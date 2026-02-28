package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface FollowUserRepository extends JpaRepository<FollowUserEntity, Long> {
    
    // Use native queries to work with existing table structure
    @Query(value = "SELECT * FROM follows_users WHERE user_id = :userId AND target_user_id = :targetUserId", nativeQuery = true)
    Optional<FollowUserEntity> findByUser_IdAndTargetUser_Id(@Param("userId") Long userId, @Param("targetUserId") Long targetUserId);
    
    @Query(value = "SELECT COUNT(*) FROM follows_users WHERE target_user_id = :targetUserId", nativeQuery = true)
    long countByTargetUserId(@Param("targetUserId") Long targetUserId);
    
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO follows_users (user_id, target_user_id, created_at) VALUES (:userId, :targetUserId, NOW())", nativeQuery = true)
    void insertFollow(@Param("userId") Long userId, @Param("targetUserId") Long targetUserId);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM follows_users WHERE user_id = :userId AND target_user_id = :targetUserId", nativeQuery = true)
    void deleteFollow(@Param("userId") Long userId, @Param("targetUserId") Long targetUserId);
}
