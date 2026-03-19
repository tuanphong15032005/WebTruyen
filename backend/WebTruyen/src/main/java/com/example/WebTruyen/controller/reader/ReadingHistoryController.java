package com.example.WebTruyen.controller.reader;

import com.example.WebTruyen.dto.response.ReadingHistoryResponse;
import com.example.WebTruyen.dto.response.ReadingHistoryDetailResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.ReadingHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/reading-history")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReadingHistoryController {

    private final ReadingHistoryService readingHistoryService;

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    @GetMapping
    public ReadingHistoryResponse getReadingHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return readingHistoryService.getReadingHistory(currentUser.getId(), page, size);
    }

    @GetMapping("/continue/{storyId}")
    public ReadingHistoryDetailResponse continueReading(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return readingHistoryService.getContinueReading(currentUser.getId(), storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reading history not found"));
    }

    @GetMapping("/reread/{storyId}")
    public ReadingHistoryDetailResponse rereadStory(
            @PathVariable Long storyId
    ) {
        return readingHistoryService.getRereadInfo(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found or has no chapters"));
    }

    @GetMapping("/debug/{userId}/{storyId}")
    public Map<String, Object> getDebugInfo(
            @PathVariable Long userId,
            @PathVariable Long storyId
    ) {
        return readingHistoryService.getDebugInfo(userId, storyId);
    }

    @PostMapping("/update")
    public Map<String, Boolean> updateReadingProgress(
            @RequestBody UpdateReadingProgressRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        readingHistoryService.updateReadingProgress(
                currentUser.getId(),
                request.storyId(),
                request.chapterId(),
                request.segmentId()
        );
        return Map.of("updated", true);
    }

    @DeleteMapping
    public Map<String, Boolean> clearHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        readingHistoryService.clearHistory(currentUser.getId());
        return Map.of("cleared", true);
    }

    public record UpdateReadingProgressRequest(
            Long storyId,
            Long chapterId,
            Long segmentId
    ) {
    }
}
