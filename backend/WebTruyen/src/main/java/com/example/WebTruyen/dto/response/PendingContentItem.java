package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingContentItem {
    private Long id;
    private String contentType;
    private String storyTitle;
    private String chapterTitle;
    private String authorName;
    private String genre;
    private String ageRating;
    private LocalDateTime submittedAt;
}
