package com.example.WebTruyen.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.WebTruyen.dto.response.AdminFinanceRequestResponse;
import com.example.WebTruyen.dto.response.RefundEligibleTransactionResponse;
import com.example.WebTruyen.dto.response.RefundRequestHistoryResponse;
import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.dto.response.WithdrawRequestHistoryResponse;
import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.enums.NotificationKind;
import com.example.WebTruyen.entity.enums.WithdrawStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.WalletEntity;
import com.example.WebTruyen.entity.model.Payment.ChapterUnlockEntity;
import com.example.WebTruyen.entity.model.Payment.DonationEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterUnlockRepository;
import com.example.WebTruyen.repository.DonationRepository;
import com.example.WebTruyen.repository.LedgerEntryRepository;
import com.example.WebTruyen.repository.NotificationRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import com.example.WebTruyen.repository.WithdrawRequestRepository;
import com.example.WebTruyen.repository.WithdrawRuleRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Service
public class WalletService {

    // Change this value to adjust how long chapter revenue remains pending before settlement.
    private static final long CHAPTER_PURCHASE_HOLD_SECONDS = 30L;

    // Change this value to adjust how often the scheduler checks pending chapter revenue.
    private static final long CHAPTER_PENDING_SETTLEMENT_CHECK_INTERVAL_MS = 10_000L;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private ChapterUnlockRepository chapterUnlockRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private WithdrawRequestRepository withdrawRequestRepository;

    @Autowired
    private WithdrawRuleRepository withdrawRuleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    @Lazy
    private SimpleDailyTaskService simpleDailyTaskService;

    @Autowired
    @Lazy
    private DailyTaskOrchestrator dailyTaskOrchestrator;

