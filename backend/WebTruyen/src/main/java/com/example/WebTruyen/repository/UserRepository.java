package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByAuthorPenName(String authorPenName);
    boolean existsByDisplayName(String displayName);

    // Load user with roles to avoid LazyInitializationException
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    @Query("SELECT u FROM UserEntity u WHERE u.id = :id")
    Optional<UserEntity> findByIdWithRoles(Long id);
    
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    @Query("SELECT u FROM UserEntity u WHERE u.username = :username")
    Optional<UserEntity> findByUsernameWithRoles(String username);

    @Query("SELECT u FROM UserEntity u " +
           "WHERE (:username IS NULL OR :username = '' OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :username, '%')) OR " +
           "LOWER(u.authorPenName) LIKE LOWER(CONCAT('%', :username, '%')) OR " +
           "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :username, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :username, '%')))")
    Page<UserEntity> searchUsers(@Param("username") String username, Pageable pageable);
}
