package com.example.WebTruyen.dto.request;

public class VerifyRequest {
    private String username;
    private String code;

    // Constructor mặc định (Bắt buộc để Spring đọc được JSON)
    public VerifyRequest() {
    }

    public VerifyRequest(String username, String code) {
        this.username = username;
        this.code = code;
    }

    // --- Getter và Setter ---
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}