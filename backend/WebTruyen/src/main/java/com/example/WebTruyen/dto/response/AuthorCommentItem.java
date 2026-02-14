package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorCommentItem {
    private Long id;
    private String readerAvatarUrl;
    private String readerDisplayName;
    private String content;
    private LocalDateTime createdAt;
    /** Normal, Reported, Hidden */
    private String status;
    private Long parentId;
    private Long rootId;
    private Long chapterId;
    private String chapterTitle;
    @Builder.Default
    private List<AuthorCommentItem> replies = List.of();
}
