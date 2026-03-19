package com.example.WebTruyen.service;

import com.example.WebTruyen.controller.admin.DailyMissionAdminController;
import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.entity.model.Gamification.UserDailyStatusEntity;
import com.example.WebTruyen.repository.DailyMissionRepository;
import com.example.WebTruyen.repository.UserDailyStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyMissionAdminService {

    private final DailyMissionRepository dailyMissionRepository;
    private final UserDailyStatusRepository userDailyStatusRepository;

    // Task codes (same as in SimpleDailyTaskService)
    private static final String TASK_LOGIN = "DAILY_LOGIN";
    private static final String TASK_READ_CHAPTERS = "READ_CHAPTERS";
    private static final String TASK_UNLOCK_CHAPTER = "UNLOCK_CHAPTER";
    private static final String TASK_COMMENT = "MAKE_COMMENTS";
    private static final String TASK_DONATE = "MAKE_DONATION";
    private static final String TASK_TOPUP = "MAKE_TOPUP";

    /**
     * Get all missions with optional date filter
     */
    public List<DailyMissionEntity> getAllMissions(LocalDate date) {
        if (date != null) {
            return dailyMissionRepository.findByDate(date);
        }
        return dailyMissionRepository.findAll();
    }

    /**
     * Get missions by specific date
     */
    public List<DailyMissionEntity> getMissionsByDate(LocalDate date) {
        return dailyMissionRepository.findByDate(date);
    }

    // ============================================================
    // Template Management Methods
    // ============================================================

    /**
     * Get all template missions (date = NULL)
     */
    public List<DailyMissionEntity> getAllTemplates() {
        return dailyMissionRepository.findByDateIsNull();
    }

    /**
     * Get all templates ordered by ID
     */
    public List<DailyMissionEntity> getTemplatesOrdered() {
        return dailyMissionRepository.findTemplatesOrdered();
    }

    /**
     * Get template by mission code
     */
    public DailyMissionEntity getTemplateByCode(String missionCode) {
        return dailyMissionRepository.findByDateIsNull().stream()
                .filter(template -> template.getMissionCode().equals(missionCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Template not found for mission code: " + missionCode));
    }

    /**
     * Update template
     */
    @Transactional
    public DailyMissionEntity updateTemplate(Integer templateId, DailyMissionEntity updateData) {
        DailyMissionEntity template = dailyMissionRepository.findById(templateId.longValue())
                .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
        
        // Verify this is a template (date should be NULL)
        if (template.getDate() != null) {
            throw new RuntimeException("This is not a template (date is not NULL)");
        }
        
        // Update allowed fields
        if (updateData.getDescription() != null) {
            template.setDescription(updateData.getDescription());
        }
        if (updateData.getTarget() != null) {
            template.setTarget(updateData.getTarget());
        }
        if (updateData.getRewardCoin() != null) {
            template.setRewardCoin(updateData.getRewardCoin());
        }
        if (updateData.getRewardCoinType() != null) {
            template.setRewardCoinType(updateData.getRewardCoinType());
        }
        
        DailyMissionEntity saved = dailyMissionRepository.save(template);
        log.info("Updated template: {} - {}", saved.getMissionCode(), saved.getDescription());
        return saved;
    }

    /**
     * Create new template
     */
    @Transactional
    public DailyMissionEntity createTemplate(DailyMissionEntity template) {
        // Ensure date is NULL for template
        template.setDate(null);
        
        // Check if mission code already exists in templates
        boolean exists = dailyMissionRepository.findByDateIsNull().stream()
                .anyMatch(t -> t.getMissionCode().equals(template.getMissionCode()));
        
        if (exists) {
            throw new RuntimeException("Template with mission code already exists: " + template.getMissionCode());
        }
        
        DailyMissionEntity saved = dailyMissionRepository.save(template);
        log.info("Created new template: {} - {}", saved.getMissionCode(), saved.getDescription());
        return saved;
    }

    /**
     * Delete template
     */
    @Transactional
    public void deleteTemplate(Integer templateId) {
        DailyMissionEntity template = dailyMissionRepository.findById(templateId.longValue())
                .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
        
        // Verify this is a template
        if (template.getDate() != null) {
            throw new RuntimeException("This is not a template (date is not NULL)");
        }
        
        dailyMissionRepository.delete(template);
        log.info("Deleted template: {} - {}", template.getMissionCode(), template.getDescription());
    }

    /**
     * Get missions by specific date with completion statistics
     */
    public List<Map<String, Object>> getMissionsByDateWithStats(LocalDate date) {
        List<DailyMissionEntity> missions = dailyMissionRepository.findByDate(date);
        
        // Get total unique users for the date
        final Long totalUsers = userDailyStatusRepository.countDistinctUsersByDate(date);
        final Long finalTotalUsers = totalUsers != null ? totalUsers : 0L;
        
        return missions.stream().map(mission -> {
            // Get count of users who completed this mission
            Long completedUsers = userDailyStatusRepository.countDistinctUsersCompletedMission(mission.getId().longValue());
            
            // Get total coins distributed for this mission
            Long totalCoinsDistributed = userDailyStatusRepository.calculateTotalCoinsDistributedForMission(mission.getId().longValue());
            
            // Check if any user has claimed rewards for this mission
            boolean hasClaims = totalCoinsDistributed != null && totalCoinsDistributed > 0;
            
            // Check if any user has started this mission (has progress record)
            Long totalProgressRecords = userDailyStatusRepository.countUsersByMissionId(mission.getId().longValue());
            boolean hasProgress = totalProgressRecords != null && totalProgressRecords > 0;
            
            // Calculate completion rate
            double completionRate = finalTotalUsers > 0 ? (double) completedUsers / finalTotalUsers * 100 : 0;
            
            Map<String, Object> missionData = new HashMap<>();
            missionData.put("id", mission.getId());
            missionData.put("date", mission.getDate());
            missionData.put("missionCode", mission.getMissionCode());
            missionData.put("description", mission.getDescription());
            missionData.put("target", mission.getTarget());
            missionData.put("rewardCoin", mission.getRewardCoin());
            missionData.put("rewardCoinType", mission.getRewardCoinType());
            missionData.put("completedUsers", completedUsers);
            missionData.put("totalUsers", finalTotalUsers);
            missionData.put("completionRate", Math.round(completionRate * 10.0) / 10.0); // Round to 1 decimal place
            missionData.put("totalCoinsDistributed", totalCoinsDistributed != null ? totalCoinsDistributed : 0L);
            missionData.put("hasClaims", hasClaims);
            missionData.put("hasProgress", hasProgress);
            
            return missionData;
        }).collect(Collectors.toList());
    }

    /**
     * Get distinct dates that have missions
     */
    public List<LocalDate> getAvailableDates() {
        return dailyMissionRepository.findAllDistinctDates();
    }

    /**
     * Create new mission
     */
    @Transactional
    public DailyMissionEntity createMission(DailyMissionAdminController.DailyMissionCreateDto createDto) {
        // Check if mission already exists for this date and code
        List<DailyMissionEntity> existingMissions = dailyMissionRepository.findByDate(createDto.getDate());
        boolean missionExists = existingMissions.stream()
                .anyMatch(m -> m.getMissionCode().equals(createDto.getMissionCode()));
        
        if (missionExists) {
            throw new RuntimeException("Mission with code " + createDto.getMissionCode() + 
                    " already exists for date " + createDto.getDate());
        }
        
        DailyMissionEntity mission = DailyMissionEntity.builder()
                .date(createDto.getDate())
                .missionCode(createDto.getMissionCode())
                .description(createDto.getDescription())
                .target(createDto.getTarget())
                .rewardCoin(createDto.getRewardCoin())
                .rewardCoinType(createDto.getRewardCoinType())
                .build();

        return dailyMissionRepository.save(mission);
    }

    /**
     * Update existing mission
     */
    @Transactional
    public DailyMissionEntity updateMission(Integer id, DailyMissionAdminController.DailyMissionUpdateDto updateDto) {
        DailyMissionEntity mission = dailyMissionRepository.findById(id.longValue())
                .orElseThrow(() -> new RuntimeException("Daily mission not found: " + id));

        if (updateDto.getDescription() != null) {
            mission.setDescription(updateDto.getDescription());
        }
        if (updateDto.getTarget() != null) {
            mission.setTarget(updateDto.getTarget());
        }
        if (updateDto.getRewardCoin() != null) {
            mission.setRewardCoin(updateDto.getRewardCoin());
        }
        if (updateDto.getRewardCoinType() != null) {
            mission.setRewardCoinType(updateDto.getRewardCoinType());
        }

        return dailyMissionRepository.save(mission);
    }

    /**
     * Delete mission (disabled - each day should have exactly 6 missions)
     */
    @Transactional
    public void deleteMission(Integer id) {
        throw new RuntimeException("Không thể xóa nhiệm vụ hàng ngày. Mỗi ngày phải có đúng 6 nhiệm vụ. Vui lòng sử dụng tính năng chỉnh sửa để thay đổi thông tin.");
    }

    /**
     * Generate missions for a specific date from templates
     */
    @Transactional
    public List<DailyMissionEntity> generateMissionsForDate(LocalDate date) {
        // Check if missions already exist for this date
        List<DailyMissionEntity> existingMissions = dailyMissionRepository.findByDate(date);
        
        // Get all templates from database
        List<DailyMissionEntity> templates = dailyMissionRepository.findByDateIsNull();
        
        // If no templates found, create with minimal default rewards
        if (templates.isEmpty()) {
            log.warn("No templates found, creating minimal default missions for date: {}", date);
            templates = createMinimalDefaultMissions(date);
        }

        // Define all required mission codes
        Set<String> requiredMissionCodes = Set.of(
            TASK_LOGIN, TASK_READ_CHAPTERS, TASK_UNLOCK_CHAPTER, 
            TASK_COMMENT, TASK_DONATE, TASK_TOPUP
        );
        
        // Get existing mission codes
        Set<String> existingMissionCodes = existingMissions.stream()
                .map(DailyMissionEntity::getMissionCode)
                .collect(Collectors.toSet());
        
        List<DailyMissionEntity> resultMissions = new ArrayList<>();
        
        if (existingMissions.isEmpty()) {
            // Case 1: No missions exist - create all 6
            log.info("No missions exist for date: {}, creating all 6 missions", date);
            
            List<DailyMissionEntity> newMissions = templates.stream()
                    .map(template -> DailyMissionEntity.builder()
                            .date(date)
                            .missionCode(template.getMissionCode())
                            .description(template.getDescription())
                            .target(template.getTarget())
                            .rewardCoin(template.getRewardCoin())
                            .rewardCoinType(template.getRewardCoinType())
                            .build())
                    .collect(Collectors.toList());

            resultMissions = dailyMissionRepository.saveAll(newMissions);
            log.info("Created {} new missions for date: {}", resultMissions.size(), date);
            
        } else if (existingMissions.size() >= 6) {
            // Case 2: Already have 6+ missions - return existing, don't create more
            log.info("Already have {} missions for date: {}, no new missions needed", existingMissions.size(), date);
            resultMissions = existingMissions;
            
        } else {
            // Case 3: Have some missions but less than 6 - create missing ones
            log.info("Have {} missions for date: {}, creating missing missions", existingMissions.size(), date);
            
            // Find missing mission codes
            Set<String> missingMissionCodes = new HashSet<>(requiredMissionCodes);
            missingMissionCodes.removeAll(existingMissionCodes);
            
            // Add existing missions to result
            resultMissions.addAll(existingMissions);
            
            // Create missing missions from templates
            List<DailyMissionEntity> missingMissions = templates.stream()
                    .filter(template -> missingMissionCodes.contains(template.getMissionCode()))
                    .map(template -> DailyMissionEntity.builder()
                            .date(date)
                            .missionCode(template.getMissionCode())
                            .description(template.getDescription())
                            .target(template.getTarget())
                            .rewardCoin(template.getRewardCoin())
                            .rewardCoinType(template.getRewardCoinType())
                            .build())
                    .collect(Collectors.toList());
            
            List<DailyMissionEntity> savedMissingMissions = dailyMissionRepository.saveAll(missingMissions);
            resultMissions.addAll(savedMissingMissions);
            
            log.info("Added {} missing missions for date: {}, total now: {}", 
                    savedMissingMissions.size(), resultMissions.size(), date);
        }
        
        return resultMissions;
    }

    /**
     * Regenerate missions from templates - only update missions without user progress
     */
    @Transactional
    public List<DailyMissionEntity> regenerateMissionsFromTemplates(LocalDate date) {
        // Get existing missions for this date
        List<DailyMissionEntity> existingMissions = dailyMissionRepository.findByDate(date);
        
        // Get templates from database
        List<DailyMissionEntity> templates = dailyMissionRepository.findByDateIsNull();
        
        // If no templates found, create with minimal default rewards
        if (templates.isEmpty()) {
            log.warn("No templates found, creating minimal default missions for date: {}", date);
            templates = createMinimalDefaultMissions(date);
        }

        // Define all required mission codes
        Set<String> requiredMissionCodes = Set.of(
            TASK_LOGIN, TASK_READ_CHAPTERS, TASK_UNLOCK_CHAPTER, 
            TASK_COMMENT, TASK_DONATE, TASK_TOPUP
        );
        
        // Get existing mission codes
        Set<String> existingMissionCodes = existingMissions.stream()
                .map(DailyMissionEntity::getMissionCode)
                .collect(Collectors.toSet());
        
        // Find missing mission codes
        Set<String> missingMissionCodes = new HashSet<>(requiredMissionCodes);
        missingMissionCodes.removeAll(existingMissionCodes);
        
        List<DailyMissionEntity> resultMissions = new ArrayList<>();
        int updatedCount = 0;
        int createdCount = 0;
        
        // Create missing missions first
        if (!missingMissionCodes.isEmpty()) {
            List<DailyMissionEntity> newMissions = templates.stream()
                    .filter(template -> missingMissionCodes.contains(template.getMissionCode()))
                    .map(template -> DailyMissionEntity.builder()
                            .date(date)
                            .missionCode(template.getMissionCode())
                            .description(template.getDescription())
                            .target(template.getTarget())
                            .rewardCoin(template.getRewardCoin())
                            .rewardCoinType(template.getRewardCoinType())
                            .build())
                    .collect(Collectors.toList());
            
            List<DailyMissionEntity> savedNewMissions = dailyMissionRepository.saveAll(newMissions);
            resultMissions.addAll(savedNewMissions);
            createdCount = savedNewMissions.size();
            log.info("Created {} missing missions for date: {}", createdCount, date);
        }
        
        // Update existing missions that have no user progress
        for (DailyMissionEntity existingMission : existingMissions) {
            // Check if any user has progress for this mission
            Long userProgressCount = userDailyStatusRepository.countUsersByMissionId(existingMission.getId().longValue());
            boolean hasUserProgress = userProgressCount != null && userProgressCount > 0;
            
            if (!hasUserProgress) {
                // Find corresponding template
                Optional<DailyMissionEntity> template = templates.stream()
                        .filter(t -> t.getMissionCode().equals(existingMission.getMissionCode()))
                        .findFirst();
                
                if (template.isPresent()) {
                    DailyMissionEntity tmpl = template.get();
                    // Update mission with template data
                    existingMission.setDescription(tmpl.getDescription());
                    existingMission.setTarget(tmpl.getTarget());
                    existingMission.setRewardCoin(tmpl.getRewardCoin());
                    existingMission.setRewardCoinType(tmpl.getRewardCoinType());
                    
                    DailyMissionEntity saved = dailyMissionRepository.save(existingMission);
                    resultMissions.add(saved);
                    updatedCount++;
                    log.info("Updated mission {} from template for date: {}", existingMission.getMissionCode(), date);
                }
            } else {
                // Keep existing mission as-is (has user progress)
                resultMissions.add(existingMission);
                log.info("Kept mission {} unchanged (has user progress) for date: {}", existingMission.getMissionCode(), date);
            }
        }
        
        log.info("Mission regeneration completed for date: {} - Created: {}, Updated: {}, Total: {}", 
                date, createdCount, updatedCount, resultMissions.size());
        
        return resultMissions;
    }
    private List<DailyMissionEntity> createMinimalDefaultMissions(LocalDate date) {
        return List.of(
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
        );
    }

    /**
     * Get mission statistics
     */
    public Map<String, Object> getMissionStats() {
        List<DailyMissionEntity> allMissions = dailyMissionRepository.findAll();
        List<UserDailyStatusEntity> allUserStatuses = userDailyStatusRepository.findAll();

        // Total missions
        long totalMissions = allMissions.size();

        // Missions by date
        Map<LocalDate, Long> missionsByDate = allMissions.stream()
                .collect(Collectors.groupingBy(DailyMissionEntity::getDate, Collectors.counting()));

        // Total user progress records
        long totalUserProgress = allUserStatuses.size();

        // Completed missions
        long completedMissions = allUserStatuses.stream()
                .filter(status -> status.getCompletedAt() != null)
                .count();

        // Most active date
        LocalDate mostActiveDate = missionsByDate.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Mission types distribution
        Map<String, Long> missionTypeDistribution = allMissions.stream()
                .collect(Collectors.groupingBy(DailyMissionEntity::getMissionCode, Collectors.counting()));

        return Map.of(
                "totalMissions", totalMissions,
                "totalUserProgress", totalUserProgress,
                "completedMissions", completedMissions,
                "completionRate", totalUserProgress > 0 ? (double) completedMissions / totalUserProgress * 100 : 0,
                "missionsByDate", missionsByDate,
                "mostActiveDate", mostActiveDate,
                "missionTypeDistribution", missionTypeDistribution,
                "uniqueDates", missionsByDate.size()
        );
    }

    /**
     * Copy missions from one date to another
     */
    @Transactional
    public Map<String, Object> copyMissionsToDate(LocalDate fromDate, LocalDate toDate) {
        // Check if target date already has missions
        List<DailyMissionEntity> existingMissions = dailyMissionRepository.findByDate(toDate);
        if (!existingMissions.isEmpty()) {
            throw new RuntimeException("Ngày " + toDate + " đã có nhiệm vụ. Vui lòng xóa hoặc chọn ngày khác.");
        }

        // Get source missions
        List<DailyMissionEntity> sourceMissions = dailyMissionRepository.findByDate(fromDate);
        if (sourceMissions.isEmpty()) {
            throw new RuntimeException("Không tìm thấy nhiệm vụ cho ngày " + fromDate);
        }

        // Create new missions for target date
        List<DailyMissionEntity> newMissions = sourceMissions.stream()
                .map(sourceMission -> DailyMissionEntity.builder()
                        .date(toDate)
                        .missionCode(sourceMission.getMissionCode())
                        .description(sourceMission.getDescription())
                        .target(sourceMission.getTarget())
                        .rewardCoin(sourceMission.getRewardCoin())
                        .rewardCoinType(sourceMission.getRewardCoinType())
                        .build())
                .collect(Collectors.toList());

        List<DailyMissionEntity> savedMissions = dailyMissionRepository.saveAll(newMissions);

        return Map.of(
                "fromDate", fromDate,
                "toDate", toDate,
                "missionsCopied", savedMissions.size(),
                "message", "Đã copy " + savedMissions.size() + " nhiệm vụ từ " + fromDate + " sang " + toDate
        );
    }

    /**
     * Batch delete missions that don't have any user progress
     */
    @Transactional
    public Map<String, Object> batchDeleteMissionsWithoutProgress(LocalDate date) {
        List<DailyMissionEntity> missions = dailyMissionRepository.findByDate(date);
        
        if (missions.isEmpty()) {
            return Map.of(
                    "deletedCount", 0,
                    "skippedCount", 0,
                    "message", "Không có nhiệm vụ nào cho ngày " + date
            );
        }

        int deletedCount = 0;
        int skippedCount = 0;

        for (DailyMissionEntity mission : missions) {
            // Check if any user has progress for this mission
            List<UserDailyStatusEntity> userProgress = userDailyStatusRepository.findByMissionId(mission.getId().longValue());
            
            if (userProgress.isEmpty()) {
                // No user progress, safe to delete
                dailyMissionRepository.delete(mission);
                deletedCount++;
                log.info("Deleted mission {} ({}) - no user progress", mission.getId(), mission.getMissionCode());
            } else {
                // Has user progress, skip deletion
                skippedCount++;
                log.info("Skipped deletion of mission {} ({}) - has user progress", mission.getId(), mission.getMissionCode());
            }
        }

        return Map.of(
                "deletedCount", deletedCount,
                "skippedCount", skippedCount,
                "message", "Đã xóa " + deletedCount + " nhiệm vụ, bỏ qua " + skippedCount + " nhiệm vụ có người làm"
        );
    }
}
