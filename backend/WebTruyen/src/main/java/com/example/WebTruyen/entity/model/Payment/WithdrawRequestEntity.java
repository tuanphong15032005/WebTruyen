package com.example.WebTruyen.entity.model.Payment;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.WithdrawStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "withdraw_requests",
        indexes = {
                @Index(name = "ix_withdraw_user", columnList = "user_id"),
                @Index(name = "ix_withdraw_status", columnList = "status"),
                @Index(name = "ix_withdraw_admin", columnList = "admin_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WithdrawRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // người rút
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_withdraw_user"))
    private UserEntity user;

    @Column(name = "coin_b_amount", nullable = false)
    private Long coinBAmount;

    @Column(name = "fee_coin_b", nullable = false)
    private Long feeCoinB;

    @Column(name = "net_coin_b", nullable = false)
    private Long netCoinB;

    @Lob
    @Column(name = "payment_method_details", nullable = false)
    private String paymentMethodDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WithdrawStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // admin xử lý (nullable)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", foreignKey = @ForeignKey(name = "fk_withdraw_admin"))
    private UserEntity admin;
}