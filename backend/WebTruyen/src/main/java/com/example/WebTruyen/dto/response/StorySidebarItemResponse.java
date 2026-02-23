package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;

public record StorySidebarItemResponse(
        Long storyId,
        String title,
        String coverUrl,
        String authorPenName,
        BigDecimal ratingAvg,
        Integer ratingCount,
        Long chapterCount
) {
}
