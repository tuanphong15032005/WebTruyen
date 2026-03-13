package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.dto.achievement.AchievementCreateDto;
import com.example.WebTruyen.dto.achievement.AchievementUpdateDto;
import com.example.WebTruyen.dto.achievement.AchievementTierCreateDto;
import com.example.WebTruyen.dto.achievement.AchievementTierUpdateDto;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.model.Gamification.AchievementTierEntity;
import com.example.WebTruyen.service.AchievementAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/achievements")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
public class AchievementAdminController {

    private final AchievementAdminService achievementAdminService;

    // Achievement CRUD
    @GetMapping
    public ResponseEntity<List<AchievementEntity>> getAllAchievements() {
        log.info("Admin requesting all achievements");
        List<AchievementEntity> achievements = achievementAdminService.getAllAchievements();
        return ResponseEntity.ok(achievements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AchievementEntity> getAchievementById(@PathVariable Integer id) {
        log.info("Admin requesting achievement with id: {}", id);
        AchievementEntity achievement = achievementAdminService.getAchievementById(id);
        return ResponseEntity.ok(achievement);
    }

    @PostMapping
    public ResponseEntity<AchievementEntity> createAchievement(@Valid @RequestBody AchievementCreateDto createDto) {
        log.info("Admin creating new achievement: {}", createDto.getName());
        AchievementEntity created = achievementAdminService.createAchievement(createDto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AchievementEntity> updateAchievement(
            @PathVariable Integer id,
            @Valid @RequestBody AchievementUpdateDto updateDto) {
        log.info("Admin updating achievement with id: {}", id);
        AchievementEntity updated = achievementAdminService.updateAchievement(id, updateDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAchievement(@PathVariable Integer id) {
        log.info("Admin deleting achievement with id: {}", id);
        achievementAdminService.deleteAchievement(id);
        return ResponseEntity.noContent().build();
    }

    // Achievement Tier CRUD
    @GetMapping("/{achievementId}/tiers")
    public ResponseEntity<List<AchievementTierEntity>> getTiersByAchievement(@PathVariable Integer achievementId) {
        log.info("Admin requesting tiers for achievement: {}", achievementId);
        List<AchievementTierEntity> tiers = achievementAdminService.getTiersByAchievement(achievementId);
        return ResponseEntity.ok(tiers);
    }

    @PostMapping("/{achievementId}/tiers")
    public ResponseEntity<AchievementTierEntity> createTier(
            @PathVariable Integer achievementId,
            @Valid @RequestBody AchievementTierCreateDto createDto) {
        log.info("Admin creating tier for achievement: {}", achievementId);
        AchievementTierEntity created = achievementAdminService.createTier(achievementId, createDto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/tiers/{tierId}")
    public ResponseEntity<AchievementTierEntity> updateTier(
            @PathVariable Integer tierId,
            @Valid @RequestBody AchievementTierUpdateDto updateDto) {
        log.info("Admin updating tier with id: {}", tierId);
        AchievementTierEntity updated = achievementAdminService.updateTier(tierId, updateDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/tiers/{tierId}")
    public ResponseEntity<Void> deleteTier(@PathVariable Integer tierId) {
        log.info("Admin deleting tier with id: {}", tierId);
        achievementAdminService.deleteTier(tierId);
        return ResponseEntity.noContent().build();
    }

    // Batch operations
    @PostMapping("/{achievementId}/tiers/batch")
    public ResponseEntity<List<AchievementTierEntity>> createTiersBatch(
            @PathVariable Integer achievementId,
            @Valid @RequestBody List<AchievementTierCreateDto> createDtos) {
        log.info("Admin creating {} tiers for achievement: {}", createDtos.size(), achievementId);
        List<AchievementTierEntity> created = achievementAdminService.createTiersBatch(achievementId, createDtos);
        return ResponseEntity.ok(created);
    }

    // Statistics
    @GetMapping("/stats")
    public ResponseEntity<?> getAchievementStats() {
        log.info("Admin requesting achievement statistics");
        var stats = achievementAdminService.getAchievementStats();
        return ResponseEntity.ok(stats);
    }
}
