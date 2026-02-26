package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AdminPayoutConfirmRequest {
    private Long coinAmount;
    private BigDecimal cashAmount;
}
