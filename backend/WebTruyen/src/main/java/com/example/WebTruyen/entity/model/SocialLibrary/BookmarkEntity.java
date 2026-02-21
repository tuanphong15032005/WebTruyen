package com.example.WebTruyen.entity.model.SocialLibrary;

import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "bookmarks",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_bookmarks_user_chapter_segment",
                        columnNames = {"user_id", "chapter_id", "segment_id"}
                )
        },
        indexes = {
                @Index(name = "ix_bookmarks_user", columnList = "user_id"),
                @Index(name = "ix_bookmarks_chapter", columnList = "chapter_id"),
                @Index(name = "ix_bookmarks_segment", columnList = "segment_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BookmarkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // N-1
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // N-1
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapter_id", nullable = false)
    private ChapterEntity chapter;

    // N-1 (segment thuộc chapter_segments)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "segment_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_bookmarks_segment")
    )
    private ChapterSegmentEntity segment; // lưu object để khỏi cần query

    @Column(name = "position_percent", precision = 5, scale = 2)
    private BigDecimal positionPercent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_favorite", nullable = false)
    private Boolean isFavorite;
}
