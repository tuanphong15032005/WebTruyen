package com.example.WebTruyen.service.user;

import com.example.WebTruyen.dto.response.UserPortfolioResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
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

        // 6. Merge bio logic
        String bio = resolveBio(user, isAuthor);

        // 7. Build response
        return UserPortfolioResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .authorPenName(user.getAuthorPenName())  // Added for ISSUE 2
                .joinDate(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE))
                .bio(bio)
                .author(isAuthor)
                .storiesCount(storiesCount)
                .followersCount(followersCount)
                .commentsCount(commentsCount)
                .build();
    }

    public Long countStories(Long userId) {
        return storyRepository.countByAuthor_Id(userId);
    }

    public Long countFollowers(Long userId) {
        return followUserRepository.countByTargetUserId(userId);
    }

    public Long countCommentsInUserStories(Long userId) {
        return commentRepository.countCommentsInUserStories(userId);
    }

    public boolean isAuthor(UserEntity user) {
        // Check if user has author pen name
        if (user.getAuthorPenName() != null && !user.getAuthorPenName().trim().isEmpty()) {
            return true;
        }
        
        // Check if user has any stories (user.id appears in stories.author_id)
        Long storiesCount = storyRepository.countByAuthor_Id(user.getId());
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
        List<StoryEntity> stories = storyRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        
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
}
