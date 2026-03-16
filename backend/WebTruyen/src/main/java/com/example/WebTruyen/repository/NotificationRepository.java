package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
}
