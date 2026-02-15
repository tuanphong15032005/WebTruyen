package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
    
    List<CommentEntity> findByChapterIdOrderByCreatedAtAsc(Long chapterId);
    
    List<CommentEntity> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);
    
    List<CommentEntity> findByRootCommentIdOrderByCreatedAtAsc(Long rootCommentId);
    
    List<CommentEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT c FROM CommentEntity c WHERE c.chapter.id = :chapterId AND c.parentComment IS NULL ORDER BY c.createdAt ASC")
    List<CommentEntity> findRootCommentsByChapterId(@Param("chapterId") Long chapterId);
    
    @Query("SELECT c FROM CommentEntity c WHERE c.isHidden = false ORDER BY c.createdAt DESC")
    List<CommentEntity> findVisibleComments();
}
