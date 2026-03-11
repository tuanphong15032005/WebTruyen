package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.UserAchievementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievementEntity, Long> {
    
    Optional<UserAchievementEntity> findByUserIdAndAchievementId(Integer userId, Integer achievementId);
    
    @Query("SELECT ua FROM UserAchievementEntity ua WHERE ua.user.id = :userId AND ua.isClaimed = false")
    List<UserAchievementEntity> findUnclaimedByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT ua FROM UserAchievementEntity ua WHERE ua.user.id = :userId ORDER BY ua.achievedAt DESC")
    List<UserAchievementEntity> findByUserIdOrderByAchievedAtDesc(@Param("userId") Integer userId);
    
    boolean existsByUserIdAndAchievementId(Integer userId, Integer achievementId);
}
