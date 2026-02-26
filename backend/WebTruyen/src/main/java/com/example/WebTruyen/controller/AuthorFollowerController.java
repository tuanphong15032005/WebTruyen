package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AuthorFollowerItemResponse;
import com.example.WebTruyen.dto.response.AuthorFollowerStatsResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AuthorAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/author")
@RequiredArgsConstructor
public class AuthorFollowerController {
    private final AuthorAnalyticsService authorAnalyticsService;

    @GetMapping("/followers")
    public List<AuthorFollowerItemResponse> listFollowers(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return authorAnalyticsService.listAuthorFollowers(currentUser.getId());
    }

    @GetMapping("/followers/stats")
    public AuthorFollowerStatsResponse getFollowerStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        return authorAnalyticsService.getAuthorFollowerStats(currentUser.getId());
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }
}
