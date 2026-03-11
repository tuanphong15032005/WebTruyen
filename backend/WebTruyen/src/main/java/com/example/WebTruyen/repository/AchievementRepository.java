package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<AchievementEntity, Integer> {
    
    Optional<AchievementEntity> findByCode(String code);
    
    @Query("SELECT a FROM AchievementEntity a WHERE a.id NOT IN " +
           "(SELECT ua.achievement.id FROM com.example.WebTruyen.entity.model.Gamification.UserAchievementEntity ua WHERE ua.user.id = :userId)")
    List<AchievementEntity> findUnlockedAchievementsByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT ua.achievement FROM com.example.WebTruyen.entity.model.Gamification.UserAchievementEntity ua WHERE ua.user.id = :userId")
    List<AchievementEntity> findAchievementsByUserId(@Param("userId") Integer userId);
}
