package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

// Minhdq - 26/02/2026
// [Add author-public-story-item-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorPublicStoryItemResponse(
        Long id,
        String title,
        String coverUrl,
        Long viewCount,
        LocalDateTime lastUpdatedAt
) {}
