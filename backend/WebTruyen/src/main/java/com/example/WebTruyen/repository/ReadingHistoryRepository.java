package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistoryEntity, ReadingHistoryId> {
    
    @Query("SELECT rh FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId ORDER BY rh.id.storyId DESC")
    List<ReadingHistoryEntity> findByUserIdOrderByStoryIdDesc(@Param("userId") Long userId);

    @Query("SELECT rh FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId AND rh.id.storyId = :storyId")
    Optional<ReadingHistoryEntity> findByUserIdAndStoryId(@Param("userId") Long userId, @Param("storyId") Long storyId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId AND rh.id.storyId = :storyId")
    void deleteByUserIdAndStoryId(@Param("userId") Long userId, @Param("storyId") Long storyId);
    
    @Query("SELECT rh FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    List<ReadingHistoryEntity> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(rh) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId")
    long countByUserId(@Param("userId") Long userId);
    

    @Query("SELECT COUNT(DISTINCT rh.lastChapter.id) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId AND rh.lastChapter IS NOT NULL")
    long countDistinctChaptersByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(DISTINCT rh.lastChapter.id) FROM ReadingHistoryEntity rh WHERE rh.id.userId = :userId AND rh.id.storyId = :storyId AND rh.lastChapter IS NOT NULL")
    long countDistinctChaptersByUserIdAndStoryId(@Param("userId") Long userId, @Param("storyId") Long storyId);
    
    @Query("SELECT COUNT(c) FROM ChapterEntity c WHERE c.volume.story.id = :storyId")
    long countTotalChaptersByStoryId(@Param("storyId") Long storyId);

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
