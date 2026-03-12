package com.example.WebTruyen.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class CreateReportRequest {

    @NotNull(message = "Story ID is required")
    private Integer storyId;

    @NotNull(message = "Chapter ID is required")
    private Long chapterId;

    @NotBlank(message = "Reason is required")
    @Size(max = 200, message = "Reason must be less than 200 characters")
    private String reason;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
}
