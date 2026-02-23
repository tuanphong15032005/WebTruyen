package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StorySidebarResponse(
        String latestVolumeTitle,
        String latestChapterTitle,
        Integer latestChapterSequence,
        Long followerCount,
        BigDecimal ratingAvg,
        Integer ratingCount,
        List<StorySidebarItemResponse> similarStories,
        List<StorySidebarItemResponse> sameAuthorStories
) {
}
