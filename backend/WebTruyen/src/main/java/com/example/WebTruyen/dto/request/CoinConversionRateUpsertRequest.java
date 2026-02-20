package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CoinConversionRateUpsertRequest {
    private Long coinAmount;
    private BigDecimal cashAmount;
    private LocalDate effectiveDate;
}
