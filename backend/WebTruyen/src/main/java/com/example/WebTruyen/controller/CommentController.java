package com.example.WebTruyen.controller;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.service.CommentService;
import com.example.WebTruyen.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    
    private final CommentService commentService;
    private final ChapterService chapterService;
    
    @PostMapping
    public ResponseEntity<CommentEntity> createComment(
            @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserEntity user) {
        
        // Validate chapter exists
        var chapter = chapterService.getChapterById(request.getChapterId());
        
        CommentEntity parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentService.getCommentById(request.getParentCommentId());
        }
        
        CommentEntity comment = commentService.createComment(
                request.getContent(), 
                user, 
                chapter, 
                parentComment
        );
        
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
