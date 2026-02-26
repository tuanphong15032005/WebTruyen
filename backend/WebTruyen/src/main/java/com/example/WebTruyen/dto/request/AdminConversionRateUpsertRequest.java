package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AdminConversionRateUpsertRequest {
    private BigDecimal coinAmount;
    private BigDecimal cashValue;
    private LocalDate effectiveDate;
}
