package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import com.example.WebTruyen.repository.DailyMissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimpleDailyTaskServiceTest {

    @Mock
    private DailyMissionRepository dailyMissionRepository;

    @InjectMocks
    private SimpleDailyTaskService simpleDailyTaskService;

    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testDate = LocalDate.now();
    }

    @Test
    void createDailyMissionsForDate_WhenNoExistingMissions_ShouldCreateAll() {
        // Given
        when(dailyMissionRepository.findByDate(testDate)).thenReturn(Collections.emptyList());
        
        DailyMissionEntity template1 = createTemplate("TASK1", "Task 1", "5", 10L);
        DailyMissionEntity template2 = createTemplate("TASK2", "Task 2", "3", 15L);
        List<DailyMissionEntity> templates = Arrays.asList(template1, template2);
        
        when(dailyMissionRepository.findByDateIsNull()).thenReturn(templates);
        when(dailyMissionRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());

        // When
        simpleDailyTaskService.createDailyMissionsForDate(testDate);

        // Then
        verify(dailyMissionRepository).findByDate(testDate);
        verify(dailyMissionRepository).findByDateIsNull();
        verify(dailyMissionRepository).saveAll(argThat(missions -> {
            List<DailyMissionEntity> missionList = (List<DailyMissionEntity>) missions;
            return missionList.size() == 2 && 
                   missionList.stream().allMatch(m -> m.getDate().equals(testDate));
        }));
    }

    @Test
    void createDailyMissionsForDate_WhenSomeExistingMissions_ShouldCreateOnlyMissing() {
        // Given
        DailyMissionEntity existingMission = createMission("TASK1", "Task 1", "5", 10L, testDate);
        List<DailyMissionEntity> existingMissions = Arrays.asList(existingMission);
        when(dailyMissionRepository.findByDate(testDate)).thenReturn(existingMissions);
        
        DailyMissionEntity template1 = createTemplate("TASK1", "Task 1", "5", 10L);
        DailyMissionEntity template2 = createTemplate("TASK2", "Task 2", "3", 15L);
        DailyMissionEntity template3 = createTemplate("TASK3", "Task 3", "1", 20L);
        List<DailyMissionEntity> templates = Arrays.asList(template1, template2, template3);
        
        when(dailyMissionRepository.findByDateIsNull()).thenReturn(templates);
        when(dailyMissionRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());

        // When
        simpleDailyTaskService.createDailyMissionsForDate(testDate);

        // Then
        verify(dailyMissionRepository).findByDate(testDate);
        verify(dailyMissionRepository).findByDateIsNull();
        verify(dailyMissionRepository).saveAll(argThat(missions -> {
            List<DailyMissionEntity> missionList = (List<DailyMissionEntity>) missions;
            return missionList.size() == 2 && // Only TASK2 and TASK3 should be created
                   missionList.stream().noneMatch(m -> "TASK1".equals(m.getMissionCode())) &&
                   missionList.stream().allMatch(m -> m.getDate().equals(testDate));
        }));
    }

    @Test
    void createDailyMissionsForDate_WhenAllMissionsExist_ShouldNotCreateAny() {
        // Given
        DailyMissionEntity existing1 = createMission("TASK1", "Task 1", "5", 10L, testDate);
        DailyMissionEntity existing2 = createMission("TASK2", "Task 2", "3", 15L, testDate);
        List<DailyMissionEntity> existingMissions = Arrays.asList(existing1, existing2);
        when(dailyMissionRepository.findByDate(testDate)).thenReturn(existingMissions);
        
        DailyMissionEntity template1 = createTemplate("TASK1", "Task 1", "5", 10L);
        DailyMissionEntity template2 = createTemplate("TASK2", "Task 2", "3", 15L);
        List<DailyMissionEntity> templates = Arrays.asList(template1, template2);
        
        when(dailyMissionRepository.findByDateIsNull()).thenReturn(templates);

        // When
        simpleDailyTaskService.createDailyMissionsForDate(testDate);

        // Then
        verify(dailyMissionRepository).findByDate(testDate);
        verify(dailyMissionRepository).findByDateIsNull();
        verify(dailyMissionRepository, never()).saveAll(any(List.class));
    }

    private DailyMissionEntity createTemplate(String code, String description, String target, Long reward) {
        return DailyMissionEntity.builder()
                .missionCode(code)
                .description(description)
                .target(target)
                .rewardCoin(reward)
                .rewardCoinType(DailyMissionEntity.CoinType.A)
                .build();
    }

    private DailyMissionEntity createMission(String code, String description, String target, Long reward, LocalDate date) {
        return DailyMissionEntity.builder()
                .id(1)
                .date(date)
                .missionCode(code)
                .description(description)
                .target(target)
                .rewardCoin(reward)
                .rewardCoinType(DailyMissionEntity.CoinType.A)
                .build();
    }
}
