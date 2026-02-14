package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByChapterIdOrderByCreatedAtAsc(Long chapterId);

    List<CommentEntity> findByChapter_IdInOrderByCreatedAtAsc(List<Long> chapterIds);
}
