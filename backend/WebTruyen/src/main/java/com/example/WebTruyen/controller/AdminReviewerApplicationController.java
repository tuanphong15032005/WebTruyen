package com.example.WebTruyen.controller;

import com.example.WebTruyen.service.ReviewerApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviewer-applications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
public class AdminReviewerApplicationController {

    private final ReviewerApplicationService reviewerApplicationService;

    /**
     * Get all reviewer applications
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllApplications() {
        List<Map<String, Object>> applications = reviewerApplicationService.getAllApplications();
        return ResponseEntity.ok(applications);
    }

    /**
     * Get applications by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Map<String, Object>>> getApplicationsByStatus(@PathVariable String status) {
        List<Map<String, Object>> applications = reviewerApplicationService.getApplicationsByStatus(status);
        return ResponseEntity.ok(applications);
    }

    /**
     * Approve reviewer application
     */
    @PostMapping("/{userId}/approve")
    public ResponseEntity<Map<String, String>> approveApplication(@PathVariable Long userId) {
        reviewerApplicationService.approveApplication(userId);
        return ResponseEntity.ok(Map.of("message", "Đơn đăng ký reviewer đã được duyệt"));
    }

    /**
     * Reject reviewer application
     */
    @PostMapping("/{userId}/reject")
    public ResponseEntity<Map<String, String>> rejectApplication(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        
        String rejectionReason = request.get("rejectionReason");
        reviewerApplicationService.rejectApplication(userId, rejectionReason);
        return ResponseEntity.ok(Map.of("message", "Đơn đăng ký reviewer đã bị từ chối"));
    }

    /**
     * Get user details for reviewer application
     */
    @GetMapping("/{userId}/user-details")
    public ResponseEntity<Map<String, Object>> getUserDetailsForApplication(@PathVariable Long userId) {
        try {
            Map<String, Object> userDetails = reviewerApplicationService.getUserDetailsForApplication(userId);
            return ResponseEntity.ok(userDetails);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get application by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getApplicationById(@PathVariable Long id) {
        try {
            Map<String, Object> application = reviewerApplicationService.getApplicationById(id);
            if (application == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Application not found"));
            }
            return ResponseEntity.ok(application);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all user data for debugging
     */
    @GetMapping("/user/{userId}/all-data")
    public ResponseEntity<Map<String, Object>> getAllUserData(@PathVariable Long userId) {
        try {
            Map<String, Object> allData = reviewerApplicationService.getAllUserData(userId);
            return ResponseEntity.ok(allData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Search applications
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchApplications(@RequestParam String query) {
        try {
            List<Map<String, Object>> applications = reviewerApplicationService.searchApplications(query);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(List.of());
        }
    }
}
