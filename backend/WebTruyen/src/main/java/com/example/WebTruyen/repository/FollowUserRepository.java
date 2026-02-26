package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowUserRepository extends JpaRepository<FollowUserEntity, Long> {
    // Minhdq - 26/02/2026
    // [Add follow-user-repository-for-author-follow - V1 - branch: clone-minhfinal2]
    long countByTargetUser_Id(Long targetUserId);

    boolean existsByUser_IdAndTargetUser_Id(Long userId, Long targetUserId);

    Optional<FollowUserEntity> findByUser_IdAndTargetUser_Id(Long userId, Long targetUserId);
}
