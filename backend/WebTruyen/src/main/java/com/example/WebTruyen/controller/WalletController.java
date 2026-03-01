package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import com.example.WebTruyen.repository.LedgerEntryRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.SimpleDailyTaskService;
import com.example.WebTruyen.service.WalletService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class WalletController {

    @Autowired
    private WalletService walletService;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private SimpleDailyTaskService simpleDailyTaskService;

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

    @GetMapping("/ledger/{userId}")
    public ResponseEntity<?> getUserLedger(@PathVariable Long userId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        // Only allow users to see their own ledger
        if (!userPrincipal.getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        List<LedgerEntryEntity> ledgerEntries = ledgerEntryRepository.findByUserOrderByCreatedAtDesc(userPrincipal.getUser());
        return ResponseEntity.ok(ledgerEntries);
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
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = walletService.purchaseChapter(userId, chapterPrice, chapterId);
            
            // Track chapter unlock for daily task
            try {
                log.info("Tracking chapter unlock for daily task - user: {}, chapter: {}", userId, chapterId);
                simpleDailyTaskService.updateTaskProgress(userId, "UNLOCK_CHAPTER", null);
                log.info("Successfully tracked chapter unlock for daily task");
            } catch (Exception e) {
                // Don't fail the purchase if daily task tracking fails
                log.warn("Failed to track chapter unlock for daily task - user: {}, chapter: {}", userId, chapterId, e);
            }
            
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @PostMapping("/donate")
    public ResponseEntity<?> donate(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long authorId = ((Number) request.get("authorId")).longValue();
        Long coinBAmount = ((Number) request.get("coinBAmount")).longValue();
        String message = (String) request.get("message");
        
        if (authorId == null || authorId <= 0) {
            return ResponseEntity.badRequest().body("Invalid author ID");
        }
        if (coinBAmount == null || coinBAmount <= 0) {
            return ResponseEntity.badRequest().body("Invalid donation amount");
        }

        try {
            Long userId = userPrincipal.getUser().getId();
            Map<String, Object> response = walletService.donateToAuthor(userId, authorId, coinBAmount, message);
            
            // Track donation for daily task
            try {
                log.info("Tracking donation for daily task - user: {}, amount: {}", userId, coinBAmount);
                simpleDailyTaskService.updateTaskProgress(userId, "MAKE_DONATION", null);
                log.info("Successfully tracked donation for daily task");
            } catch (Exception e) {
                // Don't fail the donation if daily task tracking fails
                log.warn("Failed to track donation for daily task - user: {}, amount: {}", userId, coinBAmount, e);
            }
            
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }
}
