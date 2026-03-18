package com.example.WebTruyen.controller.achievement;

import com.example.WebTruyen.dto.response.AchievementProgressResponse;
import com.example.WebTruyen.dto.response.AchievementTierResponse;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.repository.AchievementRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.TieredAchievementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tiered-achievements")
@RequiredArgsConstructor
@Slf4j
public class TieredAchievementController {

    private final TieredAchievementService tieredAchievementService;
    private final AchievementRepository achievementRepository;

    @GetMapping("/progress")
    public ResponseEntity<List<AchievementProgressResponse>> getAllAchievementProgress(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("🔍 [DEBUG] getAllAchievementProgress called");
        
        // Temporarily use hardcoded user ID for testing
        Long userId = 1L; // Hardcoded for testing
        
        log.info("🆔 [DEBUG] Using hardcoded userId: {}", userId);
        
        try {
            List<AchievementProgressResponse> progress = tieredAchievementService.getAllAchievementProgress(userId);
            log.info("📊 [DEBUG] Retrieved {} achievements for user {}", progress.size(), userId);
            log.info("📋 [DEBUG] Achievement data: {}", progress);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            log.error("💥 [DEBUG] Error getting achievement progress: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/progress/{achievementCode}")
    public ResponseEntity<AchievementProgressResponse> getAchievementProgress(
            @PathVariable String achievementCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            AchievementProgressResponse progress = tieredAchievementService.getAchievementProgress(
                    userId, achievementCode);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            log.error("Error getting achievement progress for code {}: {}", achievementCode, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/claim/{tierId}")
    public ResponseEntity<AchievementTierResponse> claimTier(
            @PathVariable Integer tierId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            AchievementTierResponse claimedTier = tieredAchievementService.claimTier(
                    userId, tierId);
            return ResponseEntity.ok(claimedTier);
        } catch (Exception e) {
            log.error("Error claiming tier {}: {}", tierId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/progress/{achievementCode}/increment")
    public ResponseEntity<String> incrementProgress(
            @PathVariable String achievementCode,
            @RequestParam Integer value,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            tieredAchievementService.updateProgress(userId, achievementCode, value);
            return ResponseEntity.ok("Progress updated successfully");
        } catch (Exception e) {
            log.error("Error updating progress for code {}: {}", achievementCode, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/progress/{achievementCode}/set")
    public ResponseEntity<String> setProgress(
            @PathVariable String achievementCode,
            @RequestParam Integer value,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            tieredAchievementService.setProgress(userId, achievementCode, value);
            return ResponseEntity.ok("Progress set successfully");
        } catch (Exception e) {
            log.error("Error setting progress for code {}: {}", achievementCode, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
