package com.example.WebTruyen.dto.response;

import com.example.WebTruyen.entity.enums.ChapterStatus;
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
public class ChapterDetailResponse {
    private Long id;
    private Long storyId;
    private Long volumeId;
    private String title;
    private Boolean free;
    private Long priceCoin;
    private ChapterStatus status;
    private Integer sequenceIndex;
    private List<ChapterSegmentResponse> segments;
    private Long nextChapterId;
    private Long previousChapterId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdateAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChapterSegmentResponse {
        private Long id;
        private Integer seq;
        private String segmentText;
    }
}
