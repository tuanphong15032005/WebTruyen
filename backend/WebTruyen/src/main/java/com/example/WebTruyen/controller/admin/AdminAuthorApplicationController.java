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

    @GetMapping("/{id}/raw-data")
    public ResponseEntity<?> getRawApplicationData(@PathVariable Long id) {
        try {
            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> rawData = new HashMap<>();
            rawData.put("userId", user.getId());
            rawData.put("username", user.getUsername());
            rawData.put("settingsJson", user.getSettingsJson());
            
            System.out.println("Raw data for user " + id + ": " + user.getSettingsJson());
            
            return ResponseEntity.ok(rawData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}/all-data")
    public ResponseEntity<?> getAllUserData(@PathVariable Long userId) {
        try {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> allData = new HashMap<>();
            allData.put("userId", user.getId());
            allData.put("username", user.getUsername());
            allData.put("email", user.getEmail());
            allData.put("createdAt", user.getCreatedAt());
            allData.put("settingsJson", user.getSettingsJson());
            
            // Parse and show individual fields
            if (user.getSettingsJson() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, Object> settings = mapper.readValue(user.getSettingsJson(), Map.class);
                    allData.put("parsedSettings", settings);
                    
                    // Extract author application fields - ORIGINAL FORM DATA
                    Map<String, Object> authorApp = new HashMap<>();
                    authorApp.put("authorApplicationStatus", settings.get("authorApplicationStatus"));
                    authorApp.put("authorApplicationSubmittedAt", settings.get("authorApplicationSubmittedAt"));
                    authorApp.put("authorPenName", settings.get("authorPenName"));
                    authorApp.put("authorBio", settings.get("authorBio"));
                    authorApp.put("authorExperience", settings.get("authorExperience"));
                    authorApp.put("authorMotivation", settings.get("authorMotivation"));
                    authorApp.put("authorApplicationRejectionReason", settings.get("authorApplicationRejectionReason"));
                    allData.put("authorApplicationData", authorApp);
                    
                    // Debug logs to show original form data
                    System.out.println("=== ORIGINAL FORM DATA FROM DATABASE ===");
                    System.out.println("User ID: " + user.getId());
                    System.out.println("Username: " + user.getUsername());
                    System.out.println("Original Pen Name: " + settings.get("authorPenName"));
                    System.out.println("Original Bio: " + settings.get("authorBio"));
                    System.out.println("Original Experience: " + settings.get("authorExperience"));
                    System.out.println("Original Motivation: " + settings.get("authorMotivation"));
                    System.out.println("=== END ORIGINAL DATA ===");
                    
                } catch (Exception e) {
                    allData.put("parseError", e.getMessage());
                }
            }
            
            return ResponseEntity.ok(allData);
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
