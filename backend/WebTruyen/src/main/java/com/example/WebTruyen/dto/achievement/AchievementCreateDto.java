package com.example.WebTruyen.dto.achievement;

import com.example.WebTruyen.entity.enums.AchievementCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementCreateDto {
    
    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must be less than 50 characters")
    private String code;
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    @NotNull(message = "Category is required")
    private AchievementCategory category;
    
    private Boolean isActive;
}
