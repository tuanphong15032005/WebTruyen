package com.example.WebTruyen.entity.model.CoreIdentity;


import com.example.WebTruyen.entity.keys.UserRoleId;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users_roles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserRoleEntity {

    @EmbeddedId
    private UserRoleId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_users_roles_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roleId")
    @JoinColumn(name = "role_id", foreignKey = @ForeignKey(name = "fk_users_roles_role"))
    private RoleEntity role;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}