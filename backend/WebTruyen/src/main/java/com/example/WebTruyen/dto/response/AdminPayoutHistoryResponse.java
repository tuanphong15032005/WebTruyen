package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminPayoutHistoryResponse(
        Long requestId,
        Long authorId,
        String authorName,
        Long coinAmount,
        BigDecimal cashAmount,
        String status,
        LocalDateTime paidAt
) {}
