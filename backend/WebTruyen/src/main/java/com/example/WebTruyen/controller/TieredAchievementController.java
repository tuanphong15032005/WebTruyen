package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.achievement.AchievementProgressDto;
import com.example.WebTruyen.dto.achievement.AchievementTierDto;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.TieredAchievementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tiered-achievements")
@RequiredArgsConstructor
@Slf4j
public class TieredAchievementController {

    private final TieredAchievementService tieredAchievementService;

    @GetMapping("/progress")
    public ResponseEntity<List<AchievementProgressDto>> getAllAchievementProgress(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        List<AchievementProgressDto> progress = tieredAchievementService.getAllAchievementProgress(Math.toIntExact(userId));
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/progress/{achievementCode}")
    public ResponseEntity<AchievementProgressDto> getAchievementProgress(
            @PathVariable String achievementCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            AchievementProgressDto progress = tieredAchievementService.getAchievementProgress(
                    Math.toIntExact(userId), achievementCode);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            log.error("Error getting achievement progress for code {}: {}", achievementCode, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/claim/{tierId}")
    public ResponseEntity<AchievementTierDto> claimTier(
            @PathVariable Integer tierId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        try {
            AchievementTierDto claimedTier = tieredAchievementService.claimTier(
                    Math.toIntExact(userId), tierId);
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
            tieredAchievementService.updateProgress(Math.toIntExact(userId), achievementCode, value);
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
            tieredAchievementService.setProgress(Math.toIntExact(userId), achievementCode, value);
            return ResponseEntity.ok("Progress set successfully");
        } catch (Exception e) {
            log.error("Error setting progress for code {}: {}", achievementCode, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
