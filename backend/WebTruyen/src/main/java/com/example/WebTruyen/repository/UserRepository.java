package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByAuthorPenName(String authorPenName);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByAuthorPenName(String authorPenName);
}