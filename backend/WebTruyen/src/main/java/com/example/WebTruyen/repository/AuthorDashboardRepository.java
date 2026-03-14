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
     * Calculate total views across all stories by author
     * Sum of view_count from stories table
     */
    @Query("SELECT COALESCE(SUM(s.viewCount), 0) FROM StoryEntity s WHERE s.author.id = :authorId")
    Long getTotalViewsByAuthor(@Param("authorId") Long authorId);

    /**
     * Count total followers for an author
     * Count from follows_users table where target_user_id = authorId
     */
    @Query("SELECT COUNT(f) FROM FollowUserEntity f WHERE f.targetUser.id = :authorId")
    Long getFollowersCountByAuthor(@Param("authorId") Long authorId);

    /**
     * Calculate total revenue from successful payment orders
     * Sum of amount_vnd from payment_orders where status = PAID and user is the author's followers
     */
    @Query("SELECT COALESCE(SUM(po.amountVnd), 0) FROM PaymentOrderEntity po WHERE po.user.id IN " +
           "(SELECT f.user.id FROM FollowUserEntity f WHERE f.targetUser.id = :authorId) " +
           "AND po.status = :status")
    Long getRevenueByAuthor(@Param("authorId") Long authorId, @Param("status") PaymentOrderStatus status);

    /**
     * Calculate unpaid revenue from pending payment orders
     * Sum of amount_vnd from payment_orders where status != PAID and user is the author's followers
     */
    @Query("SELECT COALESCE(SUM(po.amountVnd), 0) FROM PaymentOrderEntity po WHERE po.user.id IN " +
           "(SELECT f.user.id FROM FollowUserEntity f WHERE f.targetUser.id = :authorId) " +
           "AND po.status != :status")
    Long getUnpaidRevenueByAuthor(@Param("authorId") Long authorId, @Param("status") PaymentOrderStatus status);

    /**
     * Count total comments on author's stories
     * Count from comments table where story_id belongs to author
     */
    @Query("SELECT COUNT(c) FROM CommentEntity c WHERE c.story.author.id = :authorId")
    Long getCommentsCountByAuthor(@Param("authorId") Long authorId);

    /**
     * Count pending comments on author's stories
     * Count from comments table where story belongs to author and is_hidden = true
     */
    @Query("SELECT COUNT(c) FROM CommentEntity c WHERE c.story.author.id = :authorId AND c.isHidden = true")
    Long getPendingCommentsCountByAuthor(@Param("authorId") Long authorId);

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
}
