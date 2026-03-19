package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AuthorApplicationRequest;
import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import com.example.WebTruyen.repository.RoleRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthorApplicationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void applyForAuthor(Long userId, AuthorApplicationRequest request) {
        // Check if user exists
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already has author role
        boolean hasAuthorRole = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
        
        if (hasAuthorRole) {
            throw new RuntimeException("User already has author role");
        }

        // Check if user already has pending application
        Map<String, Object> settings = getUserSettings(user);
        if (settings.containsKey("authorApplicationStatus") && 
            "PENDING".equals(settings.get("authorApplicationStatus"))) {
            throw new RuntimeException("You already have a pending application");
        }

        // Check if user account is at least 7 days old (use same logic as ReviewerApplicationService)
        long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now());
        if (daysSinceCreation < 7) {
            long daysUntilEligible = 7 - daysSinceCreation;
            throw new RuntimeException("Your account must be at least 7 days old to apply for author status. " +
                    "Please wait " + daysUntilEligible + " more day(s).");
        }

        // Save application data in settings
        Map<String, Object> applicationData = new HashMap<>();
        applicationData.put("authorApplicationStatus", "PENDING");
        applicationData.put("authorApplicationSubmittedAt", LocalDateTime.now().toString());
        
        // Validate and truncate pen name if it exceeds database limit
        String penName = request.getPenName();
        if (penName != null && penName.length() > 200) {
            penName = penName.substring(0, 200);
            System.out.println("Warning: Pen name truncated to 200 characters. Original length: " + request.getPenName().length());
        }
        applicationData.put("authorPenName", penName);
        
        // Validate and truncate bio if it exceeds database limit  
        String bio = request.getBio();
        if (bio != null && bio.length() > 2000) {
            bio = bio.substring(0, 2000);
            System.out.println("Warning: Bio truncated to 2000 characters. Original length: " + request.getBio().length());
        }
        applicationData.put("authorBio", bio);
        
        applicationData.put("authorExperience", request.getExperience());
        applicationData.put("authorMotivation", request.getMotivation());
        
        // Debug logs for saving data
        System.out.println("Saving author application data:");
        System.out.println("Pen Name: " + penName);
        System.out.println("Bio: " + bio);
        System.out.println("Experience: " + request.getExperience());
        System.out.println("Motivation: " + request.getMotivation());
        
        // Merge with existing settings
        settings.putAll(applicationData);
        
        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save application data", e);
        }
    }

    public boolean hasAuthorRole(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
    }

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

    public Map<String, Object> getApplicationByUserId(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> settings = getUserSettings(user);
        System.out.println("Settings for user " + userId + ": " + settings);
        
        if (settings.containsKey("authorApplicationStatus")) {
            Map<String, Object> application = new HashMap<>();
            application.put("id", user.getId()); // Add application ID (same as user ID)
            application.put("status", settings.get("authorApplicationStatus"));
            application.put("submittedAt", settings.get("authorApplicationSubmittedAt"));
            application.put("rejectionReason", settings.get("authorApplicationRejectionReason"));
            application.put("reviewedAt", settings.get("authorApplicationReviewedAt"));
            application.put("reviewedBy", settings.get("authorApplicationReviewedBy"));
            application.put("penName", settings.get("authorPenName"));
            application.put("bio", settings.get("authorBio"));
            application.put("experience", settings.get("authorExperience"));
            application.put("motivation", settings.get("authorMotivation"));
            
            // Debug logs for application data
            System.out.println("Debug: authorPenName = " + settings.get("authorPenName"));
            System.out.println("Debug: authorBio = " + settings.get("authorBio"));
            System.out.println("Debug: authorExperience = " + settings.get("authorExperience"));
            System.out.println("Debug: authorMotivation = " + settings.get("authorMotivation"));
            
            // Add reviewer name if reviewed
            Object reviewerIdObj = settings.get("authorApplicationReviewedBy");
            if (reviewerIdObj != null) {
                Long reviewerId = null;
                if (reviewerIdObj instanceof Long) {
                    reviewerId = (Long) reviewerIdObj;
                } else if (reviewerIdObj instanceof Integer) {
                    reviewerId = ((Integer) reviewerIdObj).longValue();
                }
                if (reviewerId != null) {
                    application.put("reviewerName", getReviewerName(reviewerId));
                } else {
                    application.put("reviewerName", null);
                }
            } else {
                application.put("reviewerName", null);
            }
            
            return application;
        }
        return null;
    }

    public boolean canApplyForAuthor(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if already has author role
        boolean hasAuthorRole = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
        
        if (hasAuthorRole) {
            return false;
        }

        // Check if has pending application
        Map<String, Object> settings = getUserSettings(user);
        if ("PENDING".equals(settings.get("authorApplicationStatus"))) {
            return false;
        }

        // Check if account is at least 7 days old (use same logic as ReviewerApplicationService)
        long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now());
        return daysSinceCreation >= 7;
    }

    public long getDaysUntilEligible(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Use same logic as ReviewerApplicationService for consistency
        long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now());
        return Math.max(0, 7 - daysSinceCreation);
    }

    public List<Map<String, Object>> getAllApplications() {
        List<Map<String, Object>> applications = new ArrayList<>();
        List<UserEntity> users = userRepository.findAll();
        
        for (UserEntity user : users) {
            Map<String, Object> settings = getUserSettings(user);
            if (settings.containsKey("authorApplicationStatus")) {
                Map<String, Object> application = new HashMap<>();
                application.put("id", user.getId()); // Use user ID as application ID
                application.put("userId", user.getId());
                application.put("username", user.getUsername());
                application.put("email", user.getEmail()); // Add email field
                application.put("status", settings.get("authorApplicationStatus"));
                application.put("submittedAt", settings.get("authorApplicationSubmittedAt"));
                application.put("reviewedAt", settings.get("authorApplicationReviewedAt"));
                application.put("rejectionReason", settings.get("authorApplicationRejectionReason"));
                application.put("reviewedBy", settings.get("authorApplicationReviewedBy"));
                
                // Add reviewer name if reviewed
                Object reviewerIdObj = settings.get("authorApplicationReviewedBy");
                if (reviewerIdObj != null) {
                    Long reviewerId = null;
                    if (reviewerIdObj instanceof Long) {
                        reviewerId = (Long) reviewerIdObj;
                    } else if (reviewerIdObj instanceof Integer) {
                        reviewerId = ((Integer) reviewerIdObj).longValue();
                    }
                    if (reviewerId != null) {
                        application.put("reviewerName", getReviewerName(reviewerId));
                    } else {
                        application.put("reviewerName", null);
                    }
                } else {
                    application.put("reviewerName", null);
                }
                
                // IMPORTANT: Get ORIGINAL form data directly from settings
                String originalPenName = (String) settings.get("authorPenName");
                String originalBio = (String) settings.get("authorBio");
                String originalExperience = (String) settings.get("authorExperience");
                String originalMotivation = (String) settings.get("authorMotivation");
                
                application.put("penName", originalPenName);
                application.put("bio", originalBio);
                application.put("experience", originalExperience);
                application.put("motivation", originalMotivation);
                
                applications.add(application);
            }
        }
        
        // Sort by submitted date descending
        applications.sort((a, b) -> {
            String dateA = (String) a.get("submittedAt");
            String dateB = (String) b.get("submittedAt");
            if (dateA != null && dateB != null) {
                return dateB.compareTo(dateA);
            }
            return 0;
        });
        
        return applications;
    }

    public List<Map<String, Object>> getApplicationsByStatus(String status) {
        List<Map<String, Object>> allApplications = getAllApplications();
        return allApplications.stream()
                .filter(app -> status.equals(app.get("status")))
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveApplication(Long userId, Long adminId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> settings = getUserSettings(user);
        if (!"PENDING".equals(settings.get("authorApplicationStatus"))) {
            throw new RuntimeException("Application is not pending");
        }

        // Check if user already has author role
        boolean hasAuthorRole = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getCode().equals("AUTHOR"));
        
        if (hasAuthorRole) {
            throw new RuntimeException("User already has author role");
        }

        // Get author role
        RoleEntity authorRole = roleRepository.findByCode("AUTHOR")
                .orElseThrow(() -> new RuntimeException("Author role not found"));

        // Update user's author profile information
        String penName = (String) settings.get("authorPenName");
        String bio = (String) settings.get("authorBio");
        
        // Truncate pen name if it exceeds database limit (200 characters)
        if (penName != null && penName.length() > 200) {
            penName = penName.substring(0, 200);
            System.out.println("Warning: Pen name truncated to 200 characters. Original length: " + 
                ((String) settings.get("authorPenName")).length());
        }
        
        // Truncate bio if it exceeds database limit
        if (bio != null && bio.length() > 2000) {
            bio = bio.substring(0, 2000);
            System.out.println("Warning: Bio truncated to 2000 characters. Original length: " + 
                ((String) settings.get("authorBio")).length());
        }
        
        user.setAuthorPenName(penName);
        user.setAuthorProfileBio(bio);
        user.setUpdatedAt(LocalDateTime.now());
        
        // Update application status
        settings.put("authorApplicationStatus", "APPROVED");
        settings.put("authorApplicationReviewedAt", LocalDateTime.now().toString());
        settings.put("authorApplicationReviewedBy", adminId);
        
        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update application status", e);
        }

        // Assign author role to user
        UserRoleEntity userRole = UserRoleEntity.builder()
                .id(new UserRoleId(user.getId(), authorRole.getId()))
                .user(user)
                .role(authorRole)
                .assignedAt(LocalDateTime.now())
                .build();

        userRoleRepository.save(userRole);
    }

    @Transactional
    public void rejectApplication(Long userId, String rejectionReason, Long adminId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> settings = getUserSettings(user);
        if (!"PENDING".equals(settings.get("authorApplicationStatus"))) {
            throw new RuntimeException("Application is not pending");
        }

        settings.put("authorApplicationStatus", "REJECTED");
        settings.put("authorApplicationRejectionReason", rejectionReason);
        settings.put("authorApplicationReviewedAt", LocalDateTime.now().toString());
        settings.put("authorApplicationReviewedBy", adminId);
        
        try {
            user.setSettingsJson(objectMapper.writeValueAsString(settings));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update application status", e);
        }
    }

    public Map<String, Long> getApplicationStats() {
        List<Map<String, Object>> allApplications = getAllApplications();
        Map<String, Long> stats = new HashMap<>();
        stats.put("PENDING", 0L);
        stats.put("APPROVED", 0L);
        stats.put("REJECTED", 0L);
        
        for (Map<String, Object> app : allApplications) {
            String status = (String) app.get("status");
            stats.put(status, stats.get(status) + 1);
        }
        
        return stats;
    }

    public boolean isPenNameAvailable(String penName) {
        if (penName == null || penName.trim().isEmpty()) {
            return false;
        }

        String trimmedPenName = penName.trim();

        // First check in UserEntity.authorPenName (for approved authors)
        if (userRepository.existsByAuthorPenName(trimmedPenName)) {
            return false;
        }

        // Then check in settings for pending applications
        List<UserEntity> users = userRepository.findAll();
        for (UserEntity user : users) {
            Map<String, Object> settings = getUserSettings(user);
            String existingPenName = (String) settings.get("authorPenName");
            if (existingPenName != null && existingPenName.trim().equalsIgnoreCase(trimmedPenName)) {
                String status = (String) settings.get("authorApplicationStatus");
                if ("PENDING".equals(status)) {
                    return false;
                }
            }
        }

        return true;
    }

    public String getReviewerName(Long reviewerId) {
        if (reviewerId == null) {
            return null;
        }
        return userRepository.findById(reviewerId)
                .map(UserEntity::getUsername)
                .orElse("Unknown Admin");
    }
}
