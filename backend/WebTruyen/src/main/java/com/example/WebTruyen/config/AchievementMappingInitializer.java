package com.example.WebTruyen.config;

import com.example.WebTruyen.service.AchievementCodeMappingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AchievementMappingInitializer implements ApplicationRunner {

    private final AchievementCodeMappingService achievementCodeMappingService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Initializing achievement code mappings on application startup");
        try {
            achievementCodeMappingService.initializeAchievementMapping();
            log.info("Achievement code mappings initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize achievement code mappings: {}", e.getMessage(), e);
        }
    }
}
