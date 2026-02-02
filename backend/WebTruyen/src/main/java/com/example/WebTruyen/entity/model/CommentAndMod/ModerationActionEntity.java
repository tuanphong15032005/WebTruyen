package com.example.WebTruyen.entity.model.CommentAndMod;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "moderation_actions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ModerationActionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // admin_id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private UserEntity admin;

    @Column(name = "action_type", nullable = false, length = 200)
    private String actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_kind", nullable = false)
    private ModerationTargetKind targetKind;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Lob
    private String reason;

    @Lob
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum ModerationTargetKind { story, chapter, comment, user }
}
