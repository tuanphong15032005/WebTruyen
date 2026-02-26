package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AuthorFollowStatusResponse;
import com.example.WebTruyen.dto.response.AuthorPublicProfileResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AuthorPublicProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthorPublicProfileController {
    // Minhdq - 26/02/2026
    // [Add public-author-profile-follow-api - V1 - branch: clone-minhfinal2]
    private final AuthorPublicProfileService authorPublicProfileService;

    @GetMapping("/public/authors/{authorId}/profile")
    public AuthorPublicProfileResponse getAuthorPublicProfile(
            @PathVariable Long authorId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = userPrincipal != null ? userPrincipal.getUser() : null;
        return authorPublicProfileService.getPublicProfile(authorId, currentUser);
    }

    @PostMapping("/authors/{authorId}/follow/toggle")
    public AuthorFollowStatusResponse toggleFollowAuthor(
            @PathVariable Long authorId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return authorPublicProfileService.toggleFollow(authorId, userPrincipal.getUser());
    }
}
