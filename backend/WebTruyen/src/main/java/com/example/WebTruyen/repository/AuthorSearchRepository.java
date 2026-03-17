package com.example.WebTruyen.repository;

// ===== WebTruyen Author Search Feature START =====
// Repository for author search functionality
// Provides JPQL queries for searching authors with aggregated statistics
// ===== WebTruyen Author Search Feature END =====

import com.example.WebTruyen.dto.response.AuthorSearchResponseDTO;
import com.example.WebTruyen.dto.response.AuthorSuggestionResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for author search functionality
 * Provides JPQL queries for searching authors with aggregated statistics
 */
@Repository
public interface AuthorSearchRepository extends JpaRepository<com.example.WebTruyen.entity.model.CoreIdentity.UserEntity, Long> {

    /**
     * Search authors by pen name or display name with aggregated statistics
     * @param keyword search keyword
     *param pageable pagination information
     * @return paginated results with author statistics
     */
    @Query(value = "SELECT u.id, u.author_pen_name, u.display_name, u.avatar_url, u.author_profile_bio, " +
           "COALESCE(story_counts.story_count, 0), COALESCE(story_counts.total_views, 0), " +
           "COALESCE(follow_counts.follower_count, 0), COALESCE(rating_avg.avg_rating, 0) " +
           "FROM users u " +
           "LEFT JOIN (" +
           "    SELECT s.author_id, COUNT(s.id) as story_count, SUM(s.view_count) as total_views " +
           "    FROM stories s " +
           "    GROUP BY s.author_id " +
           ") story_counts ON u.id = story_counts.author_id " +
           "LEFT JOIN (" +
           "    SELECT f.target_user_id, COUNT(f.id) as follower_count " +
           "    FROM follows_users f " +
           "    GROUP BY f.target_user_id " +
           ") follow_counts ON u.id = follow_counts.target_user_id " +
           "LEFT JOIN (" +
           "    SELECT s.author_id, AVG(sr.rating) as avg_rating " +
           "    FROM stories s " +
           "    LEFT JOIN story_reviews sr " +
           "        ON s.id = sr.story_id " +
           "        AND sr.rating IS NOT NULL " +
           "    GROUP BY s.author_id " +
           ") rating_avg ON u.id = rating_avg.author_id " +
           "WHERE EXISTS (SELECT 1 FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.code = 'AUTHOR') " +
           "AND (" +
           "LOWER(u.author_pen_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.display_name) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
           ") " +
           "ORDER BY follow_counts.follower_count DESC",
           countQuery = "SELECT COUNT(DISTINCT u.id) " +
           "FROM users u " +
           "WHERE EXISTS (SELECT 1 FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.code = 'AUTHOR') " +
           "AND (" +
           "LOWER(u.author_pen_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.display_name) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
           ")",
           nativeQuery = true)
    Page<Object[]> searchAuthorsWithStats(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Get author suggestions for autocomplete dropdown
     * @param keyword search keyword
     * @param limit maximum number of results
     * @return list of author suggestions
     */
    @Query(value = "SELECT u.id, u.author_pen_name, u.display_name, u.avatar_url, " +
           "COALESCE(follower_count, 0) " +
           "FROM users u " +
           "LEFT JOIN (" +
           "    SELECT f.target_user_id, COUNT(f.id) as follower_count " +
           "    FROM follows_users f " +
           "    GROUP BY f.target_user_id" +
           ") follow_counts ON u.id = follow_counts.target_user_id " +
           "WHERE EXISTS (SELECT 1 FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.code = 'AUTHOR') " +
           "AND (" +
           "LOWER(u.author_pen_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.display_name) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
           ") " +
           "ORDER BY follower_count DESC, u.author_pen_name ASC " +
           "LIMIT :limit",
           nativeQuery = true)
    List<Object[]> getAuthorSuggestions(@Param("keyword") String keyword, @Param("limit") int limit);

    /**
     * Get all authors with statistics for browsing
     * @param keyword search keyword (can be null)
     * @param limit maximum number of results
     * @return list of authors with statistics
     */
    @Query(value = "SELECT u.id, u.author_pen_name, u.display_name, u.avatar_url, u.author_profile_bio, " +
           "COALESCE(story_counts.story_count, 0), COALESCE(story_counts.total_views, 0), " +
           "COALESCE(follow_counts.follower_count, 0), COALESCE(rating_avg.avg_rating, 0) " +
           "FROM users u " +
           "LEFT JOIN (" +
           "    SELECT s.author_id, COUNT(s.id) as story_count, SUM(s.view_count) as total_views " +
           "    FROM stories s " +
           "    GROUP BY s.author_id " +
           ") story_counts ON u.id = story_counts.author_id " +
           "LEFT JOIN (" +
           "    SELECT f.target_user_id, COUNT(f.id) as follower_count " +
           "    FROM follows_users f " +
           "    GROUP BY f.target_user_id " +
           ") follow_counts ON u.id = follow_counts.target_user_id " +
           "LEFT JOIN (" +
           "    SELECT s.author_id, AVG(sr.rating) as avg_rating " +
           "    FROM stories s " +
           "    LEFT JOIN story_reviews sr ON s.id = sr.story_id AND sr.rating IS NOT NULL " +
           "    GROUP BY s.author_id " +
           ") rating_avg ON u.id = rating_avg.author_id " +
           "WHERE EXISTS (SELECT 1 FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.code = 'AUTHOR') " +
           "AND (" +
           "   :keyword IS NULL " +
           "   OR LOWER(u.author_pen_name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(u.display_name) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
           ") " +
           "ORDER BY COALESCE(follow_counts.follower_count, 0) DESC, u.author_pen_name ASC " +
           "LIMIT :limit",
           nativeQuery = true)
    List<Object[]> getAllAuthorsWithStats(@Param("keyword") String keyword, @Param("limit") int limit);
}
