package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.PaymentOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrderEntity, Long> {
}
