package com.example.WebTruyen.entity.model.CoreIdentity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WalletEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_wallets_user"))
    private UserEntity user;

    @Column(name = "balance_coin_a", nullable = false)
    private Long balanceCoinA;

    @Column(name = "balance_coin_b", nullable = false)
    private Long balanceCoinB;

    @Column(name = "reserved_coin_b", nullable = false)
    private Long reservedCoinB;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}