    public WalletResponse getWallet(Long userId) {
        WalletEntity wallet = walletRepository.findById(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        return new WalletResponse(wallet.getBalanceCoinA(), wallet.getBalanceCoinB(), wallet.getPendingCoinB());
    }

        public WalletEntity getOrCreateWalletEntity(Long userId) {
            return walletRepository.findById(userId)
                    .orElseGet(() -> createDefaultWallet(userId));
        }

    private WalletEntity createDefaultWallet(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found userId=" + userId));

        WalletEntity wallet = WalletEntity.builder()
                .user(user)
                .balanceCoinA(0L)
                .balanceCoinB(0L)
                .pendingCoinB(0L)
                .reservedCoinB(0L)
                .updatedAt(LocalDateTime.now())
                .build();

        try {
            return walletRepository.save(wallet);
        } catch (DataIntegrityViolationException ex) {
            // Likely concurrent creation (duplicate PK user_id). Re-fetch and return existing wallet.
            return walletRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Wallet creation conflict", ex));
        }
    }

    public Map<String, Object> dailyCheckIn(Long userId) {
        WalletEntity buyerWallet = getOrCreateWalletEntity(userId);
        
        // Check if user has already received monthly bonus this month
        LocalDate now = LocalDate.now();
        LocalDate firstDayOfMonth = now.withDayOfMonth(1);
        
        log.info("Checking monthly bonus for user {} - current date: {}, first day: {}", userId, now, firstDayOfMonth);
        
        List<LedgerEntryEntity> existingMonthlyBonus = ledgerEntryRepository
                .findByUserIdAndReason(userId, LedgerReason.EARN)
                .stream()
                .filter(entry -> "MONTHLY_BONUS".equals(entry.getRefId()))
                .filter(entry -> {
                    // Check if the bonus was received this month
                    LocalDateTime entryTime = entry.getCreatedAt();
                    if (entryTime == null) return false;
                    
                    LocalDate entryDate = entryTime.toLocalDate();
                    boolean isThisMonth = !entryDate.isBefore(firstDayOfMonth) &&
                           entryDate.getMonthValue() == now.getMonthValue() &&
                           entryDate.getYear() == now.getYear();
                    
                    log.info("Found monthly bonus entry - date: {}, thisMonth: {}, refId: {}", 
                            entryDate, isThisMonth, entry.getRefId());
                    
                    return isThisMonth;
                })
                .collect(Collectors.toList());
        
        log.info("Monthly bonus check result - user: {}, found entries: {}, already claimed this month: {}", 
                userId, existingMonthlyBonus.size(), !existingMonthlyBonus.isEmpty());
        
        if (!existingMonthlyBonus.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Bạn đã nhận thưởng tháng này rồi!");
            response.put("alreadyClaimed", true);
            return response;
        }
        
        // Add 5000 coin A as monthly bonus
        Long currentBalance = buyerWallet.getBalanceCoinA();
        Long addedAmount = 5000L;
        Long newBalance = currentBalance + addedAmount;
        
        // Update wallet
        buyerWallet.setBalanceCoinA(newBalance);
        buyerWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(buyerWallet);
        
        // Create ledger entry for monthly bonus
        createLedgerEntry(userId, CoinType.A, addedAmount, LedgerReason.EARN, 
            "MONTHLY_BONUS", "Thưởng tháng");
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("newCoinBalance", newBalance);
        response.put("addedAmount", addedAmount);
        response.put("message", "Nhận thưởng tháng thành công!");
        
        return response;
    }

    @Scheduled(fixedDelay = CHAPTER_PENDING_SETTLEMENT_CHECK_INTERVAL_MS)
    @Transactional
    public void settlePendingChapterRevenue() {
        LocalDateTime now = LocalDateTime.now();
        List<ChapterUnlockEntity> dueUnlocks = chapterUnlockRepository
                .findAllBySettledAtIsNullAndHoldUntilLessThanEqualOrderByHoldUntilAsc(now);

        if (dueUnlocks.isEmpty()) {
            return;
        }

        log.info("Found {} chapter unlock(s) ready for settlement at {}", dueUnlocks.size(), now);

        for (ChapterUnlockEntity unlock : dueUnlocks) {
            settleChapterUnlockRevenue(unlock, now);
        }
    }

    @Transactional
    public Map<String, Object> purchaseChapter(Long userId, Long chapterId) {
        // Verify chapter exists first
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        StoryEntity story = chapter.getVolume().getStory();
        UserEntity author = story.getAuthor();
        if (author == null || author.getId() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Story author not found");
        }

        if (userId.equals(author.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tác giả có thể đọc chương của mình miễn phí, không cần mua");
        }

        Long actualChapterPrice = chapter.getPriceCoin();
        Long chapterPrice = actualChapterPrice;
        if (chapter.isFree() || actualChapterPrice == null || actualChapterPrice <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chương này không yêu cầu giao dịch mua");
        }

        // Check if chapter is already unlocked BEFORE deducting coins
        if (chapterUnlockRepository.existsByUserIdAndChapterId(userId, chapterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chương này đã được mua rồi");
        }

        WalletEntity buyerWallet = getOrCreateWalletEntity(userId);
        
        // Check if user has enough coins (prefer coin A first, then coin B)
        Long currentBalanceB = buyerWallet.getBalanceCoinB();
        Long currentBalanceA = buyerWallet.getBalanceCoinA();
        Long totalBalance = currentBalanceB + currentBalanceA;
        
        if (totalBalance < actualChapterPrice) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Không đủ coin để mua chương. Cần " + chapterPrice + " coin, chỉ có " + totalBalance + " coin");
        }
        
        // Calculate deduction: prefer coin A first, then coin B
        Long deductFromA = Math.min(currentBalanceA, actualChapterPrice);
        Long remainingPrice = actualChapterPrice - deductFromA;
        Long deductFromB = remainingPrice;
        LocalDateTime now = LocalDateTime.now();

        // Update wallet balances
        Long newBalanceB = currentBalanceB - deductFromB;
        Long newBalanceA = currentBalanceA - deductFromA;
        
        buyerWallet.setBalanceCoinB(newBalanceB);
        buyerWallet.setBalanceCoinA(newBalanceA);
        buyerWallet.setUpdatedAt(now);
        walletRepository.save(buyerWallet);

        WalletEntity authorWallet = getOrCreateWalletEntity(author.getId());
        Long newAuthorPendingCoinB = authorWallet.getPendingCoinB() + actualChapterPrice;
        authorWallet.setPendingCoinB(newAuthorPendingCoinB);
        authorWallet.setUpdatedAt(now);
        walletRepository.save(authorWallet);

        // Create chapter unlock record
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        LocalDateTime holdUntil = now.plusSeconds(CHAPTER_PURCHASE_HOLD_SECONDS);

        ChapterUnlockEntity unlock = ChapterUnlockEntity.builder()
                .user(user)
                .chapter(chapter)
                .paidCoin(deductFromA > 0 ? CoinType.A : CoinType.B)
                .coinCost(actualChapterPrice)
                .holdUntil(holdUntil)
                .settledAt(null)
                .createdAt(now)
                .build();
        
        ChapterUnlockEntity savedUnlock = chapterUnlockRepository.save(unlock);

        // Track chapter unlock for daily task using orchestrator
        try {
            log.info("Tracking chapter unlock for daily task - user: {}, chapter: {}", userId, chapterId);
            dailyTaskOrchestrator.trackUserActivity(userId, DailyTaskOrchestrator.ActivityType.UNLOCK_CHAPTER);
            log.info("Successfully tracked chapter unlock for daily task");
        } catch (Exception e) {
            // Don't fail the unlock process if daily task tracking fails
            log.warn("Failed to track chapter unlock for daily task - user: {}, chapter: {}, error: {}", userId, chapterId, e.getMessage());
        }
        
        // Create ledger entries for the transaction
        if (deductFromA > 0) {
            createLedgerEntry(userId, CoinType.A, -deductFromA, LedgerReason.SPEND_CHAPTER, 
                "CHAPTER", "Mua chương " + chapter.getTitle());
        }
        if (deductFromB > 0) {
            createLedgerEntry(userId, CoinType.B, -deductFromB, LedgerReason.SPEND_CHAPTER, 
                "CHAPTER", "Mua chương " + chapter.getTitle());
        }
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("newBalanceA", newBalanceA);
        response.put("newBalanceB", newBalanceB);
        response.put("deductedFromA", deductFromA);
        response.put("deductedFromB", deductFromB);
        response.put("totalPrice", chapterPrice);
        response.put("chapterId", chapterId);
        response.put("chapterUnlockId", savedUnlock.getId());
        response.put("holdUntil", holdUntil);
        response.put("authorPendingCoinB", newAuthorPendingCoinB);
        response.put("message", "Mua chương thành công!");
        
        return response;
    }

    public Map<String, Object> donateToAuthor(Long fromUserId, Long toUserId, Long coinBAmount, String message) {
        // Validate users
        UserEntity fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donor not found"));
        
        UserEntity toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

        // Ngăn user tự donate cho bản thân (defense-in-depth)
        if (fromUserId.equals(toUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự ủng hộ bản thân!");
        }

        // Check if donor has enough Coin B
        WalletEntity donorWallet = getOrCreateWalletEntity(fromUserId);
        if (donorWallet.getBalanceCoinB() < coinBAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Insufficient Coin B balance. Need " + coinBAmount + " 💎, only have " + donorWallet.getBalanceCoinB() + " 💎");
        }

        // Deduct coins from donor and track daily task for making donation
        Long newDonorBalance = donorWallet.getBalanceCoinB() - coinBAmount;
        donorWallet.setBalanceCoinB(newDonorBalance);
        donorWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(donorWallet);
        
        // Track donation daily task for the donor
        try {
            log.info("Auto-tracking MAKE_DONATION daily task for donor {} - amount: {}", fromUserId, coinBAmount);
            simpleDailyTaskService.updateTaskProgress(fromUserId, "MAKE_DONATION", null);
            log.info("Successfully auto-tracked MAKE_DONATION daily task for donor: {}", fromUserId);
        } catch (Exception e) {
            log.warn("Failed to auto-track MAKE_DONATION daily task for donor: {}", fromUserId, e);
        }

        // Directly update author wallet without triggering daily task (receiving donation shouldn't complete "make donation" task)
        WalletEntity authorWallet = getOrCreateWalletEntity(toUserId);
        Long newAuthorBalance = authorWallet.getBalanceCoinB() + coinBAmount;
        authorWallet.setBalanceCoinB(newAuthorBalance);
        authorWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(authorWallet);

        // Create donation record first to get the ID
        DonationEntity donation = DonationEntity.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .paidCoin(CoinType.B)
                .amountCoin(coinBAmount)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
        
        DonationEntity savedDonation = donationRepository.save(donation);

        // Create ledger entries with message in description
        String donateOutDescription = "Donate to " + toUser.getUsername();
        if (message != null && !message.trim().isEmpty()) {
            donateOutDescription += ": " + message;
        }
        
        String donateInDescription = "Receive donation from " + fromUser.getUsername();
        if (message != null && !message.trim().isEmpty()) {
            donateInDescription += ": " + message;
        }
        
        // Create ledger entries with proper refType and refId pointing to donation
        createDonationLedgerEntry(fromUserId, CoinType.B, -coinBAmount, 
            "DONATION", savedDonation.getId(), donateOutDescription);
        
        createDonationLedgerEntry(toUserId, CoinType.B, coinBAmount, 
            "DONATION", savedDonation.getId(), donateInDescription);

        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("donationAmount", coinBAmount);
        response.put("newDonorBalance", newDonorBalance);
        response.put("newAuthorBalance", newAuthorBalance);
        response.put("authorName", toUser.getUsername());
        response.put("message", "Donation successful!");
        
        return response;
    }

    // MinhHQ – ngày 16/03/2026
    // [Tạo yêu cầu rút tiền Coin B: kiểm tra số dư, tính phí, khóa coin và tạo request chờ duyệt - V2 - branch: minhfinal2]
    @Transactional
    public com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity withdrawCreateRequest(
            Long userId,
            Long amountB,
            String bankAccountNumber,
            String accountHolderName,
            String bankName
    ) {
        final long minimumRequiredAmount = 10000L;
        if (amountB == null || amountB <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền rút không hợp lệ");
        }
        if (bankAccountNumber == null || bankAccountNumber.trim().isEmpty()
                || accountHolderName == null || accountHolderName.trim().isEmpty()
                || bankName == null || bankName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin tài khoản ngân hàng không đầy đủ");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        WalletEntity wallet = getOrCreateWalletEntity(userId);

        // Lấy rule rút tiền hiện tại cho Coin B
        var ruleOpt = withdrawRuleRepository.findFirstByCoinAndActiveIsTrueOrderByIdDesc("B");
        long minWithdraw;
        long feeCoinB;

        if (ruleOpt.isPresent()) {
            var rule = ruleOpt.get();
            minWithdraw = rule.getMinWithdrawCoinB();

            BigDecimal feeValue = rule.getFeeValue();
            switch (rule.getFeeType()) {
                case PERCENT -> {
                    BigDecimal amount = BigDecimal.valueOf(amountB);
                    feeCoinB = amount.multiply(feeValue)
                            .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP)
                            .longValue();
                }
                case FIXED -> feeCoinB = feeValue.longValue();
                default -> feeCoinB = 0L;
            }
        } else {
            // Fallback: phí 5%
            minWithdraw = 1L;
            BigDecimal amount = BigDecimal.valueOf(amountB);
            feeCoinB = amount.multiply(BigDecimal.valueOf(5))
                    .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP)
                    .longValue();
        }

        minWithdraw = Math.max(minWithdraw, minimumRequiredAmount);

        if (amountB < minWithdraw) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền rút phải lớn hơn 10000 Kim cương B");
        }

        if (wallet.getBalanceCoinB() < amountB) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số dư Coin B không đủ để rút");
        }

        long netCoinB = amountB - feeCoinB;
        if (netCoinB <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thực nhận phải lớn hơn 0");
        }

        // Trừ Coin B trong ví
        long newBalanceB = wallet.getBalanceCoinB() - amountB;
        wallet.setBalanceCoinB(newBalanceB);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Ghi lịch sử rút tiền
        createLedgerEntry(userId, CoinType.B, -amountB, LedgerReason.WITHDRAW,
                "WITHDRAW_REQUEST", "Yêu cầu rút Coin B");

        String paymentDetails = String.format(
                "requestType=WITHDRAW;bankAccountNumber=%s;accountHolderName=%s;bankName=%s",
                bankAccountNumber, accountHolderName, bankName
        );

        com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity entity =
                com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity.builder()
                        .user(user)
                        .coinBAmount(amountB)
                        .feeCoinB(feeCoinB)
                        .netCoinB(netCoinB)
                        .paymentMethodDetails(paymentDetails)
                        .status(com.example.WebTruyen.entity.enums.WithdrawStatus.REQUESTED)
                        .requestedAt(LocalDateTime.now())
                        .build();

        return withdrawRequestRepository.save(entity);
    }

