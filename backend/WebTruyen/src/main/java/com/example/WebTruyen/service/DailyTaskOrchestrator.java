package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.entity.model.Gamification.UserDailyStatusEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.monitoring.DailyTaskMetrics;
import com.example.WebTruyen.repository.DailyMissionRepository;
import com.example.WebTruyen.repository.UserDailyStatusRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Centralized service for daily task operations
 * Optimized for performance with caching and centralized logic
 */
@Slf4j
@Service
public class DailyTaskOrchestrator {

    private final DailyMissionRepository dailyMissionRepository;
    private final UserDailyStatusRepository userDailyStatusRepository;
    private final UserRepository userRepository;
    private final SimpleDailyTaskService simpleDailyTaskService;
    private final DailyTaskMetrics metrics;

    public DailyTaskOrchestrator(
            DailyMissionRepository dailyMissionRepository,
            UserDailyStatusRepository userDailyStatusRepository,
            UserRepository userRepository,
            SimpleDailyTaskService simpleDailyTaskService,
            DailyTaskMetrics metrics) {
        this.dailyMissionRepository = dailyMissionRepository;
        this.userDailyStatusRepository = userDailyStatusRepository;
        this.userRepository = userRepository;
        this.simpleDailyTaskService = simpleDailyTaskService;
        this.metrics = metrics;
    }

    /**
     * Get complete daily task status for user (cached)
     */
    @Cacheable(value = "userDailyTasks", key = "#userId", unless = "#result == null")
    @Transactional(readOnly = true)
    public UserDailyTaskStatus getUserDailyTaskStatus(Long userId) {
        long startTime = System.currentTimeMillis();
        log.debug("Getting daily task status for user: {}", userId);
        
        LocalDate today = LocalDate.now();
        
        // Single optimized query to get all data
        List<DailyMissionEntity> missions = dailyMissionRepository.findByDate(today);
        List<UserDailyStatusEntity> userStatuses = userDailyStatusRepository.findByUserIdAndDate(userId, today);
        
        // Build status map
        Map<Long, UserDailyStatusEntity> statusMap = userStatuses.stream()
                .collect(Collectors.toMap(
                        status -> status.getId().getDailyMissionId(), 
                        status -> status
                ));
        
        UserDailyTaskStatus result = UserDailyTaskStatus.builder()
                .userId(userId)
                .date(today)
                .missions(missions)
                .statusMap(statusMap)
                .build();
        
        // Record cache access metrics
        long duration = System.currentTimeMillis() - startTime;
        metrics.recordCacheAccess("getUserDailyTaskStatus", duration);
        
        return result;
    }

    /**
     * Get complete daily task status for user (no cache - for fresh data)
     */
    @Transactional(readOnly = true)
    public UserDailyTaskStatus getUserDailyTaskStatusFresh(Long userId) {
        log.debug("Getting FRESH daily task status for user: {}", userId);
        
        LocalDate today = LocalDate.now();
        
        // Single optimized query to get all data
        List<DailyMissionEntity> missions = dailyMissionRepository.findByDate(today);
        List<UserDailyStatusEntity> userStatuses = userDailyStatusRepository.findByUserIdAndDate(userId, today);
        
        // Build status map
        Map<Long, UserDailyStatusEntity> statusMap = userStatuses.stream()
                .collect(Collectors.toMap(
                        status -> status.getId().getDailyMissionId(), 
                        status -> status
                ));
        
        UserDailyTaskStatus result = UserDailyTaskStatus.builder()
                .userId(userId)
                .date(today)
                .missions(missions)
                .statusMap(statusMap)
                .build();
        
        return result;
    }

