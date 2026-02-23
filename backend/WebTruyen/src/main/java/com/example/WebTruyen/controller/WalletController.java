package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping
    public ResponseEntity<?> getWallet(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        WalletResponse response = walletService.getWallet(userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> dailyCheckIn(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Map<String, Object> response = walletService.dailyCheckIn(userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/purchase-chapter")
    public ResponseEntity<?> purchaseChapter(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Long> request) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long chapterPrice = request.get("chapterPrice");
        Long chapterId = request.get("chapterId");
        
        if (chapterPrice == null || chapterPrice <= 0) {
            return ResponseEntity.badRequest().body("Invalid chapter price");
        }
        if (chapterId == null || chapterId <= 0) {
            return ResponseEntity.badRequest().body("Invalid chapter ID");
        }

        try {
            Map<String, Object> response = walletService.purchaseChapter(userPrincipal.getUser().getId(), chapterPrice, chapterId);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }
}
