package com.example.WebTruyen.controller.author;

import com.example.WebTruyen.dto.request.AuthorApplicationRequest;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.AuthorApplicationService;
import com.example.WebTruyen.service.ReviewerApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/author-application")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthorApplicationController {

    @Autowired
    private AuthorApplicationService authorApplicationService;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ReviewerApplicationService reviewerApplicationService;

    @PostMapping("/apply")
    public ResponseEntity<?> applyForAuthor(
            @RequestBody AuthorApplicationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserEntity user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            authorApplicationService.applyForAuthor(user.getId(), request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Author application submitted successfully! Please wait for admin approval.");
            response.put("status", "pending");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-pen-name")
    public ResponseEntity<?> checkPenNameAvailability(@RequestParam String penName) {
        try {
            boolean isAvailable = authorApplicationService.isPenNameAvailable(penName);
            Map<String, Object> response = new HashMap<>();
            response.put("available", isAvailable);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> checkAuthorStatus(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserEntity user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            boolean hasAuthorRole = authorApplicationService.hasAuthorRole(user.getId());
            boolean canApply = authorApplicationService.canApplyForAuthor(user.getId());
            long daysUntilEligible = authorApplicationService.getDaysUntilEligible(user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasAuthorRole", hasAuthorRole);
            response.put("canApply", canApply);
            response.put("daysUntilEligible", daysUntilEligible);
            
            // Get application status if exists
            if (!hasAuthorRole) {
                var application = authorApplicationService.getApplicationByUserId(user.getId());
                if (application != null) {
                    response.put("applicationStatus", application.get("status"));
                    response.put("submittedAt", application.get("submittedAt"));
                    response.put("rejectionReason", application.get("rejectionReason"));
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all-statuses")
    public ResponseEntity<?> getAllApplicationStatuses(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserEntity user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Author application status
            boolean hasAuthorRole = authorApplicationService.hasAuthorRole(user.getId());
            boolean canApplyForAuthor = authorApplicationService.canApplyForAuthor(user.getId());
            long daysUntilEligible = authorApplicationService.getDaysUntilEligible(user.getId());
            
            Map<String, Object> authorStatus = new HashMap<>();
            authorStatus.put("hasRole", hasAuthorRole);
            authorStatus.put("canApply", canApplyForAuthor);
            authorStatus.put("daysUntilEligible", daysUntilEligible);
            
            if (!hasAuthorRole) {
                var authorApplication = authorApplicationService.getApplicationByUserId(user.getId());
                if (authorApplication != null) {
                    authorStatus.put("status", authorApplication.get("status"));
                    authorStatus.put("submittedAt", authorApplication.get("submittedAt"));
                    authorStatus.put("rejectionReason", authorApplication.get("rejectionReason"));
                }
            }
            
            // Reviewer application status
            Map<String, Object> reviewerStatus = reviewerApplicationService.checkEligibility(user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("authorApplication", authorStatus);
            response.put("reviewerApplication", reviewerStatus);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
