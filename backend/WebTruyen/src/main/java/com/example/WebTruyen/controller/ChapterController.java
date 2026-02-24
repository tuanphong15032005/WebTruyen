package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.ChapterDetailResponse;
import com.example.WebTruyen.dto.response.ChapterResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.ChapterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
@Slf4j
public class ChapterController {

    private final ChapterService chapterService;

    @GetMapping("/{id}")
    public ResponseEntity<ChapterDetailResponse> getChapterDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Getting chapter detail for chapter ID: {}", id);
        
        Long userId = (userPrincipal != null && userPrincipal.getUser() != null) ? userPrincipal.getUser().getId() : null;
        ChapterDetailResponse response = chapterService.getChapterDetail(id, userId);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> recordChapterView(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = (userPrincipal != null && userPrincipal.getUser() != null)
                ? userPrincipal.getUser().getId()
                : null;
        chapterService.recordChapterView(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/next")
    public ResponseEntity<Long> getNextChapter(@PathVariable Long id) {
        log.info("Getting next chapter for chapter ID: {}", id);
        
        Long nextChapterId = chapterService.getNextChapterId(id);
        
        if (nextChapterId == null) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(nextChapterId);
    }

    @GetMapping("/{id}/previous")
    public ResponseEntity<Long> getPreviousChapter(@PathVariable Long id) {
        log.info("Getting previous chapter for chapter ID: {}", id);
        
        Long previousChapterId = chapterService.getPreviousChapterId(id);
        
        if (previousChapterId == null) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(previousChapterId);
    }

    @GetMapping("/story/{storyId}")
    public ResponseEntity<List<ChapterResponse>> getChaptersByStory(@PathVariable Long storyId) {
        log.info("Getting chapters for story ID: {}", storyId);
        
        // TODO: Get authorId from authenticated user or pass as parameter
        // For now, using null or default value
        List<ChapterResponse> chapters = chapterService.getChaptersByStory(storyId, null);
        
        return ResponseEntity.ok(chapters);
    }
}
