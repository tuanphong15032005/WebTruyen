package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record ChapterSummaryResponse(
        Long id,
        String title,
        Integer sequenceIndex,
        LocalDateTime lastUpdateAt,
        Boolean free,
        Long priceCoin,
        Boolean unlocked,
        Boolean purchased,
        String status,
        String approvalStatus,
        String moderationNote,
        LocalDateTime resubmitAvailableAt,
        Long resubmitHoursRemaining,
        LocalDateTime scheduledPublishAt
) {}
