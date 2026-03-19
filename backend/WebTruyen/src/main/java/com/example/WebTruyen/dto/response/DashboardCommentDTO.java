package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DashboardCommentDTO
 * Response DTO for comment information displayed on author dashboard
 * Contains comment details for the author's latest comments panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardCommentDTO {
    
    /**
     * Unique identifier of the comment
     */
    private Long commentId;
    
    /**
     * Username of the comment author
     */
    private String username;
    
    /**
     * Avatar URL of the comment author
     */
    private String avatar;
    
    /**
     * Content of the comment
     */
    private String content;
    
    /**
     * Title of the story where the comment was posted
     */
    private String storyTitle;
    
    /**
     * Timestamp when the comment was created
     */
    private LocalDateTime createdAt;
}
