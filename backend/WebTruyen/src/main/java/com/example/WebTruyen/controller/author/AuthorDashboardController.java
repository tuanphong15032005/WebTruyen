package com.example.WebTruyen.controller.author;

import com.example.WebTruyen.dto.response.DashboardCommentDTO;
import com.example.WebTruyen.dto.response.DashboardSummaryResponse;
import com.example.WebTruyen.dto.response.StoryDashboardDTO;
import com.example.WebTruyen.service.AuthorDashboardService;
import com.example.WebTruyen.service.UserService; // Add this import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AuthorDashboardController
 * REST controller for author dashboard endpoints
 * Provides thin controller layer that delegates to service layer
 */
@RestController
@RequestMapping("/api/author/dashboard")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
public class AuthorDashboardController {

    private final AuthorDashboardService authorDashboardService;
    private final UserService userService; // Add UserService dependency

    /**
     * Get dashboard summary statistics
     * Returns total views, followers, revenue, and comments metrics
     * 
     * @param userDetails Authenticated user details
     * @return DashboardSummaryResponse with summary statistics
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('AUTHOR')")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Extract author ID from authenticated user
        // In a real implementation, you would get this from the authenticated user
        Long authorId = extractAuthorId(userDetails);
        
        DashboardSummaryResponse summary = authorDashboardService.getDashboardSummary(authorId);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Get latest stories for the author
     * Returns the 3 most recently updated stories
     * 
     * @param userDetails Authenticated user details
     * @return List of StoryDashboardDTO with latest stories
     */
    @GetMapping("/stories")
    @PreAuthorize("hasRole('AUTHOR')")
    public ResponseEntity<List<StoryDashboardDTO>> getLatestStories(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.debug("Latest stories requested by user: {}", userDetails.getUsername());
        
        Long authorId = extractAuthorId(userDetails);
        
        List<StoryDashboardDTO> stories = authorDashboardService.getLatestStories(authorId);
        
        return ResponseEntity.ok(stories);
    }

    /**
     * Get latest comments on author's stories
     * Returns the 3 most recent comments across all author's stories
     * 
     * @param userDetails Authenticated user details
     * @return List of DashboardCommentDTO with latest comments
     */
    @GetMapping("/comments")
    @PreAuthorize("hasRole('AUTHOR')")
    public ResponseEntity<List<DashboardCommentDTO>> getLatestComments(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.debug("Latest comments requested by user: {}", userDetails.getUsername());
        
        Long authorId = extractAuthorId(userDetails);
        
        List<DashboardCommentDTO> comments = authorDashboardService.getLatestComments(authorId);
        
        return ResponseEntity.ok(comments);
    }

    /**
     * Extract author ID from authenticated user details
     * In a real implementation, you would parse the JWT token or user principal
     * to get the actual user ID
     * 
     * @param userDetails Authenticated user details
     * @return Author ID
     */
    private Long extractAuthorId(UserDetails userDetails) {
        // Extract real author ID from authenticated user
        try {
            // Get user by username from UserService
            var user = userService.findByUsername(userDetails.getUsername());
            if (user != null) {
                return user.getId();
            }
        } catch (Exception e) {
            log.error("Error finding user by username: {}", userDetails.getUsername(), e);
        }
        
        // Fallback - try to parse username as ID
        try {
            String username = userDetails.getUsername();
            if (username.matches("\\d+")) {
                return Long.parseLong(username);
            }
        } catch (Exception e) {
            log.debug("Could not parse username as ID: {}", userDetails.getUsername());
        }
        
        throw new RuntimeException("Could not extract author ID for user: " + userDetails.getUsername());
    }
}
