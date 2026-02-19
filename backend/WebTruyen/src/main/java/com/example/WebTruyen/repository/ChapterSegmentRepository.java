package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChapterSegmentRepository extends JpaRepository<ChapterSegmentEntity, Long> {

    List<ChapterSegmentEntity> findByChapter_IdOrderBySeqAsc(Long chapterId);

    void deleteByChapter_Id(Long chapterId);

    @Query("""
            select cs.segmentText
            from ChapterSegmentEntity cs
            where cs.chapter.volume.story.id = :storyId
            order by cs.chapter.sequenceIndex asc, cs.seq asc
            """)
    List<String> findSegmentTextsByStoryId(@Param("storyId") Long storyId);

    @Query("""
            select cs.segmentText
            from ChapterSegmentEntity cs
            where cs.chapter.volume.story.id = :storyId
              and cs.chapter.status = :status
            order by cs.chapter.sequenceIndex asc, cs.seq asc
            """)
    List<String> findSegmentTextsByStoryIdAndChapterStatus(
            @Param("storyId") Long storyId,
            @Param("status") ChapterStatus status
    );
}
