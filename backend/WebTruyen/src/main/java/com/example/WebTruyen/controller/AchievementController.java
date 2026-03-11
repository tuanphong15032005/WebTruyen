package com.example.WebTruyen.controller;

import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.model.Gamification.UserAchievementEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AchievementIntegrationService;
import com.example.WebTruyen.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;
    private final AchievementIntegrationService achievementIntegrationService;

    @GetMapping
    public ResponseEntity<List<AchievementEntity>> getAllAchievements() {
        return ResponseEntity.ok(achievementService.getAllAchievements());
    }

    @GetMapping("/my")
    public ResponseEntity<List<UserAchievementEntity>> getMyAchievements(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Cast to UserPrincipal to get user ID
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        return ResponseEntity.ok(achievementService.getUserAchievements(Math.toIntExact(userId)));
    }

    @GetMapping("/unlocked")
    public ResponseEntity<List<AchievementEntity>> getUnlockedAchievements(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        return ResponseEntity.ok(achievementService.getUnlockedAchievements(Math.toIntExact(userId)));
    }

    @GetMapping("/unclaimed")
    public ResponseEntity<List<UserAchievementEntity>> getUnclaimedAchievements(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        return ResponseEntity.ok(achievementService.getUnclaimedAchievements(Math.toIntExact(userId)));
    }

    @PostMapping("/claim/{achievementId}")
    public ResponseEntity<UserAchievementEntity> claimAchievement(
            @PathVariable Integer achievementId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        UserAchievementEntity claimed = achievementService.claimAchievement(Math.toIntExact(userId), achievementId);
        return ResponseEntity.ok(claimed);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserAchievementEntity>> getUserAchievements(@PathVariable Integer userId) {
        return ResponseEntity.ok(achievementService.getUserAchievements(userId));
    }

    // Debug endpoint to check database state
    @GetMapping("/debug/all")
    public ResponseEntity<Object> debugAllAchievements() {
        return ResponseEntity.ok().body(Map.of(
            "totalAchievements", achievementService.getAllAchievements().size(),
            "achievements", achievementService.getAllAchievements()
        ));
    }

    @GetMapping("/debug/user/{userId}")
    public ResponseEntity<Object> debugUserState(@PathVariable Integer userId) {
        return ResponseEntity.ok().body(Map.of(
            "userId", userId,
            "myAchievements", achievementService.getUserAchievements(userId),
            "unlockedAchievements", achievementService.getUnlockedAchievements(userId),
            "unclaimedAchievements", achievementService.getUnclaimedAchievements(userId)
        ));
    }

    // Test endpoint to trigger achievement
    @PostMapping("/debug/trigger-first-chapter")
    public ResponseEntity<Object> triggerFirstChapter(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        // Trigger first chapter achievement using integration service
        achievementIntegrationService.triggerFirstChapterAchievement(userId);
        
        // Check results
        List<UserAchievementEntity> userAchievements = achievementService.getUserAchievements(Math.toIntExact(userId));
        
        return ResponseEntity.ok().body(Map.of(
            "success", true,
            "userId", userId,
            "totalUserAchievements", userAchievements.size(),
            "userAchievements", userAchievements
        ));
    }

    // Trigger all achievements for testing
    @PostMapping("/debug/trigger-all")
    public ResponseEntity<Object> triggerAllAchievements(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        Long userId = userPrincipal.getUser().getId();
        
        // Trigger all achievement checks
        achievementIntegrationService.checkAllAchievements(userId);
        
        // Check results
        List<UserAchievementEntity> userAchievements = achievementService.getUserAchievements(Math.toIntExact(userId));
        List<UserAchievementEntity> unclaimedAchievements = achievementService.getUnclaimedAchievements(Math.toIntExact(userId));
        
        return ResponseEntity.ok().body(Map.of(
            "success", true,
            "userId", userId,
            "totalUserAchievements", userAchievements.size(),
            "unclaimedAchievements", unclaimedAchievements.size(),
            "userAchievements", userAchievements
        ));
    }
}
