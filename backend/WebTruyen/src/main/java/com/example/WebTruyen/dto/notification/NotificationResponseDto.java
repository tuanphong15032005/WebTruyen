package com.example.WebTruyen.dto.notification;

import java.time.LocalDateTime;

public record NotificationResponseDto(
    Long id,
    String type,
    String title,
    String message,
    Boolean isRead,
    LocalDateTime createdAt,
    Long referenceId,
    Long storyId,
    Long chapterId
) {}
