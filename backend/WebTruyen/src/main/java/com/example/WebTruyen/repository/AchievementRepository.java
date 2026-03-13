package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<AchievementEntity, Integer> {
    
    Optional<AchievementEntity> findByCode(String code);
    
    boolean existsByCode(String code);
    
    long count();
    
    long countByIsActive(boolean isActive);
    
    List<AchievementEntity> findByIsActive(boolean isActive);
    
    List<AchievementEntity> findByCategoryAndIsActive(String category, boolean isActive);
    
    @Query("SELECT a.category, COUNT(a) FROM AchievementEntity a GROUP BY a.category")
    List<Object[]> countByCategory();
}
