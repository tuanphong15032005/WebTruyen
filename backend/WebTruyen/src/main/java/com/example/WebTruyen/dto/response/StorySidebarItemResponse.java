package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;

public record StorySidebarItemResponse(
        Long id,
        String title,
        String coverUrl,
        String authorPenName,
        BigDecimal ratingAvg,
        Integer ratingCount,
        Long viewCount,
        Long chapterCount
) {
}
