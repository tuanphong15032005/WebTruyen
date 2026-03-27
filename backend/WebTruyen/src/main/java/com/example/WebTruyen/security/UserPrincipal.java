package com.example.WebTruyen.security;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;

public class UserPrincipal implements UserDetails {
    private static final Logger logger = LoggerFactory.getLogger(UserPrincipal.class);
    
    private UserEntity user;
    private List<GrantedAuthority> authorities;

    public UserPrincipal(UserEntity user) {
        this.user = user;
        // Load roles for Spring Security authorization
        this.authorities = user.getUserRoles().stream()
                .map(userRole -> new SimpleGrantedAuthority("ROLE_" + userRole.getRole().getCode()))
                .collect(Collectors.toList());
        
        // Debug logging
        logger.info("Loading UserPrincipal for user: {}, roles: {}", 
                user.getUsername(), 
                authorities.stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()));
    }

    public UserEntity getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
