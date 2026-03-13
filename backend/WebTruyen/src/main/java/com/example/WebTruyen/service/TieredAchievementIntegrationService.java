package com.example.WebTruyen.service;

import com.example.WebTruyen.repository.CommentRepository;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.repository.ReadingHistoryRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.AchievementRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TieredAchievementIntegrationService {

    private final TieredAchievementService tieredAchievementService;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final CommentRepository commentRepository;
    private final StoryRepository storyRepository;
    private final FollowUserRepository followUserRepository;
    private final AchievementRepository achievementRepository;
    private final ChapterRepository chapterRepository;
    
    // In-memory cache for daily comment limits (userId -> (date -> count))
    private final ConcurrentMap<Long, ConcurrentMap<LocalDate, Integer>> dailyCommentCache = new ConcurrentHashMap<>();

    @Transactional
    public void onChapterRead(Long userId) {
        log.info("Processing chapter read event for user: {}", userId);
        
        // Trigger hard-coded achievement
        tieredAchievementService.updateProgress(userId, "READ_CHAPTERS", 1);
        
        // Trigger all achievements in READING category dynamically
        triggerAchievementsByCategory(userId, "READING", 1);
        
        // Reading streak calculation disabled - no updatedAt field available
        // updateReadingStreak(userId);
    }

    @Transactional
    public void recalculateReadingProgress(Long userId) {
        log.info("Recalculating reading progress for user: {}", userId);
        
        try {
            Integer chaptersRead = (int) readingHistoryRepository.countDistinctChaptersByUserId(userId);
            tieredAchievementService.setProgress(userId, "READ_CHAPTERS", chaptersRead);
            
            log.info("Updated reading progress for user {}: {} chapters", userId, chaptersRead);
        } catch (Exception e) {
            log.error("Error recalculating reading progress for user {}: {}", userId, e.getMessage());
        }
        
        // Reading streak calculation disabled - no updatedAt field available
        // updateReadingStreak(userId);
    }

    // Commenting Events
    public void onCommentCreated(Long userId) {
        log.info("Processing comment created event for user: {}", userId);
        try {
            // Check daily comment limit
            if (isWithinDailyLimit(userId)) {
                log.info("Comment counted for achievement - user: {}, within daily limit", userId);
                
                // Trigger hard-coded achievement
                tieredAchievementService.updateProgress(userId, "COMMENT_COUNT", 1);
                
                // Trigger all achievements in COMMENTING category dynamically
                triggerAchievementsByCategory(userId, "COMMENTING", 1);
                
                log.info("Successfully updated COMMENT_COUNT progress for user: {}", userId);
            } else {
                log.info("Comment NOT counted for achievement - user: {}, exceeded daily limit of 5", userId);
            }
        } catch (Exception e) {
            log.error("Failed to update COMMENT_COUNT progress for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Check if user is within daily comment limit for achievement (5 comments per day)
     */
    private boolean isWithinDailyLimit(Long userId) {
        LocalDate today = LocalDate.now();
        
        // Get or create user's daily count map
        ConcurrentMap<LocalDate, Integer> userDailyCount = dailyCommentCache.computeIfAbsent(
            userId, k -> new ConcurrentHashMap<>()
        );
        
        // Get current count for today, default to 0
        Integer currentCount = userDailyCount.getOrDefault(today, 0);
        
        // Check if under limit (5 comments per day)
        if (currentCount < 5) {
            // Increment count
            userDailyCount.put(today, currentCount + 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Reset daily comment cache (call this method daily or on application restart)
     */
    public void resetDailyCache() {
        LocalDate today = LocalDate.now();
        log.info("Resetting daily comment cache for date: {}", today);
        
        // Clear old dates from cache (keep only today)
        dailyCommentCache.forEach((userId, dateMap) -> {
            dateMap.entrySet().removeIf(entry -> !entry.getKey().equals(today));
        });
        
        // Remove users with empty maps
        dailyCommentCache.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        
        log.info("Daily comment cache reset completed");
    }
    
    /**
     * Get current daily comment count for user (for debugging/admin purposes)
     */
    public int getTodayCommentCount(Long userId) {
        LocalDate today = LocalDate.now();
        ConcurrentMap<LocalDate, Integer> userDailyCount = dailyCommentCache.get(userId);
        return userDailyCount != null ? userDailyCount.getOrDefault(today, 0) : 0;
    }

    @Transactional
    public void recalculateCommentProgress(Long userId) {
        log.info("Recalculating comment progress for user: {}", userId);
        try {
            Integer commentCount = (int) commentRepository.countByUserId(userId);
            tieredAchievementService.setProgress(userId, "COMMENT_COUNT", commentCount);
            log.info("Updated comment progress for user {}: {} comments", userId, commentCount);
        } catch (Exception e) {
            log.error("Error recalculating comment progress for user {}: {}", userId, e.getMessage());
        }
    }


    @Transactional
    public void onChapterCreated(Long userId) {
        log.info("Processing chapter created event for user: {}", userId);
        try {
            // Trigger hard-coded achievement only for published chapters
            tieredAchievementService.updateProgress(userId, "WRITTEN_CHAPTERS", 1);
            
            // Trigger all achievements in WRITING category dynamically
            triggerAchievementsByCategory(userId, "WRITING", 1);
            
            log.info("Successfully updated WRITTEN_CHAPTERS progress for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to update WRITTEN_CHAPTERS progress for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional
    public void onStoryCreated(Long userId) {
        log.info("Processing story created event for user: {}", userId);
        
        // Trigger all achievements in WRITING category dynamically
        triggerAchievementsByCategory(userId, "WRITING", 1);
    }

    @Transactional
    public void recalculateWritingProgress(Long userId) {
        log.info("Recalculating writing progress for user: {}", userId);
        try {
            // Count only published chapters for achievement
            Integer chaptersWritten = (int) chapterRepository.countByAuthorIdAndStatus(userId, ChapterStatus.published);
            tieredAchievementService.setProgress(userId, "WRITTEN_CHAPTERS", chaptersWritten);
            log.info("Updated writing progress for user {}: {} published chapters", userId, chaptersWritten);
        } catch (Exception e) {
            log.error("Error recalculating writing progress for user {}: {}", userId, e.getMessage());
        }
    }

    // Social Events
    @Transactional
    public void onFollowerGained(Long userId) {
        log.info("Processing follower gained event for user: {}", userId);
        
        // Trigger hard-coded achievement
        tieredAchievementService.updateProgress(userId, "FOLLOWER_COUNT", 1);
        
        // Trigger all achievements in SOCIAL category dynamically
        triggerAchievementsByCategory(userId, "SOCIAL", 1);
    }

    @Transactional
    public void onFollowerLost(Long userId) {
        log.info("Processing follower lost event for user: {}", userId);
        // Recalculate total followers
        try {
            Integer followerCount = (int) followUserRepository.countByTargetUserId(userId);
            tieredAchievementService.setProgress(userId, "FOLLOWER_COUNT", followerCount);
        } catch (Exception e) {
            log.error("Error recalculating follower count for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional
    public void recalculateSocialProgress(Long userId) {
        log.info("Recalculating social progress for user: {}", userId);
        try {
            Integer followerCount = (int) followUserRepository.countByTargetUserId(userId);
            tieredAchievementService.setProgress(userId, "FOLLOWER_COUNT", followerCount);
            log.info("Updated social progress for user {}: {} followers", userId, followerCount);
        } catch (Exception e) {
            log.error("Error recalculating social progress for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional
    public void initializeProgressForNewUser(Long userId) {
        log.info("Initializing achievement progress for new user: {}", userId);
        
        try {
            tieredAchievementService.setProgress(userId, "READ_CHAPTERS", 0);
            tieredAchievementService.setProgress(userId, "COMMENT_COUNT", 0);
            tieredAchievementService.setProgress(userId, "WRITTEN_CHAPTERS", 0);
            tieredAchievementService.setProgress(userId, "FOLLOWER_COUNT", 0);
            
            log.info("Initialized achievement progress for new user: {}", userId);
        } catch (Exception e) {
            log.error("Error initializing progress for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Trigger all achievements in a specific category
     * This allows admin-created achievements to work dynamically
     */
    @Transactional
    private void triggerAchievementsByCategory(Long userId, String category, Integer incrementValue) {
        try {
            List<AchievementEntity> achievements = achievementRepository.findByCategoryAndIsActive(category, true);
            
            for (AchievementEntity achievement : achievements) {
                // Skip if this is the hard-coded achievement we already processed
                if ((category.equals("READING") && achievement.getCode().equals("READ_CHAPTERS")) ||
                    (category.equals("COMMENTING") && achievement.getCode().equals("COMMENT_COUNT")) ||
                    (category.equals("WRITING") && achievement.getCode().equals("WRITTEN_CHAPTERS")) ||
                    (category.equals("SOCIAL") && achievement.getCode().equals("FOLLOWER_COUNT"))) {
                    continue;
                }
                
                log.info("Dynamically triggering achievement: {} for user: {}", achievement.getCode(), userId);
                tieredAchievementService.updateProgress(userId, achievement.getCode(), incrementValue);
            }
        } catch (Exception e) {
            log.error("Error triggering achievements for category {} and user {}: {}", category, userId, e.getMessage());
        }
    }

    // Comprehensive recalculation for all achievements
    @Transactional
    public void recalculateAllProgress(Long userId) {
        log.info("Recalculating all achievement progress for user: {}", userId);
        
        try {
            recalculateReadingProgress(userId);
            recalculateCommentProgress(userId);
            recalculateWritingProgress(userId);
            recalculateSocialProgress(userId);
            
            log.info("Completed recalculation of all achievement progress for user: {}", userId);
        } catch (Exception e) {
            log.error("Error recalculating all progress for user {}: {}", userId, e.getMessage());
        }
    }
}
