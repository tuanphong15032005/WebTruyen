package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.AchievementTierEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementTierRepository extends JpaRepository<AchievementTierEntity, Integer> {
    
    List<AchievementTierEntity> findByAchievementIdOrderByTierLevel(Integer achievementId);
    
    @Query("SELECT at FROM AchievementTierEntity at WHERE at.achievement.id = :achievementId ORDER BY at.tierLevel")
    List<AchievementTierEntity> findByAchievementId(@Param("achievementId") Integer achievementId);
    
    @Query("SELECT at FROM AchievementTierEntity at WHERE at.achievement.code = :achievementCode ORDER BY at.tierLevel")
    List<AchievementTierEntity> findByAchievementCodeOrderByTierLevel(@Param("achievementCode") String achievementCode);
    
    @Query("SELECT at FROM AchievementTierEntity at WHERE at.achievement.code = :achievementCode ORDER BY at.tierLevel")
    List<AchievementTierEntity> findByAchievementCode(@Param("achievementCode") String achievementCode);
    
    Optional<AchievementTierEntity> findByAchievementIdAndTierLevel(Integer achievementId, Integer tierLevel);
    
    boolean existsByAchievementIdAndTierLevel(Integer achievementId, Integer tierLevel);
    
    long count();
    
    long countByIsActive(boolean isActive);
}
