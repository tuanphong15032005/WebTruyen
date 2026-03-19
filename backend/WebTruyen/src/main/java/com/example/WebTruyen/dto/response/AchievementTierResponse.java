package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.CoinType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementTierResponse {
    
    private Integer id;
    private Integer tierLevel;
    private Integer requirement;
    private String name;
    private String description;
    private String code;
    private Long rewardCoin;
    private CoinType rewardCoinType;
    private Boolean completed;
    private Boolean claimed;
    private LocalDateTime claimedAt;
    private Boolean current;
    private Boolean visible;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
