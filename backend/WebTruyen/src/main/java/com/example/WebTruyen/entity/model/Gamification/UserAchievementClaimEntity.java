package com.example.WebTruyen.entity.model.Gamification;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievement_claims",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tier_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserAchievementClaimEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tier_id", nullable = false)
    private AchievementTierEntity tier;

    @Column(name = "claimed_at", nullable = false)
    private LocalDateTime claimedAt;
}