    // MinhHQ – ngày 16/03/2026
    // [Lấy lịch sử yêu cầu rút tiền của tác giả theo thời gian mới nhất - V2 - branch: minhfinal2]
    public List<WithdrawRequestHistoryResponse> withdrawGetUserRequests(Long userId) {
        return withdrawRequestRepository.findByUserIdOrderByRequestedAtDesc(userId)
                .stream()
                .map(this::mapWithdrawRequestHistory)
                .toList();
    }

    // MinhHQ – ngày 16/03/2026
    // [Lấy danh sách giao dịch đủ điều kiện hoàn tiền và tính hạn mức hoàn theo số dư hiện tại - V2 - branch: minhfinal2]
    public List<RefundEligibleTransactionResponse> refundGetEligibleTransactions(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        WalletEntity wallet = getOrCreateWalletEntity(userId);
        Long balanceCoinB = wallet.getBalanceCoinB();
        long currentCoinB = balanceCoinB == null ? 0L : balanceCoinB.longValue();

        return ledgerEntryRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .filter(entry -> entry.getCoin() == CoinType.B)
                .filter(this::isRefundEligibleEntry)
                .map(entry -> mapRefundEligibleEntry(entry, currentCoinB))
                .filter(item -> {
                    Long maxRefundAmount = item.getMaxRefundAmount();
                    return maxRefundAmount != null && maxRefundAmount > 0;
                })
                .toList();
    }

