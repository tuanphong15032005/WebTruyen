package com.example.WebTruyen.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserAchievementSummaryResponse {
    
    private Integer totalAchievements;
    private Integer completedAchievements;
    private Integer inProgressAchievements;
    private Integer totalClaims;
    private Integer totalCoinsEarned;
    private List<AchievementProgressResponse> recentProgress;
    private List<AchievementTierResponse> recentlyClaimed;
}
