package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.ChapterUnlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChapterUnlockRepository extends JpaRepository<ChapterUnlockEntity, Long> {

    @Query("""
            select coalesce(sum(cu.coinCost), 0)
            from ChapterUnlockEntity cu
            where cu.chapter.volume.story.id = :storyId
            """)
    Long sumCoinCostByStoryId(@Param("storyId") Long storyId);

    @Query("""
            select function('date', cu.createdAt), count(cu), coalesce(sum(cu.coinCost), 0)
            from ChapterUnlockEntity cu
            where cu.chapter.volume.story.id = :storyId
            group by function('date', cu.createdAt)
            order by function('date', cu.createdAt)
            """)
    List<Object[]> aggregateDailyByStoryId(@Param("storyId") Long storyId);

    @Query("""
            select cu.chapter.id, count(cu), coalesce(sum(cu.coinCost), 0)
            from ChapterUnlockEntity cu
            where cu.chapter.volume.story.id = :storyId
            group by cu.chapter.id
            """)
    List<Object[]> aggregateByChapterForStory(@Param("storyId") Long storyId);
}
