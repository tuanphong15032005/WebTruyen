package com.example.WebTruyen.controller;

import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.SimpleDailyTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
