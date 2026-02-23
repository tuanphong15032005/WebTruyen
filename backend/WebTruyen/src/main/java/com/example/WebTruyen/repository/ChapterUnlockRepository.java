package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.ChapterUnlockEntity;
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
}
