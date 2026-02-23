package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AuthorStoryOptionResponse;
import com.example.WebTruyen.dto.response.AuthorStoryPerformanceResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AuthorAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/author/analytics")
@RequiredArgsConstructor
public class AuthorAnalyticsController {

    private final AuthorAnalyticsService authorAnalyticsService;

    @GetMapping("/stories")
    public List<AuthorStoryOptionResponse> listStories(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return authorAnalyticsService.listAuthorStories(currentUser.getId());
    }

    @GetMapping("/stories/{storyId}")
    public AuthorStoryPerformanceResponse getStoryPerformance(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return authorAnalyticsService.getStoryPerformance(currentUser.getId(), storyId);
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }
}
