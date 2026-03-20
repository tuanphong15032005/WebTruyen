package com.example.WebTruyen.security;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserRoleEntity;

public class UserPrincipal implements UserDetails {
    private UserEntity user;
    private List<GrantedAuthority> authorities;

    public UserPrincipal(UserEntity user) {
        this.user = user;
        // Don't load roles here to avoid LazyInitializationException
        // Roles will be checked at service level if needed
        this.authorities = List.of();
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
