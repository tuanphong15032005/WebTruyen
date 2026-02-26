package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.SocialLibrary.FollowUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface FollowUserRepository extends JpaRepository<FollowUserEntity, Long> {
    // Minhdq - 26/02/2026
    // [Add follow-user-repository-for-author-follow - V1 - branch: clone-minhfinal2]
    long countByTargetUser_Id(Long targetUserId);

    boolean existsByUser_IdAndTargetUser_Id(Long userId, Long targetUserId);

    Optional<FollowUserEntity> findByUser_IdAndTargetUser_Id(Long userId, Long targetUserId);

    @Query("""
            select fu
            from FollowUserEntity fu
            where fu.targetUser.id = :authorId
            order by fu.createdAt desc
            """)
    List<FollowUserEntity> findByTargetUser_IdOrderByCreatedAtDesc(@Param("authorId") Long authorId);

    @Query("""
            select function('date', fu.createdAt), count(fu.id)
            from FollowUserEntity fu
            where fu.targetUser.id = :authorId
            group by function('date', fu.createdAt)
            order by function('date', fu.createdAt) asc
            """)
    List<Object[]> aggregateDailyFollowersByAuthorId(@Param("authorId") Long authorId);

    @Query("""
            select count(fu.id)
            from FollowUserEntity fu
            where fu.targetUser.id = :authorId
              and function('date', fu.createdAt) >= :fromDate
            """)
    long countNewFollowersSince(@Param("authorId") Long authorId, @Param("fromDate") LocalDate fromDate);
}
