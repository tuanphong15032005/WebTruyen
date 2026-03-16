package com.example.WebTruyen.dto.response;

import java.time.LocalDateTime;

public record BookmarkStoryResponse(
        Long storyId,
        String title,
        String coverImage,
        Integer bookmarkCount,
        LocalDateTime lastBookmark
) {
}
