package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.DashboardCommentDTO;
import com.example.WebTruyen.dto.response.DashboardSummaryResponse;
import com.example.WebTruyen.dto.response.StoryDashboardDTO;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CommentAndMod.CommentEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.repository.AuthorDashboardRepository;
import com.example.WebTruyen.repository.ChapterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AuthorDashboardService
 * Handles business logic for author dashboard metrics and statistics
 * Aggregates data from multiple sources to provide comprehensive dashboard insights
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthorDashboardService {

    private final AuthorDashboardRepository authorDashboardRepository;
    private final ChapterRepository chapterRepository;

    /**
     * Get dashboard summary statistics for an author
     * Calculates total chapters, total comments, total stories and growth percentages
     * 
     * @param authorId The ID of the author
     * @return DashboardSummaryResponse containing all summary metrics with growth
     */
    public DashboardSummaryResponse getDashboardSummary(Long authorId) {
        log.debug("Fetching dashboard summary for author: {}", authorId);

        // Calculate current metrics from database
        Long totalChapters = authorDashboardRepository.getTotalChaptersByAuthor(authorId);
        Long totalComments = authorDashboardRepository.getTotalCommentsByAuthor(authorId);
        Long totalStories = authorDashboardRepository.getTotalStoriesByAuthor(authorId);

        // Calculate yesterday's metrics from database
        Long yesterdayChapters = authorDashboardRepository.getTotalChaptersByAuthorYesterday(authorId);
        Long yesterdayComments = authorDashboardRepository.getTotalCommentsByAuthorYesterday(authorId);
        Long yesterdayStories = authorDashboardRepository.getTotalStoriesByAuthorYesterday(authorId);

        log.debug("Raw metrics - chapters: {}, comments: {}, stories: {}", 
                 totalChapters, totalComments, totalStories);
        log.debug("Yesterday metrics - chapters: {}, comments: {}, stories: {}", 
                 yesterdayChapters, yesterdayComments, yesterdayStories);

        // Calculate growth percentages using Day over Day formula
        Double chaptersGrowth = calculateGrowthPercentage(totalChapters, yesterdayChapters);
        Double commentsGrowth = calculateGrowthPercentage(totalComments, yesterdayComments);
        Double storiesGrowth = calculateGrowthPercentage(totalStories, yesterdayStories);

        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .totalChapters(totalChapters != null ? totalChapters : 0L)
                .totalComments(totalComments != null ? totalComments : 0L)
                .totalStories(totalStories != null ? totalStories : 0L)
                .chaptersGrowth(chaptersGrowth)
                .commentsGrowth(commentsGrowth)
                .storiesGrowth(storiesGrowth)
                .build();
        
        log.debug("Dashboard summary response: {}", response);
        return response;
    }

    /**
     * Calculate growth percentage using Day over Day formula
     * Formula: ((currentValue - yesterdayValue) / yesterdayValue) * 100
     * 
     * @param currentValue Current value
     * @param yesterdayValue Yesterday's value
     * @return Growth percentage as Double, or 0.0 if yesterdayValue is 0
     */
    private Double calculateGrowthPercentage(Long currentValue, Long yesterdayValue) {
        if (yesterdayValue == null || yesterdayValue == 0) {
            // If yesterday's value is 0, return 100% if there's growth today, 0% otherwise
            return (currentValue != null && currentValue > 0) ? 100.0 : 0.0;
        }
        
        if (currentValue == null) {
            currentValue = 0L;
        }
        
        double growth = ((double) (currentValue - yesterdayValue) / yesterdayValue) * 100;
        // Round to 1 decimal place
        return Math.round(growth * 10.0) / 10.0;
    }

    /**
     * Get latest stories for the author's dashboard
     * Returns the 3 most recently updated stories
     * 
     * @param authorId The ID of the author
     * @return List of StoryDashboardDTO with latest stories
     */
    public List<StoryDashboardDTO> getLatestStories(Long authorId) {
        log.debug("Fetching latest stories for author: {}", authorId);
        
        List<StoryEntity> stories = authorDashboardRepository.getLatestStoriesByAuthor(authorId);
        
        // Map entities to DTOs and calculate chapter count for each story
        return stories.stream()
                .limit(3)
                .map(story -> {
                    // Calculate actual chapter count
                    List<ChapterEntity> chapters = chapterRepository.findByStoryId(story.getId());
                    int chapterCount = chapters != null ? chapters.size() : 0;
                    
                    return StoryDashboardDTO.builder()
                            .storyId(story.getId())
                            .title(story.getTitle())
                            .coverUrl(story.getCoverUrl())
                            .status(story.getStatus() != null ? story.getStatus().name() : null)
                            .chapterCount(chapterCount)
                            .updatedAt(story.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Get latest comments on author's stories
     * Returns the 3 most recent comments across all author's stories
     * 
     * @param authorId The ID of the author
     * @return List of DashboardCommentDTO with latest comments
     */
    public List<DashboardCommentDTO> getLatestComments(Long authorId) {
        log.debug("Fetching latest comments for author: {}", authorId);
        
        List<CommentEntity> comments = authorDashboardRepository.getLatestCommentsByAuthor(authorId);
        
        // Map entities to DTOs
        return comments.stream()
                .limit(3)
                .map(comment -> DashboardCommentDTO.builder()
                        .commentId(comment.getId())
                        .username(comment.getUser() != null ? comment.getUser().getUsername() : "Unknown")
                        .avatar(comment.getUser() != null ? comment.getUser().getAvatarUrl() : null)
                        .content(comment.getContent())
                        .storyTitle(comment.getStory() != null ? comment.getStory().getTitle() : "Unknown Story")
                        .createdAt(comment.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
