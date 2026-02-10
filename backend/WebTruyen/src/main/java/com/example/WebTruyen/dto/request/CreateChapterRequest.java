package com.example.WebTruyen.dto.request;


import lombok.Data;


@Data
public class CreateChapterRequest {

    private String title;


    private Integer sequenceIndex;

    private Boolean isFree = Boolean.TRUE;
    private Long priceCoin;


    private String contentHtml;   // Quill root innerHTML

    private String contentDelta;  // optional

    private String status = "DRAFT";
}