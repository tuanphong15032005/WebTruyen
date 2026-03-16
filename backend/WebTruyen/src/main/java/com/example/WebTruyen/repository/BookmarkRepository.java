package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.BookmarkEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<BookmarkEntity, Long> {

    List<BookmarkEntity> findByUser_IdAndChapter_IdOrderByCreatedAtDesc(Long userId, Long chapterId);

    Optional<BookmarkEntity> findByUser_IdAndChapter_IdAndSegment_Id(Long userId, Long chapterId, Long segmentId);

    Optional<BookmarkEntity> findByIdAndUser_Id(Long bookmarkId, Long userId);


    @Query("SELECT s.id as storyId, s.title as title, s.coverUrl as coverImage, " +
           "COUNT(b.id) as bookmarkCount, MAX(b.createdAt) as lastBookmark " +
           "FROM BookmarkEntity b " +
           "JOIN b.chapter c " +
           "JOIN c.volume v " +
           "JOIN v.story s " +
           "WHERE b.user.id = :userId AND b.isFavorite = true " +
           "GROUP BY s.id, s.title, s.coverUrl " +
           "ORDER BY MAX(b.createdAt) DESC")
    List<Object[]> findBookmarkStories(@Param("userId") Long userId);

    @Query("SELECT b.id, b.chapter.id, b.segment.id, b.positionPercent, b.createdAt, b.chapter.title, b.segment.segmentText, s.title " +
           "FROM BookmarkEntity b " +
           "JOIN b.chapter c " +
           "JOIN c.volume v " +
           "JOIN v.story s " +
           "WHERE b.user.id = :userId AND s.id = :storyId AND b.isFavorite = true " +
           "ORDER BY b.createdAt DESC")
    List<Object[]> findBookmarkStoryDetails(@Param("userId") Long userId, @Param("storyId") Long storyId);

    @Modifying
    @Query("delete from BookmarkEntity b where b.chapter.id = :chapterId")
    int deleteAllByChapterId(@Param("chapterId") Long chapterId);

}
