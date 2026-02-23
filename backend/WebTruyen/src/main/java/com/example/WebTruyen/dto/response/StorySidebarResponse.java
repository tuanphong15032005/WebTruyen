package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StorySidebarResponse(
        Long storyId,
        Long latestChapterId,
        String latestChapterTitle,
        Long latestVolumeId,
        String latestVolumeTitle,
        Long followerCount,
        Integer weeklyRank,
        BigDecimal ratingAvg,
        Integer ratingCount,
        List<StorySidebarItemResponse> similarStories,
        List<StorySidebarItemResponse> sameAuthorStories
) {
}
