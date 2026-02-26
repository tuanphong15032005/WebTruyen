package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

// Minhdq - 26/02/2026
// [Add author-follower-item-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorFollowerItemResponse(
        Long followerId,
        String followerName,
        LocalDateTime followedAt
) {}
