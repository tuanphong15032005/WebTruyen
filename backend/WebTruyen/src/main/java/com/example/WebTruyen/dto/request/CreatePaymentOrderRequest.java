package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentOrderRequest {
    private Long amountVnd;
    private Long coinBAmount;
}
