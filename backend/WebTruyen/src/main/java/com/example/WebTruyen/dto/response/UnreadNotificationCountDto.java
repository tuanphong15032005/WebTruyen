package com.example.WebTruyen.dto.response;

public record UnreadNotificationCountDto(
    long totalCount,
    long storyCount,
    long interactionCount,
    long achievementCount,
    long transactionCount
) {}
