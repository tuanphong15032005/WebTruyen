package com.example.WebTruyen.dto.response;

public record LibraryAlbumOptionResponse(
        Long id,
        String name,
        String description,
        String visibility,
        Long itemCount,
        String coverUrl,
        boolean containsStory
) {
}
