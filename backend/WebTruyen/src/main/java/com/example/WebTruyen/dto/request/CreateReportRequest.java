package com.example.WebTruyen.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class CreateReportRequest {

    // Report target - only one should be provided
    private Long chapterId;
    
    private Integer storyId;
    
    private Long commentId;

    @NotBlank(message = "Reason is required")
    @Size(max = 200, message = "Reason must be less than 200 characters")
    private String reason;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
}
