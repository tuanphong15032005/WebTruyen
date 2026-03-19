package com.example.WebTruyen.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementProgressRequest {
    
    @Min(value = 1, message = "Increment value must be at least 1")
    private Integer increment;
    
    private Integer value;
}
