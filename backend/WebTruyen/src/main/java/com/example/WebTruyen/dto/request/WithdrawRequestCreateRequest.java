package com.example.WebTruyen.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WithdrawRequestCreateRequest {

    private Long amountB;
    private String bankAccountNumber;
    private String accountHolderName;
    private String bankName;
}

