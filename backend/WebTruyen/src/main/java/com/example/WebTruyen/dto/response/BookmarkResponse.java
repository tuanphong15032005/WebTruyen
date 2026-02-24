package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookmarkResponse(
        Long id,
        Long chapterId,
        Long segmentId,
        BigDecimal positionPercent,
        Boolean isFavorite,
        LocalDateTime createdAt
) {
}
