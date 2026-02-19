package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;

import java.time.LocalDateTime;

public class TransactionHistoryResponse {
    private Long id;
    private CoinType coinType;
    private Long delta;
    private Long balanceAfter;
    private LedgerReason reason;
    private String refType;
    private Long refId;
    private LocalDateTime createdAt;
    private String description;

    // Constructors
    public TransactionHistoryResponse() {}

    public TransactionHistoryResponse(Long id, CoinType coinType, Long delta, Long balanceAfter, 
                                   LedgerReason reason, String refType, Long refId, LocalDateTime createdAt) {
        this.id = id;
        this.coinType = coinType;
        this.delta = delta;
        this.balanceAfter = balanceAfter;
        this.reason = reason;
        this.refType = refType;
        this.refId = refId;
        this.createdAt = createdAt;
        this.description = generateDescription(reason, refType, refId, delta);
    }

    private String generateDescription(LedgerReason reason, String refType, Long refId, Long delta) {
        switch (reason) {
            case TOPUP:
                return "Nạp coin";
            case SPEND_CHAPTER:
                return "Mua chương VIP";
            case DONATE:
                return "Donate tác giả";
            case WITHDRAW:
                return "Rút coin";
            case EARN:
                return "Nhận thưởng";
            case REVIEW_REWARD:
                return "Thưởng đánh giá";
            case ADJUST:
                return "Điều chỉnh hệ thống";
            default:
                return reason.toString();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CoinType getCoinType() { return coinType; }
    public void setCoinType(CoinType coinType) { this.coinType = coinType; }

    public Long getDelta() { return delta; }
    public void setDelta(Long delta) { this.delta = delta; }

    public Long getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(Long balanceAfter) { this.balanceAfter = balanceAfter; }

    public LedgerReason getReason() { return reason; }
    public void setReason(LedgerReason reason) { this.reason = reason; }

    public String getRefType() { return refType; }
    public void setRefType(String refType) { this.refType = refType; }

    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
