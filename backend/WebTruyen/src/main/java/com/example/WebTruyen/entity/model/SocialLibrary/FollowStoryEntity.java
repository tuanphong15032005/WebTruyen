package com.example.WebTruyen.entity.model.SocialLibrary;


import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "follows_stories",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_follows_stories", columnNames = {"user_id","story_id"})
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FollowStoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_stories_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_stories_story"))
    private StoryEntity story;

    @Column(name = "notify_new_chapter", nullable = false)
    private boolean notifyNewChapter;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
