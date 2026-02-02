package com.example.WebTruyen.entity.keys;


import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class UserDailyStatusId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "daily_mission_id")
    private Long dailyMissionId;
}