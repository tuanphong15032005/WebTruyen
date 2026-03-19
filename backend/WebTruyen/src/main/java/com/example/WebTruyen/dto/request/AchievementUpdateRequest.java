package com.example.WebTruyen.dto.request;

import com.example.WebTruyen.entity.enums.AchievementCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementUpdateRequest {
    
    @Size(max = 50, message = "Code must be less than 50 characters")
    private String code;
    
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    private AchievementCategory category;
    
    private Boolean isActive;
}
