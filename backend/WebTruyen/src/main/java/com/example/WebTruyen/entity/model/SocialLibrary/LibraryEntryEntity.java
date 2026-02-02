package com.example.WebTruyen.entity.model.SocialLibrary;


import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "library_entries",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_library_entries_user_story", columnNames = {"user_id","story_id"})
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LibraryEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_library_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_library_story"))
    private StoryEntity story;

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;

    @Column(name = "is_favorite", nullable = false)
    private boolean favorite;
}