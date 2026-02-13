package com.example.WebTruyen.entity.model.Content;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_review_user_story", columnNames = {"user_id", "story_id"})
        },
        indexes = {
                @Index(name = "ix_reviews_story", columnList = "story_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_story"))
    private StoryEntity story;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_user"))
    private UserEntity user;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 255)
    private String title;

    @Lob
    private String content;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        validateRating();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        validateRating();
    }

    private void validateRating() {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalStateException("rating must be between 1 and 5");
        }
    }
}
