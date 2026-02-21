package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.ChapterSegmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterSegmentRepository extends JpaRepository<ChapterSegmentEntity, Long> {

    @Query("SELECT cs FROM ChapterSegmentEntity cs WHERE cs.chapter.id = :chapterId ORDER BY cs.seq ASC")
    List<ChapterSegmentEntity> findByChapterIdOrderBySeq(@Param("chapterId") Long chapterId);

    @Query("SELECT cs FROM ChapterSegmentEntity cs WHERE cs.chapter.id = :chapterId AND cs.seq = :seq")
    ChapterSegmentEntity findByChapterIdAndSeq(@Param("chapterId") Long chapterId, @Param("seq") Integer seq);

    boolean existsByChapterIdAndSeq(Long chapterId, Integer seq);
}
