package com.example.WebTruyen.entity.keys;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ReadingHistoryId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "story_id")
    private Long storyId;
}
