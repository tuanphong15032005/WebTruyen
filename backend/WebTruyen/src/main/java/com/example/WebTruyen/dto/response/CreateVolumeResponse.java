package com.example.WebTruyen.dto.response;


import lombok.Data;

@Data
public class CreateVolumeResponse {
    private Long id;
    private Long storyId;
    private String title;
    private Integer sequenceIndex;
}