package com.example.WebTruyen.entity.keys;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Embeddable //có thể được lồng trong Entity khác - nhúng
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
//Định danh composite key cho StoryTagEntity
public class StoryTagId implements Serializable {
    @Column(name = "story_id")
    private Long storyId;

    @Column(name = "tag_id")
    private Long tagId;
}
/*class phụ trong Java, sinh ra chỉ để JPA dùng, không tồn tại trong MySQL
đại diện cho PRIMARY KEY (story_id, tag_id) - Composite key - để JPA biết đâu là composite key.
JPA không thể map PK nhiều cột trực tiếp
Nó bắt buộc gom các cột PK vào 1 object*/