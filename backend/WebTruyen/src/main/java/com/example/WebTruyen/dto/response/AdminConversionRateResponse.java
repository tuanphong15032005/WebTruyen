package com.example.WebTruyen.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminConversionRateResponse(
        Long id,
        BigDecimal coinAmount,
        BigDecimal cashValue,
        BigDecimal rate,
        LocalDate effectiveDate,
        LocalDateTime updatedAt
) {}
