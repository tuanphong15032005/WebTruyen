package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.ModerationActionRequest;
import com.example.WebTruyen.dto.request.ReportSanctionRequest;
import com.example.WebTruyen.dto.response.ContentPreviewResponse;
import com.example.WebTruyen.dto.response.PendingContentItem;
import com.example.WebTruyen.dto.response.ViolationReportItem;
import com.example.WebTruyen.service.ModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moderation")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
@RequiredArgsConstructor
public class ModerationController {
    private final ModerationService moderationService;

    @GetMapping("/pending")
    public ResponseEntity<List<PendingContentItem>> getPendingContent() {
        return ResponseEntity.ok(moderationService.getPendingContent());
    }

    @GetMapping("/approved")
    public ResponseEntity<List<PendingContentItem>> getApprovedContent() {
        return ResponseEntity.ok(moderationService.getApprovedContent());
    }

    @GetMapping("/rejected")
    public ResponseEntity<List<PendingContentItem>> getRejectedContent() {
        return ResponseEntity.ok(moderationService.getRejectedContent());
    }

    @GetMapping("/preview")
    public ResponseEntity<ContentPreviewResponse> getPreview(@RequestParam("type") String type,
                                                             @RequestParam("id") Long id) {
        return ResponseEntity.ok(moderationService.getPreview(type, id));
    }

    @GetMapping("/reports/pending")
    public ResponseEntity<List<ViolationReportItem>> getPendingReports() {
        return ResponseEntity.ok(moderationService.getPendingViolationReports());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ViolationReportItem>> getReportsByView(
            @RequestParam(name = "view", defaultValue = "pending") String view) {
        return ResponseEntity.ok(moderationService.getViolationReportsByView(view));
    }

    @PostMapping("/reports/{id}/dismiss")
    public ResponseEntity<Map<String, String>> dismissReport(@PathVariable Long id) {
        moderationService.dismissReport(id);
        return ResponseEntity.ok(Map.of("message", "Report dismissed"));
    }

    @PostMapping("/reports/{id}/hide-content")
    public ResponseEntity<Map<String, String>> hideReportedContent(@PathVariable Long id) {
        moderationService.hideReportedContent(id);
        return ResponseEntity.ok(Map.of("message", "Content hidden"));
    }

    @PostMapping("/reports/{id}/remove-content")
    public ResponseEntity<Map<String, String>> removeReportedContent(@PathVariable Long id) {
        moderationService.removeReportedContent(id);
        return ResponseEntity.ok(Map.of("message", "Content removed"));
    }

    @PostMapping("/reports/{id}/sanction")
    public ResponseEntity<Map<String, String>> sanctionUser(@PathVariable Long id,
                                                            @RequestBody(required = false) ReportSanctionRequest request) {
        moderationService.applyUserSanction(id, request == null ? new ReportSanctionRequest() : request);
        return ResponseEntity.ok(Map.of("message", "User sanction applied"));
    }

    @PostMapping("/stories/{id}/approve")
    public ResponseEntity<Map<String, String>> approveStory(@PathVariable Long id,
                                                            @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.approveStory(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Story approved"));
    }

    @PostMapping("/stories/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectStory(@PathVariable Long id,
                                                           @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.rejectStory(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Story rejected"));
    }

    @PostMapping("/stories/{id}/request-edit")
    public ResponseEntity<Map<String, String>> requestStoryEdit(@PathVariable Long id,
                                                                @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.requestStoryEdit(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Story edit requested"));
    }

    @PostMapping("/chapters/{id}/approve")
    public ResponseEntity<Map<String, String>> approveChapter(@PathVariable Long id,
                                                              @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.approveChapter(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Chapter approved"));
    }

    @PostMapping("/chapters/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectChapter(@PathVariable Long id,
                                                             @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.rejectChapter(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Chapter rejected"));
    }

    @PostMapping("/chapters/{id}/request-edit")
    public ResponseEntity<Map<String, String>> requestChapterEdit(@PathVariable Long id,
                                                                  @RequestBody(required = false) ModerationActionRequest request) {
        moderationService.requestChapterEdit(id, safeRequest(request));
        return ResponseEntity.ok(Map.of("message", "Chapter edit requested"));
    }

    private ModerationActionRequest safeRequest(ModerationActionRequest request) {
        return request == null ? new ModerationActionRequest() : request;
    }
}