    /**
     * Track user activity and auto-complete login mission
     */
    @Transactional
    @CacheEvict(value = "userDailyTasks", key = "#userId")
    public void trackUserActivity(Long userId, ActivityType activityType) {
        long startTime = System.currentTimeMillis();
        log.debug("Tracking activity: {} for user: {}", activityType, userId);
        
        try {
            // Update user activity timestamp
            updateUserActivityTime(userId);
            
            // Get FRESH status (not cached) since we're about to modify it
            UserDailyTaskStatus status = getUserDailyTaskStatusFresh(userId);
            
            // Auto-complete login mission if first activity of the day
            if (shouldCompleteLoginMission(status)) {
                completeLoginMission(userId);
                log.info("Auto-completed login mission for user: {}", userId);
            }
            
            // Track specific mission based on activity type
            trackSpecificMission(userId, activityType);
            
            // Record activity tracking metrics
            long duration = System.currentTimeMillis() - startTime;
            metrics.recordActivityTracking(activityType.name(), duration);
            
        } catch (Exception e) {
            log.error("Error tracking activity for user {}: {}", userId, e.getMessage(), e);
            // Don't fail the main operation if daily task tracking fails
        }
    }

    /**
     * Update user's last activity time
     */
    private void updateUserActivityTime(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Check if login mission should be auto-completed
     */
    private boolean shouldCompleteLoginMission(UserDailyTaskStatus status) {
        // Check if user already has login mission today
        boolean hasLoginMissionToday = status.getMissions().stream()
                .anyMatch(mission -> "DAILY_LOGIN".equals(mission.getMissionCode()) &&
                        status.getStatusMap().containsKey(mission.getId()));
        
        if (hasLoginMissionToday) {
            return false;
        }
        
        // Check if user was active yesterday or in last 24 hours
        LocalDate yesterday = status.getDate().minusDays(1);
        List<UserDailyStatusEntity> yesterdayProgress = 
                userDailyStatusRepository.findByUserIdAndDate(status.getUserId(), yesterday);
        
        UserEntity user = userRepository.findById(status.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + status.getUserId()));
        
        boolean wasRecentlyActive = !yesterdayProgress.isEmpty() || 
                (user.getUpdatedAt() != null && user.getUpdatedAt().isAfter(LocalDateTime.now().minusHours(24)));
        
        return wasRecentlyActive;
    }

    /**
     * Complete login mission
     */
    private void completeLoginMission(Long userId) {
        simpleDailyTaskService.updateTaskProgress(userId, "DAILY_LOGIN", null);
    }

    /**
     * Track specific mission based on activity type
     */
    private void trackSpecificMission(Long userId, ActivityType activityType) {
        String missionCode = getMissionCodeForActivity(activityType);
        if (missionCode != null) {
            updateMissionProgressDirectly(userId, missionCode, 1);
        }
    }

