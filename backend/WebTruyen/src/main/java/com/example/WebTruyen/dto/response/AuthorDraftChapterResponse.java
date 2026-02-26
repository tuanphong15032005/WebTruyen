package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

// Minhdq - 26/02/2026
// [Add author-draft-chapter-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorDraftChapterResponse(
        Long id,
        Long storyId,
        String storyTitle,
        Long volumeId,
        String volumeTitle,
        String chapterTitle,
        LocalDateTime lastUpdatedAt
) {}

