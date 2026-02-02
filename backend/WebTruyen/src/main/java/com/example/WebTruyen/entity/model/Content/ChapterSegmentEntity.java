package com.example.WebTruyen.entity.model.Content;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chapter_segments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_chapter_segments_chapter_seq", columnNames = {"chapter_id","seq"})
        },
        indexes = {
                @Index(name = "ix_chapter_segments_chapter_seq", columnList = "chapter_id,seq")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChapterSegmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chapter_segments_chapter"))
    private ChapterEntity chapter;

    @Column(nullable = false)
    private Integer seq;

    @Lob
    @Column(name = "segment_text", nullable = false)
    private String segmentText;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}