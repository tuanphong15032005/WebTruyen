package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.RefundRequestCreateRequest;
import com.example.WebTruyen.dto.response.RefundEligibleTransactionResponse;
import com.example.WebTruyen.dto.response.RefundRequestHistoryResponse;
import com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class RefundController {

    private final WalletService walletService;

    @GetMapping("/eligible-transactions")
    public ResponseEntity<?> getEligibleTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long userId = userPrincipal.getUser().getId();
        List<RefundEligibleTransactionResponse> items = walletService.refundGetEligibleTransactions(userId);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRefundRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RefundRequestCreateRequest request
    ) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long userId = userPrincipal.getUser().getId();
        WithdrawRequestEntity created = walletService.refundCreateRequest(
                userId,
                request.getTransactionId(),
                request.getRefundAmount(),
                request.getRefundReason(),
                request.getBankAccountNumber(),
                request.getAccountHolderName(),
                request.getBankName()
        );
        return ResponseEntity.ok(created);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRefundRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Long userId = userPrincipal.getUser().getId();
        List<RefundRequestHistoryResponse> history = walletService.refundGetUserRequests(userId);
        return ResponseEntity.ok(history);
    }
}

