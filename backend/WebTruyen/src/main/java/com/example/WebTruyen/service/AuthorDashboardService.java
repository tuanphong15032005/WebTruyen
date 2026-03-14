package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.DashboardCommentDTO;
import com.example.WebTruyen.dto.response.DashboardSummaryResponse;
import com.example.WebTruyen.dto.response.StoryDashboardDTO;
import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
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
     * Calculates total views, followers, revenue, and comments
     * 
     * @param authorId The ID of the author
     * @return DashboardSummaryResponse containing all summary metrics
     */
    public DashboardSummaryResponse getDashboardSummary(Long authorId) {
        log.debug("Fetching dashboard summary for author: {}", authorId);

        // Calculate core metrics from database
        Long totalViews = authorDashboardRepository.getTotalViewsByAuthor(authorId);
        Long followers = authorDashboardRepository.getFollowersCountByAuthor(authorId);
        Long revenue = authorDashboardRepository.getRevenueByAuthor(authorId, PaymentOrderStatus.PAID);
        Long unpaidRevenue = authorDashboardRepository.getUnpaidRevenueByAuthor(authorId, PaymentOrderStatus.PAID);
        Long comments = authorDashboardRepository.getCommentsCountByAuthor(authorId);
        Long pendingComments = authorDashboardRepository.getPendingCommentsCountByAuthor(authorId);

        log.debug("Raw metrics - views: {}, followers: {}, revenue: {}, comments: {}", 
                 totalViews, followers, revenue, comments);

        // Calculate growth percentages (placeholder logic - in real implementation, 
        // you would compare with previous period data)
        Double viewsGrowth = calculateGrowthPercentage(totalViews, 0.1); // 10% sample growth
        Double followersGrowth = calculateGrowthPercentage(followers, 0.05); // 5% sample growth

        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .totalViews(totalViews != null ? totalViews : 0L)
                .viewsGrowth(viewsGrowth)
                .followers(followers != null ? followers : 0L)
                .followersGrowth(followersGrowth)
                .revenue(revenue != null ? revenue : 0L)
                .unpaidRevenue(unpaidRevenue != null ? unpaidRevenue : 0L)
                .comments(comments != null ? comments : 0L)
                .pendingComments(pendingComments != null ? pendingComments : 0L)
                .build();
        
        log.debug("Dashboard summary response: {}", response);
        return response;
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

    /**
     * Calculate growth percentage based on current value and growth rate
     * This is a simplified calculation - in production, you would compare
     * with actual historical data from previous period
     * 
     * @param currentValue The current metric value
     * @param growthRate Sample growth rate (e.g., 0.1 for 10%)
     * @return Calculated growth percentage
     */
    private Double calculateGrowthPercentage(Long currentValue, Double growthRate) {
        if (currentValue == null || currentValue == 0) {
            return 0.0;
        }
        
        // In real implementation, this would be:
        // ((currentValue - previousValue) / previousValue) * 100
        // For now, we'll use a sample calculation
        return currentValue * growthRate / 100.0;
    }
}
