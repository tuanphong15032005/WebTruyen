package com.example.WebTruyen.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementClaimResponse {
    
    private Boolean success;
    private String message;
    private Long rewardCoin;
    private String rewardCoinType;
    private LocalDateTime claimedAt;
    private AchievementTierResponse claimedTier;
}
