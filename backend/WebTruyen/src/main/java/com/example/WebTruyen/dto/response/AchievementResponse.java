package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.AchievementCategory;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementResponse {
    
    private Integer id;
    private String code;
    private String name;
    private String description;
    private AchievementCategory category;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AchievementTierResponse> tiers;
}
