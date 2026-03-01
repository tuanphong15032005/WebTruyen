package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CreatePaymentOrderRequest;
import com.example.WebTruyen.dto.response.ConfirmPaymentResponse;
import com.example.WebTruyen.dto.response.CreatePaymentOrderResponse;
import com.example.WebTruyen.dto.response.PaymentDetailResponse;
import com.example.WebTruyen.dto.response.TransactionHistoryResponse;
import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.WalletEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import com.example.WebTruyen.entity.model.Payment.PaymentOrderEntity;
import com.example.WebTruyen.repository.LedgerEntryRepository;
import com.example.WebTruyen.repository.PaymentOrderRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final String REF_TYPE_PAYMENT = "PAYMENT";

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletService walletService;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    public CreatePaymentOrderResponse createPaymentOrder(Long userId, CreatePaymentOrderRequest request) {
        if (request.getAmountVnd() == null || request.getAmountVnd() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amountVnd must be > 0");
        }
        if (request.getCoinBAmount() == null || request.getCoinBAmount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "coinBAmount must be > 0");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));

        PaymentOrderEntity order = PaymentOrderEntity.builder()
                .user(user)
                .orderCode(generateOrderCode())
                .amountVnd(request.getAmountVnd())
                .coinBAmount(request.getCoinBAmount())
                .status(PaymentOrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        PaymentOrderEntity saved = paymentOrderRepository.save(order);
        return new CreatePaymentOrderResponse(saved.getId(), saved.getStatus());
    }

    public PaymentDetailResponse getPaymentDetail(Long userId, Long orderId) {
        PaymentOrderEntity order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found id=" + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return toDetailResponse(order);
    }

    @Transactional
    public ConfirmPaymentResponse confirmPayment(Long userId, Long orderId) {
        PaymentOrderEntity order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found id=" + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        if (order.getStatus() != PaymentOrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment order status must be PENDING");
        }

        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        paymentOrderRepository.save(order);

        // Use walletService.addCoinB() to trigger automatic daily task tracking
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));
        
        walletService.addCoinB(user, order.getCoinBAmount(), LedgerReason.TOPUP);

        // Get updated wallet balance for response
        WalletEntity updatedWallet = walletService.getOrCreateWalletEntity(userId);
        return new ConfirmPaymentResponse(updatedWallet.getBalanceCoinB());
    }

    public List<TransactionHistoryResponse> getTransactionHistory(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));

        List<LedgerEntryEntity> ledgerEntries = ledgerEntryRepository.findByUserOrderByCreatedAtDesc(user);

        return ledgerEntries.stream()
                .map(entry -> new TransactionHistoryResponse(
                        entry.getId(),
                        entry.getCoin(),
                        entry.getDelta(),
                        entry.getBalanceAfter(),
                        entry.getReason(),
                        entry.getRefType(),
                        entry.getRefId(),
                        entry.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    private PaymentDetailResponse toDetailResponse(PaymentOrderEntity order) {
        return new PaymentDetailResponse(
                order.getId(),
                order.getUser().getId(),
                order.getOrderCode(),
                order.getAmountVnd(),
                order.getCoinBAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getPaidAt()
        );
    }

    private String generateOrderCode() {
        return "ORD_" + UUID.randomUUID().toString().replace("-", "");
    }
}
