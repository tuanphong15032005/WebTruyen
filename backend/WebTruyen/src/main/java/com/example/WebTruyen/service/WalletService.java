package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.entity.enums.ChapterStatus;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.WalletEntity;
import com.example.WebTruyen.repository.ChapterRepository;
import com.example.WebTruyen.repository.UserRepository;
import com.example.WebTruyen.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChapterRepository chapterRepository;

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
        
        // Add 5000 coin A
        Long currentBalance = wallet.getBalanceCoinA();
        Long addedAmount = 5000L;
        Long newBalance = currentBalance + addedAmount;
        
        // Update wallet
        wallet.setBalanceCoinA(newBalance);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("newCoinBalance", newBalance);
        response.put("addedAmount", addedAmount);
        response.put("previousBalance", currentBalance);
        response.put("message", "Daily check-in successful");
        
        return response;
    }

    public Map<String, Object> purchaseChapter(Long userId, Long chapterPrice, Long chapterId) {
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

        // Unlock the chapter by setting status to published
        ChapterEntity chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        chapter.setStatus(ChapterStatus.published);
        chapterRepository.save(chapter);
        
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
}
