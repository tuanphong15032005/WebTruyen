package com.example.WebTruyen.dto.request;


import lombok.Data;

@Data
public class CreateVolumeRequest {
    private String title;
    // optional ordering index
    private Integer sequenceIndex;
}