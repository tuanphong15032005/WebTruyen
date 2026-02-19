package com.example.WebTruyen.entity.model.Content;


import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.enums.StoryKind;
import com.example.WebTruyen.entity.enums.StoryCompletionStatus;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoryKind kind;

    @Column(name = "original_author_name", length = 300)
    private String originalAuthorName;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_author_user_id",
            foreignKey = @ForeignKey(name = "fk_stories_original_author_user"))
    private UserEntity originalAuthorUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_status", nullable = false)
    private StoryCompletionStatus completionStatus;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "rating_sum", nullable = false)
    private long ratingSum;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "rating_avg", precision = 4, scale = 2)
    private BigDecimal ratingAvg;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<VolumeEntity> volumes = new ArrayList<>();

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryTagEntity> storyTags = new ArrayList<>();

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryReviewEntity> storyReviews = new ArrayList<>();

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReadingHistoryEntity> readingHistories = new ArrayList<>();

    @PrePersist //khoi tao cac gia tri mac dinh truoc khi them data vao Entity
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = StoryStatus.draft;
        if (kind == null) kind = StoryKind.original;
        if (completionStatus == null) completionStatus = StoryCompletionStatus.ongoing;
        validateOriginalAuthorRule();
    }

    @PreUpdate
    public void preUpdate() {
        validateOriginalAuthorRule();
    }

    private void validateOriginalAuthorRule() {
        if (kind == StoryKind.translated) {
            if (originalAuthorName == null || originalAuthorName.isBlank()) {
                throw new IllegalStateException("originalAuthorName is required when kind is translated");
            }
            return;
        }
        originalAuthorName = null;
    }

}
