package com.example.WebTruyen.entity.model.Gamification;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AchievementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;


    @Lob
    @Column(name = "criteria_json", columnDefinition = "LONGTEXT")
    private String criteriaJson;

    @Column(name = "reward_coin")
    private Long rewardCoin;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_coin_type")
    private CoinType rewardCoinType;

    public enum CoinType { A, B }
}
