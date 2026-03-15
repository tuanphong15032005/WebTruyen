package com.example.WebTruyen.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RefundEligibleTransactionResponse {
    private final Long transactionId;
    private final String transactionType;
    private final Long originalAmount;
    private final Long maxRefundAmount;
    private final String description;
    private final LocalDateTime createdAt;
}

