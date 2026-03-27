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
    
    Optional<UserAchievementProgressEntity> findByUserIdAndAchievementId(Long userId, Integer achievementId);
    
    @Query("SELECT uap FROM UserAchievementProgressEntity uap WHERE uap.user.id = :userId AND uap.achievement.code = :achievementCode")
    Optional<UserAchievementProgressEntity> findByUserIdAndAchievementCode(@Param("userId") Long userId, @Param("achievementCode") String achievementCode);
    
    boolean existsByAchievementId(Integer achievementId);
    
    @Query("SELECT COUNT(DISTINCT uap.user.id) FROM UserAchievementProgressEntity uap")
    long countDistinctUserId();
    
    @Query("SELECT COUNT(uap) FROM UserAchievementProgressEntity uap WHERE uap.achievement.id = :achievementId AND uap.progress >= :requirement")
    long countUsersReachedTierRequirement(@Param("achievementId") Integer achievementId, @Param("requirement") Integer requirement);
}
