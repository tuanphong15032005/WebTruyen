package com.example.WebTruyen.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.WebTruyen.dto.request.ModerationActionRequest;
import com.example.WebTruyen.dto.response.ContentPreviewResponse;
import com.example.WebTruyen.dto.response.PendingContentItem;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.ModerationActionEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ModerationActionRepository;
import com.example.WebTruyen.repository.StoryRepository;
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

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ModerationActionRepository moderationActionRepository;

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

    private void recordAction(Long targetId,
                              ModerationActionEntity.ModerationTargetKind targetKind,
                              String actionType,
                              ModerationActionRequest request) {
        UserEntity admin = requireAdmin();
        ModerationActionEntity action = ModerationActionEntity.builder()
                .admin(admin)
                .actionType(actionType)
                .targetKind(targetKind)
                .targetId(targetId)
                .reason(normalizeText(request != null ? request.getReason() : null))
                .notes(normalizeText(request != null ? request.getNotes() : null))
                .createdAt(LocalDateTime.now())
                .build();
        moderationActionRepository.save(action);
    }

    private UserEntity requireAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
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
