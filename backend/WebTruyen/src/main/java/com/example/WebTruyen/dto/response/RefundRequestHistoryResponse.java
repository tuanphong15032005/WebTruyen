package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.WithdrawStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RefundRequestHistoryResponse {
    private final Long id;
    private final Long transactionId;
    private final String transactionType;
    private final Long originalAmount;
    private final Long refundAmount;
    private final String refundReason;
    private final String bankAccountNumber;
    private final String accountHolderName;
    private final String bankName;
    private final WithdrawStatus status;
    private final LocalDateTime requestedAt;
    private final LocalDateTime paidAt;
}

