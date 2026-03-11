package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.UserAchievementProgressEntity;
import com.example.WebTruyen.entity.model.Gamification.UserAchievementProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAchievementProgressRepository extends JpaRepository<UserAchievementProgressEntity, UserAchievementProgressId> {
    
    Optional<UserAchievementProgressEntity> findByUserIdAndAchievementId(Integer userId, Integer achievementId);
    
    @Query("SELECT uap FROM UserAchievementProgressEntity uap WHERE uap.user.id = :userId AND uap.achievement.code = :achievementCode")
    Optional<UserAchievementProgressEntity> findByUserIdAndAchievementCode(@Param("userId") Integer userId, @Param("achievementCode") String achievementCode);
}
