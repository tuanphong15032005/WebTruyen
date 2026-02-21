package com.example.WebTruyen.repository;



import com.example.WebTruyen.entity.model.CoreIdentity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

    Optional<RoleEntity> findByCode(String code);

    Optional<RoleEntity> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByName(String name);
}