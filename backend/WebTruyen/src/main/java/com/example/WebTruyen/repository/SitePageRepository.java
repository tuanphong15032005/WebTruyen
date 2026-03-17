package com.example.WebTruyen.repository;

import com.example.WebTruyen.entity.model.Content.SitePageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SitePageRepository extends JpaRepository<SitePageEntity, Long> {
    Optional<SitePageEntity> findByCode(String code);
    
    @Query("SELECT sp FROM SitePageEntity sp ORDER BY sp.code")
    List<SitePageEntity> findAllOrderByCode();
}
