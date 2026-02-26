package com.example.WebTruyen.dto.response;

public record AdminPayoutEligibleAuthorResponse(
        Long requestId,
        Long authorId,
        String authorName,
        Long availableCoin,
        String paymentStatus
) {}
