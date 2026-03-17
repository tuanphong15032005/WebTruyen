package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AuthorRankingItemResponse;
import com.example.WebTruyen.dto.response.StoryResponse;
import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.repository.StoryRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicRankingService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final FollowUserRepository followUserRepository;
    private final StoryService storyService;

    /**
     * Xếp hạng tác giả theo số lượt theo dõi (followers) giảm dần.
     */
    public List<AuthorRankingItemResponse> getAuthorRankingByFollowers(int limit) {
        List<Long> authorIds = storyRepository.findDistinctAuthorIdsByStatus(StoryStatus.published);
        if (authorIds == null || authorIds.isEmpty()) {
            return List.of();
        }

        List<AuthorRankingItemResponse> items = new ArrayList<>();
        for (Long authorId : authorIds) {
            long followersCount = followUserRepository.countByTargetUserId(authorId);
            items.add(AuthorRankingItemResponse.builder()
                    .userId(authorId)
                    .followersCount(followersCount)
                    .build());
        }
        items.sort((a, b) -> Long.compare(
                b.getFollowersCount() != null ? b.getFollowersCount() : 0L,
                a.getFollowersCount() != null ? a.getFollowersCount() : 0L
        ));
        items = items.stream().limit(limit).toList();

        List<Long> topAuthorIds = items.stream()
                .map(AuthorRankingItemResponse::getUserId)
                .toList();
        Map<Long, UserEntity> userMap = userRepository.findAllById(topAuthorIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        List<AuthorRankingItemResponse> result = new ArrayList<>();
        int rank = 1;
        for (AuthorRankingItemResponse item : items) {
            UserEntity user = userMap.get(item.getUserId());
            result.add(AuthorRankingItemResponse.builder()
                    .userId(item.getUserId())
                    .displayName(user != null ? user.getDisplayName() : null)
                    .authorPenName(user != null ? user.getAuthorPenName() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .followersCount(item.getFollowersCount())
                    .rank(rank++)
                    .build());
        }
        return result;
    }

    /**
     * Top truyện xếp theo lượt theo dõi (số lưu vào thư viện).
     */
    public List<StoryResponse> getTopStoriesByFollowCount(int limit) {
        List<Integer> storyIds = storyRepository.findTopPublishedStoryIdsOrderByLibraryCount(
                PageRequest.of(0, limit));
        if (storyIds == null || storyIds.isEmpty()) {
            return List.of();
        }
        List<StoryEntity> stories = storyRepository.findAllById(storyIds);
        Map<Long, Integer> orderMap = new java.util.HashMap<>();
        for (int i = 0; i < storyIds.size(); i++) {
            orderMap.put(storyIds.get(i).longValue(), i);
        }
        stories.sort((a, b) -> {
            int orderA = orderMap.getOrDefault(a.getId(), Integer.MAX_VALUE);
            int orderB = orderMap.getOrDefault(b.getId(), Integer.MAX_VALUE);
            return Integer.compare(orderA, orderB);
        });
        return stories.stream()
                .map(s -> storyService.toStoryResponse(s, true))
                .toList();
    }
}
