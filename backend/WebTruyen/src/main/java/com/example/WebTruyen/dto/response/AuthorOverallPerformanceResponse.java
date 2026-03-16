package com.example.WebTruyen.dto.response;

public record AuthorOverallPerformanceResponse(
        Long storyCount,
        Long totalViews,
        Long totalCoinEarned,
        Long totalFollowers
) {}

