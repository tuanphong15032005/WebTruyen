package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.service.DailyMissionAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/daily-missions")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
public class DailyMissionAdminController {

    private final DailyMissionAdminService dailyMissionAdminService;

    // Get all missions with optional date filter
    @GetMapping
    public ResponseEntity<List<DailyMissionEntity>> getAllMissions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Admin requesting daily missions for date: {}", date);
        List<DailyMissionEntity> missions = dailyMissionAdminService.getAllMissions(date);
        return ResponseEntity.ok(missions);
    }

    // ============================================================
    // Template Management Endpoints
    // ============================================================

    // Get all templates
    @GetMapping("/templates")
    public ResponseEntity<List<DailyMissionEntity>> getAllTemplates() {
        log.info("Admin requesting all daily mission templates");
        List<DailyMissionEntity> templates = dailyMissionAdminService.getTemplatesOrdered();
        return ResponseEntity.ok(templates);
    }

    // Get template by mission code
    @GetMapping("/templates/{missionCode}")
    public ResponseEntity<DailyMissionEntity> getTemplateByCode(@PathVariable String missionCode) {
        log.info("Admin requesting template for mission code: {}", missionCode);
        DailyMissionEntity template = dailyMissionAdminService.getTemplateByCode(missionCode);
        return ResponseEntity.ok(template);
    }

    // Update template
    @PutMapping("/templates/{templateId}")
    public ResponseEntity<DailyMissionEntity> updateTemplate(
            @PathVariable Integer templateId,
            @RequestBody @Valid DailyMissionEntity updateData) {
        log.info("Admin updating template: {} with data: {}", templateId, updateData);
        DailyMissionEntity updated = dailyMissionAdminService.updateTemplate(templateId, updateData);
        return ResponseEntity.ok(updated);
    }

    // Create new template
    @PostMapping("/templates")
    public ResponseEntity<DailyMissionEntity> createTemplate(@RequestBody @Valid DailyMissionEntity template) {
        log.info("Admin creating new template: {}", template.getMissionCode());
        DailyMissionEntity created = dailyMissionAdminService.createTemplate(template);
        return ResponseEntity.ok(created);
    }

    // Delete template
    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer templateId) {
        log.info("Admin deleting template: {}", templateId);
        dailyMissionAdminService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    // Get missions by specific date
    @GetMapping("/date/{date}")
    public ResponseEntity<List<DailyMissionEntity>> getMissionsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Admin requesting missions for date: {}", date);
        List<DailyMissionEntity> missions = dailyMissionAdminService.getMissionsByDate(date);
        return ResponseEntity.ok(missions);
    }

    // Get missions by specific date with completion statistics
    @GetMapping("/date/{date}/with-stats")
    public ResponseEntity<?> getMissionsByDateWithStats(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Admin requesting missions with stats for date: {}", date);
        List<Map<String, Object>> missions = dailyMissionAdminService.getMissionsByDateWithStats(date);
        return ResponseEntity.ok(missions);
    }

    // Get distinct dates that have missions
    @GetMapping("/dates")
    public ResponseEntity<List<LocalDate>> getAvailableDates() {
        log.info("Admin requesting available mission dates");
        List<LocalDate> dates = dailyMissionAdminService.getAvailableDates();
        return ResponseEntity.ok(dates);
    }

    // Create new mission
    @PostMapping
    public ResponseEntity<?> createMission(@Valid @RequestBody DailyMissionCreateDto createDto) {
        try {
            log.info("Admin creating new daily mission: {}", createDto.getMissionCode());
            DailyMissionEntity created = dailyMissionAdminService.createMission(createDto);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Error creating mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating mission", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Internal server error"));
        }
    }

    // Update existing mission
    @PutMapping("/{id}")
    public ResponseEntity<DailyMissionEntity> updateMission(
            @PathVariable Integer id,
            @Valid @RequestBody DailyMissionUpdateDto updateDto) {
        log.info("Admin updating daily mission with id: {}", id);
        DailyMissionEntity updated = dailyMissionAdminService.updateMission(id, updateDto);
        return ResponseEntity.ok(updated);
    }

    // Delete mission
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMission(@PathVariable Integer id) {
        log.info("Admin deleting daily mission with id: {}", id);
        dailyMissionAdminService.deleteMission(id);
        return ResponseEntity.noContent().build();
    }

    // Create missions for a specific date
    @PostMapping("/generate/{date}")
    public ResponseEntity<?> generateMissionsForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            log.info("Admin generating missions for date: {}", date);
            
            // Get existing missions before generation
            List<DailyMissionEntity> existingMissions = dailyMissionAdminService.getMissionsByDate(date);
            int existingCount = existingMissions.size();
            
            List<DailyMissionEntity> missions = dailyMissionAdminService.generateMissionsForDate(date);
            int finalCount = missions.size();
            
            // Determine what action was taken
            String message;
            String actionType;
            
            if (existingCount == 0) {
                message = "Đã tạo thành công " + finalCount + " nhiệm vụ cho ngày " + date;
                actionType = "created_all";
            } else if (existingCount >= 6) {
                message = "Đã có đủ 6 nhiệm vụ cho ngày " + date + ". Không tạo thêm nhiệm vụ mới.";
                actionType = "already_complete";
            } else {
                int addedCount = finalCount - existingCount;
                message = "Đã tạo thêm " + addedCount + " nhiệm vụ còn thiếu cho ngày " + date + ". Tổng cộng: " + finalCount + " nhiệm vụ.";
                actionType = "added_missing";
            }
            
            log.info("Mission generation completed for date: {} - Action: {}, Missions: {}", 
                    date, actionType, finalCount);
            
            return ResponseEntity.ok(Map.of(
                "message", message,
                "missions", missions,
                "actionType", actionType,
                "existingCount", existingCount,
                "finalCount", finalCount,
                "addedCount", Math.max(0, finalCount - existingCount)
            ));
        } catch (Exception e) {
            log.error("Error generating missions for date: {}", date, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Regenerate missions from templates (only update missions without user progress)
    @PostMapping("/regenerate/{date}")
    public ResponseEntity<?> regenerateMissionsFromTemplates(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            log.info("Admin regenerating missions from templates for date: {}", date);
            
            // Get existing missions before regeneration
            List<DailyMissionEntity> existingMissions = dailyMissionAdminService.getMissionsByDate(date);
            int existingCount = existingMissions.size();
            
            List<DailyMissionEntity> missions = dailyMissionAdminService.regenerateMissionsFromTemplates(date);
            int finalCount = missions.size();
            
            // Calculate statistics
            int createdCount = Math.max(0, finalCount - existingCount);
            int updatedCount = Math.max(0, existingCount - (finalCount - createdCount));
            
            String message = "Đã tạo lại nhiệm vụ từ templates cho ngày " + date + 
                           ". Tạo mới: " + createdCount + ", Cập nhật: " + updatedCount + 
                           ". Các nhiệm vụ có người đang làm sẽ được giữ nguyên.";
            
            log.info("Mission regeneration completed for date: {} - Created: {}, Updated: {}, Total: {}", 
                    date, createdCount, updatedCount, finalCount);
            
            return ResponseEntity.ok(Map.of(
                "message", message,
                "missions", missions,
                "actionType", "regenerated",
                "existingCount", existingCount,
                "finalCount", finalCount,
                "createdCount", createdCount,
                "updatedCount", updatedCount
            ));
        } catch (Exception e) {
            log.error("Error regenerating missions for date: {}", date, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get mission statistics
    @GetMapping("/stats")
    public ResponseEntity<?> getMissionStats() {
        log.info("Admin requesting daily mission statistics");
        Map<String, Object> stats = dailyMissionAdminService.getMissionStats();
        return ResponseEntity.ok(stats);
    }

    // Copy missions from one date to another
    @PostMapping("/copy/{fromDate}/{toDate}")
    public ResponseEntity<?> copyMissionsToDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        log.info("Admin copying missions from {} to {}", fromDate, toDate);
        Map<String, Object> result = dailyMissionAdminService.copyMissionsToDate(fromDate, toDate);
        return ResponseEntity.ok(result);
    }

    // Batch delete missions without user progress
    @DeleteMapping("/batch-delete/{date}")
    public ResponseEntity<?> batchDeleteMissionsWithoutProgress(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            log.info("Admin batch deleting missions without user progress for date: {}", date);
            
            Map<String, Object> result = dailyMissionAdminService.batchDeleteMissionsWithoutProgress(date);
            
            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa thành công " + result.get("deletedCount") + " nhiệm vụ chưa có người làm",
                "deletedCount", result.get("deletedCount"),
                "skippedCount", result.get("skippedCount")
            ));
        } catch (Exception e) {
            log.error("Error batch deleting missions for date: {}", date, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DTO classes
    public static class DailyMissionCreateDto {
        @NotNull(message = "Date is required")
        private LocalDate date;
        
        @NotBlank(message = "Mission code is required")
        private String missionCode;
        
        @NotBlank(message = "Description is required")
        private String description;
        
        @NotBlank(message = "Target is required")
        private String target;
        
        @NotNull(message = "Reward coin is required")
        @Min(value = 1, message = "Reward coin must be at least 1")
        private Long rewardCoin;
        
        @NotNull(message = "Reward coin type is required")
        private DailyMissionEntity.CoinType rewardCoinType;

        // Getters and setters
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getMissionCode() { return missionCode; }
        public void setMissionCode(String missionCode) { this.missionCode = missionCode; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getTarget() { return target; }
        public void setTarget(String target) { this.target = target; }
        public Long getRewardCoin() { return rewardCoin; }
        public void setRewardCoin(Long rewardCoin) { this.rewardCoin = rewardCoin; }
        public DailyMissionEntity.CoinType getRewardCoinType() { return rewardCoinType; }
        public void setRewardCoinType(DailyMissionEntity.CoinType rewardCoinType) { this.rewardCoinType = rewardCoinType; }
        
        // Custom setter to handle string conversion
        public void setRewardCoinType(String rewardCoinType) { 
            if (rewardCoinType != null) {
                this.rewardCoinType = DailyMissionEntity.CoinType.valueOf(rewardCoinType);
            }
        }
    }

    public static class DailyMissionUpdateDto {
        @NotBlank(message = "Description is required")
        private String description;
        
        @NotBlank(message = "Target is required")
        private String target;
        
        @NotNull(message = "Reward coin is required")
        @Min(value = 1, message = "Reward coin must be at least 1")
        private Long rewardCoin;
        
        @NotNull(message = "Reward coin type is required")
        private DailyMissionEntity.CoinType rewardCoinType;

        // Getters and setters
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getTarget() { return target; }
        public void setTarget(String target) { this.target = target; }
        public Long getRewardCoin() { return rewardCoin; }
        public void setRewardCoin(Long rewardCoin) { this.rewardCoin = rewardCoin; }
        public DailyMissionEntity.CoinType getRewardCoinType() { return rewardCoinType; }
        public void setRewardCoinType(DailyMissionEntity.CoinType rewardCoinType) { this.rewardCoinType = rewardCoinType; }
        
        // Custom setter to handle string conversion
        public void setRewardCoinType(String rewardCoinType) { 
            if (rewardCoinType != null) {
                this.rewardCoinType = DailyMissionEntity.CoinType.valueOf(rewardCoinType);
            }
        }
    }
}
