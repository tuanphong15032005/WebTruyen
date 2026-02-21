package com.example.WebTruyen.dto.response;

import java.util.List;

public record VolumeSummaryResponse(
        Long id,
        Long storyId,
        String title,
        Integer sequenceIndex,
        Integer chapterCount,
        List<ChapterSummaryResponse> chapters
) {}
