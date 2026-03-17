package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DashboardSummaryResponse
 * Response DTO for author dashboard summary statistics
 * Contains key performance metrics for the author's dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    
    /**
     * Total number of chapters across all author's stories
     */
    private Long totalChapters;
    
    /**
     * Total number of comments across all author's stories
     */
    private Long totalComments;
    
    /**
     * Total number of stories by the author
     */
    private Long totalStories;
    
    /**
     * Growth percentage for total chapters (Day over Day)
     */
    private Double chaptersGrowth;
    
    /**
     * Growth percentage for total comments (Day over Day)
     */
    private Double commentsGrowth;
    
    /**
     * Growth percentage for total stories (Day over Day)
     */
    private Double storiesGrowth;
}
