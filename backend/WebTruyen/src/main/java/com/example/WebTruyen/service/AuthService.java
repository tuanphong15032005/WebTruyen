package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpStorageService otpStorageService;

    public UserEntity authenticate(String username, String password) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        return user;
    }

    public UserEntity registerUser(String username, String email, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists!");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use!");
        }

        UserEntity newUser = UserEntity.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.save(newUser);
    }

    public void sendOtp(String email) {
        String otp = otpService.generateOtp();
        otpStorageService.storeOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyOtp(String email, String otp) {
        boolean isValid = otpStorageService.validateOtp(email, otp);
        if (isValid) {
            otpStorageService.removeOtp(email);
            UserEntity user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setVerified(true);
            userRepository.save(user);
        }
        return isValid;
    }
}
