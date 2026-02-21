package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record ChapterSummaryResponse(
        Long id,
        String title,
        Integer sequenceIndex,
        LocalDateTime lastUpdateAt,
        String status
) {}