    // MinhHQ – ngày 16/03/2026
    // [Tạo yêu cầu hoàn tiền: kiểm tra giao dịch hợp lệ, khóa coin và lưu thông tin ngân hàng nhận hoàn - V2 - branch: minhfinal2]
    @Transactional
    public WithdrawRequestEntity refundCreateRequest(
            Long userId,
            Long transactionId,
            Long refundAmount,
            String refundReason,
            String bankAccountNumber,
            String accountHolderName,
            String bankName
    ) {
        if (transactionId == null || transactionId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giao dịch hoàn tiền không hợp lệ");
        }
        if (refundAmount == null || refundAmount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền hoàn không hợp lệ");
        }
        if (refundReason == null || refundReason.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do hoàn tiền");
        }
        if (bankAccountNumber == null || bankAccountNumber.trim().isEmpty()
                || accountHolderName == null || accountHolderName.trim().isEmpty()
                || bankName == null || bankName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin nhận hoàn tiền không đầy đủ");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        LedgerEntryEntity selectedTransaction = ledgerEntryRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch đã chọn"));

        if (selectedTransaction.getCoin() != CoinType.B || !isRefundEligibleEntry(selectedTransaction)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giao dịch này không hỗ trợ yêu cầu hoàn tiền");
        }

        long originalAmount = Math.abs(Optional.ofNullable(selectedTransaction.getDelta()).orElse(0L));
        if (originalAmount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền giao dịch gốc không hợp lệ");
        }

        WalletEntity wallet = getOrCreateWalletEntity(userId);
        Long balanceCoinB = wallet.getBalanceCoinB();
        long currentCoinB = balanceCoinB == null ? 0L : balanceCoinB.longValue();
        long maxRefundAmount = Math.min(originalAmount, currentCoinB);
        if (maxRefundAmount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số dư kim cương hiện tại không đủ để tạo yêu cầu hoàn tiền");
        }
        if (refundAmount > maxRefundAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số tiền hoàn tối đa cho giao dịch này là " + maxRefundAmount + " Kim cương");
        }

