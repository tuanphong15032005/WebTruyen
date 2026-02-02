package com.example.WebTruyen.entity.model.Content;


import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "tags",
        uniqueConstraints = { @UniqueConstraint(name = "uq_tags_slug", columnNames = "slug") }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 200)
    private String slug;

    @OneToMany(mappedBy = "tag", fetch = FetchType.LAZY)
    @Builder.Default
    private List<StoryTagEntity> storyTags = new ArrayList<>();
}