package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

// Minhdq - 26/02/2026
// [Add author-draft-story-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorDraftStoryResponse(
        Long id,
        String title,
        LocalDateTime lastUpdatedAt
) {}

