package com.example.WebTruyen.dto.response;

import java.util.List;

// Minhdq - 26/02/2026
// [Add author-draft-overview-response-dto - V1 - branch: clone-minhfinal2]
public record AuthorDraftOverviewResponse(
        List<AuthorDraftStoryResponse> stories,
        List<AuthorDraftChapterResponse> chapters
) {}

