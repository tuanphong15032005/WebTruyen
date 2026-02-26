package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AuthorChapterPerformanceResponse;
import com.example.WebTruyen.dto.response.AuthorFollowerItemResponse;
import com.example.WebTruyen.dto.response.AuthorFollowerStatsResponse;
import com.example.WebTruyen.dto.response.AuthorPerformancePointResponse;
import com.example.WebTruyen.dto.response.AuthorStoryOptionResponse;
import com.example.WebTruyen.dto.response.AuthorStoryPerformanceResponse;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterUnlockRepository;
import com.example.WebTruyen.repository.FollowStoryRepository;
import com.example.WebTruyen.repository.FollowUserRepository;
import com.example.WebTruyen.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthorAnalyticsService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final FollowStoryRepository followStoryRepository;
    private final FollowUserRepository followUserRepository;
    private final ChapterUnlockRepository chapterUnlockRepository;

    @Transactional(readOnly = true)
    public List<AuthorStoryOptionResponse> listAuthorStories(Long authorId) {
        return storyRepository.findByAuthor_IdOrderByCreatedAtDesc(authorId).stream()
                .map(story -> new AuthorStoryOptionResponse(story.getId(), story.getTitle()))
                .toList();
    }

    @Transactional(readOnly = true)
    public AuthorStoryPerformanceResponse getStoryPerformance(Long authorId, Long storyId) {
        StoryEntity story = requireOwnedStory(authorId, storyId);

        long totalViews = story.getViewCount();
        long totalFollowers = followStoryRepository.countByStory_Id(story.getId());
        long totalCoinEarned = coalesceLong(chapterUnlockRepository.sumCoinCostByStoryId(story.getId()));

        List<AuthorPerformancePointResponse> viewsOverTime = chapterUnlockRepository.aggregateDailyByStoryId(story.getId())
                .stream()
                .map(row -> new AuthorPerformancePointResponse(
                        formatDate(row[0]),
                        coalesceLong(row[1])
                ))
                .toList();

        List<AuthorPerformancePointResponse> coinRevenueOverTime = chapterUnlockRepository.aggregateDailyByStoryId(story.getId())
                .stream()
                .map(row -> new AuthorPerformancePointResponse(
                        formatDate(row[0]),
                        coalesceLong(row[2])
                ))
                .toList();

        List<AuthorPerformancePointResponse> followerGrowthOverTime = toCumulativePoints(
                followStoryRepository.aggregateDailyFollowersByStoryId(story.getId())
        );

        Map<Long, Long> unlockCountByChapter = new HashMap<>();
        Map<Long, Long> coinByChapter = new HashMap<>();
        for (Object[] row : chapterUnlockRepository.aggregateByChapterForStory(story.getId())) {
            Long chapterId = coalesceLong(row[0]);
            unlockCountByChapter.put(chapterId, coalesceLong(row[1]));
            coinByChapter.put(chapterId, coalesceLong(row[2]));
        }

        List<AuthorChapterPerformanceResponse> chapterPerformance = chapterRepository.findByStoryId(story.getId())
                .stream()
                .map(chapter -> {
                    long unlockCount = unlockCountByChapter.getOrDefault(chapter.getId(), 0L);
                    long coinEarned = coinByChapter.getOrDefault(chapter.getId(), 0L);
                    return new AuthorChapterPerformanceResponse(
                            chapter.getId(),
                            chapter.getTitle(),
                            chapter.getSequenceIndex(),
                            chapter.getStatus() != null ? chapter.getStatus().name() : null,
                            unlockCount,
                            coinEarned,
                            unlockCount
                    );
                })
                .toList();

        return new AuthorStoryPerformanceResponse(
                story.getId(),
                story.getTitle(),
                totalViews,
                totalCoinEarned,
                totalFollowers,
                viewsOverTime,
                coinRevenueOverTime,
                followerGrowthOverTime,
                chapterPerformance
        );
    }

    @Transactional(readOnly = true)
    // Minhdq - 26/02/2026
    // [Add author-follower-list-service-logic - V1 - branch: clone-minhfinal2]
    public List<AuthorFollowerItemResponse> listAuthorFollowers(Long authorId) {
        return followUserRepository.findByTargetUser_IdOrderByCreatedAtDesc(authorId)
                .stream()
                .map(this::toFollowerItem)
                .toList();
    }

    @Transactional(readOnly = true)
    // Minhdq - 26/02/2026
    // [Add author-follower-growth-summary-service-logic - V1 - branch: clone-minhfinal2]
    public AuthorFollowerStatsResponse getAuthorFollowerStats(Long authorId) {
        long totalFollowers = followUserRepository.countByTargetUser_Id(authorId);
        long newFollowersLast7Days = followUserRepository.countNewFollowersSince(
                authorId,
                LocalDate.now().minusDays(6)
        );
        long newFollowersLast30Days = followUserRepository.countNewFollowersSince(
                authorId,
                LocalDate.now().minusDays(29)
        );

        List<AuthorPerformancePointResponse> growthPoints = followUserRepository
                .aggregateDailyFollowersByAuthorId(authorId)
                .stream()
                .map(row -> new AuthorPerformancePointResponse(
                        formatDate(row[0]),
                        coalesceLong(row[1])
                ))
                .toList();

        return new AuthorFollowerStatsResponse(
                totalFollowers,
                newFollowersLast7Days,
                newFollowersLast30Days,
                growthPoints
        );
    }

    private StoryEntity requireOwnedStory(Long authorId, Long storyId) {
        if (storyId == null || storyId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        int rawStoryId;
        try {
            rawStoryId = Math.toIntExact(storyId);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid story id");
        }
        return storyRepository.findByIdAndAuthorId(rawStoryId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found"));
    }

    private List<AuthorPerformancePointResponse> toCumulativePoints(List<Object[]> rows) {
        long running = 0L;
        java.util.ArrayList<AuthorPerformancePointResponse> points = new java.util.ArrayList<>();
        for (Object[] row : rows) {
            running += coalesceLong(row[1]);
            points.add(new AuthorPerformancePointResponse(formatDate(row[0]), running));
        }
        return points;
    }

    private AuthorFollowerItemResponse toFollowerItem(FollowUserEntity follow) {
        return new AuthorFollowerItemResponse(
                follow.getUser() != null ? follow.getUser().getId() : null,
                resolveFollowerName(follow),
                follow.getCreatedAt()
        );
    }

    private String resolveFollowerName(FollowUserEntity follow) {
        if (follow.getUser() == null) {
            return "Unknown";
        }
        String displayName = follow.getUser().getDisplayName();
        if (displayName != null && !displayName.isBlank()) {
            return displayName;
        }
        String username = follow.getUser().getUsername();
        if (username != null && !username.isBlank()) {
            return username;
        }
        return "Unknown";
    }

    private String formatDate(Object raw) {
        if (raw == null) {
            return "";
        }
        if (raw instanceof LocalDate localDate) {
            return localDate.toString();
        }
        return raw.toString();
    }

    private Long coalesceLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String raw) {
            try {
                return Long.valueOf(raw);
            } catch (NumberFormatException ex) {
                return 0L;
            }
        }
        return 0L;
    }
}
