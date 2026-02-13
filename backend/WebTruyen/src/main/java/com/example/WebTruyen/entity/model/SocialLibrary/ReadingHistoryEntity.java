package com.example.WebTruyen.entity.model.SocialLibrary;

import com.example.WebTruyen.entity.keys.ReadingHistoryId;
import com.example.WebTruyen.entity.model.Content.ChapterEntity;
import com.example.WebTruyen.entity.model.Content.StoryEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reading_history",
        indexes = {
                @Index(name = "ix_readhist_user", columnList = "user_id"),
                @Index(name = "ix_readhist_story", columnList = "story_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ReadingHistoryEntity {

    @EmbeddedId
    private ReadingHistoryId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_readhist_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("storyId")
    @JoinColumn(name = "story_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_readhist_story"))
    private StoryEntity story;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_chapter_id",
            foreignKey = @ForeignKey(name = "fk_readhist_chapter"))
    private ChapterEntity lastChapter;
}
