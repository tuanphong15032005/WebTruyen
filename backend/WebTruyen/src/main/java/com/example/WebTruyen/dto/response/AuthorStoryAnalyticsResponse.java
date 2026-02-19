package com.example.WebTruyen.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AuthorStoryAnalyticsResponse {
    private Long storyId;
    private String storyTitle;
    private Long totalViews;
    private Long totalCoinEarned;
    private Long totalFollowers;
    private List<AuthorAnalyticsPoint> viewsOverTime;
    private List<AuthorAnalyticsPoint> coinRevenueOverTime;
    private List<AuthorAnalyticsPoint> followerGrowthOverTime;
    private List<AuthorChapterPerformanceItem> chapterPerformance;
}
