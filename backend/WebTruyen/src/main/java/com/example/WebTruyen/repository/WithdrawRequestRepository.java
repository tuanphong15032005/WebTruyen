package com.example.WebTruyen.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.WebTruyen.entity.model.Payment.WithdrawRequestEntity;

public interface WithdrawRequestRepository extends JpaRepository<WithdrawRequestEntity, Long> {

    List<WithdrawRequestEntity> findByUserIdOrderByRequestedAtDesc(Long userId);

    @Query("""
            select wr from WithdrawRequestEntity wr
            where wr.user.id = :userId
              and wr.paymentMethodDetails like concat('%', :marker, '%')
            order by wr.requestedAt desc
            """)
    List<WithdrawRequestEntity> findByUserIdAndPaymentMarkerOrderByRequestedAtDesc(
            @Param("userId") Long userId,
            @Param("marker") String marker
    );
}

