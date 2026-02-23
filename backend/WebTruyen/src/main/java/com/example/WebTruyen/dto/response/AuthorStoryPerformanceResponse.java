package com.example.WebTruyen.dto.response;

import java.util.List;

public record AuthorStoryPerformanceResponse(
        Long storyId,
        String storyTitle,
        Long totalViews,
        Long totalCoinEarned,
        Long totalFollowers,
        List<AuthorPerformancePointResponse> viewsOverTime,
        List<AuthorPerformancePointResponse> coinRevenueOverTime,
        List<AuthorPerformancePointResponse> followerGrowthOverTime,
        List<AuthorChapterPerformanceResponse> chapterPerformance
) {}
