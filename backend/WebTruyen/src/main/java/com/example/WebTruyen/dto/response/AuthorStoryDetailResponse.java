package com.example.WebTruyen.dto.response;

import java.util.List;

public record AuthorStoryDetailResponse(
        Long id,
        String title,
        String summaryHtml,
        String coverUrl,
        String kind,
        TagDto category,
        List<TagDto> tags,
        String status,
        String completionStatus,
        Long wordCount
) {}
