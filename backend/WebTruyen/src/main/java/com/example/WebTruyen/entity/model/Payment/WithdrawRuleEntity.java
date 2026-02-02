package com.example.WebTruyen.entity.model.Payment;

import com.example.WebTruyen.entity.enums.FeeType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "withdraw_rules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WithdrawRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // schema chỉ cho B, nhưng vẫn map enum CoinType nếu muốn
    @Column(nullable = false, length = 1)
    private String coin; // "B"

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false)
    private FeeType feeType;

    @Column(name = "fee_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal feeValue;

    @Column(name = "min_withdraw_coin_b", nullable = false)
    private Long minWithdrawCoinB;

    @Column(name = "max_withdraw_coin_b")
    private Long maxWithdrawCoinB;

    @Column(name = "is_active", nullable = false)
    private boolean active;
}