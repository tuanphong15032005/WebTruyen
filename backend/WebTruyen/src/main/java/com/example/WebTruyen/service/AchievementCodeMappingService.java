package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.repository.AchievementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementCodeMappingService {

    private final AchievementRepository achievementRepository;
    private final TieredAchievementIntegrationService tieredAchievementIntegrationService;
    
    // Cache for achievement codes to avoid frequent database queries
    private Map<String, String> achievementCodeMapping = new HashMap<>();
    
    // Predefined achievement codes that should be supported
    private static final Map<String, String> DEFAULT_ACHIEVEMENT_CODES = Map.of(
        "READING_CHAPTERS", "READ_CHAPTERS",
        "COMMENTING", "COMMENT_COUNT",
        "WRITING_CHAPTERS", "WRITTEN_CHAPTERS",
        "SOCIAL_FOLLOWERS", "FOLLOWER_COUNT"
    );
    
    /**
     * Initialize achievement code mapping from database
     */
    public void initializeAchievementMapping() {
        log.info("Initializing achievement code mapping");
        
        try {
            List<AchievementEntity> allAchievements = achievementRepository.findAll();
            
            for (AchievementEntity achievement : allAchievements) {
                String eventCode = mapCategoryToEventCode(achievement.getCategory());
                if (eventCode != null) {
                    achievementCodeMapping.put(achievement.getCode(), eventCode);
                    log.info("Mapped achievement code {} to event {}", achievement.getCode(), eventCode);
                }
            }
            
            log.info("Achievement code mapping initialized with {} mappings", achievementCodeMapping.size());
        } catch (Exception e) {
            log.error("Error initializing achievement code mapping: {}", e.getMessage());
        }
    }
    
    /**
     * Map achievement category to corresponding event code
     */
    private String mapCategoryToEventCode(String category) {
        return DEFAULT_ACHIEVEMENT_CODES.get(category);
    }
    
    /**
     * Get event code for achievement
     */
    public String getEventCode(String achievementCode) {
        return achievementCodeMapping.get(achievementCode);
    }
    
    /**
     * Trigger achievement progress update based on achievement code
     */
    public void triggerAchievementProgress(String achievementCode, Long userId, Integer incrementValue) {
        String eventCode = getEventCode(achievementCode);
        if (eventCode == null) {
            log.warn("No event code mapping found for achievement: {}", achievementCode);
            return;
        }
        
        try {
            switch (eventCode) {
                case "READ_CHAPTERS":
                    tieredAchievementIntegrationService.onChapterRead(userId);
                    break;
                case "COMMENT_COUNT":
                    tieredAchievementIntegrationService.onCommentCreated(userId);
                    break;
                case "WRITTEN_CHAPTERS":
                    tieredAchievementIntegrationService.onChapterCreated(userId);
                    break;
                case "FOLLOWER_COUNT":
                    tieredAchievementIntegrationService.onFollowerGained(userId);
                    break;
                default:
                    log.warn("Unknown event code: {}", eventCode);
            }
        } catch (Exception e) {
            log.error("Error triggering achievement progress for {}: {}", achievementCode, e.getMessage());
        }
    }
    
    /**
     * Refresh achievement mapping when admin creates new achievements
     */
    public void refreshAchievementMapping() {
        log.info("Refreshing achievement code mapping");
        achievementCodeMapping.clear();
        initializeAchievementMapping();
    }
    
    /**
     * Check if achievement code is supported
     */
    public boolean isAchievementSupported(String achievementCode) {
        return achievementCodeMapping.containsKey(achievementCode);
    }
    
    /**
     * Get all supported event codes
     */
    public Map<String, String> getAllMappings() {
        return new HashMap<>(achievementCodeMapping);
    }
}
