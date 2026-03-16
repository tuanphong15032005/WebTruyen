package com.example.WebTruyen.config;

import com.example.WebTruyen.service.SimpleDailyTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@EnableScheduling
@Slf4j
public class DailyMissionScheduler implements ApplicationRunner {

    @Autowired
    private SimpleDailyTaskService simpleDailyTaskService;

    /**
     * Run on application startup to ensure today's missions exist
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Application started - checking daily missions for today: {}", LocalDate.now());
        ensureTodayMissionsExist();
    }

    /**
     * Run every day at 00:01 to create new daily missions
     */
    @Scheduled(cron = "0 1 0 * * ?")
    public void createDailyMissions() {
        log.info("Scheduled task running - creating daily missions for: {}", LocalDate.now());
        ensureTodayMissionsExist();
    }

    /**
     * Ensure missions exist for today
     */
    private void ensureTodayMissionsExist() {
        try {
            LocalDate today = LocalDate.now();
            log.info("Ensuring daily missions exist for date: {}", today);
            
            // This will trigger mission creation if they don't exist
            boolean loginAvailable = simpleDailyTaskService.isMissionAvailable("DAILY_LOGIN");
            boolean readChaptersAvailable = simpleDailyTaskService.isMissionAvailable("READ_CHAPTERS");
            boolean unlockChapterAvailable = simpleDailyTaskService.isMissionAvailable("UNLOCK_CHAPTER");
            boolean commentAvailable = simpleDailyTaskService.isMissionAvailable("MAKE_COMMENTS");
            boolean donateAvailable = simpleDailyTaskService.isMissionAvailable("MAKE_DONATION");
            boolean topupAvailable = simpleDailyTaskService.isMissionAvailable("MAKE_TOPUP");
            
            log.info("Daily missions availability check - LOGIN: {}, READ: {}, UNLOCK: {}, COMMENT: {}, DONATE: {}, TOPUP: {}", 
                    loginAvailable, readChaptersAvailable, unlockChapterAvailable, commentAvailable, donateAvailable, topupAvailable);
            
            if (loginAvailable && readChaptersAvailable && unlockChapterAvailable && 
                commentAvailable && donateAvailable && topupAvailable) {
                log.info("All daily missions are available for today: {}", today);
            } else {
                log.warn("Some missions may not be available for today: {}", today);
            }
        } catch (Exception e) {
            log.error("Error ensuring daily missions exist", e);
        }
    }
}
