package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.AdminPayoutConfirmRequest;
import com.example.WebTruyen.dto.response.AdminPayoutEligibleAuthorResponse;
import com.example.WebTruyen.dto.response.AdminPayoutHistoryResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AdminAuthorPayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/payouts")
@RequiredArgsConstructor
public class AdminAuthorPayoutController {

    private final AdminAuthorPayoutService adminAuthorPayoutService;

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    @GetMapping("/eligible-authors")
    public List<AdminPayoutEligibleAuthorResponse> getEligibleAuthors(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return adminAuthorPayoutService.listEligibleAuthors(requireUser(userPrincipal));
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    @GetMapping("/history")
    public List<AdminPayoutHistoryResponse> getPayoutHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return adminAuthorPayoutService.listPayoutHistory(requireUser(userPrincipal));
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    @PostMapping("/{requestId}/confirm")
    public Map<String, String> confirmPayout(
            @PathVariable Long requestId,
            @RequestBody AdminPayoutConfirmRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        adminAuthorPayoutService.confirmPayout(requireUser(userPrincipal), requestId, request);
        return Map.of("message", "Đã xác nhận chi trả");
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }
}
