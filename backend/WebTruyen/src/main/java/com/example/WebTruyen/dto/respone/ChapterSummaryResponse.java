package com.example.WebTruyen.dto.respone;

import java.time.LocalDateTime;

public record ChapterSummaryResponse(
        Long id,
        String title,
        Integer sequenceIndex,
        LocalDateTime lastUpdateAt
) {}
