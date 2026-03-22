package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.NotificationKind;
import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    
    @Query("SELECT n FROM NotificationEntity n JOIN FETCH n.user u LEFT JOIN FETCH u.wallet WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    @Query("SELECT n FROM NotificationEntity n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByUserIdOrderByCreatedAtDescSimple(Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.user.id = :userId AND n.kind IN :kinds")
    long countByUserIdAndKinds(@Param("userId") Long userId, @Param("kinds") List<NotificationKind> kinds);
    
    @Query("SELECT n FROM NotificationEntity n JOIN FETCH n.user u LEFT JOIN FETCH u.wallet WHERE n.user.id = :userId AND n.kind IN :kinds ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByUserIdAndKindInOrderByCreatedAtDesc(Long userId, List<NotificationKind> kinds, Pageable pageable);
    
    @Query("SELECT n FROM NotificationEntity n WHERE n.user.id = :userId AND n.kind IN :kinds ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByUserIdAndKindInOrderByCreatedAtDescSimple(Long userId, List<NotificationKind> kinds, Pageable pageable);
    
    @Query("SELECT n.kind, COUNT(n) FROM NotificationEntity n WHERE n.user.id = :userId GROUP BY n.kind")
    List<Object[]> countNotificationsByKindForUser(@Param("userId") Long userId);

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.user.id = :userId
              AND (
                    n.kind IN :kinds
                    OR (n.kind = :legacyKind AND LOWER(COALESCE(n.refType, '')) IN :legacyRefTypes)
                  )
            ORDER BY n.createdAt DESC
            """)
    Page<NotificationEntity> findByUserIdAndKindsOrLegacyRefTypesOrderByCreatedAtDescSimple(
            @Param("userId") Long userId,
            @Param("kinds") List<NotificationKind> kinds,
            @Param("legacyKind") NotificationKind legacyKind,
            @Param("legacyRefTypes") List<String> legacyRefTypes,
            Pageable pageable
    );

    @Query("""
            SELECT n FROM NotificationEntity n
            WHERE n.user.id = :userId
              AND n.kind = :kind
              AND LOWER(COALESCE(n.refType, '')) NOT IN :excludedRefTypes
            ORDER BY n.createdAt DESC
            """)
    Page<NotificationEntity> findByUserIdAndKindExcludingRefTypesOrderByCreatedAtDescSimple(
            @Param("userId") Long userId,
            @Param("kind") NotificationKind kind,
            @Param("excludedRefTypes") List<String> excludedRefTypes,
            Pageable pageable
    );

    @Query("""
            SELECT n.kind, LOWER(COALESCE(n.refType, '')), COUNT(n)
            FROM NotificationEntity n
            WHERE n.user.id = :userId
            GROUP BY n.kind, LOWER(COALESCE(n.refType, ''))
            """)
    List<Object[]> countNotificationsByKindAndRefTypeForUser(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT n.user.id
            FROM NotificationEntity n
            WHERE n.kind = :kind AND n.chapterId = :chapterId
            """)
    List<Long> findDistinctUserIdsByKindAndChapterId(
            @Param("kind") NotificationKind kind,
            @Param("chapterId") Long chapterId
    );

    @Modifying
    @Query("""
            DELETE FROM NotificationEntity n
            WHERE n.kind = :kind AND n.chapterId = :chapterId
            """)
    int deleteByKindAndChapterId(
            @Param("kind") NotificationKind kind,
            @Param("chapterId") Long chapterId
    );
}
