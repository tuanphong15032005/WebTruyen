package com.example.WebTruyen.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLibraryAlbumRequest(
        @NotBlank(message = "Album name is required")
        @Size(max = 255, message = "Album name must be at most 255 characters")
        String name,
        @Size(max = 1000, message = "Album description must be at most 1000 characters")
        String description,
        @Size(max = 20, message = "Album visibility is invalid")
        String visibility
) {
}
