package com.example.WebTruyen.dto.notification;

public record UnreadNotificationCountDto(
    long totalCount,
    long storyCount,
    long interactionCount,
    long achievementCount,
    long transactionCount
) {}
