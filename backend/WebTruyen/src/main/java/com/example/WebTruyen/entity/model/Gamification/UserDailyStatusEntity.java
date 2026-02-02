package com.example.WebTruyen.entity.model.Gamification;

import com.example.WebTruyen.entity.keys.UserDailyStatusId;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_daily_status")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserDailyStatusEntity {

    @EmbeddedId
    private UserDailyStatusId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("dailyMissionId")
    @JoinColumn(name = "daily_mission_id", nullable = false)
    private DailyMissionEntity dailyMission;

    @Lob
    private String progress;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
