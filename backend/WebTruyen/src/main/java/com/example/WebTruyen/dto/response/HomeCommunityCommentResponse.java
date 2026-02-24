package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record HomeCommunityCommentResponse(
        Long id,
        Long userId,
        String username,
        String avatarUrl,
        Long storyId,
        String storyTitle,
        String content,
        LocalDateTime createdAt
) {
}
