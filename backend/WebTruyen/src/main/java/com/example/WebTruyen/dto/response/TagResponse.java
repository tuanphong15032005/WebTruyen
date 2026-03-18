package com.example.WebTruyen.dto.response;

import lombok.Data;

@Data
public class TagResponse {

    private Long id;
    private String name;
    private String slug;
    private Boolean featured;
    private Long usageCount;

    public TagResponse() {}

    public TagResponse(Long id, String name, String slug, Boolean featured, Long usageCount) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.featured = featured;
        this.usageCount = usageCount;
    }
}
