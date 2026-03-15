package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.WithdrawStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WithdrawRequestHistoryResponse {
    private final Long id;
    private final Long coinBAmount;
    private final Long feeCoinB;
    private final Long netCoinB;
    private final WithdrawStatus status;
    private final LocalDateTime requestedAt;
    private final LocalDateTime paidAt;
}
