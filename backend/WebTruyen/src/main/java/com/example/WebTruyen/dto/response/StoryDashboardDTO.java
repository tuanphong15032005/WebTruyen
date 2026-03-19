package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * StoryDashboardDTO
 * Response DTO for story information displayed on author dashboard
 * Contains essential story details for the author's story management panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryDashboardDTO {
    
    /**
     * Unique identifier of the story
     */
    private Long storyId;
    
    /**
     * Title of the story
     */
    private String title;
    
    /**
     * URL of the story cover image
     */
    private String coverUrl;
    
    /**
     * Current status of the story (draft, published, etc.)
     */
    private String status;
    
    /**
     * Total number of chapters in the story
     */
    private Integer chapterCount;
    
    /**
     * Last updated timestamp of the story
     */
    private LocalDateTime updatedAt;
}
