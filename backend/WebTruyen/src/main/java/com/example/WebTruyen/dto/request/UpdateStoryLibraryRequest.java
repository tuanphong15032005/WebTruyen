package com.example.WebTruyen.dto.request;

import java.util.List;

public record UpdateStoryLibraryRequest(
        String readingStatus,
        List<Long> albumIds
) {
}
