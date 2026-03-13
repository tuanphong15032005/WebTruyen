package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record AdminPendingContentResponse(
        Long contentId,
        String contentType,
        Long storyId,
        String storyTitle,
        String authorName,
        String genre,
        LocalDateTime submissionDate,
        String moderationStatus,
        String moderationActionType,
        String moderationNote,
        LocalDateTime moderationProcessedAt,
        String approvalStatus
) {}
