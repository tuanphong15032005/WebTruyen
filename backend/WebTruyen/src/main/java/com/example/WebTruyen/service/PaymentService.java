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
import com.example.WebTruyen.entity.model.Payment.DonationEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import com.example.WebTruyen.entity.model.Payment.PaymentOrderEntity;
import com.example.WebTruyen.repository.DonationRepository;
import com.example.WebTruyen.repository.LedgerEntryRepository;
import com.example.WebTruyen.repository.PaymentOrderRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
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

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private EntityManager entityManager;

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

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ConfirmPaymentResponse confirmPayment(Long userId, Long orderId) {
        log.info("Confirming payment - userId: {}, orderId: {}", userId, orderId);
        
        // Use pessimistic lock to prevent concurrent modifications
        PaymentOrderEntity order = paymentOrderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found id=" + orderId));

        log.info("Payment order found - status: {}, amount: {}", order.getStatus(), order.getCoinBAmount());

        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        if (order.getStatus() != PaymentOrderStatus.PENDING) {
            log.warn("Payment order {} already processed with status: {}", orderId, order.getStatus());
            // Return current balance instead of throwing error
            WalletEntity currentWallet = walletService.getOrCreateWalletEntity(userId);
            return new ConfirmPaymentResponse(currentWallet.getBalanceCoinB());
        }

        try {
            // Check if order was already paid by another thread (race condition)
            if (order.getStatus() == PaymentOrderStatus.PAID) {
                log.warn("Payment order {} was already paid by another thread", orderId);
                WalletEntity currentWallet = walletService.getOrCreateWalletEntity(userId);
                return new ConfirmPaymentResponse(currentWallet.getBalanceCoinB());
            }
            
            order.setStatus(PaymentOrderStatus.PAID);
            order.setPaidAt(LocalDateTime.now());
            paymentOrderRepository.save(order);
            log.info("Payment order updated to PAID");

            // Use walletService.addCoinB() to trigger automatic daily task tracking
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));
            
            log.info("Adding {} coins to user {}", order.getCoinBAmount(), userId);
            
            // Use unique idempotency key with orderId and timestamp to prevent duplicate ledger entries
            String idempotencyKey = "PAYMENT-" + orderId + "-" + System.currentTimeMillis();
            walletService.addCoinB(user, order.getCoinBAmount(), LedgerReason.TOPUP, idempotencyKey);
            log.info("Coins added successfully");

            // Get updated wallet balance for response
            WalletEntity updatedWallet = walletService.getOrCreateWalletEntity(userId);
            log.info("Final wallet balance: {}", updatedWallet.getBalanceCoinB());
            
            return new ConfirmPaymentResponse(updatedWallet.getBalanceCoinB());
        } catch (Exception e) {
            log.error("Error during payment confirmation", e);
            throw e; // Re-throw to maintain transaction behavior
        }
    }

    public List<TransactionHistoryResponse> getTransactionHistory(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));

        List<LedgerEntryEntity> ledgerEntries = ledgerEntryRepository.findByUserOrderByCreatedAtDesc(user);

        return ledgerEntries.stream()
                .map(entry -> {
                    String donationMessage = null;
                    String fromUserName = null;
                    String toUserName = null;
                    
                    // If this is a donation transaction, try to get the message and user info
                    if (entry.getReason() == LedgerReason.DONATE && entry.getRefId() != null &&
                        (entry.getRefType().equals("DONATION") || 
                         entry.getRefType().equals("DONATION_OUT") || 
                         entry.getRefType().equals("DONATION_IN"))) {
                        try {
                            // Use JOIN FETCH to avoid LazyInitializationException
                            TypedQuery<DonationEntity> query = entityManager.createQuery(
                                "SELECT d FROM DonationEntity d " +
                                "LEFT JOIN FETCH d.fromUser " +
                                "LEFT JOIN FETCH d.toUser " +
                                "WHERE d.id = :donationId", DonationEntity.class);
                            query.setParameter("donationId", entry.getRefId());
                            DonationEntity donation = query.getResultStream().findFirst().orElse(null);
                            
                            if (donation != null) {
                                donationMessage = donation.getMessage();
                                fromUserName = donation.getFromUser().getUsername();
                                toUserName = donation.getToUser().getUsername();
                                log.info("Donation details - refId: {}, from: {}, to: {}, message: {}", 
                                        entry.getRefId(), fromUserName, toUserName, donationMessage);
                            } else {
                                log.warn("Donation not found for refId: {}", entry.getRefId());
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch donation details for refId: {}", entry.getRefId(), e);
                        }
                    }
                    
                    return new TransactionHistoryResponse(
                            entry.getId(),
                            entry.getCoin(),
                            entry.getDelta(),
                            entry.getBalanceAfter(),
                            entry.getReason(),
                            entry.getRefType(),
                            entry.getRefId(),
                            entry.getCreatedAt(),
                            donationMessage,
                            fromUserName,
                            toUserName
                    );
                })
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
