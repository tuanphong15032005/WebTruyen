package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.UserPortfolioResponse;
import com.example.WebTruyen.dto.response.FollowerResponse;
import com.example.WebTruyen.service.user.UserPortfolioService;
import com.example.WebTruyen.service.TieredAchievementIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Slf4j
public class UserPortfolioController {
    private final UserPortfolioService userPortfolioService;
    private final TieredAchievementIntegrationService achievementIntegrationService;

    @GetMapping("/{userId}/portfolio")
    public UserPortfolioResponse getUserPortfolio(@PathVariable Long userId) {
        return userPortfolioService.getUserPortfolio(userId);
    }

    @GetMapping("/username/{username}/portfolio")
    public UserPortfolioResponse getUserPortfolioByUsername(@PathVariable String username) {
        return userPortfolioService.getUserPortfolioByUsername(username);
    }

    // ISSUE 3: Follow/Unfollow endpoints
    @PostMapping("/{authorId}/follow")
    public Map<String, Object> toggleFollow(@PathVariable Long authorId, @RequestParam Long currentUserId) {
        boolean isFollowing = userPortfolioService.toggleFollow(authorId, currentUserId);
        Long updatedFollowersCount = userPortfolioService.countFollowers(authorId);
        
        // Trigger achievement events for follow/unfollow
        try {
            if (isFollowing) {
                // User started following - increment follower count for author
                achievementIntegrationService.onFollowerGained(authorId);
                log.info("Triggered follower gained achievement for author: {}", authorId);
            } else {
                // User unfollowed - recalculate follower count for author
                achievementIntegrationService.onFollowerLost(authorId);
                log.info("Triggered follower lost achievement for author: {}", authorId);
            }
        } catch (Exception e) {
            log.warn("Failed to trigger achievement event for follow action: {}", e.getMessage());
        }
        
        return Map.of(
            "isFollowing", isFollowing,
            "followersCount", updatedFollowersCount
        );
    }

    @GetMapping("/{authorId}/follow-status")
    public Map<String, Boolean> getFollowStatus(@PathVariable Long authorId, @RequestParam Long currentUserId) {
        boolean isFollowing = userPortfolioService.isFollowing(authorId, currentUserId);
        return Map.of("isFollowing", isFollowing);
    }

    // ISSUE 4: Author stories endpoint
    @GetMapping("/{userId}/stories")
    public List<Map<String, Object>> getAuthorStories(@PathVariable Long userId) {
        return userPortfolioService.getAuthorStories(userId);
    }

    // Get followers list endpoint
    @GetMapping("/{userId}/followers")
    public List<FollowerResponse> getFollowersList(@PathVariable Long userId) {
        return userPortfolioService.getFollowersList(userId);
    }
}
