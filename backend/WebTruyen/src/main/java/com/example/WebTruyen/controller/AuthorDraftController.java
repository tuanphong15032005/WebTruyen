package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AuthorDraftOverviewResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AuthorDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

// Minhdq - 26/02/2026
// [Add author-draft-management-controller - V1 - branch: clone-minhfinal2]
@RestController
@RequestMapping("/api/author/drafts")
@RequiredArgsConstructor
public class AuthorDraftController {

    private final AuthorDraftService authorDraftService;

    @GetMapping
    public AuthorDraftOverviewResponse getDraftOverview(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return authorDraftService.getDraftOverview(currentUser);
    }

    @DeleteMapping("/stories/{storyId}")
    public void deleteDraftStory(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        authorDraftService.deleteDraftStory(currentUser, storyId);
    }

    @DeleteMapping("/chapters/{chapterId}")
    public void deleteDraftChapter(
            @PathVariable Long chapterId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        authorDraftService.deleteDraftChapter(currentUser, chapterId);
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }
}

