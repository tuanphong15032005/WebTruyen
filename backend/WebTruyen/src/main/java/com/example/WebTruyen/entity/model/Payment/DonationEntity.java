package com.example.WebTruyen.entity.model.Payment;


import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.CoinType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations",
        indexes = {
                @Index(name = "ix_donations_from_user", columnList = "from_user_id"),
                @Index(name = "ix_donations_to_user", columnList = "to_user_id"),
                @Index(name = "ix_donations_message", columnList = "message")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DonationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // from_user_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_don_from_user"))
    private UserEntity fromUser;

    // to_user_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_don_to_user"))
    private UserEntity toUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "paid_coin", nullable = false)
    private CoinType paidCoin;

    @Column(name = "amount_coin", nullable = false)
    private Long amountCoin;

    // Hieu Son - ngay 01/03/2026 | v1.0.0-donation-message | branch: summary-no-3-merge
    // Cap nhat entity theo migration: them cot message cho bang donations.
    @Lob
    @Column(name = "message")
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
