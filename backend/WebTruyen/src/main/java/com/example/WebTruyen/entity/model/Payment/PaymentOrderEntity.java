package com.example.WebTruyen.entity.model.Payment;


import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.PaymentOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_payment_orders_order_code", columnNames = "order_code")
        },
        indexes = { @Index(name = "ix_payment_orders_user", columnList = "user_id") }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaymentOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_payment_orders_user"))
    private UserEntity user;

    @Column(name = "order_code", nullable = false, length = 60)
    private String orderCode;

    @Column(name = "amount_vnd", nullable = false)
    private Long amountVnd;

    @Column(name = "coin_b_amount", nullable = false)
    private Long coinBAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentOrderStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}