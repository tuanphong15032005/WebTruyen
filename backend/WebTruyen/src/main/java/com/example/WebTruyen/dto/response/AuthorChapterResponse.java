package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorChapterResponse {
    private Long id;
    private String title;
    private Integer sequenceIndex;
    private ChapterStatus status;
    private Boolean free;
    private Long priceCoin;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdateAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime scheduledPublishAt;

    // Actions available for this chapter
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canPreview;
}
