package com.example.WebTruyen.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoinConversionRateManagementResponse {
    private CoinConversionRateItemResponse currentRate;
    private List<CoinConversionRateItemResponse> history;
}
