package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistoryEntity, ReadingHistoryId> {
    long countByStory_Id(Long storyId);
    Optional<ReadingHistoryEntity> findById_UserIdAndId_StoryId(Long userId, Long storyId);
    
    @Query("SELECT COUNT(rh) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    long countDistinctChaptersByUserId(Long userId);
    
    @Query("SELECT COUNT(rh) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    long countById_UserId(@Param("userId") Long userId);

    @Modifying
    @Query("""
            update ReadingHistoryEntity rh
            set rh.lastSegment = null
            where rh.lastChapter.id = :chapterId
              and rh.lastSegment is not null
            """)
    int clearLastSegmentByLastChapterId(@Param("chapterId") Long chapterId);

    boolean existsById_UserId(Long userId);
}