    /**
     * Update mission progress directly without going through SimpleDailyTaskService
     */
    private void updateMissionProgressDirectly(Long userId, String missionCode, Integer progressValue) {
        try {
            LocalDate today = LocalDate.now();
            
            // Find the mission
            DailyMissionEntity mission = dailyMissionRepository.findByDateAndMissionCode(today, missionCode)
                    .orElseThrow(() -> new RuntimeException("Daily mission not found: " + missionCode + " for date: " + today));
            
            // Find or create user status
            List<UserDailyStatusEntity> existingStatuses = userDailyStatusRepository.findByUserIdAndDate(userId, today);
            Optional<UserDailyStatusEntity> existingStatus = existingStatuses.stream()
                    .filter(status -> status.getDailyMission().getId().equals(mission.getId()))
                    .findFirst();
            
            UserDailyStatusEntity userStatus;
            if (existingStatus.isPresent()) {
                userStatus = existingStatus.get();
            } else {
                // Create new status
                UserEntity user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                
                userDailyStatusRepository.insertUserDailyStatus(userId, mission.getId().longValue());
                userStatus = userDailyStatusRepository
                    .findByUserIdAndDailyMissionId(userId, mission.getId().longValue())
                    .orElseThrow(() -> new RuntimeException("Failed to create user status"));
            }
            
            // Update progress based on task type
            updateProgressForTaskType(userStatus, missionCode, progressValue);
            
            // Check if task is completed
            boolean wasCompleted = isTaskCompleted(userStatus, mission);
            if (wasCompleted) {
                userStatus.setCompletedAt(LocalDateTime.now());
            }
            
            userDailyStatusRepository.save(userStatus);
            log.info("Updated mission progress directly - userId: {}, missionCode: {}, progressValue: {}", 
                    userId, missionCode, progressValue);
            
        } catch (Exception e) {
            log.error("Error updating mission progress directly for user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Update progress based on task type (copied from SimpleDailyTaskService)
     */
    private void updateProgressForTaskType(UserDailyStatusEntity userStatus, String missionCode, Integer progressValue) {
        Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
        
        switch (missionCode) {
            case "DAILY_LOGIN":
                progressMap.put("completed", true);
                progressMap.put("login_time", LocalDateTime.now().toString());
                break;
                
            case "READ_CHAPTERS":
                int currentRead = (int) progressMap.getOrDefault("chapters_read", 0);
                int newRead = Math.min(currentRead + (progressValue != null ? progressValue : 1), 5);
                progressMap.put("chapters_read", newRead);
                break;
                
            case "UNLOCK_CHAPTER":
                progressMap.put("chapters_unlocked", 1);
                break;
                
            case "MAKE_COMMENTS":
                int currentComments = (int) progressMap.getOrDefault("comments_made", 0);
                int newComments = Math.min(currentComments + (progressValue != null ? progressValue : 1), 3);
                progressMap.put("comments_made", newComments);
                break;
                
            case "MAKE_DONATION":
                progressMap.put("donations_made", 1);
                break;
                
            case "MAKE_TOPUP":
                progressMap.put("topups_made", 1);
                break;
        }
        
        userStatus.setProgress(serializeProgress(progressMap));
    }

    /**
     * Serialize progress to JSON (simple implementation)
     */
    private String serializeProgress(Map<String, Object> progressMap) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : progressMap.entrySet()) {
            if (!first) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":");
            
            Object value = entry.getValue();
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else if (value instanceof Boolean) {
                json.append(value);
            } else {
                json.append(value);
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }

    /**
     * Check if task is completed (copied from SimpleDailyTaskService)
     */
    private boolean isTaskCompleted(UserDailyStatusEntity userStatus, DailyMissionEntity mission) {
        Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
        int target = Integer.parseInt(mission.getTarget());
        
        switch (mission.getMissionCode()) {
            case "DAILY_LOGIN":
                return Boolean.TRUE.equals(progressMap.get("completed"));
                
            case "READ_CHAPTERS":
                int chaptersRead = (int) progressMap.getOrDefault("chapters_read", 0);
                return chaptersRead >= target;
                
            case "UNLOCK_CHAPTER":
                int chaptersUnlocked = (int) progressMap.getOrDefault("chapters_unlocked", 0);
                return chaptersUnlocked >= target;
                
            case "MAKE_COMMENTS":
                int commentsMade = (int) progressMap.getOrDefault("comments_made", 0);
                return commentsMade >= target;
                
            case "MAKE_DONATION":
                int donationsMade = (int) progressMap.getOrDefault("donations_made", 0);
                return donationsMade >= target;
                
            case "MAKE_TOPUP":
                int topupsMade = (int) progressMap.getOrDefault("topups_made", 0);
                return topupsMade >= target;
                
            default:
                return false;
        }
    }

    /**
     * Map activity type to mission code
     */
    private String getMissionCodeForActivity(ActivityType activityType) {
        return switch (activityType) {
            case READ_CHAPTER -> "READ_CHAPTERS";
            case UNLOCK_CHAPTER -> "UNLOCK_CHAPTER";
            case MAKE_COMMENT -> "MAKE_COMMENTS";
            case MAKE_DONATION -> "MAKE_DONATION";
            case MAKE_TOPUP -> "MAKE_TOPUP";
            default -> null;
        };
    }

    /**
     * Get daily tasks summary for user (optimized)
     */
    public Map<String, Object> getDailyTasksSummary(Long userId) {
        UserDailyTaskStatus status = getUserDailyTaskStatusFresh(userId); // Use fresh data instead of cached
        
        List<Map<String, Object>> taskResponses = status.getMissions().stream()
                .map(mission -> buildTaskResponse(mission, status.getStatusMap().get(mission.getId().longValue())))
                .collect(Collectors.toList());
        
        // Calculate summary
        long completedTasks = taskResponses.stream()
                .mapToLong(task -> (Boolean) task.get("completed") ? 1L : 0L)
                .sum();
        
        long totalAvailableCoins = taskResponses.stream()
                .filter(task -> !(Boolean) task.get("completed"))
                .mapToLong(task -> (Long) task.get("rewardCoin"))
                .sum();
        
        // Keep backward compatibility: provide both nested summary and flat fields used by frontend
        return Map.of(
                "tasks", taskResponses,
                "totalTasks", taskResponses.size(),
                "completedTasks", completedTasks,
                "totalAvailableCoins", totalAvailableCoins,
                "summary", Map.of(
                        "totalTasks", taskResponses.size(),
                        "completedTasks", completedTasks,
                        "availableCoins", totalAvailableCoins,
                        "completionRate", taskResponses.size() > 0 ?
                                (double) completedTasks / taskResponses.size() * 100 : 0
                ),
                "date", status.getDate()
        );
    }

    /**
     * Build task response (moved from SimpleDailyTaskService)
     */
    private Map<String, Object> buildTaskResponse(DailyMissionEntity mission, UserDailyStatusEntity userStatus) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", mission.getId());
        response.put("missionCode", mission.getMissionCode());
        response.put("description", mission.getDescription());
        response.put("target", mission.getTarget());
        response.put("rewardCoin", mission.getRewardCoin());
        response.put("rewardCoinType", mission.getRewardCoinType());
        response.put("date", mission.getDate());
        
        Map<String, Object> progressMap = userStatus != null ? parseProgress(userStatus.getProgress()) : new HashMap<>();
        
        boolean completedAtPresent = userStatus != null && userStatus.getCompletedAt() != null;
        boolean completedByProgress = userStatus != null && isCompletedByProgress(mission, progressMap);
        boolean completed = completedAtPresent || completedByProgress;
        boolean claimed = userStatus != null && isRewardClaimed(userStatus);
        boolean canClaim = completed && !claimed;

        if (userStatus != null) {
            response.put("progress", userStatus.getProgress());
            response.put("completed", completed);
            response.put("completedAt", userStatus.getCompletedAt());
            response.put("claimed", claimed);
            response.put("canClaim", canClaim);
        } else {
            response.put("progress", "{}");
            response.put("completed", false);
            response.put("completedAt", null);
            response.put("claimed", false);
            response.put("canClaim", false);
        }
        
        // Add progress tracking for specific tasks
        switch (mission.getMissionCode()) {
            case "READ_CHAPTERS":
                int currentRead = (int) progressMap.getOrDefault("chapters_read", 0);
                int targetRead = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentRead);
                response.put("targetProgress", targetRead);
                response.put("progressText", currentRead + "/" + targetRead);
                break;
                
            case "UNLOCK_CHAPTER":
                int currentUnlocks = (int) progressMap.getOrDefault("chapters_unlocked", 0);
                int targetUnlocks = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentUnlocks);
                response.put("targetProgress", targetUnlocks);
                response.put("progressText", currentUnlocks + "/" + targetUnlocks);
                break;
                
            case "MAKE_COMMENTS":
                int currentComments = (int) progressMap.getOrDefault("comments_made", 0);
                int targetComments = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentComments);
                response.put("targetProgress", targetComments);
                response.put("progressText", currentComments + "/" + targetComments);
                break;
                
