package com.example.WebTruyen.entity.model.Content;


import com.example.WebTruyen.entity.keys.StoryTagId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "story_tags")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryTagEntity {

    @EmbeddedId
    private StoryTagId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("storyId")
    @JoinColumn(name = "story_id", foreignKey = @ForeignKey(name = "fk_story_tags_story"))
    private StoryEntity story;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id", foreignKey = @ForeignKey(name = "fk_story_tags_tag"))
    private TagEntity tag;
}