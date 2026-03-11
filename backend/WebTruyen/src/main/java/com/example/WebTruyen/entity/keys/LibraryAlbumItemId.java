package com.example.WebTruyen.entity.keys;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class LibraryAlbumItemId implements Serializable {

    @Column(name = "album_id")
    private Long albumId;

    @Column(name = "story_id")
    private Long storyId;
}
