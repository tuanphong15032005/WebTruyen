package com.example.WebTruyen.entity.model.Gamification;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_missions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DailyMissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "mission_code", nullable = false, length = 100)
    private String missionCode;

    @Lob
    private String description;

    @Lob
    private String target;

    @Column(name = "reward_coin")
    private Long rewardCoin;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_coin_type")
    private CoinType rewardCoinType;

    public enum CoinType { A, B }
}
