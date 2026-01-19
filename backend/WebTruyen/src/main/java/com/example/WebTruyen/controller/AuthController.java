package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.LoginRequest;
import com.example.WebTruyen.dto.request.RegisterRequest;
import com.example.WebTruyen.dto.request.VerifyRequest;
import com.example.WebTruyen.entity.User;
import com.example.WebTruyen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.WebTruyen.service.EmailService;
import java.util.Random;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Cho phép React (Vite) gọi vào
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    // API Đăng ký
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username đã tồn tại!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã được sử dụng!");
        }

        User newUser = new User(
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
        );

        // Sinh mã OTP 6 số ngẫu nhiên
        String randomCode = String.valueOf(new Random().nextInt(900000) + 100000);
        newUser.setVerificationCode(randomCode);
        newUser.setIsVerified(false); // Chưa xác minh

        userRepository.save(newUser);

        // Gửi mail
        emailService.sendVerificationEmail(request.getEmail(), randomCode);

        return ResponseEntity.ok("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody VerifyRequest request) {
        //logic tìm user ở đây:
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (user.getVerificationCode() != null && user.getVerificationCode().equals(request.getCode())) {
            user.setIsVerified(true); // Kích hoạt tài khoản
            user.setVerificationCode(null); // Xóa mã đi cho an toàn
            userRepository.save(user);
            return ResponseEntity.ok("Xác thực thành công!");
        } else {
            return ResponseEntity.badRequest().body("Mã xác thực không đúng!");
        }
    }

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Tìm user trong DB
        Optional<User> userOptional = userRepository.findByUsername(request.getUsername());

        // 2. Nếu không thấy user
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Tài khoản hoặc mật khẩu không đúng!");
        }

        User user = userOptional.get();
        if (!user.getIsVerified()) {
            return ResponseEntity.badRequest().body("Tài khoản chưa xác thực email!");
        }
        // 3. So sánh password (User gửi lên vs DB)
        if (!user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.badRequest().body("Tài khoản hoặc mật khẩu không đúng!");
        }

        // 4. Trả về thông tin user (Trừ password)
        return ResponseEntity.ok(user);
    }
}
