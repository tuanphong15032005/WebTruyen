package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.response.AdminViolationReportResponse;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.ReportModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportModerationService reportModerationService;

    @GetMapping
    public List<AdminViolationReportResponse> listReports(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return reportModerationService.listReports(requireUser(userPrincipal));
    }

    @PostMapping("/{reportId}/dismiss")
    public Map<String, String> dismissReport(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        reportModerationService.dismissReport(requireUser(userPrincipal), reportId);
        return Map.of("message", "Report dismissed");
    }

    @PostMapping("/{reportId}/hide")
    public Map<String, String> hideContent(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        reportModerationService.hideReportedContent(requireUser(userPrincipal), reportId);
        return Map.of("message", "Reported content hidden");
    }

    @PostMapping("/{reportId}/remove")
    public Map<String, String> removeContent(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        reportModerationService.removeReportedContent(requireUser(userPrincipal), reportId);
        return Map.of("message", "Reported content removed");
    }

    @PostMapping("/{reportId}/warn-ban")
    public Map<String, String> warnOrBan(
            @PathVariable Long reportId,
            @RequestBody(required = false) WarnBanRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        boolean banUser = req != null && Boolean.TRUE.equals(req.banUser());
        Integer banHours = req != null ? req.banHours() : null;
        reportModerationService.warnOrBanReportedUser(requireUser(userPrincipal), reportId, banUser, banHours);
        return Map.of("message", banUser ? "User banned" : "User warned");
    }

    private UserEntity requireUser(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userPrincipal.getUser();
    }

    public record WarnBanRequest(Boolean banUser, Integer banHours) {}
}
