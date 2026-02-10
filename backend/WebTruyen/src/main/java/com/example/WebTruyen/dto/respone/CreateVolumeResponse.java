package com.example.WebTruyen.dto.respone;


import lombok.Data;

@Data
public class CreateVolumeResponse {
    private Long id;
    private Long storyId;
    private String title;
    private Integer sequenceIndex;
}