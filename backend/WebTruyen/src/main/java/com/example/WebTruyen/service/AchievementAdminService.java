package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AchievementCreateRequest;
import com.example.WebTruyen.dto.request.AchievementUpdateRequest;
import com.example.WebTruyen.dto.request.AchievementTierCreateRequest;
import com.example.WebTruyen.dto.request.AchievementTierUpdateRequest;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.model.Gamification.AchievementTierEntity;
import com.example.WebTruyen.repository.AchievementRepository;
import com.example.WebTruyen.repository.AchievementTierRepository;
import com.example.WebTruyen.repository.UserAchievementProgressRepository;
import com.example.WebTruyen.repository.UserAchievementClaimRepository;
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
public class AchievementAdminService {

    private final AchievementRepository achievementRepository;
    private final AchievementTierRepository achievementTierRepository;
    private final UserAchievementProgressRepository userAchievementProgressRepository;
    private final UserAchievementClaimRepository userAchievementClaimRepository;
    private final AchievementCodeMappingService achievementCodeMappingService;

    // Achievement CRUD operations
    @Transactional(readOnly = true)
    public List<AchievementEntity> getAllAchievements() {
        return achievementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public AchievementEntity getAchievementById(Integer id) {
        return achievementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Achievement not found with id: " + id));
    }

    @Transactional
    public AchievementEntity createAchievement(AchievementCreateRequest createDto) {
        // Check if code already exists
        if (achievementRepository.existsByCode(createDto.getCode())) {
            throw new RuntimeException("Achievement code already exists: " + createDto.getCode());
        }

        AchievementEntity achievement = AchievementEntity.builder()
                .code(createDto.getCode())
                .name(createDto.getName())
                .description(createDto.getDescription())
                .category(createDto.getCategory().name())
                .isActive(createDto.getIsActive() != null ? createDto.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AchievementEntity saved = achievementRepository.save(achievement);
        
        // Refresh achievement mapping to include new achievement
        achievementCodeMappingService.refreshAchievementMapping();
        
        return saved;
    }

    @Transactional
    public AchievementEntity updateAchievement(Integer id, AchievementUpdateRequest updateDto) {
        log.info("Updating achievement {} with data: {}", id, updateDto);
        AchievementEntity existing = getAchievementById(id);

        // Check code uniqueness if changed
        if (updateDto.getCode() != null && !updateDto.getCode().equals(existing.getCode())) {
            if (achievementRepository.existsByCode(updateDto.getCode())) {
                throw new RuntimeException("Achievement code already exists: " + updateDto.getCode());
            }
            existing.setCode(updateDto.getCode());
        }

        if (updateDto.getName() != null) {
            existing.setName(updateDto.getName());
        }
        if (updateDto.getDescription() != null) {
            existing.setDescription(updateDto.getDescription());
        }
        if (updateDto.getCategory() != null) {
            existing.setCategory(updateDto.getCategory().name());
        }
        if (updateDto.getIsActive() != null) {
            log.info("Updating isActive from {} to {}", existing.getIsActive(), updateDto.getIsActive());
            existing.setIsActive(updateDto.getIsActive());
            
            // Update all tiers to match achievement's active status
            List<AchievementTierEntity> tiers = achievementTierRepository.findByAchievementId(existing.getId());
            for (AchievementTierEntity tier : tiers) {
                tier.setIsActive(updateDto.getIsActive());
            }
            achievementTierRepository.saveAll(tiers);
            log.info("Updated {} tiers to match achievement active status: {}", tiers.size(), updateDto.getIsActive());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return achievementRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAchievementRestrictions(Integer achievementId) {
        Map<String, Object> restrictions = new HashMap<>();
        
        AchievementEntity achievement = achievementRepository.findById(achievementId)
                .orElseThrow(() -> new RuntimeException("Achievement not found with id: " + achievementId));
        
        // Check if any user has progress for this achievement
        boolean hasUserProgress = userAchievementProgressRepository.existsByAchievementId(achievementId);
        
        // Check if any user has claimed any tier of this achievement
        List<AchievementTierEntity> tiers = achievementTierRepository.findByAchievementId(achievementId);
        boolean hasClaims = false;
        if (!tiers.isEmpty()) {
            List<Integer> tierIds = tiers.stream().map(AchievementTierEntity::getId).collect(Collectors.toList());
            hasClaims = userAchievementClaimRepository.existsByTierIdIn(tierIds);
        }
        
        restrictions.put("hasUserProgress", hasUserProgress);
        restrictions.put("hasClaims", hasClaims);
        
        // Determine if achievement can be edited/deleted
        boolean canEdit = !hasUserProgress && !hasClaims;
        boolean canDelete = !hasUserProgress && !hasClaims;
        
        restrictions.put("canEdit", canEdit);
        restrictions.put("canDelete", canDelete);
        restrictions.put("reason", !canDelete ? 
            (hasClaims ? "Đã có người dùng nhận thành tựu này" : "Có người dùng đã có tiến độ với thành tựu này") : null);
        
        return restrictions;
    }

    @Transactional
    public void deleteAchievement(Integer id) {
        AchievementEntity achievement = getAchievementById(id);

        // Check if any user has progress for this achievement
        boolean hasUserProgress = userAchievementProgressRepository.existsByAchievementId(id);
        if (hasUserProgress) {
            // Instead of hard delete, deactivate
            achievement.setIsActive(false);
            achievement.setUpdatedAt(LocalDateTime.now());
            achievementRepository.save(achievement);
            log.warn("Achievement {} has user progress, deactivated instead of deleted", id);
        } else {
            // First delete all tiers for this achievement
            List<AchievementTierEntity> tiers = achievementTierRepository.findByAchievementId(id);
            if (!tiers.isEmpty()) {
                achievementTierRepository.deleteAll(tiers);
                log.info("Deleted {} tiers for achievement {}", tiers.size(), id);
            }
            
            // Now safe to delete the achievement
            achievementRepository.delete(achievement);
            log.info("Achievement {} deleted successfully", id);
        }
    }

    // Achievement Tier CRUD operations
    @Transactional(readOnly = true)
    public List<AchievementTierEntity> getTiersByAchievement(Integer achievementId) {
        getAchievementById(achievementId); // Validate achievement exists
        return achievementTierRepository.findByAchievementCodeOrderByTierLevel(
                achievementRepository.findById(achievementId).get().getCode()
        );
    }

    @Transactional
    public AchievementTierEntity createTier(Integer achievementId, AchievementTierCreateRequest createDto) {
        AchievementEntity achievement = getAchievementById(achievementId);

        // Check if tier level already exists for this achievement
        if (achievementTierRepository.existsByAchievementIdAndTierLevel(achievementId, createDto.getTierLevel())) {
            throw new RuntimeException("Tier level already exists for this achievement: " + createDto.getTierLevel());
        }

        AchievementTierEntity tier = AchievementTierEntity.builder()
                .achievement(achievement)
                .tierLevel(createDto.getTierLevel())
                .requirement(createDto.getRequirement())
                .name(createDto.getName())
                .description(createDto.getDescription())
                .code(createDto.getCode())
                .rewardCoin(createDto.getRewardCoin())
                .rewardCoinType(createDto.getRewardCoinType())
                .isActive(createDto.getIsActive() != null ? createDto.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .build();

        return achievementTierRepository.save(tier);
    }

    @Transactional
    public AchievementTierEntity updateTier(Integer tierId, AchievementTierUpdateRequest updateDto) {
        AchievementTierEntity existing = achievementTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Tier not found with id: " + tierId));

        // Check if any user has reached this tier's requirement
        Integer achievementId = existing.getAchievement().getId();
        Integer requirement = existing.getRequirement();
        long usersReachedThisTier = userAchievementProgressRepository.countUsersReachedTierRequirement(achievementId, requirement);
        if (usersReachedThisTier > 0) {
            throw new RuntimeException("Không thể sửa Tier khi có " + usersReachedThisTier + " người dùng đã đạt đến mức yêu cầu của tier này. Vui lòng vô hiệu hóa (inactive) thay vì sửa.");
        }

        // Check tier level uniqueness if changed
        if (updateDto.getTierLevel() != null && !updateDto.getTierLevel().equals(existing.getTierLevel())) {
            if (achievementTierRepository.existsByAchievementIdAndTierLevel(
                    existing.getAchievement().getId(), updateDto.getTierLevel())) {
                throw new RuntimeException("Tier level already exists for this achievement: " + updateDto.getTierLevel());
            }
            existing.setTierLevel(updateDto.getTierLevel());
        }

        if (updateDto.getRequirement() != null) {
            existing.setRequirement(updateDto.getRequirement());
        }
        if (updateDto.getName() != null) {
            existing.setName(updateDto.getName());
        }
        if (updateDto.getDescription() != null) {
            existing.setDescription(updateDto.getDescription());
        }
        if (updateDto.getCode() != null) {
            existing.setCode(updateDto.getCode());
        }
        if (updateDto.getRewardCoin() != null) {
            existing.setRewardCoin(updateDto.getRewardCoin());
        }
        if (updateDto.getRewardCoinType() != null) {
            existing.setRewardCoinType(updateDto.getRewardCoinType());
        }
        if (updateDto.getIsActive() != null) {
            existing.setIsActive(updateDto.getIsActive());
        }

        return achievementTierRepository.save(existing);
    }

    @Transactional
    public void deleteTier(Integer tierId) {
        AchievementTierEntity tier = achievementTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Tier not found with id: " + tierId));

        // Check if any user has claimed this tier
        if (userAchievementClaimRepository.existsByTierId(tierId)) {
            throw new RuntimeException("Không thể xóa Tier đã được người dùng nhận. Vui lòng vô hiệu hóa (inactive) thay vì xóa.");
        }
        
        // Check if any user has reached this tier's requirement
        Integer achievementId = tier.getAchievement().getId();
        Integer requirement = tier.getRequirement();
        long usersReachedThisTier = userAchievementProgressRepository.countUsersReachedTierRequirement(achievementId, requirement);
        if (usersReachedThisTier > 0) {
            throw new RuntimeException("Không thể xóa Tier khi có " + usersReachedThisTier + " người dùng đã đạt đến mức yêu cầu của tier này. Vui lòng vô hiệu hóa (inactive) thay vì xóa.");
        }
        
        // Safe to delete for now
        achievementTierRepository.delete(tier);
        log.info("Tier {} deleted successfully", tierId);
    }

    @Transactional
    public List<AchievementTierEntity> createTiersBatch(Integer achievementId, List<AchievementTierCreateRequest> createDtos) {
        AchievementEntity achievement = getAchievementById(achievementId);
        
        List<AchievementTierEntity> tiers = new ArrayList<>();
        
        for (AchievementTierCreateRequest createDto : createDtos) {
            // Check for duplicate tier levels
            if (achievementTierRepository.existsByAchievementIdAndTierLevel(achievementId, createDto.getTierLevel())) {
                throw new RuntimeException("Tier level already exists for this achievement: " + createDto.getTierLevel());
            }

            AchievementTierEntity tier = AchievementTierEntity.builder()
                    .achievement(achievement)
                    .tierLevel(createDto.getTierLevel())
                    .requirement(createDto.getRequirement())
                    .name(createDto.getName())
                    .description(createDto.getDescription())
                    .code(createDto.getCode())
                    .rewardCoin(createDto.getRewardCoin())
                    .rewardCoinType(createDto.getRewardCoinType())
                    .isActive(createDto.getIsActive() != null ? createDto.getIsActive() : true)
                    .createdAt(LocalDateTime.now())
                    .build();

            tiers.add(tier);
        }

        return achievementTierRepository.saveAll(tiers);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAchievementStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Total achievements
        long totalAchievements = achievementRepository.count();
        stats.put("totalAchievements", totalAchievements);
        
        // Active achievements
        long activeAchievements = achievementRepository.countByIsActive(true);
        stats.put("activeAchievements", activeAchievements);
        
        // Inactive achievements
        long inactiveAchievements = achievementRepository.countByIsActive(false);
        stats.put("inactiveAchievements", inactiveAchievements);
        
        // Total tiers
        long totalTiers = achievementTierRepository.count();
        stats.put("totalTiers", totalTiers);
        
        // Active tiers
        long activeTiers = achievementTierRepository.countByIsActive(true);
        stats.put("activeTiers", activeTiers);
        
        // Achievements by category
        List<Object[]> categoryStats = achievementRepository.countByCategory();
        Map<String, Long> categories = categoryStats.stream()
                .collect(Collectors.toMap(
                        arr -> (String) arr[0],
                        arr -> (Long) arr[1]
                ));
        stats.put("categories", categories);
        
        // Users with progress
        long usersWithProgress = userAchievementProgressRepository.countDistinctUserId();
        stats.put("usersWithProgress", usersWithProgress);
        
        log.info("Achievement stats: total={}, active={}, inactive={}", 
            totalAchievements, activeAchievements, inactiveAchievements);
        
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTierRestrictions(Integer tierId) {
        Map<String, Object> restrictions = new HashMap<>();
        
        AchievementTierEntity tier = achievementTierRepository.findById(tierId)
                .orElseThrow(() -> new RuntimeException("Tier not found with id: " + tierId));
        
        Integer achievementId = tier.getAchievement().getId();
        Integer requirement = tier.getRequirement();
        
        // Check if any user has claimed this tier
        boolean hasClaims = userAchievementClaimRepository.existsByTierId(tierId);
        restrictions.put("hasClaims", hasClaims);
        
        // Check if any user has reached this tier's requirement
        long usersReachedThisTier = userAchievementProgressRepository.countUsersReachedTierRequirement(achievementId, requirement);
        restrictions.put("usersReachedThisTier", usersReachedThisTier);
        
        // Determine if tier can be edited/deleted
        boolean canEdit = !hasClaims && usersReachedThisTier == 0;
        boolean canDelete = !hasClaims && usersReachedThisTier == 0;
        
        restrictions.put("canEdit", canEdit);
        restrictions.put("canDelete", canDelete);
        restrictions.put("reason", !canEdit ? 
            (hasClaims ? "Đã có người dùng nhận tier này" : "Có " + usersReachedThisTier + " người dùng đã đạt đến mức yêu cầu của tier này") : null);
        
        return restrictions;
    }
}
