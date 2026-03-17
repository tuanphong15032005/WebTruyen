package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for author search results
 * Contains author information with aggregated statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorSearchResponseDTO {
    
    private Long authorId;
    private String penName;
    private String displayName;
    private String avatarUrl;
    private String bio;
    
    // Aggregated statistics
    private Long totalStories;
    private Long totalViews;
    private Long followers;
    private BigDecimal rating;
    
    // For sorting purposes
    private Integer storyCount;
    private Long viewCount;
    private Integer followerCount;
}
