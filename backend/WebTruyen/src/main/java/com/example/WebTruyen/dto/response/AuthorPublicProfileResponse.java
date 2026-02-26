package com.example.WebTruyen.dto.response;

import java.util.List;

// Minhdq - 26/02/2026
// [Add author-public-profile-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorPublicProfileResponse(
        Long authorId,
        String avatarUrl,
        String penName,
        String shortDescription,
        Long totalViews,
        Long totalFollowers,
        boolean followed,
        List<AuthorPublicStoryItemResponse> stories
) {}
