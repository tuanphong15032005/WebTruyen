package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.AuthorApplicationRequest;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.service.AuthorApplicationService;
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

    @PostMapping("/apply")
    public ResponseEntity<?> applyForAuthor(
            @RequestBody AuthorApplicationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserEntity user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            authorApplicationService.applyForAuthor(user.getId(), request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Author application submitted successfully!");
            response.put("status", "approved"); // Auto-approved for simplicity
            
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
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasAuthorRole", hasAuthorRole);
            response.put("canApply", !hasAuthorRole);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
