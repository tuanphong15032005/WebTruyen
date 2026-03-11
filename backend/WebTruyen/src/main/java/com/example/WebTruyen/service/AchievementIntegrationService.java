package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementIntegrationService {

    private final AchievementService achievementService;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final CommentRepository commentRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final FollowUserRepository followUserRepository;
    private final DonationRepository donationRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    // Call this method when user reads a chapter
    public void processChapterRead(Long userId, Integer chapterId) {
        try {
            // Get user statistics - Note: reading history only tracks at story level
            int storiesRead = (int) readingHistoryRepository.countDistinctStoriesByUserId(userId);
            // For chapters read, we'll use stories read as approximation since schema only tracks stories
            int chaptersRead = storiesRead; // Approximation: 1 story ≈ 1 chapter read
            
            // Calculate reading streak (simplified - consecutive days with reading activity)
            int readingStreak = calculateReadingStreak(userId);

            achievementService.checkReadingAchievements(Math.toIntExact(userId), chaptersRead, storiesRead, readingStreak);
            
        } catch (Exception e) {
            log.error("Error processing chapter read achievement for user {} chapter {}", userId, chapterId, e);
        }
    }

    
    // Call this method when author publishes a story
    public void processStoryPublished(Long userId) {
        try {
            int storiesWritten = (int) storyRepository.countByAuthor_Id(userId);
            achievementService.checkWritingAchievements(Math.toIntExact(userId), storiesWritten, 0);
        } catch (Exception e) {
            log.error("Error processing story published achievement for user {}", userId, e);
        }
    }

    // Call this method when author publishes a chapter
    public void processChapterPublished(Long userId) {
        try {
            int chaptersWritten = (int) chapterRepository.countByAuthorId(userId);
            int storiesWritten = (int) storyRepository.countByAuthor_Id(userId);
            achievementService.checkWritingAchievements(Math.toIntExact(userId), storiesWritten, chaptersWritten);
        } catch (Exception e) {
            log.error("Error processing chapter published achievement for user {}", userId, e);
        }
    }

    // Call this method when user gets a new follower
    public void processNewFollower(Long authorId) {
        try {
            int followersCount = (int) followUserRepository.countByTargetUserId(authorId);
            achievementService.checkSocialAchievements(Math.toIntExact(authorId), followersCount, 0, 0);
        } catch (Exception e) {
            log.error("Error processing new follower achievement for user {}", authorId, e);
        }
    }

    // Call this method when user makes a donation
    public void processDonationMade(Long fromUserId) {
        try {
            int donationsGiven = (int) donationRepository.countByFromUserId(fromUserId);
            achievementService.checkSocialAchievements(Math.toIntExact(fromUserId), 0, donationsGiven, 0);
        } catch (Exception e) {
            log.error("Error processing donation made achievement for user {}", fromUserId, e);
        }
    }

    // Call this method when user receives a donation
    public void processDonationReceived(Long toUserId) {
        try {
            int donationsReceived = (int) donationRepository.countByToUserId(toUserId);
            achievementService.checkSocialAchievements(Math.toIntExact(toUserId), 0, 0, donationsReceived);
        } catch (Exception e) {
            log.error("Error processing donation received achievement for user {}", toUserId, e);
        }
    }

    // Call this method when user tops up wallet
    public void processWalletTopup(Long userId, Long amount) {
        try {
            // Check for first topup achievement
            if (amount > 0) {
                achievementService.checkAndUnlockAchievement(Math.toIntExact(userId), "FIRST_TOPUP", 
                    Map.of("topup_amount", amount));
            }
        } catch (Exception e) {
            log.error("Error processing wallet topup achievement for user {}", userId, e);
        }
    }

    // Call this method when user unlocks a paid chapter
    public void processChapterUnlock(Long userId, Integer chapterId) {
        try {
            int unlockedChapters = (int) ledgerEntryRepository.countByUserIdAndReason(userId, LedgerReason.SPEND_CHAPTER);
            achievementService.checkAndUnlockAchievement(Math.toIntExact(userId), "UNLOCK_10_CHAPTERS", 
                Map.of("unlocked_chapters", unlockedChapters));
        } catch (Exception e) {
            log.error("Error processing chapter unlock achievement for user {}", userId, e);
        }
    }

    // Calculate reading streak based on consecutive days with reading activity
    private int calculateReadingStreak(Long userId) {
        try {
            // Simplified reading streak - just check if user has any reading activity
            // Since ReadingHistoryEntity doesn't have createdAt field, we'll use a simple approach
            boolean hasReadingActivity = readingHistoryRepository.existsById_UserId(userId);
            
            if (hasReadingActivity) {
                // Return a simple streak based on total reading activity
                int chaptersRead = (int) readingHistoryRepository.countDistinctChaptersByUserId(userId);
                // Simple streak calculation: 1 streak for every 10 chapters read, max 30
                return Math.min(chaptersRead / 10 + 1, 30);
            }
            
            return 0;
        } catch (Exception e) {
            log.error("Error calculating reading streak for user {}", userId, e);
            return 0;
        }
    }

    // Method to check all achievements for a user (can be called periodically)
    public void checkAllAchievements(Long userId) {
        try {
            // Reading stats - Note: reading history only tracks at story level
            int storiesRead = (int) readingHistoryRepository.countDistinctStoriesByUserId(userId);
            // For chapters read, we'll use stories read as approximation since schema only tracks stories
            int chaptersRead = storiesRead; // Approximation: 1 story ≈ 1 chapter read
            int readingStreak = calculateReadingStreak(userId);
            
                        
            // Writing stats (if user is author)
            int storiesWritten = (int) storyRepository.countByAuthor_Id(userId);
            int chaptersWritten = (int) chapterRepository.countByAuthorId(userId);
            
            // Social stats
            int followersCount = (int) followUserRepository.countByTargetUserId(userId);
            int donationsGiven = (int) donationRepository.countByFromUserId(userId);
            int donationsReceived = (int) donationRepository.countByToUserId(userId);
            
            log.info("Checking achievements for user {} - chapters: {}, stories: {}, streak: {}", 
                userId, chaptersRead, storiesRead, readingStreak);
            
            // Check all achievement types
            achievementService.checkReadingAchievements(Math.toIntExact(userId), chaptersRead, storiesRead, readingStreak);
            achievementService.checkWritingAchievements(Math.toIntExact(userId), storiesWritten, chaptersWritten);
            achievementService.checkSocialAchievements(Math.toIntExact(userId), followersCount, donationsGiven, donationsReceived);
            
        } catch (Exception e) {
            log.error("Error checking all achievements for user {}", userId, e);
        }
    }

    // Debug method to trigger first chapter achievement
    public void triggerFirstChapterAchievement(Long userId) {
        try {
            log.info("Manually triggering FIRST_CHAPTER achievement for user: {}", userId);
            achievementService.checkAndUnlockAchievement(Math.toIntExact(userId), "FIRST_CHAPTER", 
                Map.of("chapters_read", 1));
        } catch (Exception e) {
            log.error("Error triggering first chapter achievement for user {}", userId, e);
        }
    }
}
