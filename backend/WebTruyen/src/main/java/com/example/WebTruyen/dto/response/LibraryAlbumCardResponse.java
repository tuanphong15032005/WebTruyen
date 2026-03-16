package com.example.WebTruyen.dto.response;

import java.util.List;

public record LibraryAlbumCardResponse(
        Long id,
        String name,
        String description,
        String visibility,
        Long itemCount,
        List<String> previewCoverUrls,
        Long remainingCount
) {
}
