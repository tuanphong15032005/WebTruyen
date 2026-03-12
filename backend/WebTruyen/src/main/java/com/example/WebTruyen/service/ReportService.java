package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreateReportRequest;
import com.example.WebTruyen.dto.response.ReportResponse;
import com.example.WebTruyen.entity.model.CommentAndMod.ReportEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
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
    private final UserRepository userRepository;

    @Transactional
    public ReportResponse createReport(CreateReportRequest request, UserEntity reporter) {
        // Validate story exists
        StoryEntity story = storyRepository.findById(request.getStoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));

        // Validate chapter exists
        ChapterEntity chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        // Validate reason is not empty
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }

        // Validate description length
        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be less than 1000 characters");
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
                .targetKind(ReportEntity.ReportTargetKind.chapter)
                .story(null) // For chapter reports, story must be null due to constraint
                .chapter(chapter)
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
