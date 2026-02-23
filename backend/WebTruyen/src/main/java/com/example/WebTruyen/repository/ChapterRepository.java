package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.ChapterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<ChapterEntity, Long> {
    /**
     * Lấy chapter theo id và kiểm tra thuộc volumeId.
     * Dùng để đảm bảo endpoint /volumes/{volumeId}/chapters/{chapterId}
     */
    Optional<ChapterEntity> findByIdAndVolume_Id(Long id, Long volumeId);

    Optional<ChapterEntity> findByIdAndVolume_Story_Id(Long id, Long storyId);

    /**
     * Lấy danh sách chapter theo volume, sắp xếp theo sequenceIndex
     */
    List<ChapterEntity> findByVolume_IdOrderBySequenceIndexAsc(Long volumeId);

    /**
     * Kiểm tra tồn tại chapter cùng sequenceIndex trong volume (tránh trùng thứ tự)
     */
    boolean existsByVolume_IdAndSequenceIndex(Long volumeId, Integer sequenceIndex);

    @Query("select coalesce(max(c.sequenceIndex), 0) from ChapterEntity c where c.volume.id = :volumeId")
    Integer findMaxSequenceIndexByVolumeId(@Param("volumeId") Long volumeId);

    @Query("select max(c.lastUpdateAt) from ChapterEntity c where c.volume.story.id = :storyId")
    LocalDateTime findLatestUpdateAtByStoryId(@Param("storyId") Long storyId);

    // Muc dich: Lay chuong moi nhat cua tap moi nhat cho sidebar metadata. Hieuson + 10h30
    Optional<ChapterEntity> findTopByVolume_Story_IdAndStatusOrderByVolume_SequenceIndexDescSequenceIndexDesc(
            Long storyId,
            ChapterStatus status
    );

    // Muc dich: Dem tong so chuong cong khai cua mot truyen (hien thi "Cung tac gia"). Hieuson + 10h30
    long countByVolume_Story_IdAndStatus(Long storyId, ChapterStatus status);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.id = :storyId ORDER BY c.sequenceIndex")
    List<ChapterEntity> findByStoryId(@Param("storyId") Long storyId);

    @Query("SELECT c FROM ChapterEntity c WHERE c.status = :status AND c.createdAt <= :now")
    List<ChapterEntity> findScheduledChaptersToPublish(@Param("status") ChapterStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.author.id = :authorId ORDER BY c.lastUpdateAt DESC")
    List<ChapterEntity> findByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.story.author.id = :authorId AND c.status = :status ORDER BY c.lastUpdateAt DESC")
    List<ChapterEntity> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") ChapterStatus status);


    boolean existsByVolumeIdAndSequenceIndex(Long volumeId, Integer sequenceIndex);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.id = :volumeId AND c.sequenceIndex > :currentSequenceIndex ORDER BY c.sequenceIndex ASC")
    List<ChapterEntity> findNextChapters(@Param("volumeId") Long volumeId, @Param("currentSequenceIndex") Integer currentSequenceIndex);

    @Query("SELECT c FROM ChapterEntity c WHERE c.volume.id = :volumeId AND c.sequenceIndex < :currentSequenceIndex ORDER BY c.sequenceIndex DESC")
    List<ChapterEntity> findPreviousChapters(@Param("volumeId") Long volumeId, @Param("currentSequenceIndex") Integer currentSequenceIndex);
}


