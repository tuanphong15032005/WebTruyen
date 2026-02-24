package com.example.WebTruyen.dto.request;

import java.math.BigDecimal;

public record CreateBookmarkRequest(
        Long chapterId,
        Long segmentId,
        BigDecimal positionPercent,
        Boolean isFavorite
) {
}
