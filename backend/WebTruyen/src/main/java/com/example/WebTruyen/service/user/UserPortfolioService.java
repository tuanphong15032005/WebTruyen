package com.example.WebTruyen.service.user;

import com.example.WebTruyen.dto.response.UserPortfolioResponse;
import com.example.WebTruyen.dto.response.FollowerResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserPortfolioService {

    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final CommentRepository commentRepository;
    private final FollowUserRepository followUserRepository;
    private final EntityManager entityManager;

    public UserPortfolioResponse getUserPortfolio(Long userId) {
        // 1. Load user
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Detect isAuthor
        boolean isAuthor = isAuthor(user);

        // 3. Load stories count
        Long storiesCount = countStories(userId);

        // 4. Count followers
        Long followersCount = countFollowers(userId);

        // 5. Count comments
        Long commentsCount = countCommentsInUserStories(userId);

        // 6. Calculate total views from stories
        Long totalViews = calculateTotalViews(userId);

        // 7. Merge bio logic
        String bio = resolveBio(user, isAuthor);

        // 8. Build response
        return UserPortfolioResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .authorPenName(user.getAuthorPenName())  // Added for ISSUE 2
                .joinDate(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE))
                .bio(bio)
                .author(isAuthor)
                .storiesCount(storiesCount)
                .followersCount(followersCount)
                .commentsCount(commentsCount)
                .totalViews(totalViews)  // Add this
                .build();
    }

    public Long countStories(Long userId) {
        return storyRepository.countByAuthor_IdAndStatus(userId, StoryStatus.published);
    }

    public Long countFollowers(Long userId) {
        return followUserRepository.countByTargetUserId(userId);
    }

    public Long countCommentsInUserStories(Long userId) {
        return commentRepository.countCommentsInUserStories(userId);
    }

    public Long calculateTotalViews(Long userId) {
        try {
            // Use native query to sum view_count from all published stories by this author
            Query query = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(s.view_count), 0) FROM stories s " +
                "WHERE s.author_id = ?1 AND s.status = 'PUBLISHED'"
            );
            query.setParameter(1, userId);
            Long totalViews = ((Number) query.getSingleResult()).longValue();
            return totalViews;
        } catch (Exception e) {
            // If query fails, return 0 as fallback
            System.err.println("Error calculating total views for user " + userId + ": " + e.getMessage());
            return 0L;
        }
    }

    public boolean isAuthor(UserEntity user) {
        // Check if user has author pen name
        if (user.getAuthorPenName() != null && !user.getAuthorPenName().trim().isEmpty()) {
            return true;
        }
        
        // Check if user has any published stories (user.id appears in stories.author_id with status = published)
        Long storiesCount = storyRepository.countByAuthor_IdAndStatus(user.getId(), StoryStatus.published);
        return storiesCount > 0;
    }

    public String resolveBio(UserEntity user, boolean isAuthor) {
        if (isAuthor && user.getAuthorProfileBio() != null && !user.getAuthorProfileBio().trim().isEmpty()) {
            return user.getAuthorProfileBio();
        }
        return user.getBio();
    }

    // ISSUE 3: Follow/Unfollow methods - Using EntityManager
    @Transactional
    public boolean toggleFollow(Long authorId, Long currentUserId) {
        if (authorId.equals(currentUserId)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        try {
            // Check if already following
            Query checkQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM follows_users WHERE user_id = ?1 AND target_user_id = ?2"
            );
            checkQuery.setParameter(1, currentUserId);
            checkQuery.setParameter(2, authorId);
            Long count = ((Number) checkQuery.getSingleResult()).longValue();
            
            if (count > 0) {
                // Unfollow
                Query deleteQuery = entityManager.createNativeQuery(
                    "DELETE FROM follows_users WHERE user_id = ?1 AND target_user_id = ?2"
                );
                deleteQuery.setParameter(1, currentUserId);
                deleteQuery.setParameter(2, authorId);
                deleteQuery.executeUpdate();
                return false;
            } else {
                // Follow
                Query insertQuery = entityManager.createNativeQuery(
                    "INSERT INTO follows_users (user_id, target_user_id, created_at) VALUES (?1, ?2, NOW())"
                );
                insertQuery.setParameter(1, currentUserId);
                insertQuery.setParameter(2, authorId);
                insertQuery.executeUpdate();
                return true;
            }
        } catch (Exception e) {
            throw new RuntimeException("Follow operation failed: " + e.getMessage());
        }
    }

    public boolean isFollowing(Long authorId, Long currentUserId) {
        try {
            Query query = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM follows_users WHERE user_id = ?1 AND target_user_id = ?2"
            );
            query.setParameter(1, currentUserId);
            query.setParameter(2, authorId);
            Long count = ((Number) query.getSingleResult()).longValue();
            return count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    // ISSUE 4: Get author stories
    public List<Map<String, Object>> getAuthorStories(Long userId) {
        List<StoryEntity> stories = storyRepository.findByAuthor_IdOrderByCreatedAtDesc(userId);
        
        return stories.stream()
                .map(story -> {
                    Map<String, Object> storyMap = new HashMap<>();
                    storyMap.put("storyId", story.getId());
                    storyMap.put("title", story.getTitle());
                    storyMap.put("coverUrl", story.getCoverUrl());
                    storyMap.put("status", story.getStatus());
                    storyMap.put("createdAt", story.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE));
                    return storyMap;
                })
                .collect(Collectors.toList());
    }

    // Get followers list with user details
    public List<FollowerResponse> getFollowersList(Long userId) {
        try {
            List<Object[]> results = followUserRepository.findFollowersWithDetails(userId);
            return results.stream()
                    .map(FollowerResponse::from)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch followers list: " + e.getMessage());
        }
    }
}
