package com.example.WebTruyen.entity.model.Content;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "volumes",
        indexes = {
                @Index(name = "ix_volumes_story", columnList = "story_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class VolumeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_volumes_story"))
    private StoryEntity story;

    @Column(length = 300)
    private String title;

    @Column(name = "sequence_index", nullable = false)
    private Integer sequenceIndex;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "volume", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ChapterEntity> chapters = new ArrayList<>();
}