        String transactionMarker = "requestType=REFUND;transactionId=" + transactionId + ";";
        List<WithdrawRequestEntity> existingRequests = withdrawRequestRepository
                .findByUserIdAndPaymentMarkerOrderByRequestedAtDesc(userId, transactionMarker);
        boolean hasOpenRequest = existingRequests.stream()
                .anyMatch(req -> req.getStatus() != null
                        && req.getStatus() != com.example.WebTruyen.entity.enums.WithdrawStatus.REJECTED
                        && req.getStatus() != com.example.WebTruyen.entity.enums.WithdrawStatus.CANCELLED);
        if (hasOpenRequest) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch này đã có yêu cầu hoàn tiền trước đó");
        }

        long newBalanceB = currentCoinB - refundAmount;
        wallet.setBalanceCoinB(newBalanceB);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        createLedgerEntry(userId, CoinType.B, -refundAmount, LedgerReason.WITHDRAW,
                "REFUND_REQUEST", "Tạm giữ kim cương cho yêu cầu hoàn tiền");

        String paymentDetails = String.format(
                "requestType=REFUND;coinLocked=true;transactionId=%d;transactionType=%s;originalAmount=%d;refundAmount=%d;refundReason=%s;bankAccountNumber=%s;accountHolderName=%s;bankName=%s",
                transactionId,
                resolveTransactionTypeLabel(selectedTransaction),
                originalAmount,
                refundAmount,
                sanitizePaymentDetailValue(refundReason),
                sanitizePaymentDetailValue(bankAccountNumber),
                sanitizePaymentDetailValue(accountHolderName),
                sanitizePaymentDetailValue(bankName)
        );

        WithdrawRequestEntity entity = WithdrawRequestEntity.builder()
                .user(user)
                .coinBAmount(refundAmount)
                .feeCoinB(0L)
                .netCoinB(refundAmount)
                .paymentMethodDetails(paymentDetails)
                .status(com.example.WebTruyen.entity.enums.WithdrawStatus.REQUESTED)
                .requestedAt(LocalDateTime.now())
                .build();

        return withdrawRequestRepository.save(entity);
    }

    // MinhHQ – ngày 16/03/2026
    // [Lấy lịch sử yêu cầu hoàn tiền của người dùng theo marker requestType=REFUND - V2 - branch: minhfinal2]
    public List<RefundRequestHistoryResponse> refundGetUserRequests(Long userId) {
        String marker = "requestType=REFUND;";
        return withdrawRequestRepository.findByUserIdAndPaymentMarkerOrderByRequestedAtDesc(userId, marker)
                .stream()
                .map(this::mapRefundRequestHistory)
                .toList();
    }

    // MinhHQ – ngày 16/03/2026
    // [Màn hình tài chính admin: lọc danh sách yêu cầu rút/hoàn theo loại và trạng thái - V2 - branch: minhfinal2]
    public List<AdminFinanceRequestResponse> financeAdminGetRequests(String requestType, WithdrawStatus status) {
        return withdrawRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "requestedAt"))
                .stream()
                .filter(req -> {
                    if (requestType == null || requestType.isBlank() || "ALL".equalsIgnoreCase(requestType)) {
                        return true;
                    }
                    return requestType.equalsIgnoreCase(resolveRequestType(req));
                })
                .filter(req -> status == null || status == req.getStatus())
                .map(this::mapAdminFinanceRequest)
                .toList();
    }

    // MinhHQ – ngày 16/03/2026
    // [Admin duyệt yêu cầu tài chính và lưu audit (adminName/adminNote/adminActionAt) - V2 - branch: minhfinal2]
    @Transactional
    public WithdrawRequestEntity financeAdminApproveRequest(Long adminId, Long requestId, String note) {
        WithdrawRequestEntity request = findFinanceRequest(requestId);
        if (request.getStatus() != WithdrawStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ yêu cầu đang chờ duyệt mới có thể duyệt");
        }

        UserEntity admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        request.setStatus(WithdrawStatus.APPROVED);
        request.setAdmin(admin);
        request.setPaymentMethodDetails(appendAdminAuditDetails(request.getPaymentMethodDetails(), admin.getUsername(), note));
        return withdrawRequestRepository.save(request);
    }

    // MinhHQ – ngày 16/03/2026
    // [Admin từ chối yêu cầu: hoàn lại Coin B đã tạm giữ cho người dùng rồi cập nhật trạng thái - V2 - branch: minhfinal2]
    @Transactional
    public WithdrawRequestEntity financeAdminRejectRequest(Long adminId, Long requestId, String note) {
        WithdrawRequestEntity request = findFinanceRequest(requestId);
        if (request.getStatus() != WithdrawStatus.REQUESTED && request.getStatus() != WithdrawStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ yêu cầu đang xử lý mới có thể từ chối");
        }

        UserEntity admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        refundCoinBToUser(request.getUser().getId(), request.getCoinBAmount());

        request.setStatus(WithdrawStatus.REJECTED);
        request.setAdmin(admin);
        request.setPaymentMethodDetails(appendAdminAuditDetails(request.getPaymentMethodDetails(), admin.getUsername(), note));
        return withdrawRequestRepository.save(request);
    }

    // MinhHQ – ngày 16/03/2026
    // [Admin đánh dấu hoàn tất chi trả/hoàn tiền và ghi nhận thời điểm paidAt - V2 - branch: minhfinal2]
    @Transactional
    public WithdrawRequestEntity financeAdminMarkCompleted(Long adminId, Long requestId, String note) {
        WithdrawRequestEntity request = findFinanceRequest(requestId);
        if (request.getStatus() != WithdrawStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ yêu cầu đã duyệt mới có thể đánh dấu hoàn tất");
        }

        UserEntity admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        request.setStatus(WithdrawStatus.PAID);
        request.setPaidAt(LocalDateTime.now());
        request.setAdmin(admin);
        request.setPaymentMethodDetails(appendAdminAuditDetails(request.getPaymentMethodDetails(), admin.getUsername(), note));
        return withdrawRequestRepository.save(request);
    }

    // MinhHQ – ngày 16/03/2026
    // [Map dữ liệu lịch sử rút tiền cho frontend tác giả (amount/fee/net/status/time) - V2 - branch: minhfinal2]
    private WithdrawRequestHistoryResponse mapWithdrawRequestHistory(WithdrawRequestEntity entity) {
        return WithdrawRequestHistoryResponse.builder()
                .id(entity.getId())
                .coinBAmount(entity.getCoinBAmount())
                .feeCoinB(entity.getFeeCoinB())
                .netCoinB(entity.getNetCoinB())
                .status(entity.getStatus())
                .requestedAt(entity.getRequestedAt())
                .paidAt(entity.getPaidAt())
                .build();
    }

    // MinhHQ – ngày 16/03/2026
    // [Map dữ liệu chi tiết yêu cầu tài chính cho admin, tách nhánh WITHDRAW và REFUND - V2 - branch: minhfinal2]
    private AdminFinanceRequestResponse mapAdminFinanceRequest(WithdrawRequestEntity entity) {
        String details = entity.getPaymentMethodDetails() == null ? "" : entity.getPaymentMethodDetails();
        String requestType = resolveRequestType(entity);
        boolean isRefund = "REFUND".equalsIgnoreCase(requestType);

        String senderName = resolveSenderDisplayName(entity.getUser());
        String relatedReference = isRefund
                ? String.format("GD #%d - %s",
                parseLongDetail(details, "transactionId"),
                parseStringDetail(details, "transactionType"))
                : "Doanh thu kim cương của tác giả";

        String requestReason = isRefund
                ? parseStringDetail(details, "refundReason")
                : parseStringDetail(details, "adminNote");

        return AdminFinanceRequestResponse.builder()
                .id(entity.getId())
                .requestType(requestType)
                .senderId(entity.getUser() != null ? entity.getUser().getId() : null)
                .senderName(senderName)
                .amountCoinB(entity.getCoinBAmount())
                .relatedReference(relatedReference)
                .bankAccountNumber(parseStringDetail(details, "bankAccountNumber"))
                .accountHolderName(parseStringDetail(details, "accountHolderName"))
                .bankName(parseStringDetail(details, "bankName"))
                .requestReason(requestReason)
                .status(entity.getStatus())
                .requestedAt(entity.getRequestedAt())
                .paidAt(entity.getPaidAt())
                .adminName(entity.getAdmin() != null ? entity.getAdmin().getUsername() : "")
                .build();
    }

    // MinhHQ – ngày 16/03/2026
    // [Map giao dịch đủ điều kiện hoàn với maxRefundAmount = min(originalAmount, currentCoinB) - V2 - branch: minhfinal2]
    private RefundEligibleTransactionResponse mapRefundEligibleEntry(LedgerEntryEntity entry, long currentCoinB) {
        long originalAmount = Math.abs(Optional.ofNullable(entry.getDelta()).orElse(0L));
        long maxRefundAmount = Math.min(originalAmount, currentCoinB);
        return RefundEligibleTransactionResponse.builder()
                .transactionId(entry.getId())
                .transactionType(resolveTransactionTypeLabel(entry))
                .originalAmount(originalAmount)
                .maxRefundAmount(maxRefundAmount)
                .description(resolveTransactionDescription(entry))
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private boolean isRefundEligibleEntry(LedgerEntryEntity entry) {
        if (entry == null || entry.getReason() == null || entry.getDelta() == null) {
            return false;
        }
        return switch (entry.getReason()) {
            case TOPUP -> entry.getDelta() > 0;
            case SPEND_CHAPTER, DONATE -> entry.getDelta() < 0;
            default -> false;
        };
    }

    private String resolveTransactionTypeLabel(LedgerEntryEntity entry) {
        if (entry == null || entry.getReason() == null) {
            return "Thanh toán khác";
        }
        return switch (entry.getReason()) {
            case TOPUP -> "Nạp Coin";
            case SPEND_CHAPTER -> "Mua chương";
            case DONATE -> "Donate";
            default -> "Thanh toán khác";
        };
    }

    private String resolveTransactionDescription(LedgerEntryEntity entry) {
        String refType = entry.getRefType() == null ? "" : entry.getRefType();
        return switch (entry.getReason()) {
            case TOPUP -> "Nạp kim cương vào ví";
            case SPEND_CHAPTER -> "Thanh toán mở khóa chương truyện";
            case DONATE -> "Ủng hộ tác giả";
            default -> "Giao dịch " + refType;
        };
    }

    // MinhHQ – ngày 16/03/2026
    // [Map lịch sử yêu cầu hoàn tiền từ paymentMethodDetails cho trang người dùng - V2 - branch: minhfinal2]
    private RefundRequestHistoryResponse mapRefundRequestHistory(WithdrawRequestEntity entity) {
        String details = entity.getPaymentMethodDetails() == null ? "" : entity.getPaymentMethodDetails();
        return RefundRequestHistoryResponse.builder()
                .id(entity.getId())
                .transactionId(parseLongDetail(details, "transactionId"))
                .transactionType(parseStringDetail(details, "transactionType"))
                .originalAmount(parseLongDetail(details, "originalAmount"))
                .refundAmount(parseLongDetail(details, "refundAmount"))
                .refundReason(parseStringDetail(details, "refundReason"))
                .bankAccountNumber(parseStringDetail(details, "bankAccountNumber"))
                .accountHolderName(parseStringDetail(details, "accountHolderName"))
                .bankName(parseStringDetail(details, "bankName"))
                .status(entity.getStatus())
                .requestedAt(entity.getRequestedAt())
                .paidAt(entity.getPaidAt())
                .build();
    }

    private String parseStringDetail(String details, String key) {
        String marker = key + "=";
        int start = details.indexOf(marker);
        if (start < 0) {
            return "";
        }
        int valueStart = start + marker.length();
        int end = details.indexOf(';', valueStart);
        if (end < 0) {
            end = details.length();
        }
        return details.substring(valueStart, end);
    }

    private Long parseLongDetail(String details, String key) {
        String value = parseStringDetail(details, key);
        if (value.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private String sanitizePaymentDetailValue(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replace(";", ",");
    }

    private WithdrawRequestEntity findFinanceRequest(Long requestId) {
        return withdrawRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu tài chính"));
    }

    // MinhHQ – ngày 16/03/2026
    // [Hoàn Coin B về ví khi yêu cầu bị từ chối và ghi ledger ADJUST để đối soát - V2 - branch: minhfinal2]
    private void refundCoinBToUser(Long userId, Long amount) {
        long refundAmount = amount == null ? 0L : amount;
        if (refundAmount <= 0) {
            return;
        }
        WalletEntity wallet = getOrCreateWalletEntity(userId);
        long currentCoinB = wallet.getBalanceCoinB() == null ? 0L : wallet.getBalanceCoinB();
        wallet.setBalanceCoinB(currentCoinB + refundAmount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        createLedgerEntry(userId, CoinType.B, refundAmount, LedgerReason.ADJUST,
                "REQUEST_REJECT_REFUND", "Hoàn lại kim cương khi admin từ chối yêu cầu");
    }

    private String resolveRequestType(WithdrawRequestEntity entity) {
        String details = entity.getPaymentMethodDetails() == null ? "" : entity.getPaymentMethodDetails();
        String requestType = parseStringDetail(details, "requestType");
        if (requestType != null && !requestType.isBlank()) {
            return requestType.trim().toUpperCase();
        }
        return "WITHDRAW";
    }

    private String resolveSenderDisplayName(UserEntity user) {
        if (user == null) {
            return "Không rõ";
        }
        if (user.getAuthorPenName() != null && !user.getAuthorPenName().isBlank()) {
            return user.getAuthorPenName();
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getUsername();
    }

    private String appendAdminAuditDetails(String details, String adminName, String note) {
        String base = details == null ? "" : details;
        String safeAdminName = sanitizePaymentDetailValue(adminName);
        String safeNote = sanitizePaymentDetailValue(note);
        return base
                + ";adminName=" + safeAdminName
                + ";adminNote=" + safeNote
                + ";adminActionAt=" + LocalDateTime.now();
    }

    private void settleChapterUnlockRevenue(ChapterUnlockEntity unlock, LocalDateTime settledAt) {
        UserEntity author = unlock.getChapter().getVolume().getStory().getAuthor();
        if (author == null || author.getId() == null) {
            throw new IllegalStateException("Chapter author not found for settlement unlockId=" + unlock.getId());
        }

        WalletEntity authorWallet = getOrCreateWalletEntity(author.getId());
        Long currentPendingCoinB = authorWallet.getPendingCoinB();
        Long chapterRevenue = unlock.getCoinCost();

        if (chapterRevenue == null || chapterRevenue <= 0) {
            unlock.setSettledAt(settledAt);
            chapterUnlockRepository.save(unlock);
            log.warn("Marked chapter unlock {} as settled without transfer because coinCost={}", unlock.getId(), chapterRevenue);
            return;
        }

        if (currentPendingCoinB == null || currentPendingCoinB < chapterRevenue) {
            throw new IllegalStateException("Insufficient pending Coin B for settlement unlockId=" + unlock.getId());
        }

        Long newPendingCoinB = currentPendingCoinB - chapterRevenue;
        Long newBalanceCoinB = authorWallet.getBalanceCoinB() + chapterRevenue;

        authorWallet.setPendingCoinB(newPendingCoinB);
        authorWallet.setBalanceCoinB(newBalanceCoinB);
        authorWallet.setUpdatedAt(settledAt);
        walletRepository.save(authorWallet);

        unlock.setSettledAt(settledAt);
        chapterUnlockRepository.save(unlock);

        createSettlementLedgerEntry(author, unlock, chapterRevenue, newBalanceCoinB, settledAt);
        createSettlementNotification(author, unlock, chapterRevenue, settledAt);

        log.info("Settled chapter unlock {} for author {} with {} Coin B", unlock.getId(), author.getId(), chapterRevenue);
    }

    private void createSettlementLedgerEntry(UserEntity author, ChapterUnlockEntity unlock, Long amount,
                                             Long balanceAfter, LocalDateTime createdAt) {
        String idempotencyKey = "CHAPTER_SETTLEMENT_" + unlock.getId();
        if (ledgerEntryRepository.existsByIdempotencyKey(idempotencyKey)) {
            return;
        }

        LedgerEntryEntity entry = LedgerEntryEntity.builder()
                .user(author)
                .coin(CoinType.B)
                .delta(amount)
                .balanceAfter(balanceAfter)
                .reason(LedgerReason.EARN)
                .refType("CHAPTER_SETTLEMENT")
                .refId(unlock.getId())
                .idempotencyKey(idempotencyKey)
                .createdAt(createdAt)
                .build();

        ledgerEntryRepository.save(entry);
    }

    private void createSettlementNotification(UserEntity author, ChapterUnlockEntity unlock, Long amount,
                                              LocalDateTime createdAt) {
        NotificationEntity notification = NotificationEntity.builder()
                .user(author)
                .kind(NotificationKind.system)
                .message("Doanh thu chương \"" + unlock.getChapter().getTitle() + "\" đã được cộng " + amount + " Coin B vào ví.")
                .refType("CHAPTER_SETTLEMENT")
                .refId(unlock.getId())
                .storyId(unlock.getChapter().getVolume().getStory().getId())
                .chapterId(unlock.getChapter().getId())
                .createdAt(createdAt)
                .build();

        notificationRepository.save(notification);
    }

    private void createDonationLedgerEntry(Long userId, CoinType coinType, Long delta,
                                         String refType, Long refId, String description) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        // Use different refTypes for debit and credit to avoid unique constraint violation
        String finalRefType = delta < 0 ? "DONATION_OUT" : "DONATION_IN";

        // Generate a unique idempotency key using timestamp and random component
        String idempotencyKey = String.format("D%d_%d_%s_%d", userId, refId, coinType.name().charAt(0), System.currentTimeMillis() % 1000000);
        
        // Check if similar entry already exists to prevent duplicate constraint violation
        try {
            if (!ledgerEntryRepository.existsByIdempotencyKey(idempotencyKey)) {
                LedgerEntryEntity entry = LedgerEntryEntity.builder()
                        .user(user)
                        .coin(coinType)
                        .delta(delta)
                        .reason(LedgerReason.DONATE)
                        .refType(finalRefType)
                        .refId(refId)
                        .idempotencyKey(idempotencyKey)
                        .createdAt(LocalDateTime.now())
                        .build();

                ledgerEntryRepository.save(entry);
            }
        } catch (DataIntegrityViolationException e) {
            // Log the error but don't fail the donation
            log.warn("Ledger entry already exists for donation {} - user {} - coin {}: {}",
                    refId, userId, coinType, e.getMessage());
        }
    }

    private void createLedgerEntry(Long userId, CoinType coinType, Long delta, 
                                  LedgerReason reason, String refType, String description) {
        createLedgerEntry(userId, coinType, delta, reason, refType, description, null);
    }

    private void createLedgerEntry(Long userId, CoinType coinType, Long delta,
                                  LedgerReason reason, String refType, String description, String idempotencyKey) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        // Use provided idempotency key or generate default one
        String finalIdempotencyKey = idempotencyKey != null ? idempotencyKey :
            String.format("%s%d_%c_%d", refType.substring(0, Math.min(5, refType.length())),
                          userId, coinType.name().charAt(0), System.currentTimeMillis() % 1000000);
        
        // Create ledger entry for all transaction types
        // Use timestamp as refId since transactions don't have a specific reference ID
        Long refId = System.currentTimeMillis();
        
        LedgerEntryEntity entry = LedgerEntryEntity.builder()
                .user(user)
                .coin(coinType)
                .delta(delta)
                .reason(reason)
                .refType(refType)
                .refId(refId)
                .idempotencyKey(finalIdempotencyKey)
                .createdAt(LocalDateTime.now())
                .build();
        
        try {
            ledgerEntryRepository.save(entry);
            log.info("Successfully created ledger entry: user {}, amount {} {}, reason {}", 
                    userId, delta, coinType, reason);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            log.error("Failed to create ledger entry: user {}, amount {} {}, reason {}", 
                    userId, delta, coinType, reason, e);
        }
    }

    public void addCoinA(UserEntity user, Long amount, LedgerReason reason, String refType, String description) {
        WalletEntity wallet = getOrCreateWalletEntity(user.getId());
        Long newBalance = wallet.getBalanceCoinA() + amount;
        wallet.setBalanceCoinA(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        
        // Create ledger entry
        createLedgerEntry(user.getId(), CoinType.A, amount, reason, 
            refType, description);
    }

    public void addCoinB(UserEntity user, Long amount, LedgerReason reason) {
        addCoinB(user, amount, reason, null);
    }

    public void addCoinB(UserEntity user, Long amount, LedgerReason reason, String idempotencyKey) {
        // 1. Lấy wallet
        WalletEntity wallet = getOrCreateWalletEntity(user.getId());
        // 2. Lấy balance cũ
        Long newBalance = wallet.getBalanceCoinB() + amount;
        // 3. Cộng coin
        wallet.setBalanceCoinB(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // 4. Ghi ledger entry (lịch sử giao dịch) với refType phù hợp
        String refType = switch (reason) {
            case TOPUP -> "TOPUP";
            case DONATE -> "DONATION";
            case WITHDRAW -> "WITHDRAW";
            case SPEND_CHAPTER -> "CHAPTER";
            case ADJUST -> "ADJUST";
            case REVIEW_REWARD -> "REVIEW_REWARD";
            default -> "OTHER";
        };

        String description = switch (reason) {
            case TOPUP -> "Nạp tiền";
            case DONATE -> "Nhận donation";
            case WITHDRAW -> "Rút tiền";
            case SPEND_CHAPTER -> "Mua chương";
            case ADJUST -> "ADJUST";
            case REVIEW_REWARD -> "Thưởng review";
            default -> "Giao dịch khác";
        };
        
        createLedgerEntry(user.getId(), CoinType.B, amount, reason, 
            refType, description, idempotencyKey);
        
        // Auto-track daily task for topup only (donation is tracked separately)
        if (reason == LedgerReason.TOPUP) {
            trackTopupDailyTask(user.getId(), amount);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void trackTopupDailyTask(Long userId, Long amount) {
        try {
            log.info("Auto-tracking MAKE_TOPUP daily task for user {} - amount: {}", userId, amount);
            
            // Check if the mission exists for today before attempting to track
            if (simpleDailyTaskService.isMissionAvailable("MAKE_TOPUP")) {
                simpleDailyTaskService.updateTaskProgress(userId, "MAKE_TOPUP", null);
                log.info("Successfully auto-tracked MAKE_TOPUP daily task for user: {}", userId);
            } else {
                log.info("MAKE_TOPUP daily mission not available for today, skipping tracking for user: {}", userId);
            }
        } catch (Exception e) {
            // Don't fail the coin addition if daily task tracking fails
            log.warn("Failed to auto-track MAKE_TOPUP daily task for user: {}", userId, e);
        }
    }
}
