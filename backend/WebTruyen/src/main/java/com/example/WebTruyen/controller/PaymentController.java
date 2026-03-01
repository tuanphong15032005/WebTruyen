package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreatePaymentOrderRequest;
import com.example.WebTruyen.dto.response.ConfirmPaymentResponse;
import com.example.WebTruyen.dto.response.CreatePaymentOrderResponse;
import com.example.WebTruyen.dto.response.PaymentDetailResponse;
import com.example.WebTruyen.dto.response.TransactionHistoryResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @RequestBody CreatePaymentOrderRequest request) {
        log.info("Payment order creation requested");
        
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            log.warn("Unauthorized payment order creation attempt");
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userPrincipal.getUser().getId();
        log.info("Creating payment order for user: {}, amount: {} VND, coins: {}", 
                userId, request.getAmountVnd(), request.getCoinBAmount());

        CreatePaymentOrderResponse response = paymentService.createPaymentOrder(userId, request);
        log.info("Payment order created: {}", response.getOrderId());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<?> confirm(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @PathVariable Long orderId) {
        log.info("Payment confirmation requested - orderId: {}", orderId);
        
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            log.warn("Unauthorized payment confirmation attempt - orderId: {}", orderId);
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Long userId = userPrincipal.getUser().getId();
            log.info("Confirming payment for user: {}, order: {}", userId, orderId);
            
            ConfirmPaymentResponse response = paymentService.confirmPayment(userId, orderId);
            log.info("Payment confirmed successfully - user: {}, order: {}, new balance: {}", userId, orderId, response.getBalanceCoinB());
            
            // Daily task tracking is now automatic in WalletService.addCoinB() when reason is TOPUP
            log.info("Daily task tracking will be handled automatically by WalletService");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error confirming payment - orderId: {}", orderId, e);
            throw e;
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> detail(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @PathVariable Long orderId) {
        log.info("Payment detail requested - orderId: {}", orderId);
        
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            log.warn("Unauthorized payment detail attempt - orderId: {}", orderId);
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userPrincipal.getUser().getId();
        log.info("Getting payment detail for user: {}, order: {}", userId, orderId);
        
        PaymentDetailResponse response = paymentService.getPaymentDetail(userId, orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("Payment history requested");
        
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            log.warn("Unauthorized payment history attempt");
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userPrincipal.getUser().getId();
        log.info("Getting payment history for user: {}", userId);
        
        var transactions = paymentService.getTransactionHistory(userId);
        return ResponseEntity.ok(transactions);
    }
}
