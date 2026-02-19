package com.example.WebTruyen.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthorChapterPerformanceItem {
    private Long chapterId;
    private String chapterTitle;
    private String chapterStatus;
    private Integer chapterNumber;
    private Long views;
    private Long coinEarned;
}
