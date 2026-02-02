package com.example.WebTruyen.entity.model.Content;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "drafts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DraftEntity {

    @Id
    @Column(name = "chapter_id")
    private Long chapterId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "chapter_id", foreignKey = @ForeignKey(name = "fk_drafts_chapter"))
    private ChapterEntity chapter;

    @Lob
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}