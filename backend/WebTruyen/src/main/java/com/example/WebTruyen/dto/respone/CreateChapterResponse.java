package com.example.WebTruyen.dto.respone;

import lombok.Data;
import java.util.List;

@Data
public class CreateChapterResponse {
    private Long chapterId;
    private List<Long> segmentIds;
    private Integer segmentCount;
}