package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.WithdrawStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminFinanceRequestResponse {
    private final Long id;
    private final String requestType;
    private final Long senderId;
    private final String senderName;
    private final Long amountCoinB;
    private final String relatedReference;
    private final String bankAccountNumber;
    private final String accountHolderName;
    private final String bankName;
    private final String requestReason;
    private final WithdrawStatus status;
    private final LocalDateTime requestedAt;
    private final LocalDateTime paidAt;
    private final String adminName;
}

