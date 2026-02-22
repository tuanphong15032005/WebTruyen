package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
//<<<<<<< HEAD
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId);
    List<CommentEntity> findByChapter_IdAndParentCommentIsNullOrderByCreatedAtDesc(Long chapterId);

    Page<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId, Pageable pageable);

    Page<CommentEntity> findByStory_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Integer storyId, Pageable pageable);
    List<CommentEntity> findByStory_IdAndParentCommentIsNullOrderByCreatedAtDesc(Integer storyId);

    List<CommentEntity> findByRootComment_IdInAndParentCommentIsNotNullAndIsHiddenFalseOrderByCreatedAtAsc(List<Long> rootCommentIds);
    List<CommentEntity> findByRootComment_IdInAndParentCommentIsNotNullOrderByCreatedAtAsc(List<Long> rootCommentIds);

    Optional<CommentEntity> findByIdAndChapter_IdAndIsHiddenFalse(Long id, Long chapterId);

    Optional<CommentEntity> findByIdAndStory_IdAndIsHiddenFalse(Long id, Integer storyId);
    
    List<CommentEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT c FROM CommentEntity c
            LEFT JOIN c.chapter chapter
            LEFT JOIN chapter.volume volume
            LEFT JOIN volume.story chapterStory
            LEFT JOIN c.story story
            WHERE c.id = :commentId
              AND (
                    (chapterStory IS NOT NULL AND chapterStory.author.id = :authorId)
                 OR (story IS NOT NULL AND story.author.id = :authorId)
              )
            """)
    Optional<CommentEntity> findAuthorOwnedCommentById(
            @Param("commentId") Long commentId,
            @Param("authorId") Long authorId
    );

    /** Direct replies (children) of a comment, for cascade delete. */
    List<CommentEntity> findByParentComment_Id(Long parentCommentId);
}
