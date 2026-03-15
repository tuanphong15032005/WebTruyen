package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefundRequestCreateRequest {
    private Long transactionId;
    private Long refundAmount;
    private String refundReason;
    private String bankAccountNumber;
    private String accountHolderName;
    private String bankName;
}

