package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.enums.LedgerReason;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.Payment.LedgerEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntryEntity, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);
    List<LedgerEntryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
    boolean existsByRefTypeAndRefIdAndReason(String refType, Long refId, LedgerReason reason);
}
