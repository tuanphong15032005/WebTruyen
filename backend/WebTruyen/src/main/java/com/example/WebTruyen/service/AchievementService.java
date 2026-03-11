package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Gamification.AchievementEntity;
import com.example.WebTruyen.entity.model.Gamification.UserAchievementEntity;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.repository.AchievementRepository;
import com.example.WebTruyen.repository.UserAchievementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final WalletService walletService;
    private final ObjectMapper objectMapper;

    public List<AchievementEntity> getAllAchievements() {
        List<AchievementEntity> achievements = achievementRepository.findAll();
        log.info("Total achievements found: {}", achievements.size());
        return achievements;
    }

    public List<UserAchievementEntity> getUserAchievements(Integer userId) {
        log.info("Getting achievements for user: {}", userId);
        List<UserAchievementEntity> userAchievements = userAchievementRepository.findByUserIdOrderByAchievedAtDesc(userId);
        log.info("Found {} user achievements for user: {}", userAchievements.size(), userId);
        return userAchievements;
    }

    public List<AchievementEntity> getUnlockedAchievements(Integer userId) {
        log.info("Getting unlocked achievements for user: {}", userId);
        List<AchievementEntity> unlockedAchievements = achievementRepository.findUnlockedAchievementsByUserId(userId);
        log.info("Found {} unlocked achievements for user: {}", unlockedAchievements.size(), userId);
        return unlockedAchievements;
    }

    public List<UserAchievementEntity> getUnclaimedAchievements(Integer userId) {
        log.info("Getting unclaimed achievements for user: {}", userId);
        List<UserAchievementEntity> unclaimedAchievements = userAchievementRepository.findUnclaimedByUserId(userId);
        log.info("Found {} unclaimed achievements for user: {}", unclaimedAchievements.size(), userId);
        return unclaimedAchievements;
    }

    @Transactional
    public UserAchievementEntity claimAchievement(Integer userId, Integer achievementId) {
        Optional<UserAchievementEntity> userAchievementOpt = userAchievementRepository
                .findByUserIdAndAchievementId(userId, achievementId);

        if (userAchievementOpt.isEmpty()) {
            throw new RuntimeException("Achievement not found for user");
        }

        UserAchievementEntity userAchievement = userAchievementOpt.get();
        if (userAchievement.getIsClaimed()) {
            throw new RuntimeException("Achievement already claimed");
        }

        userAchievement.setIsClaimed(true);
        userAchievementRepository.save(userAchievement);

        // Grant reward
        AchievementEntity achievement = userAchievement.getAchievement();
        if (achievement.getRewardCoin() != null && achievement.getRewardCoin() > 0) {
            UserEntity user = UserEntity.builder().id(userId.longValue()).build();
            
            if (achievement.getRewardCoinType() == AchievementEntity.CoinType.A) {
                walletService.addCoinA(user, achievement.getRewardCoin(), 
                    LedgerReason.REVIEW_REWARD, "ACHIEVEMENT", 
                    "Thưởng thành tích: " + achievement.getName());
            } else {
                walletService.addCoinB(user, achievement.getRewardCoin(), 
                    LedgerReason.REVIEW_REWARD);
            }
        }

        return userAchievement;
    }

    @Transactional
    public Optional<UserAchievementEntity> checkAndUnlockAchievement(Integer userId, String achievementCode, Map<String, Object> progress) {
        try {
            Optional<AchievementEntity> achievementOpt = achievementRepository.findByCode(achievementCode);
            if (achievementOpt.isEmpty()) {
                log.warn("Achievement not found: {}", achievementCode);
                return Optional.empty();
            }

            AchievementEntity achievement = achievementOpt.get();

            // Check if already unlocked
            if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId())) {
                return Optional.empty();
            }

            // Check criteria
            if (checkAchievementCriteria(achievement, progress)) {
                return Optional.of(unlockAchievement(userId, achievement.getId()));
            }

        } catch (Exception e) {
            log.error("Error checking achievement: {}", achievementCode, e);
        }

        return Optional.empty();
    }

    private boolean checkAchievementCriteria(AchievementEntity achievement, Map<String, Object> progress) {
        try {
            if (achievement.getCriteriaJson() == null) {
                return false;
            }

            Map<String, Object> criteria = objectMapper.readValue(achievement.getCriteriaJson(), Map.class);

            for (Map.Entry<String, Object> entry : criteria.entrySet()) {
                String key = entry.getKey();
                Object requiredValue = entry.getValue();
                Object actualValue = progress.get(key);

                if (actualValue == null || !compareValues(actualValue, requiredValue)) {
                    return false;
                }
            }

            return true;
        } catch (JsonProcessingException e) {
            log.error("Error parsing achievement criteria", e);
            return false;
        }
    }

    private boolean compareValues(Object actual, Object required) {
        if (actual instanceof Number && required instanceof Number) {
            return ((Number) actual).doubleValue() >= ((Number) required).doubleValue();
        }
        return actual.equals(required);
    }

    @Transactional
    public UserAchievementEntity unlockAchievement(Integer userId, Integer achievementId) {
        if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievementId)) {
            throw new RuntimeException("Achievement already unlocked");
        }

        AchievementEntity achievement = achievementRepository.findById(achievementId)
                .orElseThrow(() -> new RuntimeException("Achievement not found"));

        UserAchievementEntity userAchievement = UserAchievementEntity.builder()
                .user(UserEntity.builder().id(userId.longValue()).build())
                .achievement(achievement)
                .achievedAt(LocalDateTime.now())
                .isClaimed(false)
                .build();

        return userAchievementRepository.save(userAchievement);
    }

    // Achievement checking methods for different activities
    public void checkReadingAchievements(Integer userId, int chaptersRead, int storiesRead, int readingStreak) {
        // First chapter read
        if (chaptersRead >= 1) {
            checkAndUnlockAchievement(userId, "FIRST_CHAPTER", Map.of("chapters_read", chaptersRead));
        }

        // Reading streak achievements
        if (readingStreak >= 3) {
            checkAndUnlockAchievement(userId, "READING_STREAK_3", Map.of("streak_days", readingStreak));
        }
        if (readingStreak >= 7) {
            checkAndUnlockAchievement(userId, "READING_STREAK_7", Map.of("streak_days", readingStreak));
        }
        if (readingStreak >= 30) {
            checkAndUnlockAchievement(userId, "READING_STREAK_30", Map.of("streak_days", readingStreak));
        }

        // Stories read achievements
        if (storiesRead >= 5) {
            checkAndUnlockAchievement(userId, "READ_5_STORIES", Map.of("stories_read", storiesRead));
        }
        if (storiesRead >= 10) {
            checkAndUnlockAchievement(userId, "READ_10_STORIES", Map.of("stories_read", storiesRead));
        }
        if (storiesRead >= 50) {
            checkAndUnlockAchievement(userId, "READ_50_STORIES", Map.of("stories_read", storiesRead));
        }

        // Chapters read achievements
        if (chaptersRead >= 10) {
            checkAndUnlockAchievement(userId, "READ_10_CHAPTERS", Map.of("chapters_read", chaptersRead));
        }
        if (chaptersRead >= 50) {
            checkAndUnlockAchievement(userId, "READ_50_CHAPTERS", Map.of("chapters_read", chaptersRead));
        }
        if (chaptersRead >= 100) {
            checkAndUnlockAchievement(userId, "READ_100_CHAPTERS", Map.of("chapters_read", chaptersRead));
        }
    }

    
    public void checkWritingAchievements(Integer userId, int storiesWritten, int chaptersWritten) {
        if (storiesWritten >= 1) {
            checkAndUnlockAchievement(userId, "FIRST_STORY", Map.of("stories_written", storiesWritten));
        }
        if (chaptersWritten >= 1) {
            checkAndUnlockAchievement(userId, "FIRST_CHAPTER_WRITTEN", Map.of("chapters_written", chaptersWritten));
        }
        if (storiesWritten >= 3) {
            checkAndUnlockAchievement(userId, "WRITE_3_STORIES", Map.of("stories_written", storiesWritten));
        }
        if (chaptersWritten >= 10) {
            checkAndUnlockAchievement(userId, "WRITE_10_CHAPTERS", Map.of("chapters_written", chaptersWritten));
        }
    }

    public void checkSocialAchievements(Integer userId, int followersCount, int donationsGiven, int donationsReceived) {
        if (followersCount >= 10) {
            checkAndUnlockAchievement(userId, "POPULAR_AUTHOR_10", Map.of("followers_count", followersCount));
        }
        if (followersCount >= 50) {
            checkAndUnlockAchievement(userId, "POPULAR_AUTHOR_50", Map.of("followers_count", followersCount));
        }
        if (donationsGiven >= 1) {
            checkAndUnlockAchievement(userId, "FIRST_DONATION", Map.of("donations_given", donationsGiven));
        }
        if (donationsReceived >= 1) {
            checkAndUnlockAchievement(userId, "FIRST_DONATION_RECEIVED", Map.of("donations_received", donationsReceived));
        }
    }
}
