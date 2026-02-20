package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoinConversionRateItemResponse {
    private Long id;
    private Long coinAmount;
    private BigDecimal cashAmount;
    private BigDecimal conversionRate;
    private LocalDate effectiveDate;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
