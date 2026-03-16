package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record BookmarkStoryDetailResponse(
        Long id,
        Long chapterId,
        Long segmentId,
        Double positionPercent,
        LocalDateTime createdAt,
        String chapterTitle,
        String segmentText,
        String storyTitle
) {
}
