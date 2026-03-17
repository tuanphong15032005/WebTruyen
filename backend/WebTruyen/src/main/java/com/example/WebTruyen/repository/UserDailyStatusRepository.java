package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.UserDailyStatusEntity;
import com.example.WebTruyen.entity.keys.UserDailyStatusId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserDailyStatusRepository extends JpaRepository<UserDailyStatusEntity, UserDailyStatusId> {
    
    @Query("SELECT uds FROM UserDailyStatusEntity uds WHERE uds.id.userId = :userId AND uds.dailyMission.date = :date")
    List<UserDailyStatusEntity> findByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);
    
    @Query("SELECT uds FROM UserDailyStatusEntity uds WHERE uds.id.userId = :userId AND uds.id.dailyMissionId = :dailyMissionId")
    Optional<UserDailyStatusEntity> findByUserIdAndDailyMissionId(@Param("userId") Long userId, @Param("dailyMissionId") Long dailyMissionId);
    
    @Query("SELECT uds FROM UserDailyStatusEntity uds WHERE uds.id.userId = :userId AND uds.completedAt IS NOT NULL ORDER BY uds.completedAt DESC")
    List<UserDailyStatusEntity> findCompletedTasksByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(uds) FROM UserDailyStatusEntity uds WHERE uds.id.userId = :userId AND uds.dailyMission.date = :date AND uds.completedAt IS NOT NULL")
    Long countCompletedTasksByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);
    
    @Query("SELECT uds FROM UserDailyStatusEntity uds WHERE uds.id.userId = :userId AND uds.dailyMission.date = :date AND uds.completedAt IS NULL")
    List<UserDailyStatusEntity> findIncompleteTasksByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(DISTINCT uds.id.userId) FROM UserDailyStatusEntity uds WHERE uds.id.dailyMissionId = :dailyMissionId AND uds.completedAt IS NOT NULL")
    Long countDistinctUsersCompletedMission(@Param("dailyMissionId") Long dailyMissionId);
    
    @Query("SELECT COUNT(DISTINCT uds.id.userId) FROM UserDailyStatusEntity uds WHERE uds.dailyMission.date = :date")
    Long countDistinctUsersByDate(@Param("date") LocalDate date);
    
    @Query("SELECT dm.rewardCoin * COUNT(DISTINCT uds.id.userId) FROM DailyMissionEntity dm JOIN UserDailyStatusEntity uds ON dm.id = uds.id.dailyMissionId WHERE dm.id = :dailyMissionId AND uds.completedAt IS NOT NULL")
    Long calculateTotalCoinsDistributedForMission(@Param("dailyMissionId") Long dailyMissionId);
    
    @Query("SELECT COUNT(DISTINCT uds.id.userId) FROM UserDailyStatusEntity uds WHERE uds.id.dailyMissionId = :dailyMissionId")
    Long countUsersByMissionId(@Param("dailyMissionId") Long dailyMissionId);
    
    @Query("SELECT uds FROM UserDailyStatusEntity uds WHERE uds.id.dailyMissionId = :dailyMissionId")
    List<UserDailyStatusEntity> findByMissionId(@Param("dailyMissionId") Long dailyMissionId);
    
    @Modifying
    @Query(value = "INSERT INTO user_daily_status (user_id, daily_mission_id, progress) VALUES (:userId, :dailyMissionId, '{}')", nativeQuery = true)
    void insertUserDailyStatus(@Param("userId") Long userId, @Param("dailyMissionId") Long dailyMissionId);
    
    // Optimized batch queries for performance
    @Query("SELECT uds, dm FROM UserDailyStatusEntity uds JOIN uds.dailyMission dm WHERE uds.id.userId = :userId AND dm.date = :date")
    List<Object[]> findTodayStatusWithMissions(@Param("userId") Long userId, @Param("date") LocalDate date);
    
    @Query("SELECT DISTINCT uds.id.userId FROM UserDailyStatusEntity uds WHERE uds.dailyMission.date >= :startDate")
    List<Long> findActiveUsersSince(@Param("startDate") LocalDate startDate);
    
    @Modifying
    @Query("UPDATE UserDailyStatusEntity uds SET uds.completedAt = :now WHERE uds.id.userId = :userId")
    void updateUserActivityTime(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
