package com.example.WebTruyen.dto.response;

import java.util.List;

public record LibraryAlbumDetailResponse(
        Long id,
        String name,
        String description,
        String visibility,
        Long itemCount,
        List<StoryResponse> stories
) {
}
