package com.example.WebTruyen.service;

import com.example.WebTruyen.entity.model.Content.SitePageEntity;
import com.example.WebTruyen.repository.SitePageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SitePageService {
    
    private final SitePageRepository sitePageRepository;
    
    public Optional<SitePageEntity> findByCode(String code) {
        return sitePageRepository.findByCode(code);
    }
    
    public List<SitePageEntity> findAll() {
        return sitePageRepository.findAll();
    }
    
    public List<SitePageEntity> findAllOrderByCode() {
        return sitePageRepository.findAllOrderByCode();
    }
    
    public SitePageEntity save(SitePageEntity sitePage) {
        return sitePageRepository.save(sitePage);
    }
    
    public void deleteById(Long id) {
        sitePageRepository.deleteById(id);
    }
}
