package com.example.WebTruyen.dto.request;

import com.example.WebTruyen.entity.enums.CoinType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementTierUpdateRequest {
    
    @Min(value = 1, message = "Tier level must be at least 1")
    private Integer tierLevel;
    
    @Min(value = 1, message = "Requirement must be at least 1")
    private Integer requirement;
    
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    @Size(max = 50, message = "Code must be less than 50 characters")
    private String code;
    
    @Min(value = 0, message = "Reward coin must be at least 0")
    private Long rewardCoin;
    
    private CoinType rewardCoinType;
    
    private Boolean isActive;
}
