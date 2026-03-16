package com.example.WebTruyen.dto.response;

import java.util.List;

public record StoryLibraryDialogResponse(
        boolean saved,
        boolean favorite,
        String readingStatus,
        List<LibraryAlbumOptionResponse> albums
) {
}
