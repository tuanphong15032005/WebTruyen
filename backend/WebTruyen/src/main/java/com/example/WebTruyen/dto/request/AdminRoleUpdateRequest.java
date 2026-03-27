package com.example.WebTruyen.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AdminRoleUpdateRequest {
    private List<String> roles;
}
