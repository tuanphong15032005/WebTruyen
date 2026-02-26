package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AuthorFollowStatusResponse;
import com.example.WebTruyen.dto.response.AuthorPublicProfileResponse;
import com.example.WebTruyen.dto.response.AuthorPublicStoryItemResponse;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthorPublicProfileService {
    // Minhdq - 26/02/2026
    // [Add public-author-profile-follow-service - V1 - branch: clone-minhfinal2]
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final FollowUserRepository followUserRepository;

    @Transactional
    public AuthorPublicProfileResponse getPublicProfile(Long authorId, UserEntity currentUser) {
        if (authorId == null || authorId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid author id");
        }

        UserEntity author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

        List<StoryEntity> publishedStories = storyRepository
                .findByAuthor_IdOrderByCreatedAtDesc(authorId)
                .stream()
                .filter(story -> story.getStatus() == StoryStatus.published)
                .toList();

        List<AuthorPublicStoryItemResponse> stories = publishedStories.stream()
                .map(this::toStoryItem)
                .toList();

        long totalViews = publishedStories.stream()
                .mapToLong(StoryEntity::getViewCount)
                .sum();

        long totalFollowers = followUserRepository.countByTargetUser_Id(authorId);
        boolean followed = currentUser != null
                && currentUser.getId() != null
                && followUserRepository.existsByUser_IdAndTargetUser_Id(currentUser.getId(), authorId);

        return new AuthorPublicProfileResponse(
                author.getId(),
                author.getAvatarUrl(),
                resolvePenName(author),
                author.getAuthorProfileBio(),
                totalViews,
                totalFollowers,
                followed,
                stories
        );
    }

    @Transactional
    public AuthorFollowStatusResponse toggleFollow(Long authorId, UserEntity currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (authorId == null || authorId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid author id");
        }
        if (authorId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
        }

        UserEntity targetAuthor = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

        boolean followed = followUserRepository
                .findByUser_IdAndTargetUser_Id(currentUser.getId(), authorId)
                .map(existing -> {
                    followUserRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    FollowUserEntity follow = FollowUserEntity.builder()
                            .user(currentUser)
                            .targetUser(targetAuthor)
                            .createdAt(LocalDateTime.now())
                            .build();
                    followUserRepository.save(follow);
                    return true;
                });

        long totalFollowers = followUserRepository.countByTargetUser_Id(authorId);
        return new AuthorFollowStatusResponse(followed, totalFollowers);
    }

    private AuthorPublicStoryItemResponse toStoryItem(StoryEntity story) {
        Long storyId = story.getId();
        LocalDateTime lastUpdatedAt = chapterRepository.findLatestUpdateAtByStoryId(storyId);
        return new AuthorPublicStoryItemResponse(
                storyId,
                story.getTitle(),
                story.getCoverUrl(),
                story.getViewCount(),
                lastUpdatedAt
        );
    }

    private String resolvePenName(UserEntity author) {
        if (author.getAuthorPenName() != null && !author.getAuthorPenName().isBlank()) {
            return author.getAuthorPenName();
        }
        if (author.getDisplayName() != null && !author.getDisplayName().isBlank()) {
            return author.getDisplayName();
        }
        if (author.getUsername() != null && !author.getUsername().isBlank()) {
            return author.getUsername();
        }
        return "Tác giả";
    }
}
