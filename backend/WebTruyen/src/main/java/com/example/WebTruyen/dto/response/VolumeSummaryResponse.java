package com.example.WebTruyen.dto.response;

import java.util.List;

public record VolumeSummaryResponse(
        Long id,
        Long storyId,
        String title,
        String coverUrl,
        Integer sequenceIndex,
        Integer chapterCount,
        List<ChapterSummaryResponse> chapters
) {}
