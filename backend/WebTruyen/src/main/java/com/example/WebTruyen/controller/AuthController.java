package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.ForgotPasswordRequest;
import com.example.WebTruyen.dto.request.LoginRequest;
import com.example.WebTruyen.dto.request.ResetPasswordRequest;
import com.example.WebTruyen.dto.request.SendOtpRequest;
import com.example.WebTruyen.dto.request.VerifyOtpRequest;
import com.example.WebTruyen.dto.response.LoginResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.security.JwtTokenProvider;
import com.example.WebTruyen.service.AuthService;
import com.example.WebTruyen.service.AccountLockedException;
import com.example.WebTruyen.service.TieredAchievementIntegrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private TieredAchievementIntegrationService achievementIntegrationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            UserEntity user = authService.authenticate(request.getUsername(), request.getPassword());

            if (!user.isVerified()) {
                return ResponseEntity.badRequest().body("Please verify your email before logging in.");
            }

            String token = tokenProvider.generateToken(user.getId(), user.getUsername());

            LoginResponse response = new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                userRoleRepository.findByUser_Id(user.getId()).stream()
                        .map(userRole -> userRole.getRole())
                        .filter(role -> role != null && role.getCode() != null && !role.getCode().isBlank())
                        .map(role -> role.getCode().trim().toUpperCase())
                        .distinct()
                        .toList(),
                user.getAvatarUrl()
            );

            return ResponseEntity.ok(response);
        } catch (AccountLockedException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", e.getMessage());
            body.put("secondsRemaining", e.getSecondsRemaining());
            return ResponseEntity.status(423).body(body);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.example.WebTruyen.dto.request.RegisterRequest request) {
        try {
            UserEntity newUser = authService.registerUser(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getDisplayName(),
                false
            );

            // Initialize achievement progress for new user
            try {
                achievementIntegrationService.initializeProgressForNewUser(newUser.getId());
                log.info("Initialized achievement progress for new user: {}", newUser.getId());
            } catch (Exception e) {
                log.warn("Failed to initialize achievement progress for user {}: {}", newUser.getId(), e.getMessage());
            }

            authService.sendOtp(request.getEmail());

            return ResponseEntity.ok(Map.of(
                "message", "Registration successful! Please check your email for OTP verification.",
                "username", newUser.getUsername()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest request) {
        try {
            authService.sendOtp(request.getEmail());
            return ResponseEntity.ok("OTP sent to your email!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            boolean isValid = authService.verifyOtp(request.getEmail(), request.getOtp());
            if (isValid) {
                return ResponseEntity.ok("Email verified successfully! You can now login.");
            } else {
                return ResponseEntity.badRequest().body("Invalid or expired OTP.");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.sendPasswordResetEmail(request.getEmail());
            return ResponseEntity.ok("Password reset link sent to your email!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successfully! Please login with your new password.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernameAvailability(@RequestParam String username) {
        try {
            boolean isAvailable = !authService.isUsernameTaken(username);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error checking username availability");
        }
    }
}
