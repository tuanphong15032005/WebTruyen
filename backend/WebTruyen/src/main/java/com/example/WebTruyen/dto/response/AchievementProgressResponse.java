package com.example.WebTruyen.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementProgressResponse {
    
    private String achievementCode;
    private String achievementName;
    private String description;
    private Integer currentProgress;
    private Integer currentTier;
    private Integer totalTiers;
    private Double progressPercentage;
    private AchievementTierResponse currentTierInfo;
    private AchievementTierResponse nextTierInfo;
    private List<AchievementTierResponse> allTiers;
    private Boolean isCompleted;
}
