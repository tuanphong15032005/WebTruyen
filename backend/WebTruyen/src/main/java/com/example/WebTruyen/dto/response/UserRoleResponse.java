package com.example.WebTruyen.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRoleResponse {
    private Long userId;
    private Long roleId;
    private String roleCode;
    private String roleName;
    private String roleDescription;
}
