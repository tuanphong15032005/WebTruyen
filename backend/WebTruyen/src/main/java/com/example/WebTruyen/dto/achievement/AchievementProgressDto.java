package com.example.WebTruyen.dto.achievement;

import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementProgressDto {
    
    private String achievementCode;
    private String achievementName;
    private String description;
    private Integer currentProgress;
    private Integer currentTier;
    private Integer totalTiers;
    private Double progressPercentage;
    private AchievementTierDto currentTierInfo;
    private AchievementTierDto nextTierInfo;
    private List<AchievementTierDto> allTiers;
    private Boolean isCompleted;
}
