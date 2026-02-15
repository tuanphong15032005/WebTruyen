package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.StoryStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDashboardStoryResponse {
    private Long id;
    private String title;
    private String summary;
    private String coverUrl;
    private StoryStatus status;
    private Integer totalChapters;
    private Integer publishedChapters;
    private Integer draftChapters;
    private Integer scheduledChapters;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdateAt;

    // Nested chapters (optional - populated when expand chapters is requested)
    private List<AuthorChapterResponse> chapters;
    private Boolean chaptersExpanded;

    // Actions available for this story
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canPreview;
    private Boolean canManageChapters;
}
