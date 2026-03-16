package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.AdminAuthorApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/author-applications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminAuthorApplicationController {

    @Autowired
    private AdminAuthorApplicationService adminAuthorApplicationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllApplications() {
        try {
            List<Map<String, Object>> applications = adminAuthorApplicationService.getAllApplications();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getApplicationsByStatus(@PathVariable String status) {
        try {
            List<Map<String, Object>> applications = adminAuthorApplicationService.getApplicationsByStatus(status);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(@PathVariable Long id) {
        try {
            Map<String, Object> application = adminAuthorApplicationService.getApplicationById(id);
            if (application == null) {
                return ResponseEntity.badRequest().body("Application not found");
            }
            return ResponseEntity.ok(application);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserEntity admin = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            
            adminAuthorApplicationService.approveApplication(id, admin.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Application approved successfully");
            response.put("status", "approved");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectApplication(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String rejectionReason = request.get("rejectionReason");
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Rejection reason is required");
            }

            UserEntity admin = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            
            adminAuthorApplicationService.rejectApplication(id, rejectionReason, admin.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Application rejected successfully");
            response.put("status", "rejected");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getApplicationStats() {
        try {
            Map<String, Long> stats = adminAuthorApplicationService.getApplicationStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<?> getApplicationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<Map<String, Object>> applications = adminAuthorApplicationService.getApplicationsByDateRange(startDate, endDate);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/user-details")
    public ResponseEntity<?> getUserDetailsForApplication(@PathVariable Long id) {
        try {
            Map<String, Object> userDetails = adminAuthorApplicationService.getUserDetailsForApplication(id);
            return ResponseEntity.ok(userDetails);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchApplications(@RequestParam String query) {
        try {
            List<Map<String, Object>> applications = adminAuthorApplicationService.searchApplications(query);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
