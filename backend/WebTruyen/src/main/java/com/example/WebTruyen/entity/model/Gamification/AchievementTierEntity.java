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

    @Column(nullable = false, length = 100)
    private String name;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(length = 50)
    private String code;

    @Column(name = "reward_coin", nullable = false)
    private Long rewardCoin;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_coin_type", nullable = false)
    private CoinType rewardCoinType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = java.time.LocalDateTime.now();
        }
    }

    // Helper methods
    public String getName() {
        return this.name;
    }

    public String getDescription() {
        return this.description;
    }

    public String getCode() {
        return this.code;
    }
}
