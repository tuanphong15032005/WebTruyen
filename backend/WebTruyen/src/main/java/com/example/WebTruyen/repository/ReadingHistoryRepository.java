package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistoryEntity, ReadingHistoryId> {
    long countByStory_Id(Long storyId);
    Optional<ReadingHistoryEntity> findById_UserIdAndId_StoryId(Long userId, Long storyId);
    
    @Query("SELECT COUNT(rh) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    long countDistinctChaptersByUserId(Long userId);
    
    boolean existsById_UserId(Long userId);
}
