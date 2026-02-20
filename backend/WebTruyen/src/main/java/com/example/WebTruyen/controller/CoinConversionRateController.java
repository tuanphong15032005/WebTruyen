package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.request.CoinConversionRateUpsertRequest;
import com.example.WebTruyen.dto.response.CoinConversionRateItemResponse;
import com.example.WebTruyen.dto.response.CoinConversionRateManagementResponse;
import com.example.WebTruyen.service.CoinConversionRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/conversion-rates")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
@RequiredArgsConstructor
public class CoinConversionRateController {
    private final CoinConversionRateService coinConversionRateService;

    @GetMapping("/management")
    public ResponseEntity<CoinConversionRateManagementResponse> getManagementData() {
        return ResponseEntity.ok(coinConversionRateService.getManagementData());
    }

    @GetMapping("/current")
    public ResponseEntity<CoinConversionRateItemResponse> getCurrentRate() {
        return ResponseEntity.ok(coinConversionRateService.getCurrentRate());
    }

    @GetMapping("/history")
    public ResponseEntity<List<CoinConversionRateItemResponse>> getHistory() {
        return ResponseEntity.ok(coinConversionRateService.getHistory());
    }

    @PostMapping
    public ResponseEntity<CoinConversionRateItemResponse> createRate(@RequestBody CoinConversionRateUpsertRequest request) {
        return ResponseEntity.ok(coinConversionRateService.createRate(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoinConversionRateItemResponse> updateRate(@PathVariable Long id,
                                                                     @RequestBody CoinConversionRateUpsertRequest request) {
        return ResponseEntity.ok(coinConversionRateService.updateRate(id, request));
    }
}
