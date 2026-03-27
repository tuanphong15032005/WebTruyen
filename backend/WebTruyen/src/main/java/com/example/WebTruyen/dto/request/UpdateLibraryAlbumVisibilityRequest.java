package com.example.WebTruyen.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateLibraryAlbumVisibilityRequest(
        @NotBlank(message = "Album visibility is required")
        @Size(max = 20, message = "Album visibility is invalid")
        String visibility
) {
}
