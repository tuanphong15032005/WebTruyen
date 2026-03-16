package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record ReadingHistoryDetailResponse(
        Long id,
        Long storyId,
        String storyTitle,
        String storyCoverUrl,
        Long chapterId,
        String chapterTitle,
        Long segmentId,
        LocalDateTime lastReadAt,
        Integer chaptersRead,
        Integer totalChapters,
        Double progressPercentage
) {
}