            case "MAKE_DONATION":
                int currentDonations = (int) progressMap.getOrDefault("donations_made", 0);
                int targetDonations = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentDonations);
                response.put("targetProgress", targetDonations);
                response.put("progressText", currentDonations + "/" + targetDonations);
                break;
                
            case "MAKE_TOPUP":
                int currentTopups = (int) progressMap.getOrDefault("topups_made", 0);
                int targetTopups = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentTopups);
                response.put("targetProgress", targetTopups);
                response.put("progressText", currentTopups + "/" + targetTopups);
                break;
                
            case "DAILY_LOGIN":
                boolean loginCompleted = Boolean.TRUE.equals(progressMap.get("completed"));
                response.put("currentProgress", loginCompleted ? 1 : 0);
                response.put("targetProgress", 1);
                response.put("progressText", loginCompleted ? "1/1" : "0/1");
                break;
        }
        
        return response;
    }

    private boolean isCompletedByProgress(DailyMissionEntity mission, Map<String, Object> progressMap) {
        try {
            int target = Integer.parseInt(mission.getTarget());

            return switch (mission.getMissionCode()) {
                case "DAILY_LOGIN" -> Boolean.TRUE.equals(progressMap.get("completed"));
                case "READ_CHAPTERS" -> ((int) progressMap.getOrDefault("chapters_read", 0)) >= target;
                case "UNLOCK_CHAPTER" -> ((int) progressMap.getOrDefault("chapters_unlocked", 0)) >= target;
                case "MAKE_COMMENTS" -> ((int) progressMap.getOrDefault("comments_made", 0)) >= target;
                case "MAKE_DONATION" -> ((int) progressMap.getOrDefault("donations_made", 0)) >= target;
                case "MAKE_TOPUP" -> ((int) progressMap.getOrDefault("topups_made", 0)) >= target;
                default -> false;
            };
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if reward is claimed
     */
    private boolean isRewardClaimed(UserDailyStatusEntity userStatus) {
        if (userStatus.getProgress() == null) return false;
        
        try {
            Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
            return progressMap.containsKey("claimed_at");
        } catch (Exception e) {
            log.warn("Error parsing progress for claim check: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Parse progress JSON
     */
    private Map<String, Object> parseProgress(String progressJson) {
        Map<String, Object> result = new HashMap<>();
        if (progressJson != null && !progressJson.isEmpty() && !"{ }".equals(progressJson)) {
            try {
                // Simple JSON parsing for known progress fields
                if (progressJson.contains("chapters_read")) {
                    int value = extractIntValue(progressJson, "chapters_read");
                    result.put("chapters_read", value);
                }
                if (progressJson.contains("chapters_unlocked")) {
                    int value = extractIntValue(progressJson, "chapters_unlocked");
                    result.put("chapters_unlocked", value);
                }
                if (progressJson.contains("comments_made")) {
                    int value = extractIntValue(progressJson, "comments_made");
                    result.put("comments_made", value);
                }
                if (progressJson.contains("donations_made")) {
                    int value = extractIntValue(progressJson, "donations_made");
                    result.put("donations_made", value);
                }
                if (progressJson.contains("topups_made")) {
                    int value = extractIntValue(progressJson, "topups_made");
                    result.put("topups_made", value);
                }
                if (progressJson.contains("completed")) {
                    boolean completed = progressJson.contains("\"completed\":true") ||
                            progressJson.contains("\"completed\": true");
                    result.put("completed", completed);
                }
                if (progressJson.contains("claimed_at")) {
                    result.put("claimed_at", true);
                }
                result.put("parsed", true);
            } catch (Exception e) {
                log.warn("Error parsing progress JSON: {}", e.getMessage());
            }
        }
        return result;
    }
    
    /**
     * Extract integer value from JSON string
     */
    private int extractIntValue(String json, String key) {
        String pattern = "\"" + key + "\":";
        int keyIndex = json.indexOf(pattern);
        if (keyIndex == -1) return 0;
        
        int valueStart = keyIndex + pattern.length();
        int valueEnd = json.indexOf(",", valueStart);
        if (valueEnd == -1) {
            valueEnd = json.indexOf("}", valueStart);
        }
        if (valueEnd == -1) return 0;
        
        String valueStr = json.substring(valueStart, valueEnd).trim();
        try {
            return Integer.parseInt(valueStr);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Activity types enum
     */
    public enum ActivityType {
        READ_CHAPTER,
        UNLOCK_CHAPTER,
        MAKE_COMMENT,
        MAKE_DONATION,
        MAKE_TOPUP,
        LOGIN
    }

    /**
     * User daily task status DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class UserDailyTaskStatus {
        private Long userId;
        private LocalDate date;
        private List<DailyMissionEntity> missions;
        private Map<Long, UserDailyStatusEntity> statusMap;
        
        public boolean isFirstActivityToday() {
            return statusMap.isEmpty();
        }
        
        public boolean hasLoginMissionToday() {
            return missions.stream()
                    .anyMatch(m -> "DAILY_LOGIN".equals(m.getMissionCode()) && statusMap.containsKey(m.getId().longValue()));
        }
    }
}
