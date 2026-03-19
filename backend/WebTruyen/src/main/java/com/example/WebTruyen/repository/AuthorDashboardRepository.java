package com.example.WebTruyen.repository;

import com.example.WebTruyen.dto.response.DashboardCommentDTO;
import com.example.WebTruyen.dto.response.StoryDashboardDTO;
import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * AuthorDashboardRepository
 * Custom repository for author dashboard data aggregation
 * Contains JPQL queries for dashboard metrics and statistics
 */
@Repository
public interface AuthorDashboardRepository extends JpaRepository<StoryEntity, Long> {

    /**
     * Count total chapters across all stories by author
     * Count from chapters table where volume.story.author.id = authorId
     */
    @Query("SELECT COUNT(c) FROM ChapterEntity c WHERE c.volume.story.author.id = :authorId")
    Long getTotalChaptersByAuthor(@Param("authorId") Long authorId);

    /**
     * Count total comments across all author's stories
     * Count from comments table where story.author.id = authorId
     */
    @Query("SELECT COUNT(c) FROM CommentEntity c WHERE c.story.author.id = :authorId")
    Long getTotalCommentsByAuthor(@Param("authorId") Long authorId);

    /**
     * Count total stories by author
     * Count from stories table where author.id = authorId
     */
    @Query("SELECT COUNT(s) FROM StoryEntity s WHERE s.author.id = :authorId")
    Long getTotalStoriesByAuthor(@Param("authorId") Long authorId);

    /**
     * Get latest 3 stories by author
     * Returns story details for dashboard display
     */
    @Query("SELECT s FROM StoryEntity s WHERE s.author.id = :authorId ORDER BY s.createdAt DESC")
    List<StoryEntity> getLatestStoriesByAuthor(@Param("authorId") Long authorId);

    /**
     * Get latest 3 comments on author's stories
     * Returns comment details for dashboard display
     */
    @Query("SELECT c FROM CommentEntity c WHERE c.story.author.id = :authorId ORDER BY c.createdAt DESC")
    List<CommentEntity> getLatestCommentsByAuthor(@Param("authorId") Long authorId);

    /**
     * Count total chapters by author for yesterday
     * Count from chapters table where volume.story.author.id = authorId 
     * and chapter created yesterday
     */
    @Query(value = "SELECT COUNT(*) FROM chapters c " +
           "JOIN volumes v ON c.volume_id = v.id " +
           "JOIN stories s ON v.story_id = s.id " +
           "WHERE s.author_id = :authorId " +
           "AND DATE(c.created_at) = DATE(CURRENT_DATE - INTERVAL 1 DAY)", 
           nativeQuery = true)
    Long getTotalChaptersByAuthorYesterday(@Param("authorId") Long authorId);

    /**
     * Count total comments by author for yesterday
     * Count from comments table where story.author.id = authorId 
     * and comment created yesterday
     */
    @Query(value = "SELECT COUNT(*) FROM comments c " +
           "JOIN stories s ON c.story_id = s.id " +
           "WHERE s.author_id = :authorId " +
           "AND DATE(c.created_at) = DATE(CURRENT_DATE - INTERVAL 1 DAY)", 
           nativeQuery = true)
    Long getTotalCommentsByAuthorYesterday(@Param("authorId") Long authorId);

    /**
     * Count total stories by author for yesterday
     * Count from stories table where author.id = authorId 
     * and story created yesterday
     */
    @Query(value = "SELECT COUNT(*) FROM stories s " +
           "WHERE s.author_id = :authorId " +
           "AND DATE(s.created_at) = DATE(CURRENT_DATE - INTERVAL 1 DAY)", 
           nativeQuery = true)
    Long getTotalStoriesByAuthorYesterday(@Param("authorId") Long authorId);
}
