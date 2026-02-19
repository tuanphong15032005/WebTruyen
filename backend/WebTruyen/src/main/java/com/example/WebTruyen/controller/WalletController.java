package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.WalletResponse;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping
    public ResponseEntity<?> getWallet(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        WalletResponse response = walletService.getWallet(userPrincipal.getUser().getId());
        return ResponseEntity.ok(response);
    }
}
