package com.example.WebTruyen.controller;

import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.SimpleDailyTaskService;
import com.example.WebTruyen.service.DailyTaskOrchestrator;
import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.entity.model.Gamification.UserDailyStatusEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/daily-tasks")
@CrossOrigin(origins = "*")
@Slf4j
public class SimpleDailyTaskController {

    @Autowired
    private SimpleDailyTaskService simpleDailyTaskService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private DailyTaskOrchestrator dailyTaskOrchestrator;

    /**
     * Get daily tasks for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getDailyTasks(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = dailyTaskOrchestrator.getDailyTasksSummary(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting daily tasks for user", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update progress for a specific task
     */
    @PostMapping("/progress")
    public ResponseEntity<?> updateTaskProgress(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            String missionCode = (String) request.get("missionCode");
            Integer progressValue = (Integer) request.get("progressValue");
            
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, missionCode, progressValue);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating task progress", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Claim reward for a specific task
     */
    @PostMapping("/claim/{missionId}")
    public ResponseEntity<?> claimTaskReward(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long missionId) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> result = simpleDailyTaskService.claimTaskReward(userId, missionId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Error claiming task reward", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Claim all available rewards
     */
    @PostMapping("/claim-all")
    public ResponseEntity<?> claimAllRewards(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> result = simpleDailyTaskService.claimAllRewards(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error claiming all rewards", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

/**
     * Track user login for daily task
     */
    @PostMapping("/track-login")
    public ResponseEntity<?> trackLogin(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "DAILY_LOGIN", null);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking login", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Track chapter reading for daily task
     */
    @PostMapping("/track-read")
    public ResponseEntity<?> trackChapterRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) Map<String, Object> request) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Integer progressValue = request != null ? (Integer) request.get("progressValue") : 1;
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "READ_CHAPTERS", progressValue);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Chapter read tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking chapter read", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Track chapter unlock for daily task
     */
    @PostMapping("/track-unlock")
    public ResponseEntity<?> trackChapterUnlock(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "UNLOCK_CHAPTER", null);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Chapter unlock tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking chapter unlock", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Track comment for daily task
     */
    @PostMapping("/track-comment")
    public ResponseEntity<?> trackComment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) Map<String, Object> request) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Integer progressValue = request != null ? (Integer) request.get("progressValue") : 1;
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "MAKE_COMMENTS", progressValue);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Comment tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking comment", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Track donation for daily task
     */
    @PostMapping("/track-donate")
    public ResponseEntity<?> trackDonation(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "MAKE_DONATION", null);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Donation tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking donation", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Track top-up for daily task
     */
    @PostMapping("/track-topup")
    public ResponseEntity<?> trackTopup(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, "MAKE_TOPUP", null);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Top-up tracked successfully",
                    "task", response
            ));
        } catch (Exception e) {
            log.error("Error tracking top-up", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Create daily missions for today (debug endpoint)
     */
    @PostMapping("/create-today")
    public ResponseEntity<?> createTodayMissions() {
        try {
            simpleDailyTaskService.createDailyMissionsForDate(java.time.LocalDate.now());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Daily missions created for today"
            ));
        } catch (Exception e) {
            log.error("Error creating today's missions", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Test endpoint to simulate activity tracking
     */
    @PostMapping("/test-activity/{activityType}")
    public ResponseEntity<?> testActivity(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String activityType) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            log.info("TEST: Simulating activity - userId: {}, activityType: {}", userId, activityType);
            
            // Track activity using orchestrator
            DailyTaskOrchestrator.ActivityType activity;
            try {
                activity = DailyTaskOrchestrator.ActivityType.valueOf(activityType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Invalid activity type: " + activityType
                ));
            }
            
            dailyTaskOrchestrator.trackUserActivity(userId, activity);
            
            // Wait a moment for database to update
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            // Get updated tasks to show progress
            Map<String, Object> updatedTasks = simpleDailyTaskService.getDailyTasksForUser(userId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test activity simulated: " + activityType,
                    "updatedTasks", updatedTasks
            ));
        } catch (Exception e) {
            log.error("Error testing activity", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Debug endpoint to check current progress
     */
    @GetMapping("/debug-progress")
    public ResponseEntity<?> debugProgress(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            
            // Get raw data from database
            LocalDate today = LocalDate.now();
            var missions = dailyTaskOrchestrator.getUserDailyTaskStatusFresh(userId);
            
            return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "date", today,
                    "missions", missions.getMissions().size(),
                    "statusMapSize", missions.getStatusMap().size(),
                    "statusData", missions.getStatusMap().entrySet().stream()
                            .map(entry -> Map.of(
                                    "missionId", entry.getKey(),
                                    "progress", entry.getValue().getProgress(),
                                    "completedAt", entry.getValue().getCompletedAt()
                            ))
                            .toList()
            ));
        } catch (Exception e) {
            log.error("Error debugging progress", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Debug endpoint to check task response details
     */
    @GetMapping("/debug-task-response")
    public ResponseEntity<?> debugTaskResponse(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            LocalDate today = LocalDate.now();
            
            // Get raw data
            var missions = dailyTaskOrchestrator.getUserDailyTaskStatusFresh(userId);
            
            // Find DAILY_LOGIN mission
            DailyMissionEntity loginMission = missions.getMissions().stream()
                    .filter(m -> "DAILY_LOGIN".equals(m.getMissionCode()))
                    .findFirst()
                    .orElse(null);
            
            if (loginMission == null) {
                return ResponseEntity.ok(Map.of("error", "DAILY_LOGIN mission not found"));
            }
            
            UserDailyStatusEntity loginStatus = missions.getStatusMap().get(loginMission.getId());
            
            // Build response using SimpleDailyTaskService debug method
            Map<String, Object> taskResponse = simpleDailyTaskService.debugBuildTaskResponse(loginMission, loginStatus);
            
            return ResponseEntity.ok(Map.of(
                    "missionId", loginMission.getId(),
                    "missionCode", loginMission.getMissionCode(),
                    "userStatus", loginStatus != null ? Map.of(
                            "progress", loginStatus.getProgress(),
                            "completedAt", loginStatus.getCompletedAt()
                    ) : null,
                    "taskResponse", taskResponse
            ));
        } catch (Exception e) {
            log.error("Error debugging task response", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Force refresh daily tasks (clear cache)
     */
    @PostMapping("/force-refresh")
    public ResponseEntity<?> forceRefresh(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            
            // Clear cache
            var cache = cacheManager.getCache("userDailyTasks");
            if (cache != null) {
                cache.evict(userId);
                log.info("Cleared cache for user {}", userId);
            } else {
                log.warn("Cache 'userDailyTasks' not found when force-refresh called for user {}", userId);
            }
            
            // Get fresh data
            Map<String, Object> response = dailyTaskOrchestrator.getDailyTasksSummary(userId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cache cleared and data refreshed",
                    "data", response
            ));
        } catch (Exception e) {
            log.error("Error force refreshing daily tasks", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Complete test flow - create mission, track progress, check result
     */
    @PostMapping("/test-complete-flow")
    public ResponseEntity<?> testCompleteFlow(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Long userId = userPrincipal.getUser().getId();
            LocalDate today = LocalDate.now();
            
            // Step 1: Get initial state
            Map<String, Object> initialTasks = simpleDailyTaskService.getDailyTasksForUser(userId);
            
            // Step 2: Track some activities
            dailyTaskOrchestrator.trackUserActivity(userId, DailyTaskOrchestrator.ActivityType.MAKE_COMMENT);
            dailyTaskOrchestrator.trackUserActivity(userId, DailyTaskOrchestrator.ActivityType.MAKE_COMMENT);
            dailyTaskOrchestrator.trackUserActivity(userId, DailyTaskOrchestrator.ActivityType.MAKE_COMMENT);
            
            // Step 3: Get final state
            Map<String, Object> finalTasks = simpleDailyTaskService.getDailyTasksForUser(userId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Complete test flow executed",
                    "initialState", initialTasks,
                    "finalState", finalTasks,
                    "testDate", today
            ));
        } catch (Exception e) {
            log.error("Error in complete test flow", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    }
