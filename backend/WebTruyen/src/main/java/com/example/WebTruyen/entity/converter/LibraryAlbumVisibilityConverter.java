package com.example.WebTruyen.entity.converter;

import com.example.WebTruyen.entity.enums.LibraryAlbumVisibility;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class LibraryAlbumVisibilityConverter implements AttributeConverter<LibraryAlbumVisibility, String> {

    @Override
    public String convertToDatabaseColumn(LibraryAlbumVisibility visibility) {
        return visibility == null ? null : visibility.getValue();
    }

    @Override
    public LibraryAlbumVisibility convertToEntityAttribute(String value) {
        return value == null ? null : LibraryAlbumVisibility.fromValue(value);
    }
}
