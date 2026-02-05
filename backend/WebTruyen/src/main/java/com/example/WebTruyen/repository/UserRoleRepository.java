package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.keys.UserRoleId;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, UserRoleId> {

    // Lấy tất cả role của 1 user
    List<UserRoleEntity> findByUser_Id(Long userId);

    // Lấy tất cả user thuộc 1 role
    List<UserRoleEntity> findByRole_Id(Long roleId);

    // Kiểm tra user có role code nào đó không (hay dùng authorize)
    boolean existsByUser_IdAndRole_Code(Long userId, String roleCode);

    // Tìm đúng 1 bản ghi theo cặp user + role
    Optional<UserRoleEntity> findByUser_IdAndRole_Id(Long userId, Long roleId);

    // Xóa role của user theo cặp user + role
    void deleteByUser_IdAndRole_Id(Long userId, Long roleId);
}