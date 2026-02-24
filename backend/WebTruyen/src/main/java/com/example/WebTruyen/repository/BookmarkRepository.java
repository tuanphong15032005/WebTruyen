package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.BookmarkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<BookmarkEntity, Long> {

    List<BookmarkEntity> findByUser_IdAndChapter_IdOrderByCreatedAtDesc(Long userId, Long chapterId);

    Optional<BookmarkEntity> findByUser_IdAndChapter_IdAndSegment_Id(Long userId, Long chapterId, Long segmentId);

    Optional<BookmarkEntity> findByIdAndUser_Id(Long bookmarkId, Long userId);
}
