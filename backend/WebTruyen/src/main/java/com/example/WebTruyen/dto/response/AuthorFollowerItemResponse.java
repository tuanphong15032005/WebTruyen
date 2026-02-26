package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record AuthorFollowerItemResponse(
        Long followerId,
        String followerName,
        LocalDateTime followedAt
) {}
