package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AchievementProgressResponse;
import com.example.WebTruyen.dto.response.AchievementTierResponse;
import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Gamification.*;
import com.example.WebTruyen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TieredAchievementService {

    private final AchievementRepository achievementRepository;
    private final AchievementTierRepository achievementTierRepository;
    private final UserAchievementProgressRepository userAchievementProgressRepository;
    private final UserAchievementClaimRepository userAchievementClaimRepository;
    private final WalletService walletService;

    @Transactional
    public void updateProgress(Long userId, String achievementCode, Integer incrementValue) {
        log.info("DEBUG: Updating progress for user {} and achievement {} with increment {}", userId, achievementCode, incrementValue);
        
        try {
            AchievementEntity achievement = achievementRepository.findByCode(achievementCode)
                    .orElseThrow(() -> new RuntimeException("Achievement not found: " + achievementCode));
            
            log.info("DEBUG: Found achievement: {} (ID: {}, Active: {})", achievement.getCode(), achievement.getId(), achievement.getIsActive());
            
            UserAchievementProgressEntity progress = userAchievementProgressRepository
                    .findByUserIdAndAchievementId(userId, achievement.getId())
                    .orElse(UserAchievementProgressEntity.builder()
                            .id(UserAchievementProgressId.builder()
                                    .userId(userId)
                                    .achievementId(achievement.getId())
                                    .build())
                            .user(UserEntity.builder().id(userId).build())
                            .achievement(achievement)
                            .progress(0)
                            .updatedAt(LocalDateTime.now())
                            .build());
            
            int oldProgress = progress.getProgress();
            progress.setProgress(oldProgress + incrementValue);
            progress.setUpdatedAt(LocalDateTime.now());
            
            UserAchievementProgressEntity saved = userAchievementProgressRepository.save(progress);
            
            log.info("DEBUG: Updated progress for user {} achievement {}: {} -> {}", userId, achievementCode, oldProgress, saved.getProgress());
        } catch (Exception e) {
            log.error("DEBUG: Error updating progress for user {} achievement {}: {}", userId, achievementCode, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void setProgress(Long userId, String achievementCode, Integer value) {
        log.info("Setting progress for user {} and achievement {} to {}", userId, achievementCode, value);
        
        AchievementEntity achievement = achievementRepository.findByCode(achievementCode)
                .orElseThrow(() -> new RuntimeException("Achievement not found: " + achievementCode));
        
        UserAchievementProgressEntity progress = userAchievementProgressRepository
                .findByUserIdAndAchievementId(userId, achievement.getId())
                .orElse(UserAchievementProgressEntity.builder()
                        .id(UserAchievementProgressId.builder()
                                .userId(userId)
                                .achievementId(achievement.getId())
                                .build())
                        .user(UserEntity.builder().id(userId).build())
                        .achievement(achievement)
                        .progress(0)
                        .updatedAt(LocalDateTime.now())
                        .build());
        
        progress.setProgress(value);
        progress.setUpdatedAt(LocalDateTime.now());
        
        userAchievementProgressRepository.save(progress);
        
        log.info("Set progress for user {} achievement {}: {}", userId, achievementCode, progress.getProgress());
    }

    public AchievementProgressResponse getAchievementProgress(Long userId, String achievementCode) {
        log.info("Getting achievement progress for user {} and achievement {}", userId, achievementCode);
        
        AchievementEntity achievement = achievementRepository.findByCode(achievementCode)
                .orElseThrow(() -> new RuntimeException("Achievement not found: " + achievementCode));
        
        // Check if achievement is active
        if (!achievement.getIsActive()) {
            throw new RuntimeException("Achievement is not active: " + achievementCode);
        }
        
        List<AchievementTierEntity> allTiers = achievementTierRepository
                .findByAchievementCode(achievementCode);
        
        if (allTiers.isEmpty()) {
            throw new RuntimeException("No tiers found for achievement: " + achievementCode);
        }
        
        UserAchievementProgressEntity progress = userAchievementProgressRepository
                .findByUserIdAndAchievementId(userId, achievement.getId())
                .orElse(UserAchievementProgressEntity.builder()
                        .id(UserAchievementProgressId.builder()
                                .userId(userId)
                                .achievementId(achievement.getId())
                                .build())
                        .progress(0)
                        .build());
        
        List<UserAchievementClaimEntity> claims = userAchievementClaimRepository
                .findClaimsByUserIdAndAchievementCode(userId, achievementCode);
        
        Set<Integer> claimedTierIds = claims.stream()
                .map(claim -> claim.getTier().getId())
                .collect(Collectors.toSet());
        
        return buildProgressDto(achievement, allTiers, progress, claimedTierIds);
    }

    public List<AchievementProgressResponse> getAllAchievementProgress(Long userId) {
        log.info("Getting all achievement progress for user {}", userId);
        
        // Get all active achievements
        List<AchievementEntity> activeAchievements = achievementRepository.findByIsActive(true);
        List<AchievementProgressResponse> result = new ArrayList<>();
        
        for (AchievementEntity achievement : activeAchievements) {
            try {
                AchievementProgressResponse progress = getAchievementProgress(userId, achievement.getCode());
                result.add(progress);
            } catch (Exception e) {
                log.warn("Could not get progress for achievement {}: {}", achievement.getCode(), e.getMessage());
            }
        }
        
        return result;
    }

    @Transactional
    public AchievementTierResponse claimTier(Long userId, Integer tierId) {
        log.info("User {} claiming tier {}", userId, tierId);
        
        AchievementTierEntity tier = achievementTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Tier not found: " + tierId));
        
        if (userAchievementClaimRepository.existsByUserIdAndTierId(userId, tierId)) {
            throw new RuntimeException("Tier already claimed: " + tierId);
        }
        
        UserAchievementProgressEntity progress = userAchievementProgressRepository
                .findByUserIdAndAchievementId(userId, tier.getAchievement().getId())
                .orElseThrow(() -> new RuntimeException("No progress found for achievement: " + tier.getAchievement().getCode()));
        
        if (progress.getProgress() < tier.getRequirement()) {
            throw new RuntimeException("Tier requirements not met. Required: " + tier.getRequirement() + ", Current: " + progress.getProgress());
        }
        
        UserAchievementClaimEntity claim = UserAchievementClaimEntity.builder()
                .user(UserEntity.builder().id(userId).build())
                .tier(tier)
                .claimedAt(LocalDateTime.now())
                .build();
        
        userAchievementClaimRepository.save(claim);
        
        grantReward(userId, tier);
        
        log.info("User {} successfully claimed tier {} with reward {} coins", userId, tierId, tier.getRewardCoin());
        
        return convertToTierDto(tier, progress.getProgress(), Set.of(tierId), true);
    }

    private AchievementProgressResponse buildProgressDto(AchievementEntity achievement, 
                                                  List<AchievementTierEntity> allTiers,
                                                  UserAchievementProgressEntity progress,
                                                  Set<Integer> claimedTierIds) {
        
        // Only include visible tiers (current and claimed) in the response
        List<AchievementTierResponse> visibleTierDtos = allTiers.stream()
                .map(tier -> convertToTierDto(tier, progress.getProgress(), claimedTierIds, false))
                .filter(tierDto -> tierDto.getVisible())
                .collect(Collectors.toList());
        
        AchievementTierEntity currentTier = determineCurrentTier(allTiers, progress.getProgress(), claimedTierIds);
        AchievementTierEntity nextTier = determineNextTier(allTiers, progress.getProgress(), claimedTierIds);
        
        Integer completedTiers = (int) allTiers.stream()
                .filter(tier -> progress.getProgress() >= tier.getRequirement())
                .count();
        
        Double progressPercentage = nextTier != null 
                ? (Math.min(progress.getProgress(), nextTier.getRequirement()) * 100.0 / nextTier.getRequirement())
                : 100.0;
        
        return AchievementProgressResponse.builder()
                .achievementCode(achievement.getCode())
                .achievementName(achievement.getName())
                .description(achievement.getDescription())
                .currentProgress(progress.getProgress())
                .currentTier(completedTiers)
                .totalTiers(allTiers.size())
                .progressPercentage(progressPercentage)
                .currentTierInfo(currentTier != null ? convertToTierDto(currentTier, progress.getProgress(), claimedTierIds, false) : null)
                .nextTierInfo(nextTier != null ? convertToTierDto(nextTier, progress.getProgress(), claimedTierIds, false) : null)
                .allTiers(visibleTierDtos) // Only return visible tiers
                .isCompleted(nextTier == null)
                .build();
    }

    private AchievementTierEntity determineCurrentTier(List<AchievementTierEntity> allTiers, 
                                                      Integer currentProgress, 
                                                      Set<Integer> claimedTierIds) {
        return allTiers.stream()
                .filter(tier -> currentProgress >= tier.getRequirement() && !claimedTierIds.contains(tier.getId()))
                .findFirst()
                .orElse(null);
    }

    private AchievementTierEntity determineNextTier(List<AchievementTierEntity> allTiers, 
                                                   Integer currentProgress, 
                                                   Set<Integer> claimedTierIds) {
        return allTiers.stream()
                .filter(tier -> currentProgress < tier.getRequirement())
                .findFirst()
                .orElse(null);
    }

    private AchievementTierResponse convertToTierDto(AchievementTierEntity tier, 
                                              Integer currentProgress, 
                                              Set<Integer> claimedTierIds,
                                              Boolean isClaimed) {
        Boolean completed = currentProgress >= tier.getRequirement();
        Boolean claimed = claimedTierIds.contains(tier.getId());
        Boolean current = completed && !claimed;
        // Only show current tier (completed but not claimed) and claimed tiers
        Boolean visible = current || claimed;
        
        return AchievementTierResponse.builder()
                .id(tier.getId())
                .tierLevel(tier.getTierLevel())
                .requirement(tier.getRequirement())
                .name(tier.getName())
                .description(tier.getDescription())
                .code(tier.getCode())
                .rewardCoin(tier.getRewardCoin())
                .rewardCoinType(tier.getRewardCoinType())
                .completed(completed)
                .claimed(claimed)
                .current(current)
                .visible(visible)
                .build();
    }

    @Transactional
    private void grantReward(Long userId, AchievementTierEntity tier) {
        if (tier.getRewardCoin() != null && tier.getRewardCoin() > 0) {
            UserEntity user = UserEntity.builder().id(userId).build();
            
            if (tier.getRewardCoinType() == CoinType.A) {
                walletService.addCoinA(user, tier.getRewardCoin(), 
                    LedgerReason.REVIEW_REWARD, "ACHIEVEMENT", 
                    "Thưởng thành tích: " + tier.getName());
            } else {
                walletService.addCoinB(user, tier.getRewardCoin(), 
                    LedgerReason.REVIEW_REWARD);
            }
        }
    }
}
