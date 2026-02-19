package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CreatePaymentOrderResponse {
    private Long orderId;
    private PaymentOrderStatus status;
}
