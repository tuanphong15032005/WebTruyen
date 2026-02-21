package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.ChapterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<ChapterEntity, Long> {

    @Query("SELECT COALESCE(MAX(c.sequenceIndex), 0) FROM ChapterEntity c WHERE c.volume.id = :volumeId")
    Integer findMaxSequenceIndexByVolume(@Param("volumeId") Long volumeId);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.id = :storyId ORDER BY c.sequenceIndex")
    List<ChapterEntity> findByStoryId(@Param("storyId") Long storyId);

    @Query("SELECT c FROM ChapterEntity c WHERE c.status = :status AND c.createdAt <= :now")
    List<ChapterEntity> findScheduledChaptersToPublish(@Param("status") ChapterStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.author.id = :authorId ORDER BY c.lastUpdateAt DESC")
    List<ChapterEntity> findByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.author.id = :authorId AND c.status = :status ORDER BY c.lastUpdateAt DESC")
    List<ChapterEntity> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") ChapterStatus status);

    boolean existsByVolumeIdAndSequenceIndex(Long volumeId, Integer sequenceIndex);
}
