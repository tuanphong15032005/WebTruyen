package com.example.WebTruyen.controller.admin;

import com.example.WebTruyen.dto.response.AdminFinanceRequestResponse;
import com.example.WebTruyen.entity.enums.WithdrawStatus;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity;
import com.example.WebTruyen.repository.UserRoleRepository;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final WalletService walletService;
    private final UserRoleRepository userRoleRepository;

    @GetMapping("/requests")
    public List<AdminFinanceRequestResponse> getFinanceRequests(
            @RequestParam(required = false, defaultValue = "ALL") String requestType,
            @RequestParam(required = false) WithdrawStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        requireAdminOrMod(currentUser);
        return walletService.financeAdminGetRequests(requestType, status);
    }

    @PostMapping("/requests/{requestId}/approve")
    public Map<String, String> approveRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) FinanceActionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        requireAdminOrMod(currentUser);
        String note = request != null ? request.note() : "";
        walletService.financeAdminApproveRequest(currentUser.getId(), requestId, note);
        return Map.of("message", "Duyệt yêu cầu thành công");
    }

    @PostMapping("/requests/{requestId}/reject")
    public Map<String, String> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) FinanceActionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        requireAdminOrMod(currentUser);
        String note = request != null ? request.note() : "";
        walletService.financeAdminRejectRequest(currentUser.getId(), requestId, note);
        return Map.of("message", "Từ chối yêu cầu thành công");
    }

    @PostMapping("/requests/{requestId}/complete")
    public Map<String, String> completeRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) FinanceActionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UserEntity currentUser = requireUser(userPrincipal);
        requireAdminOrMod(currentUser);
        String note = request != null ? request.note() : "";
        WithdrawRequestEntity updated = walletService.financeAdminMarkCompleted(currentUser.getId(), requestId, note);
        String action = resolveCompleteAction(updated);
        return Map.of("message", action + " thành công");
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null || userPrincipal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    private void requireAdminOrMod(UserEntity currentUser) {
        Long userId = currentUser.getId();
        boolean allowed = userRoleRepository.existsByUser_IdAndRole_Code(userId, "ADMIN")
                || userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private String resolveCompleteAction(WithdrawRequestEntity entity) {
        String details = entity.getPaymentMethodDetails() == null ? "" : entity.getPaymentMethodDetails();
        return details.contains("requestType=REFUND;") ? "Đánh dấu đã hoàn tiền" : "Đánh dấu đã thanh toán";
    }

    public record FinanceActionRequest(String note) {}
}

