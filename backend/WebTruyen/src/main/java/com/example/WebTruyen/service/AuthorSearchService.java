package com.example.WebTruyen.service;

// ===== WebTruyen Author Search Feature START =====
// Service for author search functionality
// Handles business logic for searching authors with statistics
// ===== WebTruyen Author Search Feature END =====

import com.example.WebTruyen.dto.response.AuthorSearchResponseDTO;
import com.example.WebTruyen.dto.response.AuthorSuggestionResponseDTO;
import com.example.WebTruyen.dto.response.PageAuthorSearchResponseDTO;
import com.example.WebTruyen.repository.AuthorSearchRepository;
import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.FollowUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Service for author search functionality
 * Handles business logic for searching authors with statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthorSearchService {

    private final AuthorSearchRepository authorSearchRepository;
    private final FollowUserRepository followUserRepository;

    /**
     * Search authors by keyword with pagination and sorting
     * @param keyword search keyword (pen name or display name)
     * @param page page number (0-based)
     * @param size page size
     * @param sort sort field (followers, stories, views)
     * @return paginated search results
     */
    public PageAuthorSearchResponseDTO searchAuthors(String keyword, int page, int size, String sort) {
        log.info("Searching authors with keyword: {}, page: {}, size: {}, sort: {}", keyword, page, size, sort);
        
        // Validate parameters
        validateSearchParams(keyword, page, size);
        
        // Create pageable without sorting (we'll handle sorting in Java)
        Pageable pageable = PageRequest.of(page, size);
        
        // Search authors
        List<Object[]> resultList;
        if (keyword == null || keyword.trim().isEmpty()) {
            resultList = authorSearchRepository.getAllAuthorsWithStats("", 100); // Get more results for pagination
        } else {
            Page<Object[]> resultPage = authorSearchRepository.searchAuthorsWithStats(keyword.trim(), pageable);
            resultList = resultPage.getContent();
        }
        
        // Convert Object[] to DTO
        List<AuthorSearchResponseDTO> authorDTOs = resultList.stream()
                .map(this::convertToAuthorSearchDTO)
                .collect(java.util.stream.Collectors.toList());
        
        // Apply sorting in Java (since we can't sort at DB level with simplified query)
        authorDTOs = sortAuthors(authorDTOs, sort);
        
        // Apply pagination in Java
        int startIndex = page * size;
        
        log.info("Total authors found: {}, StartIndex: {}, Size: {}", authorDTOs.size(), startIndex, size);
        
        // Check if startIndex is out of bounds to prevent IndexOutOfBoundsException
        if (startIndex >= authorDTOs.size()) {
            return PageAuthorSearchResponseDTO.builder()
                    .content(List.of())
                    .page(page)
                    .size(size)
                    .totalElements((long) authorDTOs.size())
                    .totalPages((int) Math.ceil((double) authorDTOs.size() / size))
                    .first(page == 0)
                    .last(true)
                    .empty(true)
                    .build();
        }
        
        int endIndex = Math.min(startIndex + size, authorDTOs.size());
        List<AuthorSearchResponseDTO> paginatedAuthors = authorDTOs.subList(startIndex, endIndex);
        
        // Convert to response DTO
        return PageAuthorSearchResponseDTO.builder()
                .content(paginatedAuthors)
                .page(page)
                .size(size)
                .totalElements((long) authorDTOs.size())
                .totalPages((int) Math.ceil((double) authorDTOs.size() / size))
                .first(page == 0)
                .last(endIndex >= authorDTOs.size())
                .empty(paginatedAuthors.isEmpty())
                .build();
    }

    /**
     * Get author suggestions for autocomplete dropdown
     * @param keyword search keyword
     * @param limit maximum number of suggestions
     * @return list of author suggestions
     */
    public List<AuthorSuggestionResponseDTO> getAuthorSuggestions(String keyword, int limit) {
        log.info("Getting author suggestions with keyword: {}, limit: {}", keyword, limit);
        
        // Validate parameters
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        
        if (limit < 1 || limit > 20) {
            limit = 5; // Default to 5 if invalid
        }
        
        List<Object[]> suggestions = 
            authorSearchRepository.getAuthorSuggestions(keyword.trim(), limit);
        
        // Convert Object[] to DTO
        List<AuthorSuggestionResponseDTO> suggestionDTOs = suggestions.stream()
                .map(this::convertToAuthorSuggestionDTO)
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} author suggestions", suggestionDTOs.size());
        return suggestionDTOs;
    }

    /**
     * Sort authors in Java based on the sort parameter
     * @param authors list of authors to sort
     * @param sort sort field
     * @return sorted list of authors
     */
    private List<AuthorSearchResponseDTO> sortAuthors(List<AuthorSearchResponseDTO> authors, String sort) {
        if (authors == null || authors.isEmpty()) {
            return authors;
        }
        
        String sortField = determineSortField(sort);
        
        switch (sortField) {
            case "followers":
                return authors.stream()
                        .sorted((a, b) -> Long.compare(b.getFollowers(), a.getFollowers()))
                        .collect(java.util.stream.Collectors.toList());
            case "stories":
                return authors.stream()
                        .sorted((a, b) -> Long.compare(b.getTotalStories(), a.getTotalStories()))
                        .collect(java.util.stream.Collectors.toList());
            case "views":
                return authors.stream()
                        .sorted((a, b) -> Long.compare(b.getTotalViews(), a.getTotalViews()))
                        .collect(java.util.stream.Collectors.toList());
            default:
                // Default sort by pen name
                return authors.stream()
                        .sorted((a, b) -> {
                            String nameA = a.getPenName() != null ? a.getPenName().toLowerCase() : "";
                            String nameB = b.getPenName() != null ? b.getPenName().toLowerCase() : "";
                            return nameA.compareTo(nameB);
                        })
                        .collect(java.util.stream.Collectors.toList());
        }
    }

    /**
     * Determine the appropriate sort field based on input
     * @param sort input sort parameter
     * @return valid sort field for sorting
     */
    private String determineSortField(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return "penName";
        }
        
        switch (sort.toLowerCase().trim()) {
            case "followers":
                return "followers";
            case "totalstories":
                return "stories";
            case "totalviews":
                return "views";
            default:
                return "penName";
        }
    }

    /**
     * Convert Object[] to AuthorSearchResponseDTO
     * @param row database row result
     * @return AuthorSearchResponseDTO
     */
    private AuthorSearchResponseDTO convertToAuthorSearchDTO(Object[] row) {
        Long totalStories = row[5] != null ? ((Number) row[5]).longValue() : 0L;
        Long totalViews = row[6] != null ? ((Number) row[6]).longValue() : 0L;
        Long followers = row[7] != null ? ((Number) row[7]).longValue() : 0L;
        Double ratingDouble = row[8] != null ? ((Number) row[8]).doubleValue() : null;
        java.math.BigDecimal rating = ratingDouble != null ? java.math.BigDecimal.valueOf(ratingDouble) : null;
        
        return AuthorSearchResponseDTO.builder()
                .authorId(row[0] != null ? ((Number) row[0]).longValue() : null)
                .penName((String) row[1])
                .displayName((String) row[2])
                .avatarUrl((String) row[3])
                .bio((String) row[4])
                .totalStories(totalStories)
                .totalViews(totalViews)
                .followers(followers)
                .rating(rating)
                .storyCount(totalStories.intValue())
                .viewCount(totalViews)
                .followerCount(followers.intValue())
                .build();
    }

    /**
     * Convert Object[] to AuthorSuggestionResponseDTO
     * @param row database row result
     * @return AuthorSuggestionResponseDTO
     */
    private AuthorSuggestionResponseDTO convertToAuthorSuggestionDTO(Object[] row) {
        Long followers = row[4] != null ? ((Number) row[4]).longValue() : 0L;
        
        return AuthorSuggestionResponseDTO.builder()
                .authorId(row[0] != null ? ((Number) row[0]).longValue() : null)
                .penName((String) row[1])
                .displayName((String) row[2])
                .avatarUrl((String) row[3])
                .followers(followers)
                .primaryGenre(null) // Simplified for now
                .build();
    }

    /**
     * Follow an author
     * @param authorId author ID to follow
     * @return follow response
     */
    @Transactional
    public Map<String, Object> followAuthor(Long authorId) {
        log.info("Following author with ID: {}", authorId);
        
        try {
            // TODO: Get current user from security context
            // For now, using a mock user ID (you need to replace this with actual authentication)
            Long currentUserId = getCurrentUserId();
            // Temporarily disable authentication check for testing
            if (currentUserId == null) {
                log.warn("Current user ID is null, using fallback for testing");
                currentUserId = 1L; // Fallback for testing
            }
            
            // Prevent self-follow (temporarily disabled for testing)
            // if (currentUserId.equals(authorId)) {
            //     return Map.of(
            //         "success", false,
            //         "message", "Cannot follow yourself",
            //         "authorId", authorId
            //     );
            // }
            
            // Check if already following
            Optional<FollowUserEntity> existingFollow = followUserRepository
                .findByUser_IdAndTargetUser_Id(currentUserId, authorId);
            
            if (existingFollow.isPresent()) {
                return Map.of(
                    "success", false,
                    "message", "Already following this author",
                    "authorId", authorId
                );
            }
            
            // Create new follow relationship using native query
            followUserRepository.insertFollow(currentUserId, authorId);
            
            log.info("User {} successfully followed author {}", currentUserId, authorId);
            
            return Map.of(
                "success", true,
                "message", "Successfully followed author",
                "authorId", authorId,
                "isFollowing", true
            );
            
        } catch (Exception e) {
            log.error("Error following author {}: {}", authorId, e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to follow author: " + e.getMessage(),
                "authorId", authorId
            );
        }
    }

    /**
     * Unfollow an author
     * @param authorId author ID to unfollow
     * @return unfollow response
     */
    @Transactional
    public Map<String, Object> unfollowAuthor(Long authorId) {
        log.info("Unfollowing author with ID: {}", authorId);
        
        try {
            // TODO: Get current user from security context
            // For now, using a mock user ID (you need to replace this with actual authentication)
            Long currentUserId = getCurrentUserId();
            // Temporarily disable authentication check for testing
            if (currentUserId == null) {
                log.warn("Current user ID is null, using fallback for testing");
                currentUserId = 1L; // Fallback for testing
            }
            
            // Prevent self-unfollow (temporarily disabled for testing)
            // if (currentUserId.equals(authorId)) {
            //     return Map.of(
            //         "success", false,
            //         "message", "Cannot unfollow yourself",
            //         "authorId", authorId
            //     );
            // }
            
            // Find existing follow relationship
            Optional<FollowUserEntity> existingFollow = followUserRepository
                .findByUser_IdAndTargetUser_Id(currentUserId, authorId);
            
            if (existingFollow.isEmpty()) {
                return Map.of(
                    "success", false,
                    "message", "Not following this author",
                    "authorId", authorId
                );
            }
            
            // Delete follow relationship using native query
            followUserRepository.deleteFollow(currentUserId, authorId);
            
            log.info("User {} successfully unfollowed author {}", currentUserId, authorId);
            
            return Map.of(
                "success", true,
                "message", "Successfully unfollowed author",
                "authorId", authorId,
                "isFollowing", false
            );
            
        } catch (Exception e) {
            log.error("Error unfollowing author {}: {}", authorId, e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to unfollow author: " + e.getMessage(),
                "authorId", authorId
            );
        }
    }

    /**
     * Check if current user is following an author
     * @param authorId author ID to check
     * @return follow status
     */
    public Map<String, Object> getFollowStatus(Long authorId) {
        log.info("Checking follow status for author: {}", authorId);
        
        try {
            Long currentUserId = getCurrentUserId();
            // Temporarily disable authentication check for testing
            if (currentUserId == null) {
                log.warn("Current user ID is null, using fallback for testing");
                currentUserId = 1L; // Fallback for testing
            }
            
            // Check if following
            Optional<FollowUserEntity> existingFollow = followUserRepository
                .findByUser_IdAndTargetUser_Id(currentUserId, authorId);
            
            boolean isFollowing = existingFollow.isPresent();
            
            return Map.of(
                "success", true,
                "authorId", authorId,
                "isFollowing", isFollowing
            );
            
        } catch (Exception e) {
            log.error("Error checking follow status for author {}: {}", authorId, e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to check follow status: " + e.getMessage(),
                "authorId", authorId,
                "isFollowing", false
            );
        }
    }

    /**
     * Get current user ID from security context
     * @return current user ID or null if not authenticated
     */
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();
                
                // If principal is a UserPrincipal (from JWT filter)
                if (principal.getClass().getSimpleName().equals("UserPrincipal")) {
                    try {
                        // Use reflection to get user from UserPrincipal
                        java.lang.reflect.Method getUserMethod = principal.getClass().getMethod("getUser");
                        Object userEntity = getUserMethod.invoke(principal);
                        if (userEntity instanceof com.example.WebTruyen.entity.model.CoreIdentity.UserEntity) {
                            return ((com.example.WebTruyen.entity.model.CoreIdentity.UserEntity) userEntity).getId();
                        }
                    } catch (Exception e) {
                        log.error("Error getting user from UserPrincipal: {}", e.getMessage());
                    }
                }
                
                // If principal is a User entity or has getId method
                if (principal instanceof com.example.WebTruyen.entity.model.CoreIdentity.UserEntity) {
                    return ((com.example.WebTruyen.entity.model.CoreIdentity.UserEntity) principal).getId();
                }
                
                // If principal is a String (username), try to parse as ID
                if (principal instanceof String) {
                    String username = (String) principal;
                    try {
                        return Long.parseLong(username);
                    } catch (NumberFormatException e) {
                        log.warn("Username is not numeric: {}", username);
                        return null;
                    }
                }
                
                // Try to get user ID from authentication name
                if (authentication.getName() != null && !authentication.getName().equals("anonymousUser")) {
                    try {
                        return Long.parseLong(authentication.getName());
                    } catch (NumberFormatException e) {
                        log.warn("Authentication name is not numeric: {}", authentication.getName());
                        return null;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting current user ID from security context: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Validate search parameters
     * @param keyword search keyword
     * @param page page number
     * @param size page size
     */
    private void validateSearchParams(String keyword, int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        
        if (keyword != null && keyword.length() > 100) {
            throw new IllegalArgumentException("Search keyword cannot exceed 100 characters");
        }
    }
}
