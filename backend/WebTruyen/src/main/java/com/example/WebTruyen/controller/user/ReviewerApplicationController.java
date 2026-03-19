package com.example.WebTruyen.controller.user;

import com.example.WebTruyen.service.ReviewerApplicationService;
import com.example.WebTruyen.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerApplicationController {

    private final ReviewerApplicationService reviewerApplicationService;

    /**
     * Check eligibility for reviewer application
     */
    @GetMapping("/check-eligibility/{userId}")
    public ResponseEntity<Map<String, Object>> checkEligibility(@PathVariable Long userId) {
        Map<String, Object> response = reviewerApplicationService.checkEligibility(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit reviewer application
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> submitApplication(
            @RequestBody Map<String, String> applicationData,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        Long userId = currentUser.getUser().getId();
        
        Map<String, Object> response = reviewerApplicationService.submitApplication(userId, applicationData);
        return ResponseEntity.ok(response);
    }

    /**
     * Get application status for current user
     */
    @GetMapping("/application-status/{userId}")
    public ResponseEntity<Map<String, Object>> getApplicationStatus(@PathVariable Long userId) {
        Map<String, Object> response = reviewerApplicationService.getApplicationStatus(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Check reviewer status for current user
     */
    @GetMapping("/status")
    public ResponseEntity<?> checkReviewerStatus(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = ((UserPrincipal) userDetails).getUser().getId();
            Map<String, Object> response = reviewerApplicationService.checkReviewerStatus(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
