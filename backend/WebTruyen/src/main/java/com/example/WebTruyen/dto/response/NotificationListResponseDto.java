package com.example.WebTruyen.dto.response;

import java.util.List;

public record NotificationListResponseDto(
    List<NotificationResponseDto> notifications,
    int currentPage,
    int totalPages,
    long totalElements,
    boolean hasNext,
    boolean hasPrevious
) {}
