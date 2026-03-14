package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CreatePaymentOrderRequest;
import com.example.WebTruyen.dto.response.ConfirmPaymentResponse;
import com.example.WebTruyen.dto.response.CreatePaymentOrderResponse;
import com.example.WebTruyen.dto.response.PaymentDetailResponse;
import com.example.WebTruyen.dto.response.TransactionHistoryResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.PaymentService;
import com.example.WebTruyen.service.VNPayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private VNPayService vnpayService;

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

    @PostMapping("/{orderId}/vnpay-url")
    public ResponseEntity<?> createVNPayUrl(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                            @PathVariable Long orderId) {
        log.info("VNPay URL creation requested - orderId: {}", orderId);
        
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Long userId = userPrincipal.getUser().getId();
            log.info("Getting payment detail for user: {}, order: {}", userId, orderId);
            PaymentDetailResponse paymentDetail = paymentService.getPaymentDetail(userId, orderId);
            log.info("Payment detail retrieved: amount={}, orderCode={}", 
                    paymentDetail.getAmountVnd(), paymentDetail.getOrderCode());
            
            String paymentUrl = vnpayService.createPaymentUrl(
                orderId, 
                paymentDetail.getAmountVnd(), 
                "Topup Coin B - Order: " + paymentDetail.getOrderCode()
            );
            
            log.info("VNPay URL created successfully for order: {}", orderId);
            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            log.error("Error creating VNPay URL for order: {}", orderId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create payment URL: " + e.getMessage()));
        }
    }

    @GetMapping("/vnpay-test")
    public ResponseEntity<?> testVNPay() {
        try {
            String testUrl = vnpayService.createPaymentUrl(123L, 10000L, "Test payment");
            return ResponseEntity.ok(Map.of("paymentUrl", testUrl, "status", "success"));
        } catch (Exception e) {
            log.error("VNPay test failed", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "status", "failed"));
        }
    }

    @GetMapping("/vnpay-config")
    public ResponseEntity<?> checkVNPayConfig() {
        try {
            return ResponseEntity.ok(Map.of(
                "hasUrl", vnpayService != null,
                "status", "checked"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) {
        log.info("VNPay return callback received");
        
        try {
            Map<String, String> params = new HashMap<>();
            java.util.Enumeration<String> parameterNames = request.getParameterNames();
            while (parameterNames.hasMoreElements()) {
                String paramName = parameterNames.nextElement();
                String paramValue = request.getParameter(paramName);
                params.put(paramName, paramValue);
            }

            log.info("VNPay return parameters: {}", params);

            // Validate secure hash
            if (!vnpayService.validateReturnUrl(params)) {
                log.warn("Invalid VNPay return signature");
                return ResponseEntity.status(400).body(Map.of("error", "Invalid signature"));
            }

            String vnp_ResponseCode = params.get("vnp_ResponseCode");
            String vnp_TxnRef = params.get("vnp_TxnRef");
            String vnp_TransactionStatus = params.get("vnp_TransactionStatus");
            
            log.info("VNPay return - ResponseCode: {}, TransactionStatus: {}, TxnRef: {}", 
                    vnp_ResponseCode, vnp_TransactionStatus, vnp_TxnRef);
        
        if ("00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus)) {
            // Payment successful
            try {
                Long orderId = Long.parseLong(vnp_TxnRef);
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "orderId", orderId,
                    "message", "Payment successful"
                ));
            } catch (Exception e) {
                log.error("Error processing successful VNPay return", e);
                return ResponseEntity.status(500).body("Error processing payment");
            }
        } else if ("24".equals(vnp_ResponseCode)) {
            // Payment cancelled by user
            return ResponseEntity.ok(Map.of(
                "status", "cancelled",
                "message", "Payment was cancelled by user"
            ));
        } else {
            // Payment failed
            String failReason = "Payment failed";
            if (vnp_ResponseCode != null) {
                switch (vnp_ResponseCode) {
                    case "01": failReason = "Giao dịch chưa thành công"; break;
                    case "02": failReason = "Giao dịch bị lỗi"; break;
                    case "03": failReason = "Giao dịch không hợp lệ"; break;
                    case "04": failReason = "Số tiền giao dịch không hợp lệ"; break;
                    case "05": failReason = "Số dư tài khoản không đủ"; break;
                    case "06": failReason = "Mã giao dịch đã tồn tại"; break;
                    case "07": failReason = "Truy cập bị từ chối"; break;
                    case "08": failReason = "Số tiền không hợp lệ"; break;
                    case "09": failReason = "Kiểu giao dịch không hợp lệ"; break;
                    case "10": failReason = "Khách hàng chưa đăng ký dịch vụ"; break;
                    case "11": failReason = "Đã hết hạn chờ thanh toán"; break;
                    case "12": failReason = "Thẻ bị khóa"; break;
                    case "13": failReason = "Yêu cầu bị từ chối"; break;
                    case "51": failReason = "Tài khoản không đủ số dư"; break;
                    case "65": failReason = "Số dư tài khoản không đủ"; break;
                    case "75": failReason = "Quá số lần giao dịch cho phép"; break;
                    case "79": failReason = "Kích hoạt tài khoản"; break;
                    default: failReason = "Lỗi không xác định (mã: " + vnp_ResponseCode + ")"; break;
                }
            }
            return ResponseEntity.ok(Map.of(
                "status", "failed",
                "message", failReason
            ));
        }
        } catch (Exception e) {
            log.error("Error processing VNPay return", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error processing VNPay return: " + e.getMessage()
            ));
        }
    }
}
