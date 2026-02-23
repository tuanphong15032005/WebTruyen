package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AdminViolationReportResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReportModerationService {

    private final ReportRepository reportRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;

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
    }

    @Transactional
    public void hideReportedContent(UserEntity currentUser, Long reportId) {
        requireModerator(currentUser);
        ReportEntity report = requireReport(reportId);
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.story && report.getStory() != null) {
            StoryEntity story = report.getStory();
            story.setStatus(StoryStatus.archived);
            storyRepository.save(story);
            resolveReport(report, currentUser, "HIDE_STORY");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            ChapterEntity chapter = report.getChapter();
            chapter.setStatus(ChapterStatus.archived);
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
            storyRepository.save(story);
            resolveReport(report, currentUser, "REMOVE_STORY");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.chapter && report.getChapter() != null) {
            ChapterEntity chapter = report.getChapter();
            chapter.setStatus(ChapterStatus.archived);
            chapter.setLastUpdateAt(LocalDateTime.now());
            chapterRepository.save(chapter);
            resolveReport(report, currentUser, "REMOVE_CHAPTER");
            return;
        }
        if (report.getTargetKind() == ReportEntity.ReportTargetKind.comment && report.getComment() != null) {
            CommentEntity comment = report.getComment();
            deleteCommentAndDescendants(comment);
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

    private void deleteCommentAndDescendants(CommentEntity comment) {
        reportRepository.deleteByComment_Id(comment.getId());
        for (CommentEntity child : commentRepository.findByParentComment_Id(comment.getId())) {
            deleteCommentAndDescendants(child);
        }
        commentRepository.delete(comment);
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
        if (normalized.contains("HIDE")) return "HIDDEN_CONTENT";
        if (normalized.contains("REMOVE")) return "REMOVED_CONTENT";
        if (normalized.contains("WARN_USER")) return "WARNED_USER";
        return normalized;
    }
}
