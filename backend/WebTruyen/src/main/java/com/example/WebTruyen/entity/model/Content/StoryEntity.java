package com.example.WebTruyen.entity.model.Content;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.WebTruyen.entity.enums.StoryStatus;
import com.example.WebTruyen.entity.enums.StoryVisibility;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stories",
        indexes = {
                @Index(name = "ix_stories_author", columnList = "author_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_stories_author"))
    private UserEntity author;

    @Column(nullable = false, length = 500)
    private String title;

    @Lob
    private String summary;

    @Column(name = "cover_url", length = 1000)
    private String coverUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoryStatus status;

    @Transient
    @Builder.Default
    private StoryVisibility visibility = StoryVisibility.public_;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<VolumeEntity> volumes = new ArrayList<>();

    @OneToMany(mappedBy = "story", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryTagEntity> storyTags = new ArrayList<>();
}