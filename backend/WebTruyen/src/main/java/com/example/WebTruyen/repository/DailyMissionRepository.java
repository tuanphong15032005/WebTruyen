package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Gamification.DailyMissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyMissionRepository extends JpaRepository<DailyMissionEntity, Integer> {
    
    List<DailyMissionEntity> findByDate(LocalDate date);
    
    Optional<DailyMissionEntity> findByDateAndMissionCode(LocalDate date, String missionCode);
    
    @Query("SELECT dm FROM DailyMissionEntity dm WHERE dm.date = :date ORDER BY dm.id")
    List<DailyMissionEntity> findMissionsByDateOrdered(@Param("date") LocalDate date);
    
    @Query("SELECT DISTINCT dm.date FROM DailyMissionEntity dm ORDER BY dm.date DESC")
    List<LocalDate> findAllDistinctDates();
}
