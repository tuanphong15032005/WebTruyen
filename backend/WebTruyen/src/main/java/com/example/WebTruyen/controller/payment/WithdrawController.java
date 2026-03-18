package com.example.WebTruyen.controller.payment;

import com.example.WebTruyen.dto.request.WithdrawRequestCreateRequest;
import com.example.WebTruyen.dto.response.WithdrawRequestHistoryResponse;
import com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.WalletService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/withdrawals")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class WithdrawController {

    @Autowired
    private WalletService walletService;

    @PostMapping
    public ResponseEntity<?> createWithdrawRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody WithdrawRequestCreateRequest request) {

        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userPrincipal.getUser().getId();
        WithdrawRequestEntity entity = walletService.withdrawCreateRequest(
                userId,
                request.getAmountB(),
                request.getBankAccountNumber(),
                request.getAccountHolderName(),
                request.getBankName()
        );

        return ResponseEntity.ok(entity);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyWithdrawRequests(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userPrincipal.getUser().getId();
        List<WithdrawRequestHistoryResponse> requests = walletService.withdrawGetUserRequests(userId);
        return ResponseEntity.ok(requests);
    }
}

