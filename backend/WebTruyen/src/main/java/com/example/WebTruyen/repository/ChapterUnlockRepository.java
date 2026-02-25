package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.ChapterUnlockEntity;
//<<<<<<< HEAD
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterUnlockRepository extends JpaRepository<ChapterUnlockEntity, Long> {
    
    Optional<ChapterUnlockEntity> findByUserAndChapter(UserEntity user, ChapterEntity chapter);
    
    @Query("SELECT cu.chapter FROM ChapterUnlockEntity cu WHERE cu.user.id = :userId")
    List<ChapterEntity> findUnlockedChaptersByUserId(@Param("userId") Long userId);
    
    boolean existsByUserIdAndChapterId(Long userId, Long chapterId);
    
    void deleteByUserIdAndChapterId(Long userId, Long chapterId);

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
//=======
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//
//import java.util.List;

//public interface ChapterUnlockRepository extends JpaRepository<ChapterUnlockEntity, Long> {
//
//    @Query("""
//            select coalesce(sum(cu.coinCost), 0)
//            from ChapterUnlockEntity cu
//            where cu.chapter.volume.story.id = :storyId
//            """)
//    Long sumCoinCostByStoryId(@Param("storyId") Long storyId);
//
//    @Query("""
//            select function('date', cu.createdAt), count(cu), coalesce(sum(cu.coinCost), 0)
//            from ChapterUnlockEntity cu
//            where cu.chapter.volume.story.id = :storyId
//            group by function('date', cu.createdAt)
//            order by function('date', cu.createdAt)
//            """)
//    List<Object[]> aggregateDailyByStoryId(@Param("storyId") Long storyId);
//
//    @Query("""
//            select cu.chapter.id, count(cu), coalesce(sum(cu.coinCost), 0)
//            from ChapterUnlockEntity cu
//            where cu.chapter.volume.story.id = :storyId
//            group by cu.chapter.id
//            """)
//    List<Object[]> aggregateByChapterForStory(@Param("storyId") Long storyId);
//>>>>>>> origin/minhfinal1
}
