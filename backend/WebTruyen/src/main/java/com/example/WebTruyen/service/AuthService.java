package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.ForgotPasswordRequest;
import com.example.WebTruyen.dto.request.ResetPasswordRequest;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.WalletEntity;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import com.example.WebTruyen.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Duration;

@Service
public class AuthService {

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 1;

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

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private WalletRepository walletRepository;

    public UserEntity authenticate(String username, String password) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        LocalDateTime now = LocalDateTime.now();
        if (user.getLockUntil() != null) {
            if (user.getLockUntil().isAfter(now)) {
                long secondsRemaining = Duration.between(now, user.getLockUntil()).getSeconds();
                if (secondsRemaining < 1) {
                    secondsRemaining = 1;
                }
                throw new AccountLockedException("Account is temporarily locked. Please try again later.", secondsRemaining);
            } else {
                user.setLockUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;

            if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                user.setFailedLoginAttempts(0);
                user.setLockUntil(now.plusMinutes(LOCK_MINUTES));
                userRepository.save(user);
                long secondsRemaining = Duration.between(now, user.getLockUntil()).getSeconds();
                if (secondsRemaining < 1) {
                    secondsRemaining = LOCK_MINUTES * 60L;
                }
                throw new AccountLockedException("Account is temporarily locked. Please try again later.", secondsRemaining);
            }

            user.setFailedLoginAttempts(attempts);
            userRepository.save(user);
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getFailedLoginAttempts() != 0 || user.getLockUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
        }

        return user;
    }

    public UserEntity registerUser(String username, String email, String password) {
        return registerUser(username, email, password, null, null);
    }

    public UserEntity registerUser(String username, String email, String password, String displayName, Boolean upgradeToAuthor) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (password == null || password.isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use!");
        }

        String finalUsername = normalizeUsername(username, email);
        finalUsername = ensureUniqueUsername(finalUsername);

        UserEntity newUser = UserEntity.builder()
                .username(finalUsername)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName)
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        // upgradeToAuthor is accepted from client (UC01) but role assignment is not implemented here
        // because the project currently has no Role/UserRole repositories wired.

        UserEntity savedUser = userRepository.save(newUser);

        if (!walletRepository.existsById(savedUser.getId())) {
            WalletEntity wallet = WalletEntity.builder()
                    .user(savedUser)
                    .balanceCoinA(0L)
                    .balanceCoinB(0L)
                    .reservedCoinB(0L)
                    .updatedAt(LocalDateTime.now())
                    .build();
            walletRepository.save(wallet);
        }

        return savedUser;
    }

    private String normalizeUsername(String username, String email) {
        String candidate = username;
        if (candidate == null || candidate.trim().isEmpty()) {
            String localPart = email.split("@", 2)[0];
            candidate = localPart;
        }

        candidate = candidate.trim();
        candidate = candidate.replaceAll("[^a-zA-Z0-9._-]", "");
        if (candidate.isEmpty()) {
            candidate = "user";
        }

        return candidate;
    }

    private String ensureUniqueUsername(String baseUsername) {
        String candidate = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = baseUsername + suffix;
            suffix++;
        }
        return candidate;
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

    public void sendPasswordResetEmail(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String resetToken = tokenProvider.generatePasswordResetToken(user.getId());
        emailService.sendPasswordResetEmail(email, resetToken);
    }

    public void resetPassword(String token, String newPassword) {
        if (!tokenProvider.validatePasswordResetToken(token)) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        Long userId = tokenProvider.getUserIdFromToken(token);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validatePasswordPolicy(newPassword, user.getPasswordHash());

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void validatePasswordPolicy(String newPassword, String currentPasswordHash) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }

        if (passwordEncoder.matches(newPassword, currentPasswordHash)) {
            throw new RuntimeException("New password cannot be the same as the current password");
        }
    }
}
