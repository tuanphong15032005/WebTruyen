package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.UserAchievementClaimEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementClaimRepository extends JpaRepository<UserAchievementClaimEntity, Long> {
    
    Optional<UserAchievementClaimEntity> findByUserIdAndTierId(Long userId, Integer tierId);
    
    @Query("SELECT uac FROM UserAchievementClaimEntity uac WHERE uac.user.id = :userId AND uac.tier.achievement.code = :achievementCode ORDER BY uac.tier.tierLevel DESC")
    List<UserAchievementClaimEntity> findClaimsByUserIdAndAchievementCode(@Param("userId") Long userId, @Param("achievementCode") String achievementCode);
    
    boolean existsByUserIdAndTierId(Long userId, Integer tierId);
}
