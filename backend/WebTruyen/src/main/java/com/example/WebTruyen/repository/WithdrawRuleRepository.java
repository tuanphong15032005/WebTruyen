package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.WithdrawRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WithdrawRuleRepository extends JpaRepository<WithdrawRuleEntity, Long> {

    Optional<WithdrawRuleEntity> findFirstByCoinAndActiveIsTrueOrderByIdDesc(String coin);
}

