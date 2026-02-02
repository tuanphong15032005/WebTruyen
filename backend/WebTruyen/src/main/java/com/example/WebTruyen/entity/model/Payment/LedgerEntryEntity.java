package com.example.WebTruyen.entity.model.Payment;


import com.example.WebTruyen.entity.enums.*;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ledger_entries",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_ledger_ref_reason", columnNames = {"ref_type","ref_id","reason"}),
                @UniqueConstraint(name = "uq_ledger_idempotency", columnNames = {"idempotency_key"})
        },
        indexes = {
                @Index(name = "ix_ledger_user_time", columnList = "user_id,created_at"),
                @Index(name = "ix_ledger_ref", columnList = "ref_type,ref_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LedgerEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ledger_user"))
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoinType coin;

    @Column(nullable = false)
    private Long delta;

    @Column(name = "balance_after")
    private Long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LedgerReason reason;

    @Column(name = "ref_type", nullable = false, length = 30)
    private String refType;

    @Column(name = "ref_id", nullable = false)
    private Long refId;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}