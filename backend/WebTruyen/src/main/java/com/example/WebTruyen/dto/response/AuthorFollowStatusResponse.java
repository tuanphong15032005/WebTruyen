package com.example.WebTruyen.dto.response;

// Minhdq - 26/02/2026
// [Add author-follow-status-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorFollowStatusResponse(
        boolean followed,
        Long totalFollowers
) {}
