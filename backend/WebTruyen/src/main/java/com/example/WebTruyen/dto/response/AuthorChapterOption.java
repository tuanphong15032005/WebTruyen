package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorChapterOption {
    private Long id;
    private String title;
    private String volumeTitle;
    private Integer volumeSequence;
    private Integer chapterSequence;
}
