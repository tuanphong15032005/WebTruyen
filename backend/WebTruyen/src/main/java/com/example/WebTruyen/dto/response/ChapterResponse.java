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
public class ChapterResponse {
    private Long id;
    private Long storyId;
    private Long volumeId;
    private String title;
    private String content;
    private Boolean free;
    private Long priceCoin;
    private ChapterStatus status;
    private Integer sequenceIndex;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdateAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime scheduledPublishAt;
}
