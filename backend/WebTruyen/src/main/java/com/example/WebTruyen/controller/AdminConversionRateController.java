package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.AdminConversionRateUpsertRequest;
import com.example.WebTruyen.dto.response.AdminConversionRateResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.AdminConversionRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/conversion-rates")
@RequiredArgsConstructor
public class AdminConversionRateController {

    private final AdminConversionRateService adminConversionRateService;

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    @GetMapping
    public List<AdminConversionRateResponse> list(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return adminConversionRateService.list(requireUser(userPrincipal));
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    @PostMapping
    public AdminConversionRateResponse create(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody AdminConversionRateUpsertRequest request
    ) {
        return adminConversionRateService.create(requireUser(userPrincipal), request);
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    @PutMapping("/{id}")
    public AdminConversionRateResponse update(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody AdminConversionRateUpsertRequest request
    ) {
        return adminConversionRateService.update(requireUser(userPrincipal), id, request);
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }
}
