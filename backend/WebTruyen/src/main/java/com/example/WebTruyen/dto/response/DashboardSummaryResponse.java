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
     * Total views across all author's stories
     */
    private Long totalViews;
    
    /**
     * Views growth percentage (compared to previous period)
     */
    private Double viewsGrowth;
    
    /**
     * Total number of followers
     */
    private Long followers;
    
    /**
     * Followers growth percentage (compared to previous period)
     */
    private Double followersGrowth;
    
    /**
     * Total revenue from successful transactions (in VND)
     */
    private Long revenue;
    
    /**
     * Unpaid revenue amount (in VND)
     */
    private Long unpaidRevenue;
    
    /**
     * Total number of comments on author's stories
     */
    private Long comments;
    
    /**
     * Number of pending comments awaiting moderation
     */
    private Long pendingComments;
}
