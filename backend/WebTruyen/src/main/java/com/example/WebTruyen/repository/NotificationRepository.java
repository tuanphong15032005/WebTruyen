package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.NotificationKind;
import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    
    Page<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.user.id = :userId AND n.kind IN :kinds")
    long countByUserIdAndKinds(@Param("userId") Long userId, @Param("kinds") List<NotificationKind> kinds);
    
    Page<NotificationEntity> findByUserIdAndKindInOrderByCreatedAtDesc(Long userId, List<NotificationKind> kinds, Pageable pageable);
}
