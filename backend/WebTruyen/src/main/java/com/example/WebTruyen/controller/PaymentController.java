package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreatePaymentOrderRequest;
import com.example.WebTruyen.dto.response.ConfirmPaymentResponse;
import com.example.WebTruyen.dto.response.CreatePaymentOrderResponse;
import com.example.WebTruyen.dto.response.PaymentDetailResponse;
import com.example.WebTruyen.dto.response.TransactionHistoryResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @RequestBody CreatePaymentOrderRequest request) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        CreatePaymentOrderResponse response = paymentService.createPaymentOrder(userPrincipal.getUser().getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<?> confirm(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @PathVariable Long orderId) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        ConfirmPaymentResponse response = paymentService.confirmPayment(userPrincipal.getUser().getId(), orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> detail(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                    @PathVariable Long orderId) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        PaymentDetailResponse response = paymentService.getPaymentDetail(userPrincipal.getUser().getId(), orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        var transactions = paymentService.getTransactionHistory(userPrincipal.getUser().getId());
        return ResponseEntity.ok(transactions);
    }
}
