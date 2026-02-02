package com.example.WebTruyen.entity.model.SocialLibrary;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "follows_users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_follows_users", columnNames = {"user_id","target_user_id"})
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FollowUserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // user_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_users_user"))
    private UserEntity user;

    // target_user_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_users_target"))
    private UserEntity targetUser;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}