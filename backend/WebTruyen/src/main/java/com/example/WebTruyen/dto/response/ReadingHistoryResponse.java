package com.example.WebTruyen.dto.response;

import java.util.List;

public record ReadingHistoryResponse(
        ReadingHistoryDetailResponse mostRecent,
        List<ReadingHistoryDetailResponse> histories,
        long totalElements,
        int totalPages,
        int currentPage
) {
}
