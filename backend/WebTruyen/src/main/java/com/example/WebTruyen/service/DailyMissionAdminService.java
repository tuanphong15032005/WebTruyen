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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        if (!existingMissions.isEmpty()) {
            log.warn("Missions already exist for date: {}, returning existing missions", date);
            return existingMissions;
        }

        // Get templates from database
        List<DailyMissionEntity> templates = dailyMissionRepository.findByDateIsNull();
        
        // If no templates found, create with minimal default rewards
        if (templates.isEmpty()) {
            log.warn("No templates found, creating minimal default missions for date: {}", date);
            templates = createMinimalDefaultMissions(date);
        }

        // Create new missions for the target date based on templates
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

        return dailyMissionRepository.saveAll(newMissions);
    }

    /**
     * Create minimal default missions if no reference found
     */
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
}
