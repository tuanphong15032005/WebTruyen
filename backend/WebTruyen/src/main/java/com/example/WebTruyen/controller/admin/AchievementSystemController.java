package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.service.TieredAchievementIntegrationService;
import com.example.WebTruyen.service.AchievementCodeMappingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/achievements/system")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('MOD')")
public class AchievementSystemController {

    private final TieredAchievementIntegrationService tieredAchievementIntegrationService;
    private final AchievementCodeMappingService achievementCodeMappingService;

    @PostMapping("/refresh-mapping")
    public ResponseEntity<Map<String, Object>> refreshAchievementMapping() {
        log.info("Admin requesting achievement mapping refresh");
        
        try {
            achievementCodeMappingService.refreshAchievementMapping();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Achievement mapping refreshed successfully");
            response.put("mappings", achievementCodeMappingService.getAllMappings());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error refreshing achievement mapping: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error refreshing achievement mapping: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/recalculate/{userId}")
    public ResponseEntity<Map<String, Object>> recalculateUserProgress(@PathVariable Long userId) {
        log.info("Admin requesting progress recalculation for user: {}", userId);
        
        try {
            tieredAchievementIntegrationService.recalculateAllProgress(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Progress recalculated successfully for user: " + userId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error recalculating progress for user {}: {}", userId, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error recalculating progress: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/initialize/{userId}")
    public ResponseEntity<Map<String, Object>> initializeUserProgress(@PathVariable Long userId) {
        log.info("Admin requesting progress initialization for user: {}", userId);
        
        try {
            tieredAchievementIntegrationService.initializeProgressForNewUser(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Progress initialized successfully for user: " + userId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error initializing progress for user {}: {}", userId, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error initializing progress: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/mapping-status")
    public ResponseEntity<Map<String, Object>> getMappingStatus() {
        log.info("Admin requesting achievement mapping status");
        
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mappings", achievementCodeMappingService.getAllMappings());
            response.put("totalMappings", achievementCodeMappingService.getAllMappings().size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting mapping status: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error getting mapping status: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
