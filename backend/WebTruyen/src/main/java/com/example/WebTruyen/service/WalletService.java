package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.enums.CoinType;
import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.WalletEntity;
import com.example.WebTruyen.entity.model.Payment.ChapterUnlockEntity;
import com.example.WebTruyen.entity.model.Payment.DonationEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.ChapterUnlockRepository;
import com.example.WebTruyen.repository.DonationRepository;
import com.example.WebTruyen.repository.LedgerEntryRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WalletService {

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
    @Lazy
    private SimpleDailyTaskService simpleDailyTaskService;

    public WalletResponse getWallet(Long userId) {
        WalletEntity wallet = walletRepository.findById(userId)
                .orElseGet(() -> createDefaultWallet(userId));

        return new WalletResponse(wallet.getBalanceCoinA(), wallet.getBalanceCoinB());
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
        WalletEntity wallet = getOrCreateWalletEntity(userId);
        
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
        Long currentBalance = wallet.getBalanceCoinA();
        Long addedAmount = 5000L;
        Long newBalance = currentBalance + addedAmount;
        
        // Update wallet
        wallet.setBalanceCoinA(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        
        // Create ledger entry for monthly bonus
        createLedgerEntry(userId, CoinType.A, addedAmount, LedgerReason.EARN, 
            "MONTHLY_BONUS", System.currentTimeMillis(), "Thưởng tháng");
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("newCoinBalance", newBalance);
        response.put("addedAmount", addedAmount);
        response.put("message", "Nhận thưởng tháng thành công!");
        
        return response;
    }

    public Map<String, Object> purchaseChapter(Long userId, Long chapterPrice, Long chapterId) {
        // Verify chapter exists first
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        // Check if chapter is already unlocked BEFORE deducting coins
        if (chapterUnlockRepository.existsByUserIdAndChapterId(userId, chapterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chương này đã được mua rồi");
        }

        WalletEntity wallet = getOrCreateWalletEntity(userId);
        
        // Check if user has enough coins (prefer coin A first, then coin B)
        Long currentBalanceB = wallet.getBalanceCoinB();
        Long currentBalanceA = wallet.getBalanceCoinA();
        Long totalBalance = currentBalanceB + currentBalanceA;
        
        if (totalBalance < chapterPrice) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Không đủ coin để mua chương. Cần " + chapterPrice + " coin, chỉ có " + totalBalance + " coin");
        }
        
        // Calculate deduction: prefer coin A first, then coin B
        Long deductFromA = Math.min(currentBalanceA, chapterPrice);
        Long remainingPrice = chapterPrice - deductFromA;
        Long deductFromB = remainingPrice;
        
        // Update wallet balances
        Long newBalanceB = currentBalanceB - deductFromB;
        Long newBalanceA = currentBalanceA - deductFromA;
        
        wallet.setBalanceCoinB(newBalanceB);
        wallet.setBalanceCoinA(newBalanceA);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Create chapter unlock record
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        ChapterUnlockEntity unlock = ChapterUnlockEntity.builder()
                .user(user)
                .chapter(chapter)
                .paidCoin(deductFromA > 0 ? CoinType.A : CoinType.B)
                .coinCost(chapterPrice)
                .createdAt(LocalDateTime.now())
                .build();
        
        chapterUnlockRepository.save(unlock);
        
        // Create ledger entries for the transaction
        if (deductFromA > 0) {
            createLedgerEntry(userId, CoinType.A, -deductFromA, LedgerReason.SPEND_CHAPTER, 
                "CHAPTER", chapterId, "Mua chương " + chapter.getTitle());
        }
        if (deductFromB > 0) {
            createLedgerEntry(userId, CoinType.B, -deductFromB, LedgerReason.SPEND_CHAPTER, 
                "CHAPTER", chapterId, "Mua chương " + chapter.getTitle());
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
        response.put("message", "Mua chương thành công!");
        
        return response;
    }

    public Map<String, Object> donateToAuthor(Long fromUserId, Long toUserId, Long coinBAmount, String message) {
        // Validate users
        UserEntity fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donor not found"));
        
        UserEntity toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

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

        // Add coins to author (use addCoinB but DONATION reason doesn't trigger daily task)
        UserEntity authorUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));
        
        // Directly update author wallet without triggering daily task (receiving donation shouldn't complete "make donation" task)
        WalletEntity authorWallet = getOrCreateWalletEntity(toUserId);
        Long newAuthorBalance = authorWallet.getBalanceCoinB() + coinBAmount;
        authorWallet.setBalanceCoinB(newAuthorBalance);
        authorWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(authorWallet);
        
        // Create ledger entry for author receiving donation
        createDailyTaskLedgerEntry(toUserId, CoinType.B, coinBAmount, LedgerReason.DONATE, 
            "DONATION_RECEIVE", "Received donation");

        // Create donation record
        DonationEntity donation = DonationEntity.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .paidCoin(CoinType.B)
                .amountCoin(coinBAmount)
                .createdAt(LocalDateTime.now())
                .build();
        
        donationRepository.save(donation);

        // Create ledger entries with message in description
        String donateOutDescription = "Donate to " + toUser.getUsername();
        if (message != null && !message.trim().isEmpty()) {
            donateOutDescription += ": " + message;
        }
        
        String donateInDescription = "Receive donation from " + fromUser.getUsername();
        if (message != null && !message.trim().isEmpty()) {
            donateInDescription += ": " + message;
        }
        
        // Use unique refType to avoid constraint violations
        String uniqueRefType = "DONATE_" + System.currentTimeMillis();
        
        createDonationLedgerEntry(fromUserId, CoinType.B, -coinBAmount, 
            uniqueRefType + "_OUT", toUserId, donateOutDescription);
        
        createDonationLedgerEntry(toUserId, CoinType.B, coinBAmount, 
            uniqueRefType + "_IN", fromUserId, donateInDescription);

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

    private void createDonationLedgerEntry(Long userId, CoinType coinType, Long delta, 
                                         String refType, Long refId, String description) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        String idempotencyKey = String.format("DONATE_%d_%d_%s_%d", userId, refId, coinType, System.currentTimeMillis());
        
        // Check if similar entry already exists to prevent duplicate constraint violation
        if (!ledgerEntryRepository.existsByIdempotencyKey(idempotencyKey)) {
            LedgerEntryEntity entry = LedgerEntryEntity.builder()
                    .user(user)
                    .coin(coinType)
                    .delta(delta)
                    .reason(LedgerReason.DONATE)
                    .refType(refType)
                    .refId(refId)
                    .idempotencyKey(idempotencyKey)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            ledgerEntryRepository.save(entry);
        }
    }

    private void createLedgerEntry(Long userId, CoinType coinType, Long delta, 
                                  LedgerReason reason, String refType, Long refId, String description) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        String idempotencyKey = String.format("SPEND_CHAPTER_%d_%d_%s", userId, refId, coinType);
        
        // Check both constraints to prevent duplicate entries
        if (!ledgerEntryRepository.existsByIdempotencyKey(idempotencyKey) &&
            !ledgerEntryRepository.existsByRefTypeAndRefIdAndReason(refType, refId, reason)) {
            LedgerEntryEntity entry = LedgerEntryEntity.builder()
                    .user(user)
                    .coin(coinType)
                    .delta(delta)
                    .reason(reason)
                    .refType(refType)
                    .refId(refId)
                    .idempotencyKey(idempotencyKey)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            ledgerEntryRepository.save(entry);
        }
    }

    public void addCoinA(UserEntity user, Long amount, LedgerReason reason) {
        WalletEntity wallet = getOrCreateWalletEntity(user.getId());
        Long newBalance = wallet.getBalanceCoinA() + amount;
        wallet.setBalanceCoinA(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        
        // Create ledger entry
        createDailyTaskLedgerEntry(user.getId(), CoinType.A, amount, reason, 
            "DAILY_TASK", "Daily task reward");
    }

    public void addCoinB(UserEntity user, Long amount, LedgerReason reason) {
        WalletEntity wallet = getOrCreateWalletEntity(user.getId());
        Long newBalance = wallet.getBalanceCoinB() + amount;
        wallet.setBalanceCoinB(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        
        // Create ledger entry
        createDailyTaskLedgerEntry(user.getId(), CoinType.B, amount, reason, 
            "DAILY_TASK", "Daily task reward");
        
        // Auto-track daily task for topup only (donation is tracked separately)
        if (reason == LedgerReason.TOPUP) {
            try {
                log.info("Auto-tracking MAKE_TOPUP daily task for user {} - amount: {}", user.getId(), amount);
                simpleDailyTaskService.updateTaskProgress(user.getId(), "MAKE_TOPUP", null);
                log.info("Successfully auto-tracked MAKE_TOPUP daily task for user: {}", user.getId());
            } catch (Exception e) {
                // Don't fail the coin addition if daily task tracking fails
                log.warn("Failed to auto-track MAKE_TOPUP daily task for user: {}", user.getId(), e);
            }
        }
    }

    private void createDailyTaskLedgerEntry(Long userId, CoinType coinType, Long delta, 
                                          LedgerReason reason, String refType, String description) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        String idempotencyKey = String.format("DAILY_TASK_%d_%s_%d", userId, coinType, System.currentTimeMillis());
        
        // Create ledger entry for daily task rewards
        // Use timestamp as refId since daily tasks don't have a specific reference ID
        Long refId = System.currentTimeMillis();
        
        LedgerEntryEntity entry = LedgerEntryEntity.builder()
                .user(user)
                .coin(coinType)
                .delta(delta)
                .reason(reason)
                .refType(refType)
                .refId(refId)
                .idempotencyKey(idempotencyKey)
                .createdAt(LocalDateTime.now())
                .build();
        
        try {
            ledgerEntryRepository.save(entry);
            log.info("Successfully created ledger entry for daily task reward: user {}, amount {} {}", 
                    userId, delta, coinType);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            log.error("Failed to create ledger entry for daily task reward: user {}, amount {} {}", 
                    userId, delta, coinType, e);
        }
    }
}
