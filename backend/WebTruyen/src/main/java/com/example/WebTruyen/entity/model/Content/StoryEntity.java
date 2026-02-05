package com.example.WebTruyen.entity.model.Content;


import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "stories",
        indexes = {
                @Index(name = "ix_stories_author", columnList = "author_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_stories_author"))
    private UserEntity author;

    @Column(nullable = false, length = 500)
    private String title;

    @Lob
    private String summary;

    @Column(name = "cover_url", length = 1000)
    private String coverUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoryStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<VolumeEntity> volumes = new ArrayList<>();

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryTagEntity> storyTags = new ArrayList<>();

    @PrePersist //khoi tao cac gia tri mac dinh truoc khi them data vao Entity
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = StoryStatus.draft;
    }

}