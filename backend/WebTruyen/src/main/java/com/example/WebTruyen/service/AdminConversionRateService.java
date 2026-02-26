package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.AdminConversionRateUpsertRequest;
import com.example.WebTruyen.dto.response.AdminConversionRateResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.AdminConversionRateNativeRepository;
import com.example.WebTruyen.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminConversionRateService {

    private final AdminConversionRateNativeRepository conversionRateRepository;
    private final UserRoleRepository userRoleRepository;

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    public List<AdminConversionRateResponse> list(UserEntity currentUser) {
        requireAdminOrMod(currentUser);
        return conversionRateRepository.findAll();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    @Transactional
    public AdminConversionRateResponse create(UserEntity currentUser, AdminConversionRateUpsertRequest request) {
        requireAdminOrMod(currentUser);
        validate(request);
        return conversionRateRepository.insert(
                request.getCoinAmount(),
                request.getCashValue(),
                request.getEffectiveDate()
        );
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    @Transactional
    public AdminConversionRateResponse update(
            UserEntity currentUser,
            Long id,
            AdminConversionRateUpsertRequest request
    ) {
        requireAdminOrMod(currentUser);
        validate(request);
        return conversionRateRepository.update(
                id,
                request.getCoinAmount(),
                request.getCashValue(),
                request.getEffectiveDate()
        );
    }

    private void validate(AdminConversionRateUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        if (request.getCoinAmount() == null || request.getCoinAmount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "coinAmount must be > 0");
        }
        if (request.getCashValue() == null || request.getCashValue().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cashValue must be >= 0");
        }
        if (request.getEffectiveDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "effectiveDate is required");
        }
        // Minhdq - 25/02/2026
        // [Fix conversion-rate-date-validation/id - V2 - branch: minhfinal2]
        if (request.getEffectiveDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "effectiveDate cannot be in the past");
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
