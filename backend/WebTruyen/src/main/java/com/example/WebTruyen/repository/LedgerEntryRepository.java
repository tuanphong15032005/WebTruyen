package com.example.WebTruyen.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntryEntity, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);
    List<LedgerEntryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
    Page<LedgerEntryEntity> findByUserOrderByCreatedAtDesc(UserEntity user, Pageable pageable);
    List<LedgerEntryEntity> findByUserIdAndReason(Long userId, LedgerReason reason);
    Optional<LedgerEntryEntity> findByIdAndUserId(Long id, Long userId);
    boolean existsByRefTypeAndRefIdAndReason(String refType, Long refId, LedgerReason reason);
    
    @Query("SELECT COUNT(l) FROM LedgerEntryEntity l WHERE l.user.id = :userId AND l.reason = :reason")
    long countByUserIdAndReason(@Param("userId") Long userId, @Param("reason") LedgerReason reason);
}
