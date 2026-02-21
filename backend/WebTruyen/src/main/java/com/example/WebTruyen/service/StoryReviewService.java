package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.UpsertStoryReviewRequest;
import com.example.WebTruyen.dto.response.PagedResponse;
import com.example.WebTruyen.dto.response.StoryReviewResponse;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.Content.StoryReviewEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.StoryReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryReviewService {

    private final StoryRepository storyRepository;
    private final StoryReviewRepository storyReviewRepository;

    @Transactional(readOnly = true)
    public PagedResponse<StoryReviewResponse> listPublishedStoryReviews(Integer storyId, Integer page, Integer size) {
        StoryEntity story = requirePublishedStory(storyId);
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        Page<StoryReviewEntity> dataPage = storyReviewRepository.findByStory_IdOrderByCreatedAtDesc(
                story.getId(),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<StoryReviewResponse> items = dataPage
                .stream()
                .map(this::toResponse)
                .toList();

        return new PagedResponse<>(
                items,
                safePage,
                safeSize,
                dataPage.getTotalElements(),
                dataPage.getTotalPages(),
                dataPage.hasNext()
        );
    }

    @Transactional
    public StoryReviewResponse createReview(UserEntity currentUser, Integer storyId, UpsertStoryReviewRequest req) {
        StoryEntity story = requirePublishedStory(storyId);
        validateRequest(req);

        boolean existed = storyReviewRepository
                .findByUser_IdAndStory_Id(currentUser.getId(), story.getId())
                .isPresent();
        if (existed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this story");
        }

        StoryReviewEntity review = StoryReviewEntity.builder()
                .story(story)
                .user(currentUser)
                .anonymous(false)
                .build();

        review.setRating(req.rating());
        review.setTitle(normalizeText(req.title(), 255));
        review.setContent(normalizeText(req.content(), null));

        StoryReviewEntity saved = storyReviewRepository.save(review);
        recalculateStoryRating(story);
        return toResponse(saved);
    }

    private StoryEntity requirePublishedStory(Integer storyId) {
        StoryEntity story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
        if (story.getStatus() != StoryStatus.published) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story is not public");
        }
        return story;
    }

    private void validateRequest(UpsertStoryReviewRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid review payload");
        }
        if (req.rating() == null || req.rating() < 1 || req.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }
        if (req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review content is required");
        }
    }

    private void recalculateStoryRating(StoryEntity story) {
        List<StoryReviewEntity> allReviews = storyReviewRepository.findByStory_Id(story.getId());
        long ratingSum = allReviews.stream()
                .map(StoryReviewEntity::getRating)
                .filter(java.util.Objects::nonNull)
                .mapToLong(Integer::longValue)
                .sum();
        int ratingCount = allReviews.size();
        story.setRatingSum(ratingSum);
        story.setRatingCount(ratingCount);
        if (ratingCount == 0) {
            story.setRatingAvg(null);
            return;
        }
        story.setRatingAvg(
                BigDecimal.valueOf(ratingSum)
                        .divide(BigDecimal.valueOf(ratingCount), 2, RoundingMode.HALF_UP)
        );
    }

    private StoryReviewResponse toResponse(StoryReviewEntity review) {
        UserEntity user = review.getUser();
        String username = user != null ? user.getUsername() : "Ẩn danh";
        if (review.isAnonymous()) {
            username = "Ẩn danh";
        }
        return new StoryReviewResponse(
                review.getId(),
                user != null ? user.getId() : null,
                username,
                user != null ? user.getAvatarUrl() : null,
                review.getRating(),
                review.getTitle(),
                review.getContent(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

    private String normalizeText(String value, Integer maxLength) {
        if (value == null) {
            return null;
        }
        String text = value.trim();
        if (text.isEmpty()) {
            return null;
        }
        if (maxLength != null && text.length() > maxLength) {
            return text.substring(0, maxLength);
        }
        return text;
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private int normalizeSize(Integer size) {
        if (size == null || size <= 0) {
            return 8;
        }
        return Math.min(size, 50);
    }
}
