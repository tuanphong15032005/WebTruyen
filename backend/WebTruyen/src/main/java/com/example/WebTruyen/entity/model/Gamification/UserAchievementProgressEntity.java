package com.example.WebTruyen.entity.model.Gamification;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievement_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "achievement_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserAchievementProgressEntity {

    @EmbeddedId
    private UserAchievementProgressId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("achievementId")
    @JoinColumn(name = "achievement_id", nullable = false)
    private AchievementEntity achievement;

    @Column(nullable = false)
    private Integer progress;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
