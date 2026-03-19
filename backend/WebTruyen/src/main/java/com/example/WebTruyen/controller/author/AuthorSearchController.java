package com.example.WebTruyen.controller.author;

// ===== WebTruyen Author Search Feature START =====
// REST Controller for author search functionality
// Provides public endpoints for searching and discovering authors
// ===== WebTruyen Author Search Feature END =====

import com.example.WebTruyen.dto.response.AuthorSearchResponseDTO;
import com.example.WebTruyen.dto.response.AuthorSuggestionResponseDTO;
import com.example.WebTruyen.dto.response.PageAuthorSearchResponseDTO;
import com.example.WebTruyen.service.AuthorSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for author search functionality
 * Provides public endpoints for searching and discovering authors
 */
@RestController
@RequestMapping("/api/authors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AuthorSearchController {

    private final AuthorSearchService authorSearchService;

    /**
     * Search authors by keyword with pagination and sorting
     * Endpoint: GET /api/authors/search
     * 
     * @param keyword search keyword for pen name or display name
     * @param page page number (default: 0)
     * @param size page size (default: 12, max: 50)
     * @param sort sort field (followers, stories, views, rating)
     * @return paginated search results
     */
    @GetMapping("/search")
    public ResponseEntity<PageAuthorSearchResponseDTO> searchAuthors(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "followers") String sort) {
        
        log.info("Author search request - keyword: {}, page: {}, size: {}, sort: {}", 
                keyword, page, size, sort);
        
        PageAuthorSearchResponseDTO result = authorSearchService.searchAuthors(keyword, page, size, sort);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Get author suggestions for autocomplete dropdown
     * Endpoint: GET /api/authors/suggestions
     * 
     * @param keyword search keyword (required)
     * @param size maximum number of suggestions (default: 5, max: 20)
     * @return list of author suggestions
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<AuthorSuggestionResponseDTO>> getAuthorSuggestions(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "5") int size) {
        
        log.info("Author suggestions request - keyword: {}, size: {}", keyword, size);
        
        List<AuthorSuggestionResponseDTO> suggestions = authorSearchService.getAuthorSuggestions(keyword, size);
        
        return ResponseEntity.ok(suggestions);
    }

    /**
     * Get all authors with pagination (browse functionality)
     * Endpoint: GET /api/authors
     * 
     * @param page page number (default: 0)
     * @param size page size (default: 12, max: 50)
     * @param sort sort field (followers, stories, views, rating)
     * @return paginated list of all authors
     */
    @GetMapping
    public ResponseEntity<PageAuthorSearchResponseDTO> getAllAuthors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "followers") String sort) {
        
        log.info("Get all authors request - page: {}, size: {}, sort: {}", page, size, sort);
        
        // Empty keyword to get all authors
        PageAuthorSearchResponseDTO result = authorSearchService.searchAuthors(null, page, size, sort);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Follow an author
     * Endpoint: POST /api/authors/{id}/follow
     * 
     * @param authorId author ID to follow
     * @return follow response
     */
    @PostMapping("/{id}/follow")
    public ResponseEntity<Map<String, Object>> followAuthor(@PathVariable Long id) {
        log.info("Follow author request - authorId: {}", id);
        
        try {
            Map<String, Object> result = authorSearchService.followAuthor(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error following author: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to follow author",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Unfollow an author
     * Endpoint: DELETE /api/authors/{id}/follow
     * 
     * @param authorId author ID to unfollow
     * @return unfollow response
     */
    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Map<String, Object>> unfollowAuthor(@PathVariable Long id) {
        log.info("Unfollow author request - authorId: {}", id);
        
        try {
            Map<String, Object> result = authorSearchService.unfollowAuthor(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error unfollowing author: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to unfollow author",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Check if current user is following an author
     * Endpoint: GET /api/authors/{id}/follow-status
     * 
     * @param authorId author ID to check
     * @return follow status
     */
    @GetMapping("/{id}/follow-status")
    public ResponseEntity<Map<String, Object>> getFollowStatus(@PathVariable Long id) {
        log.info("Get follow status request - authorId: {}", id);
        
        try {
            Map<String, Object> result = authorSearchService.getFollowStatus(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting follow status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get follow status",
                "message", e.getMessage()
            ));
        }
    }
}
