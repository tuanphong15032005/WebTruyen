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

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
