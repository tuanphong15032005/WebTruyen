package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record StoryReviewResponse(
        Long id,
        Long userId,
        String username,
        String avatarUrl,
        Integer rating,
        String title,
        String content,
        Boolean spoiler,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
