package com.example.WebTruyen.entity.model.CoreIdentity;


import com.example.WebTruyen.entity.model.Content.StoryReviewEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.SocialLibrary.ReadingHistoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import jakarta.persistence.*;
import lombok.*;
import tools.jackson.databind.ser.jdk.JDKKeySerializers;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_users_email", columnNames = "email"),
                @UniqueConstraint(name = "uq_users_username", columnNames = "username"),
                @UniqueConstraint(name = "uq_users_author_pen_name", columnNames = "author_pen_name")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 512)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String username;

    @Lob
    private String bio;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "author_pen_name", length = 200, unique = true)
    private String authorPenName;

    @Lob
    @Column(name = "author_profile_bio")
    private String authorProfileBio;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Lob
    @Column(name = "settings_json")
    private String settingsJson;

    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "lock_until")
    private LocalDateTime lockUntil;

  // 1-1 wallets (PK=FK)
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private WalletEntity wallet;

    // N-N roles via join table users_roles
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserRoleEntity> userRoles = new ArrayList<>();

    // 1-N stories authored
    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryEntity> stories = new ArrayList<>();

    @OneToMany(mappedBy = "originalAuthorUser", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryEntity> translatedStories = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryReviewEntity> storyReviews = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReadingHistoryEntity> readingHistories = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<NotificationEntity> notifications = new ArrayList<>();
}
