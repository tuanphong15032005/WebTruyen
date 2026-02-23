package com.example.WebTruyen.dto.response;

public record AuthorChapterPerformanceResponse(
        Long chapterId,
        String chapterTitle,
        Integer sequenceIndex,
        String status,
        Long estimatedViews,
        Long coinEarned,
        Long unlockCount
) {}
