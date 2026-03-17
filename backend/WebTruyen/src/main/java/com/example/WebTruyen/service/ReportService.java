package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateReportRequest;
import com.example.WebTruyen.dto.response.ReportResponse;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.ReportRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReportResponse createReport(CreateReportRequest request, UserEntity reporter) {
        // Validate reason is not empty
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }

        // Validate description length
        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be less than 1000 characters");
        }

        // Validate that exactly one target is provided
        int targetCount = 0;
        if (request.getChapterId() != null) targetCount++;
        if (request.getStoryId() != null) targetCount++;
        if (request.getCommentId() != null) targetCount++;
        
        if (targetCount != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exactly one target (chapterId, storyId, or commentId) must be provided");
        }

        // Create report entity based on target
        ReportEntity.ReportTargetKind targetKind;
        StoryEntity story = null;
        ChapterEntity chapter = null;
        CommentEntity comment = null;
        
        if (request.getChapterId() != null) {
            // Chapter report
            chapter = chapterRepository.findById(request.getChapterId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
            targetKind = ReportEntity.ReportTargetKind.chapter;
        } else if (request.getStoryId() != null) {
            // Story report
            story = storyRepository.findById(request.getStoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
            targetKind = ReportEntity.ReportTargetKind.story;
        } else if (request.getCommentId() != null) {
            // Comment report
            comment = commentRepository.findById(request.getCommentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
            targetKind = ReportEntity.ReportTargetKind.comment;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one target (chapterId, storyId, or commentId) must be provided");
        }

        // Anti-spam: Check if user already reported this chapter within 24h
        // TODO: Re-enable after testing
        /*
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        log.info("Checking for existing report - reporter: {}, chapter: {}, since: {}", reporter.getId(), chapter.getId(), twentyFourHoursAgo);
        boolean hasRecentReport = reportRepository.existsByReporterAndChapterAndCreatedAtAfter(
                reporter, chapter, twentyFourHoursAgo);
        log.info("Has recent report: {}", hasRecentReport);
        if (hasRecentReport) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "You have already reported this chapter within the last 24 hours");
        }

        // Anti-spam: Check if user has submitted more than 5 reports in the last 24 hours
        LocalDateTime twentyFourHoursAgoForCount = LocalDateTime.now().minusHours(24);
        long reportCount = reportRepository.countByReporterAndCreatedAtAfter(
                reporter, twentyFourHoursAgoForCount);
        log.info("Total reports in last 24h: {}", reportCount);
        if (reportCount >= 5) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "You have reached the maximum number of reports per day (5)");
        }
        */

        // Create report entity
        ReportEntity report = ReportEntity.builder()
                .reporter(reporter)
                .targetKind(targetKind)
                .story(story)
                .chapter(chapter)
                .comment(comment)
                .reason(request.getReason().trim())
                .details(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(ReportEntity.ReportStatus.open)
                .createdAt(LocalDateTime.now())
                .build();

        // Save report
        ReportEntity savedReport = reportRepository.save(report);

        // Return response
        return new ReportResponse(
                savedReport.getId(),
                savedReport.getStatus().name(),
                savedReport.getCreatedAt()
        );
    }
}
