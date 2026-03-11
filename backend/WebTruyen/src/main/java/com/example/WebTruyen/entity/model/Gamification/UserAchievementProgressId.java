package com.example.WebTruyen.entity.model.Gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievementProgressId implements Serializable {

    private Integer userId;
    private Integer achievementId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserAchievementProgressId that = (UserAchievementProgressId) o;
        return Objects.equals(userId, that.userId) && 
               Objects.equals(achievementId, that.achievementId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, achievementId);
    }
}
