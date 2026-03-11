package com.example.WebTruyen.service;

import com.example.WebTruyen.repository.ReadingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TieredAchievementIntegrationService {

    private final TieredAchievementService tieredAchievementService;
    private final ReadingHistoryRepository readingHistoryRepository;

    @Transactional
    public void onChapterRead(Long userId) {
        log.info("Processing chapter read event for user: {}", userId);
        
        tieredAchievementService.updateProgress(userId.intValue(), "READ_CHAPTERS", 1);
    }

    @Transactional
    public void recalculateReadingProgress(Integer userId) {
        log.info("Recalculating reading progress for user: {}", userId);
        
        try {
            Integer chaptersRead = (int) readingHistoryRepository.countDistinctChaptersByUserId(userId.longValue());
            tieredAchievementService.setProgress(userId, "READ_CHAPTERS", chaptersRead);
            
            log.info("Updated reading progress for user {}: {} chapters", userId, chaptersRead);
        } catch (Exception e) {
            log.error("Error recalculating reading progress for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional
    public void initializeProgressForNewUser(Integer userId) {
        log.info("Initializing achievement progress for new user: {}", userId);
        
        try {
            // Initialize READ_CHAPTERS progress to 0
            tieredAchievementService.setProgress(userId, "READ_CHAPTERS", 0);
            
            log.info("Initialized achievement progress for user: {}", userId);
        } catch (Exception e) {
            log.error("Error initializing progress for user {}: {}", userId, e.getMessage());
        }
    }
}
