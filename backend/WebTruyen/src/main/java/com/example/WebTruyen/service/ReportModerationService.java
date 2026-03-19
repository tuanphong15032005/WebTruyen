package com.example.WebTruyen.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.WebTruyen.dto.response.AdminViolationReportResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.StoryApprovalStatus;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.ReportRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.service.NotificationService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportModerationService {

    private final ReportRepository reportRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AdminViolationReportResponse> listReports(UserEntity currentUser) {
        requireModerator(currentUser);
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void dismissReport(UserEntity currentUser, Long reportId) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        report.setStatus(ReportEntity.ReportStatus.rejected);
        report.setActionTakenBy(currentUser);
        report.setAction("DISMISS_REPORT");
        report.setResolvedAt(LocalDateTime.now());
        reportRepository.save(report);
        
        // Send notification to the reporter
        if (report.getReporter() != null) {
            String message = String.format("Báo cáo của bạn về %s đã được xem xét và bị bác bỏ.", 
                getTargetDescription(report));
            notificationService.createNotification(
                report.getReporter().getId(),
                "report",
                "Báo cáo bị bác bỏ",
                message,
                report.getId(),
                report.getStory() != null ? report.getStory().getId() : null,
                null
            );
        }
    }

    @Transactional
    public void hideReportedContent(UserEntity currentUser, Long reportId) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            String violationType = normalizeViolationType(report.getReason());
            boolean severe = "COPYRIGHT".equals(violationType);
            StoryEntity story = report.getStory();
            story.setStatus(severe ? StoryStatus.archived : StoryStatus.draft);
            story.setApprovalStatus(null);
            story.setApprovalUpdatedAt(LocalDateTime.now());
            storyRepository.save(story);
            resolveReport(report, currentUser, "HIDE_STORY");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            String violationType = normalizeViolationType(report.getReason());
            boolean severe = "COPYRIGHT".equals(violationType);
            ChapterEntity chapter = report.getChapter();
            chapter.setStatus(severe ? ChapterStatus.archived : ChapterStatus.draft);
            chapter.setApprovalStatus(null);
            chapter.setLastUpdateAt(LocalDateTime.now());
            chapterRepository.save(chapter);
            resolveReport(report, currentUser, "HIDE_CHAPTER");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            comment.setIsHidden(true);
            commentRepository.save(comment);
            resolveReport(report, currentUser, "HIDE_COMMENT");
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report target is invalid");
    }

    @Transactional
    public void removeReportedContent(UserEntity currentUser, Long reportId) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            StoryEntity story = report.getStory();
            story.setStatus(StoryStatus.archived);
            story.setApprovalStatus(null);
            storyRepository.save(story);
            resolveReport(report, currentUser, "REMOVE_STORY");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            ChapterEntity chapter = report.getChapter();
            chapter.setStatus(ChapterStatus.archived);
            chapter.setApprovalStatus(null);
            chapter.setLastUpdateAt(LocalDateTime.now());
            chapterRepository.save(chapter);
            resolveReport(report, currentUser, "REMOVE_CHAPTER");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            hideCommentSubtree(comment);
            resolveReport(report, currentUser, "REMOVE_COMMENT");
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report target is invalid");
    }

    @Transactional
    public void warnOrBanReportedUser(UserEntity currentUser, Long reportId, boolean banUser, Integer banHours) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        UserEntity violatingUser = resolveViolatingUser(report);
        if (violatingUser == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot determine violating user");
        }

        if (banUser) {
            int safeHours = (banHours == null || banHours <= 0) ? 72 : banHours;
            violatingUser.setLockUntil(LocalDateTime.now().plusHours(safeHours));
            userRepository.save(violatingUser);
            resolveReport(report, currentUser, "BAN_USER");
            return;
        }

        resolveReport(report, currentUser, "WARN_USER");
    }

    private void hideCommentSubtree(CommentEntity comment) {
        comment.setIsHidden(true);
        commentRepository.save(comment);
        for (CommentEntity child : commentRepository.findByParentComment_Id(comment.getId())) {
            hideCommentSubtree(child);
        }
    }

    private UserEntity resolveViolatingUser(ReportEntity report) {
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            return report.getStory().getAuthor();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            return report.getChapter().getVolume().getStory().getAuthor();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            return report.getComment().getUser();
        }
        return null;
    }

    private void resolveReport(ReportEntity report, UserEntity admin, String action) {
        report.setStatus(ReportEntity.ReportStatus.resolved);
        report.setActionTakenBy(admin);
        report.setAction(action);
        report.setResolvedAt(LocalDateTime.now());
        reportRepository.save(report);
        
        // Send notification to the reporter
        if (report.getReporter() != null) {
            String message = String.format("Báo cáo của bạn về %s đã được xử lý. Hành động: %s", 
                getTargetDescription(report), getActionDescription(action));
            notificationService.createNotification(
                report.getReporter().getId(),
                "report",
                "Báo cáo đã được xử lý",
                message,
                report.getId(),
                report.getStory() != null ? report.getStory().getId() : null,
                null
            );
        }
    }

    private ReportEntity requireReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    private void requireModerator(UserEntity currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Long userId = currentUser.getId();
        boolean allowed = userRoleRepository.existsByUser_IdAndRole_Code(userId, "ADMIN")
                || userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD")
                || userRoleRepository.existsByUser_IdAndRole_Code(userId, "REVIEWER");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private AdminViolationReportResponse toResponse(ReportEntity report) {
        String reportedBy = report.getReporter() != null ? report.getReporter().getUsername() : "Unknown";
        String violationType = normalizeViolationType(report.getReason());
        Long targetId = resolveTargetId(report);
        String reportDetails = (report.getDetails() == null || report.getDetails().isBlank())
                ? report.getReason()
                : report.getDetails();
        Long storyId = resolveStoryIdForTarget(report);
        String storyTitle = resolveStoryTitleForTarget(report);
        String chapterTitle = resolveChapterTitleForTarget(report);

        return new AdminViolationReportResponse(
                report.getId(),
                violationType,
                report.getTargetKind().name().toUpperCase(Locale.ROOT),
                reportedBy,
                reportDetails,
                report.getStatus().name().toUpperCase(Locale.ROOT),
                resolveActionResult(report),
                report.getAction(),
                targetId,
                storyId,
                storyTitle,
                chapterTitle,
                report.getCreatedAt()
        );
    }

    private Long resolveTargetId(ReportEntity report) {
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            return report.getStory().getId();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            return report.getChapter().getId();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            return report.getComment().getId();
        }
        return null;
    }

    private Long resolveStoryIdForTarget(ReportEntity report) {
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            return report.getStory().getId();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            StoryEntity story = report.getChapter().getVolume() != null
                    ? report.getChapter().getVolume().getStory()
                    : null;
            return story != null ? story.getId() : null;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            if (comment.getStory() != null) {
                return comment.getStory().getId();
            }
            if (comment.getChapter() != null && comment.getChapter().getVolume() != null) {
                StoryEntity story = comment.getChapter().getVolume().getStory();
                return story != null ? story.getId() : null;
            }
        }
        return null;
    }

    private String resolveStoryTitleForTarget(ReportEntity report) {
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            return report.getStory().getTitle();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            StoryEntity story = report.getChapter().getVolume() != null
                    ? report.getChapter().getVolume().getStory()
                    : null;
            return story != null ? story.getTitle() : null;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            if (comment.getStory() != null) {
                return comment.getStory().getTitle();
            }
            if (comment.getChapter() != null && comment.getChapter().getVolume() != null) {
                StoryEntity story = comment.getChapter().getVolume().getStory();
                return story != null ? story.getTitle() : null;
            }
        }
        return null;
    }

    private String resolveChapterTitleForTarget(ReportEntity report) {
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            return report.getChapter().getTitle();
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            if (comment.getChapter() != null) {
                return comment.getChapter().getTitle();
            }
        }
        return null;
    }

    private String normalizeViolationType(String raw) {
        if (raw == null || raw.isBlank()) {
            return "OTHER";
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("copyright")) return "COPYRIGHT";
        if (normalized.contains("sexual")) return "SEXUAL";
        if (normalized.contains("hate")) return "HATE";
        if (normalized.contains("spam")) return "SPAM";
        return "OTHER";
    }

    private String resolveActionResult(ReportEntity report) {
        if (report.getStatus() == ReportEntity.ReportStatus.open || report.getStatus() == ReportEntity.ReportStatus.in_review) {
            return "UNPROCESSED";
        }
        if (report.getStatus() == ReportEntity.ReportStatus.rejected) {
            return "DISMISSED";
        }
        String action = report.getAction();
        if (action == null || action.isBlank()) {
            return "RESOLVED";
        }
        String normalized = action.trim().toUpperCase(Locale.ROOT);
        if (normalized.contains("BAN_USER")) return "BANNED_USER";
        if (normalized.contains("RESTORED")) return "RESTORED";
        if (normalized.contains("HIDE")) return "HIDDEN_CONTENT";
        if (normalized.contains("REMOVE")) return "REMOVED_CONTENT";
        if (normalized.contains("WARN_USER")) return "WARNED_USER";
        return normalized;
    }
    
    private String getTargetDescription(ReportEntity report) {
        switch (report.getTargetKind()) {
            case story:
                return report.getStory() != null ? 
                    "truyện \"" + report.getStory().getTitle() + "\"" : "truyện";
            case chapter:
                return report.getChapter() != null ? 
                    "chương \"" + report.getChapter().getTitle() + "\"" : "chương";
            case comment:
                return "bình luận";
            default:
                return "nội dung";
        }
    }
    
    private String getActionDescription(String action) {
        return switch (action) {
            case "HIDE_STORY", "HIDE_CHAPTER", "HIDE_COMMENT" -> "Ẩn nội dung";
            case "REMOVE_STORY", "REMOVE_CHAPTER", "REMOVE_COMMENT" -> "Xóa nội dung";
            case "BAN_USER" -> "Khóa tài khoản người vi phạm";
            case "WARN_USER" -> "Cảnh báo người vi phạm";
            default -> "Đã xử lý";
        };
    }

    @Transactional
    public void restoreStoryForReport(UserEntity currentUser, Long reportId) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        if (report.getTargetKind() != ReportEntity.ReportTargetKind.story || report.getStory() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ áp dụng cho báo cáo truyện");
        }
        String action = report.getAction();
        if (action == null || (!action.contains("HIDE_STORY") && !action.contains("REMOVE_STORY"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Báo cáo chưa xử lý ẩn/gỡ truyện");
        }
        StoryEntity story = report.getStory();
        story.setStatus(StoryStatus.published);
        story.setApprovalStatus(StoryApprovalStatus.approved);
        storyRepository.save(story);
        report.setAction(action + "_RESTORED");
        reportRepository.save(report);
    }
}
