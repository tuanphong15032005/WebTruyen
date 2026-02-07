package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.LoginRequest;
import com.example.WebTruyen.dto.request.SendOtpRequest;
import com.example.WebTruyen.dto.request.VerifyOtpRequest;
import com.example.WebTruyen.dto.response.LoginResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.security.JwtTokenProvider;
import com.example.WebTruyen.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

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
                user.getUsername()
            );
            
            return ResponseEntity.ok(response);
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
                request.getPassword()
            );
            
            authService.sendOtp(request.getEmail());
            
            return ResponseEntity.ok("Registration successful! Please check your email for OTP verification.");
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
}
