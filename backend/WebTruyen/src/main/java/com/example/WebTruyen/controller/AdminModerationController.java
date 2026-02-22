package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AdminPendingContentResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/moderation")
@RequiredArgsConstructor
public class AdminModerationController {

    private final StoryService storyService;

    @GetMapping("/pending-content")
    public List<AdminPendingContentResponse> getPendingContent(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return storyService.getPendingModerationContent(requireUser(userPrincipal));
    }

    @PostMapping("/stories/{storyId}/approve")
    public Map<String, String> approveStory(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        storyService.approveStoryModeration(requireUser(userPrincipal), storyId);
        return Map.of("message", "Story approved");
    }

    @PostMapping("/stories/{storyId}/reject")
    public Map<String, String> rejectStory(
            @PathVariable Long storyId,
            @RequestBody(required = false) ModerationNoteRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String note = req != null ? req.note() : null;
        storyService.rejectStoryModeration(requireUser(userPrincipal), storyId, note);
        return Map.of("message", "Story rejected");
    }

    @PostMapping("/stories/{storyId}/request-edit")
    public Map<String, String> requestStoryEdit(
            @PathVariable Long storyId,
            @RequestBody(required = false) ModerationNoteRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String note = req != null ? req.note() : null;
        storyService.requestStoryEditModeration(requireUser(userPrincipal), storyId, note);
        return Map.of("message", "Story edit requested");
    }

    @PostMapping("/chapters/{chapterId}/approve")
    public Map<String, String> approveChapter(
            @PathVariable Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        storyService.approveChapterModeration(requireUser(userPrincipal), chapterId);
        return Map.of("message", "Chapter approved");
    }

    @PostMapping("/chapters/{chapterId}/reject")
    public Map<String, String> rejectChapter(
            @PathVariable Long chapterId,
            @RequestBody(required = false) ModerationNoteRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String note = req != null ? req.note() : null;
        storyService.rejectChapterModeration(requireUser(userPrincipal), chapterId, note);
        return Map.of("message", "Chapter rejected");
    }

    @PostMapping("/chapters/{chapterId}/request-edit")
    public Map<String, String> requestChapterEdit(
            @PathVariable Long chapterId,
            @RequestBody(required = false) ModerationNoteRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String note = req != null ? req.note() : null;
        storyService.requestChapterEditModeration(requireUser(userPrincipal), chapterId, note);
        return Map.of("message", "Chapter edit requested");
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    public record ModerationNoteRequest(String note) {}
}
