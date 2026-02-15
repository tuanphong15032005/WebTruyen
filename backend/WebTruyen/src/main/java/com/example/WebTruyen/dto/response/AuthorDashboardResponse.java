package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDashboardResponse {
    private List<AuthorDashboardStoryResponse> stories;
    private Integer totalStories;
    private Integer totalChapters;
    private Integer publishedChapters;
    private Integer draftChapters;
    private Integer scheduledChapters;
    
    // Filter information
    private String currentKeyword;
    private String currentStatusFilter;
}
