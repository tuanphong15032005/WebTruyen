package com.example.WebTruyen.controller;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.TieredAchievementIntegrationService;
import com.example.WebTruyen.service.CommentService;
import com.example.WebTruyen.service.ChapterService;
import com.example.WebTruyen.service.SimpleDailyTaskService;
import com.example.WebTruyen.service.DailyTaskOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    
    private final CommentService commentService;
    private final ChapterService chapterService;
    private final TieredAchievementIntegrationService achievementIntegrationService;
    private final SimpleDailyTaskService simpleDailyTaskService;
    private final DailyTaskOrchestrator dailyTaskOrchestrator;
    
    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            throw new RuntimeException("Authentication required");
        }
        return userPrincipal.getUser();
    }
    
    @PostMapping
    public ResponseEntity<CommentEntity> createComment(
            @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("Creating comment for user principal: {}", userPrincipal);
        
        UserEntity user = requireUser(userPrincipal);
        log.info("Authenticated user: {} (ID: {})", user.getUsername(), user.getId());
        
        // Validate chapter exists
        var chapter = chapterService.getChapterById(request.getChapterId());
        
        CommentEntity parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentService.getCommentById(request.getParentCommentId());
        }
        
        CommentEntity comment = commentService.createInternalComment(
                request.getContent(), 
                user, 
                chapter, 
                parentComment
        );
        
        log.info("Comment created successfully with ID: {} for user: {}", comment.getId(), user.getId());
        
        // Track comment creation for daily task using orchestrator
        try {
            log.info("Tracking comment creation for daily task - user: {}, comment: {}", user.getId(), comment.getId());
            dailyTaskOrchestrator.trackUserActivity(user.getId(), DailyTaskOrchestrator.ActivityType.MAKE_COMMENT);
            log.info("Successfully tracked comment creation for daily task");
        } catch (Exception e) {
            log.warn("Failed to track comment creation for daily task - user: {}, error: {}", user.getId(), e.getMessage());
        }
        
        // Trigger achievement event for comment creation
        try {
            log.info("DEBUG: About to trigger achievement event for user: {}", user.getId());
            achievementIntegrationService.onCommentCreated(user.getId());
            log.info("DEBUG: Achievement event triggered successfully for user: {}", user.getId());
        } catch (Exception e) {
            log.error("DEBUG: Failed to trigger achievement event for user {}: {}", user.getId(), e.getMessage(), e);
        }
        
        return ResponseEntity.ok(comment);
    }
    
    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<List<CommentEntity>> getChapterComments(@PathVariable Long chapterId) {
        List<CommentEntity> comments = commentService.getRootCommentsByChapter(chapterId);
        return ResponseEntity.ok(comments);
    }
    
    @GetMapping("/replies/{parentCommentId}")
    public ResponseEntity<List<CommentEntity>> getReplies(@PathVariable Long parentCommentId) {
        List<CommentEntity> replies = commentService.getReplies(parentCommentId);
        return ResponseEntity.ok(replies);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CommentEntity>> getUserComments(@PathVariable Long userId) {
        List<CommentEntity> comments = commentService.getUserComments(userId);
        return ResponseEntity.ok(comments);
    }
    
    @PostMapping("/{commentId}/hide")
    public ResponseEntity<CommentEntity> hideComment(@PathVariable Long commentId) {
        CommentEntity comment = commentService.hideComment(commentId);
        return ResponseEntity.ok(comment);
    }
    
    public static class CreateCommentRequest {
        private String content;
        private Long chapterId;
        private Long parentCommentId;
        
        // Getters and setters
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Long getChapterId() { return chapterId; }
        public void setChapterId(Long chapterId) { this.chapterId = chapterId; }
        
        public Long getParentCommentId() { return parentCommentId; }
        public void setParentCommentId(Long parentCommentId) { this.parentCommentId = parentCommentId; }
    }
}
