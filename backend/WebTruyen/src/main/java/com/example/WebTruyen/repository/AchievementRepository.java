package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<AchievementEntity, Integer> {
    
    Optional<AchievementEntity> findByCode(String code);
}
