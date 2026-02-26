package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AdminPayoutConfirmRequest;
import com.example.WebTruyen.dto.response.AdminPayoutEligibleAuthorResponse;
import com.example.WebTruyen.dto.response.AdminPayoutHistoryResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.AdminAuthorPayoutNativeRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuthorPayoutService {

    private final AdminAuthorPayoutNativeRepository payoutRepository;
    private final UserRoleRepository userRoleRepository;

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    public List<AdminPayoutEligibleAuthorResponse> listEligibleAuthors(UserEntity currentUser) {
        requireAdminOrMod(currentUser);
        return payoutRepository.findEligibleAuthors();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    public List<AdminPayoutHistoryResponse> listPayoutHistory(UserEntity currentUser) {
        requireAdminOrMod(currentUser);
        return payoutRepository.findPayoutHistory();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    @Transactional
    public void confirmPayout(UserEntity currentUser, Long requestId, AdminPayoutConfirmRequest request) {
        requireAdminOrMod(currentUser);
        validate(request);
        int updated = payoutRepository.markRequestAsPaid(requestId, currentUser.getId(), request.getCashAmount());
        if (updated <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu rút không hợp lệ hoặc đã được xử lý");
        }
    }

    private void validate(AdminPayoutConfirmRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ");
        }
        if (request.getCoinAmount() == null || request.getCoinAmount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "coinAmount phải lớn hơn 0");
        }
        if (request.getCashAmount() == null || request.getCashAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cashAmount phải >= 0");
        }
    }

    private void requireAdminOrMod(UserEntity currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Long userId = currentUser.getId();
        boolean allowed = userRoleRepository.existsByUser_IdAndRole_Code(userId, "ADMIN")
                || userRoleRepository.existsByUser_IdAndRole_Code(userId, "MOD");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }
}
