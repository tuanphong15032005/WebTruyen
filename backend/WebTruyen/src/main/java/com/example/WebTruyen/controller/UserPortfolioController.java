package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.UserPortfolioResponse;
import com.example.WebTruyen.service.user.UserPortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class UserPortfolioController {
    private final UserPortfolioService userPortfolioService;

    @GetMapping("/{userId}/portfolio")
    public UserPortfolioResponse getUserPortfolio(@PathVariable Long userId) {
        return userPortfolioService.getUserPortfolio(userId);
    }

    // ISSUE 3: Follow/Unfollow endpoints
    @PostMapping("/{authorId}/follow")
    public Map<String, Object> toggleFollow(@PathVariable Long authorId, @RequestParam Long currentUserId) {
        boolean isFollowing = userPortfolioService.toggleFollow(authorId, currentUserId);
        Long updatedFollowersCount = userPortfolioService.countFollowers(authorId);
        
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
}
