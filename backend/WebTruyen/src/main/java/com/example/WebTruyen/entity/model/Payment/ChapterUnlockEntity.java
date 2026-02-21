package com.example.WebTruyen.entity.model.Payment;


import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.enums.CoinType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chapter_unlocks",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_chapter_unlock_user_chapter", columnNames = {"user_id","chapter_id"})
        },
        indexes = {
                @Index(name = "ix_chapter_unlock_user", columnList = "user_id"),
                @Index(name = "ix_chapter_unlock_chapter", columnList = "chapter_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChapterUnlockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chunlock_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chunlock_chapter"))
    private ChapterEntity chapter;

    @Enumerated(EnumType.STRING)
    @Column(name = "paid_coin", nullable = false)
    private CoinType paidCoin;

    @Column(name = "coin_cost", nullable = false)
    private Long coinCost;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}