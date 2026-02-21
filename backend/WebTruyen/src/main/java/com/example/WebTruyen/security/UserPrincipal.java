package com.example.WebTruyen.security;

import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserPrincipal implements UserDetails {
    private UserEntity user;

    public UserPrincipal(UserEntity user) {
        this.user = user;
    }

    public UserEntity getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> authorities = user.getUserRoles().stream()
                .map(userRole -> userRole.getRole() != null ? userRole.getRole().getCode() : null)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(code -> !code.isEmpty())
                .map(String::toUpperCase)
                .map(code -> new SimpleGrantedAuthority("ROLE_" + code))
                .distinct()
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        // Seed data uses MOD, but moderation/admin screens should accept ADMIN semantics too.
        if (authorities.stream().anyMatch(a -> "ROLE_MOD".equals(a.getAuthority()))
                && authorities.stream().noneMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

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
