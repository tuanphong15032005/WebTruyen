package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId);

    Page<CommentEntity> findByChapter_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Long chapterId, Pageable pageable);

    Page<CommentEntity> findByStory_IdAndParentCommentIsNullAndIsHiddenFalseOrderByCreatedAtDesc(Integer storyId, Pageable pageable);

    List<CommentEntity> findByRootComment_IdInAndParentCommentIsNotNullAndIsHiddenFalseOrderByCreatedAtAsc(List<Long> rootCommentIds);

    Optional<CommentEntity> findByIdAndChapter_IdAndIsHiddenFalse(Long id, Long chapterId);

    Optional<CommentEntity> findByIdAndStory_IdAndIsHiddenFalse(Long id, Integer storyId);
}
