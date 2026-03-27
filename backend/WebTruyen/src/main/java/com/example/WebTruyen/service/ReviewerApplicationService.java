package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.RoleRepository;
import com.example.WebTruyen.repository.UserRepository;
// Import UserRoleId
import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewerApplicationService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final ObjectMapper objectMapper;

    /**
     * Check if user is eligible to apply for reviewer role
     */
    public Map<String, Object> checkEligibility(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        
        // Check if user already has reviewer role
        boolean alreadyReviewer = hasReviewerRole(user);
        if (alreadyReviewer) {
            response.put("alreadyReviewer", true);
            response.put("canApply", false);
            return response;
        }

        // Check if user has pending application
        boolean hasPendingApplication = hasPendingApplication(user);
        if (hasPendingApplication) {
            response.put("hasPendingApplication", true);
            response.put("canApply", false);
            response.put("applicationSubmittedAt", getApplicationSubmittedAt(user));
            return response;
        }

        // Check if user has rejected application
        boolean hasRejectedApplication = hasRejectedApplication(user);
        if (hasRejectedApplication) {
            response.put("hasRejectedApplication", true);
            response.put("canApply", true);
            response.put("rejectionReason", getRejectionReason(user));
            return response;
        }

        // Check account age (must be at least 7 days)
        long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now());
        boolean canApply = daysSinceCreation >= 7;
        
        response.put("alreadyReviewer", false);
        response.put("hasPendingApplication", false);
        response.put("hasRejectedApplication", false);
        response.put("canApply", canApply);
        response.put("daysUntilEligible", Math.max(0, 7 - daysSinceCreation));
        
        return response;
    }

    /**
     * Submit reviewer application
     */
    @Transactional
    public Map<String, Object> submitApplication(Long userId, Map<String, String> applicationData) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check eligibility - but allow resubmission if rejected
        Map<String, Object> eligibility = checkEligibility(userId);
        if (!(Boolean) eligibility.get("canApply") && !(Boolean) eligibility.get("hasRejectedApplication")) {
            throw new RuntimeException("Bạn không đủ điều kiện để đăng ký reviewer");
        }

        // Save application data to settingsJson (this will overwrite previous data)
        Map<String, Object> settings = getUserSettings(user);
        settings.put("reviewerApplicationStatus", "PENDING");
        settings.put("reviewerApplicationSubmittedAt", LocalDateTime.now().toString());
        settings.put("reviewerExperience", applicationData.get("experience"));
        settings.put("reviewerMotivation", applicationData.get("motivation"));
        settings.put("reviewerAvailability", applicationData.get("availability"));
        settings.put("reviewerSkills", applicationData.get("skills"));
        
        // Clear previous rejection data
        settings.remove("reviewerApplicationRejectedAt");
        settings.remove("reviewerApplicationRejectionReason");

        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save reviewer application data", e);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đơn đăng ký reviewer đã được gửi thành công");
        response.put("status", "PENDING");
        
        return response;
    }

    /**
     * Get application status for user
     */
    public Map<String, Object> getApplicationStatus(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return checkEligibility(userId);
    }

    /**
     * Get all reviewer applications for admin
     */
    public List<Map<String, Object>> getAllApplications() {
        return userRepository.findAll().stream()
                .filter(this::hasReviewerApplication)
                .map(this::buildApplicationResponse)
                .sorted((a, b) -> {
                    String dateA = (String) a.get("submittedAt");
                    String dateB = (String) b.get("submittedAt");
                    if (dateA != null && dateB != null) {
                        return dateA.compareTo(dateB); // Sort ascending (FIFO - first in, first out)
                    }
                    return 0;
                })
                .toList();
    }

    /**
     * Get applications by status
     */
    public List<Map<String, Object>> getApplicationsByStatus(String status) {
        return userRepository.findAll().stream()
                .filter(user -> {
                    Map<String, Object> settings = getUserSettings(user);
                    String applicationStatus = (String) settings.get("reviewerApplicationStatus");
                    return status.equals(applicationStatus);
                })
                .map(this::buildApplicationResponse)
                .sorted((a, b) -> {
                    String dateA = (String) a.get("submittedAt");
                    String dateB = (String) b.get("submittedAt");
                    if (dateA != null && dateB != null) {
                        return dateA.compareTo(dateB); // Sort ascending (FIFO - first in, first out)
                    }
                    return 0;
                })
                .toList();
    }

    /**
     * Approve reviewer application
     */
    @Transactional
    public void approveApplication(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has pending application
        if (!hasPendingApplication(user)) {
            throw new RuntimeException("Không có đơn đăng ký nào đang chờ duyệt");
        }

        // Add reviewer role
        RoleEntity reviewerRole = roleRepository.findByCode("REVIEWER")
                .orElseThrow(() -> new RuntimeException("Reviewer role not found"));

        // Create UserRoleId first
        UserRoleId userRoleId = new UserRoleId();
        userRoleId.setUserId(user.getId());
        userRoleId.setRoleId(reviewerRole.getId());

        UserRoleEntity userRole = new UserRoleEntity();
        userRole.setId(userRoleId);
        userRole.setUser(user);
        userRole.setRole(reviewerRole);
        userRole.setAssignedAt(LocalDateTime.now());
        userRoleRepository.save(userRole);

        // Update application status
        Map<String, Object> settings = getUserSettings(user);
        settings.put("reviewerApplicationStatus", "APPROVED");
        settings.put("reviewerApplicationApprovedAt", LocalDateTime.now().toString());
        
        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update reviewer application status", e);
        }
    }

    /**
     * Reject reviewer application
     */
    @Transactional
    public void rejectApplication(Long userId, String rejectionReason) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has pending application
        if (!hasPendingApplication(user)) {
            throw new RuntimeException("Không có đơn đăng ký nào đang chờ duyệt");
        }

        // Update application status
        Map<String, Object> settings = getUserSettings(user);
        settings.put("reviewerApplicationStatus", "REJECTED");
        settings.put("reviewerApplicationRejectedAt", LocalDateTime.now().toString());
        settings.put("reviewerApplicationRejectionReason", rejectionReason);
        
        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update reviewer application status", e);
        }
    }

    /**
     * Check reviewer status for current user
     */
    public Map<String, Object> checkReviewerStatus(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean hasReviewerRole = hasReviewerRole(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasReviewerRole", hasReviewerRole);
        
        // Get application status if not approved
        if (!hasReviewerRole) {
            var application = getApplicationByUserId(userId);
            if (application != null) {
                response.put("applicationStatus", application.get("status"));
                response.put("submittedAt", application.get("submittedAt"));
                response.put("rejectionReason", application.get("rejectionReason"));
            }
        }
        
        return response;
    }

    /**
     * Get application details by user ID
     */
    public Map<String, Object> getApplicationByUserId(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!hasReviewerApplication(user)) {
            return null;
        }
        
        Map<String, Object> application = new HashMap<>();
        application.put("status", getUserSettings(user).get("reviewerApplicationStatus"));
        application.put("submittedAt", getApplicationSubmittedAt(user));
        application.put("rejectionReason", getRejectionReason(user));
        
        return application;
    }

    // Helper methods
    private boolean hasReviewerRole(UserEntity user) {
        return userRoleRepository.existsByUser_IdAndRole_Code(user.getId(), "REVIEWER");
    }

    private boolean hasPendingApplication(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        return "PENDING".equals(settings.get("reviewerApplicationStatus"));
    }

    private boolean hasRejectedApplication(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        return "REJECTED".equals(settings.get("reviewerApplicationStatus"));
    }

    private boolean hasReviewerApplication(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        return settings.containsKey("reviewerApplicationStatus");
    }

    private String getApplicationSubmittedAt(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        return (String) settings.get("reviewerApplicationSubmittedAt");
    }

    private String getRejectionReason(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        return (String) settings.get("reviewerApplicationRejectionReason");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getUserSettings(UserEntity user) {
        try {
            if (user.getSettingsJson() != null && !user.getSettingsJson().trim().isEmpty()) {
                return objectMapper.readValue(user.getSettingsJson(), Map.class);
            }
        } catch (Exception e) {
            // Ignore parsing errors, return empty map
        }
        return new HashMap<>();
    }
    
    private Map<String, Object> buildApplicationResponse(UserEntity user) {
        Map<String, Object> settings = getUserSettings(user);
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", user.getId()); // Add ID for frontend compatibility
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("status", settings.get("reviewerApplicationStatus"));
        response.put("submittedAt", settings.get("reviewerApplicationSubmittedAt"));
        response.put("experience", settings.get("reviewerExperience"));
        response.put("motivation", settings.get("reviewerMotivation"));
        response.put("availability", settings.get("reviewerAvailability"));
        response.put("skills", settings.get("reviewerSkills"));
        response.put("rejectionReason", settings.get("reviewerApplicationRejectionReason"));
        
        return response;
    }

    /**
     * Get user details for reviewer application
     */
    public Map<String, Object> getUserDetailsForApplication(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("userId", user.getId());
        userDetails.put("username", user.getUsername());
        userDetails.put("email", user.getEmail());
        userDetails.put("displayName", user.getDisplayName());
        userDetails.put("createdAt", user.getCreatedAt());
        
        return userDetails;
    }

    /**
     * Get application by ID
     */
    public Map<String, Object> getApplicationById(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!hasReviewerApplication(user)) {
            throw new RuntimeException("Application not found");
        }

        return buildApplicationResponse(user);
    }

    /**
     * Get all user data for debugging
     */
    public Map<String, Object> getAllUserData(Long userId) {
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
                Map<String, Object> settings = getUserSettings(user);
                allData.put("parsedSettings", settings);
                
                // Extract reviewer application fields
                Map<String, Object> reviewerApp = new HashMap<>();
                reviewerApp.put("reviewerApplicationStatus", settings.get("reviewerApplicationStatus"));
                reviewerApp.put("reviewerApplicationSubmittedAt", settings.get("reviewerApplicationSubmittedAt"));
                reviewerApp.put("reviewerExperience", settings.get("reviewerExperience"));
                reviewerApp.put("reviewerMotivation", settings.get("reviewerMotivation"));
                reviewerApp.put("reviewerAvailability", settings.get("reviewerAvailability"));
                reviewerApp.put("reviewerSkills", settings.get("reviewerSkills"));
                reviewerApp.put("reviewerApplicationRejectionReason", settings.get("reviewerApplicationRejectionReason"));
                allData.put("reviewerApplicationData", reviewerApp);
                
            } catch (Exception e) {
                allData.put("parseError", e.getMessage());
            }
        }
        
        return allData;
    }

    /**
     * Search applications
     */
    public List<Map<String, Object>> searchApplications(String query) {
        return userRepository.findAll().stream()
                .filter(this::hasReviewerApplication)
                .filter(user -> {
                    String username = user.getUsername().toLowerCase();
                    String email = user.getEmail().toLowerCase();
                    String searchQuery = query.toLowerCase();
                    return username.contains(searchQuery) || email.contains(searchQuery);
                })
                .map(this::buildApplicationResponse)
                .sorted((a, b) -> {
                    String dateA = (String) a.get("submittedAt");
                    String dateB = (String) b.get("submittedAt");
                    if (dateA != null && dateB != null) {
                        return dateB.compareTo(dateA); // Sort descending (newest first)
                    }
                    return 0;
                })
                .toList();
    }
}
