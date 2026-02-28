package com.example.WebTruyen.dto.request;

import lombok.Data;

@Data
public class AuthorApplicationRequest {
    private String penName;
    private String bio;
    private String experience;
    private String motivation;
}
