package com.example.WebTruyen.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MergeTagsRequest {

    @NotNull(message = "Source tag ID is required")
    private Long sourceTagId;

    @NotNull(message = "Target tag ID is required")
    private Long targetTagId;
}
