package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Payment.DonationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<DonationEntity, Long> {
    
    List<DonationEntity> findByFromUserIdOrderByCreatedAtDesc(Long fromUserId);
    
    List<DonationEntity> findByToUserIdOrderByCreatedAtDesc(Long toUserId);
    
    @Query("SELECT d FROM DonationEntity d WHERE d.fromUser.id = :fromUserId AND d.toUser.id = :toUserId ORDER BY d.createdAt DESC")
    List<DonationEntity> findByFromUserAndToUserOrderByCreatedAtDesc(@Param("fromUserId") Long fromUserId, @Param("toUserId") Long toUserId);
    
    @Query("SELECT COUNT(d) FROM DonationEntity d WHERE d.toUser.id = :authorId")
    Long countDonationsToAuthor(@Param("authorId") Long authorId);
}
