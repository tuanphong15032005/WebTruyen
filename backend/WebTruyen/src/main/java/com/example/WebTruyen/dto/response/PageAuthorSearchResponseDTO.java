package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated response for author search
 * Contains search results with pagination metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageAuthorSearchResponseDTO {
    
    private List<AuthorSearchResponseDTO> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean empty;
}
