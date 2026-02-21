package com.example.WebTruyen.entity.model.CommentAndMod;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // N-1
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // N-1
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapter_id", nullable = false)
    private ChapterEntity chapter;

    // N-1 self
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private CommentEntity parentComment;

    // N-1 self: thread root
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_comment_id")
    private CommentEntity rootComment;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Integer depth;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 1-N self: children
    @OneToMany(mappedBy = "parentComment", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CommentEntity> replies = new ArrayList<>();
}
