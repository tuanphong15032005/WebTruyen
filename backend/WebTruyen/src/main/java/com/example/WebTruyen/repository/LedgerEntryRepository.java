package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntryEntity, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);
    List<LedgerEntryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
    List<LedgerEntryEntity> findByUserIdAndReason(Long userId, LedgerReason reason);
    boolean existsByRefTypeAndRefIdAndReason(String refType, Long refId, LedgerReason reason);
    
    @Query("SELECT COUNT(l) FROM LedgerEntryEntity l WHERE l.user.id = :userId AND l.reason = :reason")
    long countByUserIdAndReason(@Param("userId") Long userId, @Param("reason") LedgerReason reason);
}
