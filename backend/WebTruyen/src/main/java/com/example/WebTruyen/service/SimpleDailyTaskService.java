package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.entity.model.Gamification.UserDailyStatusEntity;
import com.example.WebTruyen.repository.DailyMissionRepository;
import com.example.WebTruyen.repository.UserDailyStatusRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SimpleDailyTaskService {

    @Autowired
    private DailyMissionRepository dailyMissionRepository;

    @Autowired
    private UserDailyStatusRepository userDailyStatusRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletService walletService;

    // Task codes
    private static final String TASK_LOGIN = "DAILY_LOGIN";
    private static final String TASK_READ_CHAPTERS = "READ_CHAPTERS";
    private static final String TASK_UNLOCK_CHAPTER = "UNLOCK_CHAPTER";
    private static final String TASK_COMMENT = "MAKE_COMMENTS";
    private static final String TASK_DONATE = "MAKE_DONATION";
    private static final String TASK_TOPUP = "MAKE_TOPUP";

    /**
     * Get daily tasks summary for user
     */
    public Map<String, Object> getDailyTasksForUser(Long userId) {
        LocalDate today = LocalDate.now();
        
        // Ensure daily missions exist for today
        ensureDailyMissionsExist(today);
        
        // Get all missions for today
        List<DailyMissionEntity> missions = dailyMissionRepository.findByDate(today);
        
        // Get user's progress for these missions
        List<UserDailyStatusEntity> userStatuses = userDailyStatusRepository.findByUserIdAndDate(userId, today);
        
        // Create a map of missionId to user status for quick lookup
        Map<Long, UserDailyStatusEntity> statusMap = userStatuses.stream()
                .collect(Collectors.toMap(status -> status.getId().getDailyMissionId(), status -> status));
        
        // Build response
        List<Map<String, Object>> taskResponses = missions.stream()
                .map(mission -> buildTaskResponse(mission, statusMap.get(mission.getId().longValue())))
                .collect(Collectors.toList());
        
        // Calculate summary
        long completedTasks = taskResponses.stream()
                .mapToLong(task -> (Boolean) task.get("completed") ? 1L : 0L)
                .sum();
        
        long totalAvailableCoins = taskResponses.stream()
                .filter(task -> !(Boolean) task.get("completed"))
                .mapToLong(task -> (Long) task.get("rewardCoin"))
                .sum();
        
        return Map.of(
                "tasks", taskResponses,
                "totalTasks", missions.size(),
                "completedTasks", (int) completedTasks,
                "availableTasks", missions.size() - (int) completedTasks,
                "totalAvailableCoins", totalAvailableCoins,
                "allTasksCompleted", completedTasks == missions.size(),
                "date", today.toString()
        );
    }

    /**
     * Update progress for a specific task
     */
    @Transactional
    public Map<String, Object> updateTaskProgress(Long userId, String missionCode, Integer progressValue) {
        LocalDate today = LocalDate.now();
        
        // Find the mission
        DailyMissionEntity mission = dailyMissionRepository.findByDateAndMissionCode(today, missionCode)
                .orElseThrow(() -> new RuntimeException("Daily mission not found: " + missionCode));
        
        // Find or create user status - use a different approach to avoid type issues
        List<UserDailyStatusEntity> existingStatuses = userDailyStatusRepository.findByUserIdAndDate(userId, today);
        Optional<UserDailyStatusEntity> existingStatus = existingStatuses.stream()
                .filter(status -> status.getDailyMission().getId().equals(mission.getId()))
                .findFirst();
        
        UserDailyStatusEntity userStatus;
        if (existingStatus.isPresent()) {
            userStatus = existingStatus.get();
        } else {
            // Use native query to insert directly, bypassing @MapsId issues
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            
            try {
                // Insert using native query to avoid @MapsId type conversion problems
                userDailyStatusRepository.insertUserDailyStatus(userId, mission.getId());
                
                // Now fetch the newly created entity
                userStatus = userDailyStatusRepository
                    .findByUserIdAndDailyMissionId(userId, mission.getId().longValue())
                    .orElseThrow(() -> new RuntimeException("Failed to create user status"));
            } catch (Exception e) {
                log.error("Failed to create user daily status", e);
                throw new RuntimeException("Failed to track task progress", e);
            }
        }
        
        // Update progress based on task type
        updateProgressForTaskType(userStatus, missionCode, progressValue);
        
        // Check if task is completed
        if (isTaskCompleted(userStatus, mission)) {
            userStatus.setCompletedAt(LocalDateTime.now());
        }
        
        userDailyStatusRepository.save(userStatus);
        
        return buildTaskResponse(mission, userStatus);
    }

    /**
     * Claim reward for a completed task
     */
    @Transactional
    public Map<String, Object> claimTaskReward(Long userId, Long missionId) {
        LocalDate today = LocalDate.now();
        
        // Find the mission
        DailyMissionEntity mission = dailyMissionRepository.findById(missionId.intValue())
                .orElseThrow(() -> new RuntimeException("Daily mission not found: " + missionId));
        
        // Verify mission is for today
        if (!mission.getDate().equals(today)) {
            throw new RuntimeException("Can only claim rewards for today's missions");
        }
        
        // Find user status
        UserDailyStatusEntity userStatus = userDailyStatusRepository
                .findByUserIdAndDailyMissionId(userId, missionId)
                .orElseThrow(() -> new RuntimeException("User task status not found"));
        
        // Verify task is completed but not yet claimed
        if (userStatus.getCompletedAt() == null) {
            throw new RuntimeException("Task is not completed yet");
        }
        
        // Check if already claimed
        Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
        if (progressMap.containsKey("claimed_at")) {
            throw new RuntimeException("Reward already claimed");
        }
        
        // Add coins to user wallet
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        try {
            log.info("Starting reward claim for user {} and mission {}", userId, missionId);
            
            if (mission.getRewardCoinType() == DailyMissionEntity.CoinType.A) {
                log.info("Adding {} Coin A to user {}", mission.getRewardCoin(), userId);
                walletService.addCoinA(user, mission.getRewardCoin(), LedgerReason.EARN);
            } else {
                log.info("Adding {} Coin B to user {}", mission.getRewardCoin(), userId);
                walletService.addCoinB(user, mission.getRewardCoin(), LedgerReason.EARN);
            }
            
            log.info("Successfully added coins to user {} for daily task: {}", 
                    userId, mission.getMissionCode());
            
            // Mark as claimed
            progressMap.put("claimed_at", LocalDateTime.now().toString());
            userStatus.setProgress(serializeProgress(progressMap));
            userDailyStatusRepository.save(userStatus);
            
            log.info("Successfully marked mission {} as claimed for user {}", missionId, userId);
            
            return Map.of(
                    "success", true,
                    "message", "Reward claimed successfully!"
            );
        } catch (Exception e) {
            log.error("Failed to add coins to user {} for daily task reward", userId, e);
            throw new RuntimeException("Failed to claim reward: " + e.getMessage(), e);
        }
    }

    /**
     * Claim all available rewards
     */
    @Transactional
    public Map<String, Object> claimAllRewards(Long userId) {
        LocalDate today = LocalDate.now();
        
        // Get all completed but unclaimed tasks
        List<UserDailyStatusEntity> completedTasks = userDailyStatusRepository
                .findByUserIdAndDate(userId, today)
                .stream()
                .filter(status -> status.getCompletedAt() != null)
                .collect(Collectors.toList());
        
        if (completedTasks.isEmpty()) {
            return Map.of(
                    "claimedTasks", 0,
                    "totalCoins", 0L,
                    "message", "No completed tasks to claim"
            );
        }
        
        int claimedTasks = 0;
        long totalCoins = 0;
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        for (UserDailyStatusEntity status : completedTasks) {
            try {
                DailyMissionEntity mission = status.getDailyMission();
                
                // Check if already claimed
                Map<String, Object> progressMap = parseProgress(status.getProgress());
                if (progressMap.containsKey("claimed_at")) {
                    continue;
                }
                
                log.info("Processing reward claim for user {} and mission {}", userId, mission.getId());
                
                // Add coins
                if (mission.getRewardCoinType() == DailyMissionEntity.CoinType.A) {
                    log.info("Adding {} Coin A to user {}", mission.getRewardCoin(), userId);
                    walletService.addCoinA(user, mission.getRewardCoin(), LedgerReason.EARN);
                } else {
                    log.info("Adding {} Coin B to user {}", mission.getRewardCoin(), userId);
                    walletService.addCoinB(user, mission.getRewardCoin(), LedgerReason.EARN);
                }
                
                totalCoins += mission.getRewardCoin();
                claimedTasks++;
                
                // Mark as claimed
                progressMap.put("claimed_at", LocalDateTime.now().toString());
                status.setProgress(serializeProgress(progressMap));
                
                log.info("Successfully processed reward for mission {} for user {}", mission.getId(), userId);
                
            } catch (Exception e) {
                log.error("Failed to claim reward for mission {} for user {}", 
                        status.getDailyMission().getId(), userId, e);
            }
        }
        
        // Save all updated statuses
        userDailyStatusRepository.saveAll(completedTasks);
        
        return Map.of(
                "claimedTasks", claimedTasks,
                "totalCoins", totalCoins,
                "message", String.format("Successfully claimed %d tasks and received %d coins!", claimedTasks, totalCoins)
        );
    }

    /**
     * Ensure daily missions exist for the given date
     */
    private void ensureDailyMissionsExist(LocalDate date) {
        List<DailyMissionEntity> existingMissions = dailyMissionRepository.findByDate(date);
        
        if (existingMissions.isEmpty()) {
            createDailyMissionsForDate(date);
        }
    }

    /**
     * Create daily missions for a specific date
     */
    private void createDailyMissionsForDate(LocalDate date) {
        DailyMissionEntity[] missions = {
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_LOGIN)
                        .description("Đăng nhập 1 lần")
                        .target("1")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build(),
                
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_READ_CHAPTERS)
                        .description("Đọc tổng 5 chương")
                        .target("5")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build(),
                
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_UNLOCK_CHAPTER)
                        .description("Unlock 1 chapter trả phí")
                        .target("1")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build(),
                
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_COMMENT)
                        .description("Comment 3 lần")
                        .target("3")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build(),
                
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_DONATE)
                        .description("Thực hiện 1 Donate")
                        .target("1")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build(),
                
                DailyMissionEntity.builder()
                        .date(date)
                        .missionCode(TASK_TOPUP)
                        .description("Thực hiện 1 lần nạp tiền")
                        .target("1")
                        .rewardCoin(10L)
                        .rewardCoinType(DailyMissionEntity.CoinType.A)
                        .build()
        };
        
        dailyMissionRepository.saveAll(List.of(missions));
        log.info("Created {} daily missions for date {}", missions.length, date);
    }

    /**
     * Update progress based on task type
     */
    private void updateProgressForTaskType(UserDailyStatusEntity userStatus, String missionCode, Integer progressValue) {
        Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
        
        switch (missionCode) {
            case TASK_LOGIN:
                progressMap.put("completed", true);
                progressMap.put("login_time", LocalDateTime.now().toString());
                break;
                
            case TASK_READ_CHAPTERS:
                int currentRead = (int) progressMap.getOrDefault("chapters_read", 0);
                int newRead = Math.min(currentRead + (progressValue != null ? progressValue : 1), 5);
                progressMap.put("chapters_read", newRead);
                break;
                
            case TASK_UNLOCK_CHAPTER:
                progressMap.put("chapters_unlocked", 1);
                break;
                
            case TASK_COMMENT:
                int currentComments = (int) progressMap.getOrDefault("comments_made", 0);
                int newComments = Math.min(currentComments + (progressValue != null ? progressValue : 1), 3);
                progressMap.put("comments_made", newComments);
                break;
                
            case TASK_DONATE:
                progressMap.put("donations_made", 1);
                break;
                
            case TASK_TOPUP:
                progressMap.put("topups_made", 1);
                break;
        }
        
        userStatus.setProgress(serializeProgress(progressMap));
    }

    /**
     * Check if task is completed
     */
    private boolean isTaskCompleted(UserDailyStatusEntity userStatus, DailyMissionEntity mission) {
        Map<String, Object> progressMap = parseProgress(userStatus.getProgress());
        int target = Integer.parseInt(mission.getTarget());
        
        switch (mission.getMissionCode()) {
            case TASK_LOGIN:
                return Boolean.TRUE.equals(progressMap.get("completed"));
                
            case TASK_READ_CHAPTERS:
                return (int) progressMap.getOrDefault("chapters_read", 0) >= target;
                
            case TASK_UNLOCK_CHAPTER:
                return (int) progressMap.getOrDefault("chapters_unlocked", 0) >= target;
                
            case TASK_COMMENT:
                return (int) progressMap.getOrDefault("comments_made", 0) >= target;
                
            case TASK_DONATE:
                return (int) progressMap.getOrDefault("donations_made", 0) >= target;
                
            case TASK_TOPUP:
                return (int) progressMap.getOrDefault("topups_made", 0) >= target;
                
            default:
                return false;
        }
    }

    /**
     * Build task response
     */
    private Map<String, Object> buildTaskResponse(DailyMissionEntity mission, UserDailyStatusEntity userStatus) {
        Map<String, Object> progressMap = userStatus != null ? parseProgress(userStatus.getProgress()) : new HashMap<>();
        
        boolean completed = userStatus != null && userStatus.getCompletedAt() != null;
        boolean canClaim = completed && !progressMap.containsKey("claimed_at");
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", mission.getId());
        response.put("missionCode", mission.getMissionCode());
        response.put("description", mission.getDescription());
        response.put("target", mission.getTarget());
        response.put("rewardCoin", mission.getRewardCoin());
        response.put("rewardCoinType", mission.getRewardCoinType());
        response.put("completed", completed);
        response.put("completedAt", userStatus != null ? userStatus.getCompletedAt() : null);
        response.put("canClaim", canClaim);
        
        // Add progress tracking for specific tasks
        switch (mission.getMissionCode()) {
            case TASK_READ_CHAPTERS:
                int currentRead = (int) progressMap.getOrDefault("chapters_read", 0);
                int targetRead = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentRead);
                response.put("targetProgress", targetRead);
                response.put("progressText", currentRead + "/" + targetRead);
                break;
                
            case TASK_COMMENT:
                int currentComments = (int) progressMap.getOrDefault("comments_made", 0);
                int targetComments = Integer.parseInt(mission.getTarget());
                response.put("currentProgress", currentComments);
                response.put("targetProgress", targetComments);
                response.put("progressText", currentComments + "/" + targetComments);
                break;
        }
        
        return response;
    }

    /**
     * Parse progress JSON string to map
     */
    private Map<String, Object> parseProgress(String progressJson) {
        try {
            if (progressJson == null || progressJson.trim().isEmpty()) {
                return new HashMap<>();
            }
            // Simple JSON parsing for basic structures
            Map<String, Object> map = new HashMap<>();
            if (progressJson.contains("chapters_read")) {
                int value = extractIntValue(progressJson, "chapters_read");
                map.put("chapters_read", value);
            }
            if (progressJson.contains("comments_made")) {
                int value = extractIntValue(progressJson, "comments_made");
                map.put("comments_made", value);
            }
            if (progressJson.contains("completed")) {
                map.put("completed", progressJson.contains("\"completed\":true"));
            }
            if (progressJson.contains("claimed_at")) {
                map.put("claimed_at", "claimed");
            }
            return map;
        } catch (Exception e) {
            log.warn("Failed to parse progress JSON: {}", progressJson, e);
            return new HashMap<>();
        }
    }

    /**
     * Serialize progress map to JSON string
     */
    private String serializeProgress(Map<String, Object> progressMap) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        
        boolean first = true;
        for (Map.Entry<String, Object> entry : progressMap.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":");
            
            if (entry.getValue() instanceof String) {
                json.append("\"").append(entry.getValue()).append("\"");
            } else {
                json.append(entry.getValue());
            }
            first = false;
        }
        
        json.append("}");
        return json.toString();
    }

    /**
     * Extract integer value from JSON string
     */
    private int extractIntValue(String json, String key) {
        String pattern = "\"" + key + "\":";
        int index = json.indexOf(pattern);
        if (index == -1) return 0;
        
        int start = index + pattern.length();
        int end = json.indexOf(",", start);
        if (end == -1) end = json.indexOf("}", start);
        
        String value = json.substring(start, end).trim();
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
