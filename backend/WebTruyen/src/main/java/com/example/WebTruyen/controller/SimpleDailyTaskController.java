package com.example.WebTruyen.controller;

import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.SimpleDailyTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
            Map<String, Object> response = simpleDailyTaskService.getDailyTasksForUser(userId);
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
     * Test endpoint to manually trigger task tracking
     */
@PostMapping("/test-track/{missionCode}")
public ResponseEntity<?> testTrackTask(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @PathVariable String missionCode) {
    try {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        Long userId = userPrincipal.getUser().getId();
        log.info("TEST: Manually tracking task - userId: {}, missionCode: {}", userId, missionCode);
        
        Map<String, Object> response = simpleDailyTaskService.updateTaskProgress(userId, missionCode, null);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test tracking successful",
                "task", response
        ));
    } catch (Exception e) {
        log.error("TEST: Error tracking task", e);
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
        ));
    }
}

/**
     * Bulk fix endpoint to update completion for all existing tasks
     */
@PostMapping("/fix-all-completion")
public ResponseEntity<?> fixAllTaskCompletion(@AuthenticationPrincipal UserPrincipal userPrincipal) {
    try {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        Long userId = userPrincipal.getUser().getId();
        log.info("Bulk fix requested for all task completion - userId: {}", userId);
        
        // Fix all task types
        String[] taskCodes = {"MAKE_TOPUP", "MAKE_DONATION", "UNLOCK_CHAPTER", "MAKE_COMMENTS", "READ_CHAPTERS"};
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (String taskCode : taskCodes) {
            try {
                Map<String, Object> result = simpleDailyTaskService.forceUpdateTaskCompletion(userId, taskCode);
                results.add(Map.of("taskCode", taskCode, "result", result));
                log.info("Fixed task {}: completed={}", taskCode, result.get("completed"));
            } catch (Exception e) {
                log.warn("Failed to fix task {}: {}", taskCode, e.getMessage());
                results.add(Map.of("taskCode", taskCode, "error", e.getMessage()));
            }
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All tasks completion force-updated",
                "results", results
        ));
    } catch (Exception e) {
        log.error("Error in bulk fix", e);
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
        ));
    }
}

/**
     * Manual fix endpoint to force re-check task completion after parsing fix
     */
@PostMapping("/fix-completion/{missionCode}")
public ResponseEntity<?> fixTaskCompletion(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @PathVariable String missionCode) {
    try {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        Long userId = userPrincipal.getUser().getId();
        log.info("Manual fix requested for task completion - userId: {}, missionCode: {}", userId, missionCode);
        
        Map<String, Object> result = simpleDailyTaskService.forceUpdateTaskCompletion(userId, missionCode);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task completion force-updated",
                "task", result
        ));
    } catch (Exception e) {
        log.error("Error fixing task completion", e);
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

    }
