package com.example.WebTruyen.entity.model.Content;

import com.example.WebTruyen.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "chapters",
        indexes = {
                @Index(name = "ix_chapters_volume", columnList = "volume_id"),
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChapterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volume_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chapters_volume"))
    private VolumeEntity volume;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "sequence_index", nullable = false)
    private Integer sequenceIndex;

    @Column(name = "is_free", nullable = false)
    private boolean free;

    @Column(name = "price_coin")
    private Long priceCoin;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChapterStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_update_at")
    private LocalDateTime lastUpdateAt;

    @OneToMany(mappedBy = "chapter", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ChapterSegmentEntity> segments = new ArrayList<>();

    @OneToOne(mappedBy = "chapter", fetch = FetchType.LAZY)
    private DraftEntity draft;
}