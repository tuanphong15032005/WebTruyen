package com.example.WebTruyen.dto.respone;

import java.time.LocalDateTime;

public record StoryReviewResponse(
        Long id,
        Long userId,
        String username,
        String avatarUrl,
        Integer rating,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
