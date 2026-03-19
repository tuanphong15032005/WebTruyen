package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for author search suggestions
 * Simplified version for dropdown suggestions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorSuggestionResponseDTO {
    
    private Long authorId;
    private String penName;
    private String displayName;
    private String avatarUrl;
    private Long followers;
    private String primaryGenre;
}
