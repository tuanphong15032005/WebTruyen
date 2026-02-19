package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PaymentDetailResponse {
    private Long id;
    private Long userId;
    private String orderCode;
    private Long amountVnd;
    private Long coinBAmount;
    private PaymentOrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
