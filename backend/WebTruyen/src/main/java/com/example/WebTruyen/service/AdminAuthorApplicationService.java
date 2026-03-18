package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.RoleRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.repository.UserAchievementProgressRepository;
import com.example.WebTruyen.repository.AchievementRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.model.Gamification.UserAchievementProgressEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminAuthorApplicationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthorApplicationService authorApplicationService;
    
    @Autowired
    private UserAchievementProgressRepository userAchievementProgressRepository;
    
    @Autowired
    private AchievementRepository achievementRepository;
    
    @Autowired
    private ChapterRepository chapterRepository;
    
    @Autowired
    private CommentRepository commentRepository;

    public List<Map<String, Object>> getAllApplications() {
        return authorApplicationService.getAllApplications();
    }

    public List<Map<String, Object>> getApplicationsByStatus(String status) {
        return authorApplicationService.getApplicationsByStatus(status);
    }

    public Map<String, Object> getApplicationById(Long id) {
        return authorApplicationService.getApplicationByUserId(id);
    }

    @Transactional
    public void approveApplication(Long applicationId, Long adminId) {
        authorApplicationService.approveApplication(applicationId, adminId);
    }

    @Transactional
    public void rejectApplication(Long applicationId, String rejectionReason, Long adminId) {
        authorApplicationService.rejectApplication(applicationId, rejectionReason, adminId);
    }

    public Map<String, Long> getApplicationStats() {
        return authorApplicationService.getApplicationStats();
    }

    public List<Map<String, Object>> getApplicationsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<Map<String, Object>> allApplications = authorApplicationService.getAllApplications();
        return allApplications.stream()
                .filter(app -> {
                    String submittedAt = (String) app.get("submittedAt");
                    if (submittedAt != null) {
                        try {
                            LocalDateTime submitTime = LocalDateTime.parse(submittedAt);
                            return !submitTime.isBefore(startDate) && !submitTime.isAfter(endDate);
                        } catch (Exception e) {
                            return false;
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getUserDetailsForApplication(Long applicationId) {
        UserEntity user = userRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("id", user.getId());
        userDetails.put("username", user.getUsername());
        userDetails.put("email", user.getEmail());
        userDetails.put("displayName", user.getDisplayName());
        userDetails.put("createdAt", user.getCreatedAt());
        userDetails.put("verified", user.isVerified());
        userDetails.put("avatarUrl", user.getAvatarUrl());
        
        // Debug logs
        System.out.println("User Email: " + user.getEmail());
        System.out.println("User Settings JSON: " + user.getSettingsJson());
        
        // Add user activity information
        Map<String, Object> userActivity = getUserActivityStats(user.getId());
        userDetails.put("activity", userActivity);
        
        return userDetails;
    }
    
    private Map<String, Object> getUserActivityStats(Long userId) {
        Map<String, Object> activity = new HashMap<>();
        
        try {
            // Get actual counts from repositories
            int chaptersRead = 0;
            int commentsCount = 0;
            int storiesFollowed = 0;
            int daysSinceCreation = 0;
            
            try {
                // Count comments made by user
                commentsCount = (int) commentRepository.countByUserId(userId);
            } catch (Exception e) {
                // If method doesn't exist, try to get from achievement progress
                commentsCount = getAchievementProgress(userId, "COMMENT_COUNT");
            }
            
            try {
                // Try to get chapters read from achievement progress
                chaptersRead = getAchievementProgress(userId, "READ_CHAPTERS");
            } catch (Exception e) {
                chaptersRead = 0;
            }
            
            // Calculate days since account creation
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getCreatedAt() != null) {
                daysSinceCreation = (int) java.time.temporal.ChronoUnit.DAYS.between(
                    user.getCreatedAt(),
                    java.time.LocalDateTime.now()
                );
            }
            
            activity.put("chaptersRead", chaptersRead);
            activity.put("commentsCount", commentsCount);
            activity.put("storiesFollowed", storiesFollowed);
            activity.put("daysSinceCreation", daysSinceCreation);
            activity.put("lastLogin", null); // Last login tracking not available in UserEntity
            
        } catch (Exception e) {
            // If everything fails, provide basic info
            activity.put("chaptersRead", 0);
            activity.put("commentsCount", 0);
            activity.put("storiesFollowed", 0);
            activity.put("daysSinceCreation", 0);
            activity.put("lastLogin", null);
        }
        
        return activity;
    }
    
    private int getAchievementProgress(Long userId, String achievementCode) {
        try {
            AchievementEntity achievement = achievementRepository.findByCode(achievementCode).orElse(null);
            if (achievement != null) {
                UserAchievementProgressEntity progress = userAchievementProgressRepository
                        .findByUserIdAndAchievementId(userId, achievement.getId()).orElse(null);
                if (progress != null) {
                    return progress.getProgress();
                }
            }
        } catch (Exception e) {
            // Ignore errors
        }
        return 0;
    }
    
    public List<Map<String, Object>> searchApplications(String query) {
        List<Map<String, Object>> allApplications = authorApplicationService.getAllApplications();
        if (query == null || query.trim().isEmpty()) {
            return allApplications;
        }
        
        String searchTerm = query.toLowerCase().trim();
        return allApplications.stream()
                .filter(app -> {
                    String username = (String) app.get("username");
                    String penName = (String) app.get("penName");
                    
                    return (username != null && username.toLowerCase().contains(searchTerm)) ||
                           (penName != null && penName.toLowerCase().contains(searchTerm));
                })
                .collect(Collectors.toList());
    }
}
