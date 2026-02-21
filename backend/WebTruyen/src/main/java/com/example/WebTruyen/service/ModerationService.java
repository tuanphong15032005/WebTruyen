package com.example.WebTruyen.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.WebTruyen.dto.request.ReportSanctionRequest;
import com.example.WebTruyen.dto.request.ModerationActionRequest;
import com.example.WebTruyen.dto.response.ContentPreviewResponse;
import com.example.WebTruyen.dto.response.PendingContentItem;
import com.example.WebTruyen.dto.response.ViolationReportItem;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.ModerationActionRepository;
import com.example.WebTruyen.repository.ReportRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.security.UserPrincipal;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ModerationService {
    private static final String DEFAULT_GENRE = "Chưa phân loại";
    private static final String DEFAULT_RATING = "Chưa phân loại";
    private static final String STORY_BY_STATUS_SQL = """
            SELECT s.id AS id,
                   'story' AS content_type,
                   s.title AS story_title,
                   NULL AS chapter_title,
                   COALESCE(NULLIF(u.author_pen_name, ''), NULLIF(u.display_name, ''), u.username) AS author_name,
                   COALESCE(GROUP_CONCAT(DISTINCT t.name SEPARATOR ', '), ?) AS genre,
                   NULL AS age_rating,
                   s.created_at AS submitted_at
            FROM stories s
            JOIN users u ON u.id = s.author_id
            LEFT JOIN story_tags st ON st.story_id = s.id
            LEFT JOIN tags t ON t.id = st.tag_id
            WHERE s.status = ?
            GROUP BY s.id, s.title, u.author_pen_name, u.display_name, u.username, s.created_at
            """;
    private static final String CHAPTER_BY_STATUS_SQL = """
            SELECT c.id AS id,
                   'chapter' AS content_type,
                   s.title AS story_title,
                   c.title AS chapter_title,
                   COALESCE(NULLIF(u.author_pen_name, ''), NULLIF(u.display_name, ''), u.username) AS author_name,
                   COALESCE(GROUP_CONCAT(DISTINCT t.name SEPARATOR ', '), ?) AS genre,
                   NULL AS age_rating,
                   c.created_at AS submitted_at
            FROM chapters c
            JOIN volumes v ON v.id = c.volume_id
            JOIN stories s ON s.id = v.story_id
            JOIN users u ON u.id = s.author_id
            LEFT JOIN story_tags st ON st.story_id = s.id
            LEFT JOIN tags t ON t.id = st.tag_id
            WHERE c.status = ?
            GROUP BY c.id, c.title, s.title, u.author_pen_name, u.display_name, u.username, c.created_at
            """;
    private static final String STORY_PREVIEW_SQL = """
            SELECT s.title AS title, s.summary AS content
            FROM stories s
            WHERE s.id = ?
            """;
    private static final String CHAPTER_PREVIEW_SQL = """
            SELECT c.title AS title,
                   COALESCE(d.content,
                            GROUP_CONCAT(cs.segment_text ORDER BY cs.seq SEPARATOR '\\n\\n')) AS content
            FROM chapters c
            LEFT JOIN drafts d ON d.chapter_id = c.id
            LEFT JOIN chapter_segments cs ON cs.chapter_id = c.id
            WHERE c.id = ?
            GROUP BY c.title, d.content
            """;
    private static final int PREVIEW_LIMIT = 1200;
    private static final List<ReportEntity.ReportStatus> OPEN_REPORT_STATUSES =
            List.of(ReportEntity.ReportStatus.open, ReportEntity.ReportStatus.in_review);

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final ModerationActionRepository moderationActionRepository;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<PendingContentItem> getPendingContent() {
        return getContentByStatus("draft");
    }

    @Transactional(readOnly = true)
    public List<PendingContentItem> getApprovedContent() {
        return getContentByStatus("published");
    }

    @Transactional(readOnly = true)
    public List<PendingContentItem> getRejectedContent() {
        return getContentByStatus("archived");
    }

    @Transactional(readOnly = true)
    public ContentPreviewResponse getPreview(String type, Long id) {
        if (!StringUtils.hasText(type) || id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing preview parameters");
        }
        String normalized = type.trim().toLowerCase();
        if ("story".equals(normalized)) {
            return fetchPreview(STORY_PREVIEW_SQL, id, "Tóm tắt truyện chưa có.");
        }
        if ("chapter".equals(normalized)) {
            return fetchPreview(CHAPTER_PREVIEW_SQL, id, "Nội dung chương chưa có.");
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported preview type");
    }

    @Transactional
    public void approveStory(Long storyId, ModerationActionRequest request) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        story.setStatus(StoryStatus.published);
        recordAction(storyId, ModerationActionEntity.ModerationTargetKind.story, "approve", request);
    }

    @Transactional
    public void rejectStory(Long storyId, ModerationActionRequest request) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        story.setStatus(StoryStatus.archived);
        recordAction(storyId, ModerationActionEntity.ModerationTargetKind.story, "reject", request);
    }

    @Transactional
    public void requestStoryEdit(Long storyId, ModerationActionRequest request) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        story.setStatus(StoryStatus.draft);
        recordAction(storyId, ModerationActionEntity.ModerationTargetKind.story, "request_edit", request);
    }

    @Transactional
    public void approveChapter(Long chapterId, ModerationActionRequest request) {
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.published);
        recordAction(chapterId, ModerationActionEntity.ModerationTargetKind.chapter, "approve", request);
    }

    @Transactional
    public void rejectChapter(Long chapterId, ModerationActionRequest request) {
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.archived);
        recordAction(chapterId, ModerationActionEntity.ModerationTargetKind.chapter, "reject", request);
    }

    @Transactional
    public void requestChapterEdit(Long chapterId, ModerationActionRequest request) {
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.draft);
        recordAction(chapterId, ModerationActionEntity.ModerationTargetKind.chapter, "request_edit", request);
    }

    @Transactional(readOnly = true)
    public List<ViolationReportItem> getPendingViolationReports() {
        return getViolationReportsByView("pending");
    }

    @Transactional(readOnly = true)
    public List<ViolationReportItem> getViolationReportsByView(String view) {
        List<ReportEntity.ReportStatus> statuses = mapReportViewToStatuses(view);
        List<ReportEntity> reports = reportRepository.findByStatusInOrderByCreatedAtDesc(statuses);
        return reports.stream()
                .map(this::toViolationReportItem)
                .toList();
    }

    @Transactional
    public void dismissReport(Long reportId) {
        ReportEntity report = findOpenReport(reportId);
        resolveReport(report, "dismiss", ReportEntity.ReportStatus.rejected);
    }

    @Transactional
    public void hideReportedContent(Long reportId) {
        ReportEntity report = findOpenReport(reportId);
        switch (report.getTargetKind()) {
            case story -> {
                StoryEntity story = requireStoryTarget(report);
                story.setStatus(StoryStatus.archived);
            }
            case chapter -> {
                ChapterEntity chapter = requireChapterTarget(report);
                chapter.setStatus(ChapterStatus.archived);
            }
            case comment -> {
                CommentEntity comment = requireCommentTarget(report);
                comment.setIsHidden(true);
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported report target");
        }
        resolveReport(report, "hide_content", ReportEntity.ReportStatus.resolved);
    }

    @Transactional
    public void removeReportedContent(Long reportId) {
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "Remove content action is disabled");
    }

    @Transactional
    public void applyUserSanction(Long reportId, ReportSanctionRequest request) {
        ReportEntity report = findOpenReport(reportId);
        UserEntity violatingUser = requireViolatingUser(report);

        String sanctionType = normalizeSanctionType(request != null ? request.getSanctionType() : null);
        if ("ban".equals(sanctionType)) {
            int banHours = normalizeBanHours(request != null ? request.getBanHours() : null);
            violatingUser.setLockUntil(LocalDateTime.now().plusHours(banHours));
            resolveReport(report, "ban_user", ReportEntity.ReportStatus.resolved);
        } else {
            resolveReport(report, "warn_user", ReportEntity.ReportStatus.resolved);
        }
    }

    private void recordAction(Long targetId,
                              ModerationActionEntity.ModerationTargetKind targetKind,
                              String actionType,
                              ModerationActionRequest request) {
        UserEntity admin = requireAdmin();
        UserEntity managedAdmin = userRepository.getReferenceById(admin.getId());
        ModerationActionEntity action = ModerationActionEntity.builder()
                .admin(managedAdmin)
                .actionType(actionType)
                .targetKind(targetKind)
                .targetId(targetId)
                .reason(normalizeText(request != null ? request.getReason() : null))
                .notes(normalizeText(request != null ? request.getNotes() : null))
                .createdAt(LocalDateTime.now())
                .build();
        moderationActionRepository.save(action);
    }

    private ViolationReportItem toViolationReportItem(ReportEntity report) {
        return ViolationReportItem.builder()
                .reportId(report.getId())
                .violationType(normalizeViolationType(report.getReason()))
                .reportedContentType(formatTargetKind(report.getTargetKind()))
                .reportedContent(resolveReportedContent(report))
                .reportedBy(resolveDisplayName(report.getReporter()))
                .reportDetails(resolveReportDetails(report))
                .reportedAt(report.getCreatedAt())
                .reportStatus(formatReportStatus(report.getStatus()))
                .handledAction(formatHandledAction(report.getAction()))
                .handledAt(report.getResolvedAt())
                .build();
    }

    private List<ReportEntity.ReportStatus> mapReportViewToStatuses(String view) {
        if (!StringUtils.hasText(view) || "pending".equalsIgnoreCase(view.trim())) {
            return OPEN_REPORT_STATUSES;
        }

        String normalized = view.trim().toLowerCase();
        return switch (normalized) {
            case "resolved" -> List.of(ReportEntity.ReportStatus.resolved);
            case "rejected" -> List.of(ReportEntity.ReportStatus.rejected);
            case "all" -> List.of(
                    ReportEntity.ReportStatus.open,
                    ReportEntity.ReportStatus.in_review,
                    ReportEntity.ReportStatus.resolved,
                    ReportEntity.ReportStatus.rejected
            );
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported report view");
        };
    }

    private String normalizeViolationType(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return "Khac";
        }
        String normalized = rawValue.trim().toLowerCase();
        if (normalized.contains("copyright") || normalized.contains("ban quyen")) {
            return "Copyright";
        }
        if (normalized.contains("sexual") || normalized.contains("sex") || normalized.contains("18+") || normalized.contains("tinh duc")) {
            return "Sexual";
        }
        if (normalized.contains("hate") || normalized.contains("thu han") || normalized.contains("ky thi")) {
            return "Hate";
        }
        if (normalized.contains("spam")) {
            return "Spam";
        }
        return "Khac";
    }

    private String formatTargetKind(ReportEntity.ReportTargetKind targetKind) {
        if (targetKind == null) {
            return "Unknown";
        }
        return switch (targetKind) {
            case story -> "Story";
            case chapter -> "Chapter";
            case comment -> "Comment";
        };
    }

    private String resolveReportedContent(ReportEntity report) {
        return switch (report.getTargetKind()) {
            case story -> {
                StoryEntity story = report.getStory();
                yield story != null && StringUtils.hasText(story.getTitle())
                        ? story.getTitle()
                        : "Story da bi xoa";
            }
            case chapter -> {
                ChapterEntity chapter = report.getChapter();
                if (chapter == null) {
                    yield "Chapter da bi xoa";
                }
                String storyTitle = chapter.getVolume() != null
                        && chapter.getVolume().getStory() != null
                        ? chapter.getVolume().getStory().getTitle()
                        : null;
                if (StringUtils.hasText(storyTitle) && StringUtils.hasText(chapter.getTitle())) {
                    yield storyTitle + " - " + chapter.getTitle();
                }
                yield StringUtils.hasText(chapter.getTitle()) ? chapter.getTitle() : "Chapter da bi xoa";
            }
            case comment -> {
                CommentEntity comment = report.getComment();
                if (comment == null || !StringUtils.hasText(comment.getContent())) {
                    yield "Comment da bi xoa";
                }
                String content = comment.getContent().trim();
                if (content.length() > 120) {
                    yield content.substring(0, 120) + "...";
                }
                yield content;
            }
        };
    }

    private String resolveReportDetails(ReportEntity report) {
        if (StringUtils.hasText(report.getDetails())) {
            return report.getDetails().trim();
        }
        if (StringUtils.hasText(report.getReason())) {
            return report.getReason().trim();
        }
        return "Khong co mo ta";
    }

    private String formatReportStatus(ReportEntity.ReportStatus status) {
        if (status == null) {
            return "Unknown";
        }
        return switch (status) {
            case open -> "Open";
            case in_review -> "In review";
            case resolved -> "Resolved";
            case rejected -> "Rejected";
        };
    }

    private String formatHandledAction(String action) {
        if (!StringUtils.hasText(action)) {
            return null;
        }
        return switch (action) {
            case "dismiss" -> "Dismissed";
            case "hide_content" -> "Hidden content";
            case "remove_content" -> "Removed content";
            case "warn_user" -> "Warned user";
            case "ban_user" -> "Banned user";
            default -> action;
        };
    }

    private String resolveDisplayName(UserEntity user) {
        if (user == null) {
            return "Unknown";
        }
        if (StringUtils.hasText(user.getDisplayName())) {
            return user.getDisplayName().trim();
        }
        if (StringUtils.hasText(user.getAuthorPenName())) {
            return user.getAuthorPenName().trim();
        }
        if (StringUtils.hasText(user.getUsername())) {
            return user.getUsername().trim();
        }
        return "User#" + user.getId();
    }

    private ReportEntity findOpenReport(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        if (!OPEN_REPORT_STATUSES.contains(report.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report already handled");
        }
        return report;
    }

    private void resolveReport(ReportEntity report, String action, ReportEntity.ReportStatus status) {
        UserEntity admin = requireAdmin();
        report.setAction(action);
        report.setStatus(status);
        report.setResolvedAt(LocalDateTime.now());
        report.setActionTakenBy(userRepository.getReferenceById(admin.getId()));
        reportRepository.save(report);
    }

    private StoryEntity requireStoryTarget(ReportEntity report) {
        StoryEntity story = report.getStory();
        if (story == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story target not found");
        }
        return story;
    }

    private ChapterEntity requireChapterTarget(ReportEntity report) {
        ChapterEntity chapter = report.getChapter();
        if (chapter == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter target not found");
        }
        return chapter;
    }

    private CommentEntity requireCommentTarget(ReportEntity report) {
        CommentEntity comment = report.getComment();
        if (comment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment target not found");
        }
        return comment;
    }

    private UserEntity requireViolatingUser(ReportEntity report) {
        return switch (report.getTargetKind()) {
            case story -> {
                StoryEntity story = requireStoryTarget(report);
                if (story.getAuthor() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Story author not found");
                }
                yield story.getAuthor();
            }
            case chapter -> {
                ChapterEntity chapter = requireChapterTarget(report);
                if (chapter.getVolume() == null || chapter.getVolume().getStory() == null || chapter.getVolume().getStory().getAuthor() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chapter author not found");
                }
                yield chapter.getVolume().getStory().getAuthor();
            }
            case comment -> {
                CommentEntity comment = requireCommentTarget(report);
                if (comment.getUser() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment user not found");
                }
                yield comment.getUser();
            }
        };
    }

    private String normalizeSanctionType(String sanctionType) {
        if (!StringUtils.hasText(sanctionType)) {
            return "warn";
        }
        String normalized = sanctionType.trim().toLowerCase();
        if (!normalized.equals("warn") && !normalized.equals("ban")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sanction type must be warn or ban");
        }
        return normalized;
    }

    private int normalizeBanHours(Integer banHours) {
        int value = banHours == null ? 24 : banHours;
        if (value < 1 || value > 24 * 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ban duration must be between 1 and 8760 hours");
        }
        return value;
    }

    private UserEntity requireAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean isAdminOrModerator = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_MOD".equals(authority) || "ROLE_ADMIN".equals(authority));
        if (!isAdminOrModerator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin or moderator role required");
        }
        UserEntity user = principal.getUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }

    private List<PendingContentItem> getContentByStatus(String status) {
        String normalized = normalizeStatus(status);
        List<PendingContentItem> items = new ArrayList<>();
        items.addAll(fetchContentByStatus(STORY_BY_STATUS_SQL, normalized));
        items.addAll(fetchContentByStatus(CHAPTER_BY_STATUS_SQL, normalized));
        items.sort(Comparator.comparing(
                        PendingContentItem::getSubmittedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed());
        return items;
    }

    private List<PendingContentItem> fetchContentByStatus(String sql, String status) {
        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter(1, DEFAULT_GENRE)
                .setParameter(2, status)
                .getResultList();
        List<PendingContentItem> results = new ArrayList<>();
        for (Object[] row : rows) {
            results.add(PendingContentItem.builder()
                    .id(toLong(row[0]))
                    .contentType(toString(row[1]))
                    .storyTitle(toString(row[2]))
                    .chapterTitle(toString(row[3]))
                    .authorName(toString(row[4]))
                    .genre(toString(row[5], DEFAULT_GENRE))
                    .ageRating(toString(row[6], DEFAULT_RATING))
                    .submittedAt(toLocalDateTime(row[7]))
                    .build());
        }
        return results;
    }

    private ContentPreviewResponse fetchPreview(String sql, Long id, String emptyMessage) {
        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter(1, id)
                .getResultList();
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found");
        }
        Object[] row = rows.get(0);
        String title = toString(row[0]);
        String content = toString(row[1]);
        if (!StringUtils.hasText(content)) {
            content = emptyMessage;
        } else if (content.length() > PREVIEW_LIMIT) {
            content = content.substring(0, PREVIEW_LIMIT) + "...";
        }
        return ContentPreviewResponse.builder()
                .title(title)
                .content(content)
                .build();
    }

    private String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String normalizeStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "draft";
        }
        String normalized = status.trim().toLowerCase();
        if (!normalized.equals("draft") && !normalized.equals("published") && !normalized.equals("archived")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status");
        }
        return normalized;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private String toString(Object value) {
        return value == null ? null : value.toString();
    }

    private String toString(Object value, String fallback) {
        String text = toString(value);
        return StringUtils.hasText(text) ? text : fallback;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof LocalDateTime time) {
            return time;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return null;
    }
}
