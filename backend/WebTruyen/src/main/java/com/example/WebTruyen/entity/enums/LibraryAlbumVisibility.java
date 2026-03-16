package com.example.WebTruyen.entity.enums;

public enum LibraryAlbumVisibility {
    PRIVATE("private"),
    PUBLIC("public");

    private final String value;

    LibraryAlbumVisibility(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static LibraryAlbumVisibility fromValue(String value) {
        for (LibraryAlbumVisibility visibility : values()) {
            if (visibility.value.equals(value)) {
                return visibility;
            }
        }
        throw new IllegalArgumentException("Unknown library album visibility: " + value);
    }
}
