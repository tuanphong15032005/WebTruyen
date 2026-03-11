package com.example.WebTruyen.entity.model.Gamification;

import com.example.WebTruyen.entity.enums.CoinType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievement_tiers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementTierEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "achievement_id", nullable = false)
    private AchievementEntity achievement;

    @Column(name = "tier_level", nullable = false)
    private Integer tierLevel;

    @Column(nullable = false)
    private Integer requirement;

    @Column(name = "reward_coin", nullable = false)
    private Long rewardCoin;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_coin_type", nullable = false)
    private CoinType rewardCoinType;

    @Column(name = "created_at", nullable = false)
    private java.time.LocalDateTime createdAt;

    // Helper methods
    public String getName() {
        return achievement != null ? achievement.getName() : null;
    }

    public String getDescription() {
        return achievement != null ? achievement.getDescription() : null;
    }

    public String getCode() {
        return achievement != null ? achievement.getCode() : null;
    }
}
