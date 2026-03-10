package com.example.WebTruyen.entity.model.SocialLibrary;

import com.example.WebTruyen.entity.keys.LibraryAlbumItemId;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "library_album_items",
        indexes = {
                @Index(name = "ix_library_album_items_story", columnList = "story_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryAlbumItemEntity {

    @EmbeddedId
    private LibraryAlbumItemId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("albumId")
    @JoinColumn(name = "album_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_library_album_items_album"))
    private LibraryAlbumEntity album;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("storyId")
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_library_album_items_story"))
    private StoryEntity story;

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;

    @PrePersist
    public void prePersist() {
        if (addedAt == null) addedAt = LocalDateTime.now();
    }
}
