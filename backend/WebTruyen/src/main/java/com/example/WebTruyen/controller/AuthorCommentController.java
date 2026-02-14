package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.AuthorReplyRequest;
import com.example.WebTruyen.dto.response.AuthorChapterOption;
import com.example.WebTruyen.dto.response.AuthorCommentItem;
import com.example.WebTruyen.dto.response.AuthorStoryOption;
import com.example.WebTruyen.service.AuthorCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/author")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
@RequiredArgsConstructor
public class AuthorCommentController {

    private final AuthorCommentService authorCommentService;

    @GetMapping("/stories")
    public ResponseEntity<List<AuthorStoryOption>> getMyStories() {
        UserEntity user = requireCurrentUser();
        return ResponseEntity.ok(authorCommentService.getStoriesByAuthor(user.getId()));
    }

    @GetMapping("/stories/{storyId}/chapters")
    public ResponseEntity<List<AuthorChapterOption>> getChapters(@PathVariable Long storyId) {
        UserEntity user = requireCurrentUser();
        return ResponseEntity.ok(authorCommentService.getChaptersByStory(storyId, user.getId()));
    }

    @GetMapping("/comments")
    public ResponseEntity<List<AuthorCommentItem>> getComments(
            @RequestParam Long storyId,
            @RequestParam(required = false) Long chapterId) {
        UserEntity user = requireCurrentUser();
        return ResponseEntity.ok(authorCommentService.getCommentsForAuthor(storyId, chapterId, user.getId()));
    }

    @PostMapping("/comments/{commentId}/reply")
    public ResponseEntity<AuthorCommentItem> replyToComment(
            @PathVariable Long commentId,
            @RequestBody AuthorReplyRequest request) {
        UserEntity user = requireCurrentUser();
        AuthorCommentItem created = authorCommentService.replyToComment(commentId, request, user.getId());
        return ResponseEntity.ok(created);
    }

    @PostMapping("/comments/{commentId}/hide")
    public ResponseEntity<Map<String, String>> hideComment(@PathVariable Long commentId) {
        UserEntity user = requireCurrentUser();
        authorCommentService.hideComment(commentId, user.getId());
        return ResponseEntity.ok(Map.of("message", "Comment hidden"));
    }

    private UserEntity requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        UserEntity user = principal.getUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }
}
