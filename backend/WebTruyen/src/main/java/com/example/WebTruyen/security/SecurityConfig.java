package com.example.WebTruyen.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. QUAN TRỌNG: Thêm cấu hình CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // === PUBLIC ENDPOINTS (Guest, Reader, Author, Admin) ===
                        // Home page - Public access for all users
                        .requestMatchers("/", "/api/stories", "/api/stories/**").permitAll()
                        .requestMatchers("/api/public/stories/**").permitAll()
                        
                        // Advanced Search - Public access for all users
                        .requestMatchers("/api/search", "/api/search/**").permitAll()
                        .requestMatchers("/api/authors/search").permitAll()
                        .requestMatchers("/api/authors/suggestions").permitAll()
                        .requestMatchers("/api/authors").permitAll()
                        
                        // Ranking Hub and Story Ranking - Public access for all users
                        .requestMatchers("/api/ranking/**").permitAll()
                        .requestMatchers("/api/public/ranking/**").permitAll()
                        
                        // Authentication endpoints - Public access
                        .requestMatchers("/api/auth/**").permitAll()
                        
                        // Public user portfolio and discovery - Public access
                        .requestMatchers("/api/users/*/portfolio").permitAll()
                        .requestMatchers("/api/users/*/follow").permitAll()
                        .requestMatchers("/api/users/*/follow-status").permitAll()
                        .requestMatchers("/api/users/*/stories").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        
                        // Public content endpoints
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/chapters/**").permitAll()
                        .requestMatchers("/api/comments/**").permitAll()
                        .requestMatchers("/api/tags", "/api/v1/tags").permitAll()
                        
                        // Author application pen name check - Public access
                        .requestMatchers("/api/author-application/check-pen-name").permitAll()
                        
                        // Test and error endpoints - Public access
                        .requestMatchers("/api/test/public").permitAll()
                        .requestMatchers("/error").permitAll()

                        // === AUTHENTICATED USER ENDPOINTS (Reader, Author, Admin) ===
                        // Header Sidebar functionality - Requires authentication
                        .requestMatchers("/api/users/profile/**").authenticated()
                        .requestMatchers("/api/users/bookmarks/**").authenticated()
                        .requestMatchers("/api/users/reading-history/**").authenticated()
                        .requestMatchers("/api/users/notifications/**").authenticated()
                        .requestMatchers("/api/users/settings/**").authenticated()
                        
                        // Wallet and transaction functionality - Authenticated users
                        .requestMatchers("/api/wallet/**").authenticated()
                        .requestMatchers("/api/transactions/**").authenticated()
                        .requestMatchers("/api/donations/**").authenticated()
                        .requestMatchers("/api/payments/**").authenticated()
                        
                        // Withdrawal requests - Authenticated users (all roles can request)
                        .requestMatchers("/api/withdrawals/**").authenticated()
                        
                        // Reports - Authenticated users
                        .requestMatchers("/api/reports").authenticated()
                        
                        // Daily tasks and achievements - Authenticated users
                        .requestMatchers("/api/daily-tasks/**").authenticated()
                        .requestMatchers("/api/achievements/**").authenticated()
                        .requestMatchers("/api/tiered-achievements/**").authenticated()
                        
                        // Library functionality - Authenticated users
                        .requestMatchers("/api/library/**").authenticated()
                        .requestMatchers("/api/bookmarks/**").authenticated()

                        // === AUTHOR ENDPOINTS (Author, Moderator) ===
                        // Author dashboard and story management
                        .requestMatchers("/api/author/**").hasAnyRole("AUTHOR", "MOD")
                        .requestMatchers("/api/stories/manage/**").hasAnyRole("AUTHOR", "MOD")
                        .requestMatchers("/api/chapters/manage/**").hasAnyRole("AUTHOR", "MOD")
                        
                        // Author application - Authenticated users (so readers can apply)
                        .requestMatchers("/api/author-application/**").authenticated()
                        
                        // Author analytics and performance
                        .requestMatchers("/api/author/analytics/**").hasAnyRole("AUTHOR", "MOD")
                        .requestMatchers("/api/performance/**").hasAnyRole("AUTHOR", "MOD")
                        
                        // Reviewer application - Authenticated users (so readers can apply)
                        .requestMatchers("/api/reviewer/**").authenticated()

                        // === ADMIN ENDPOINTS (Moderator only) ===
                        // Admin dashboard and management
                        .requestMatchers("/api/admin/**").hasRole("MOD")
                        
                        // Finance management
                        .requestMatchers("/api/finance/**").hasRole("MOD")
                        .requestMatchers("/api/admin/finance/**").hasRole("MOD")
                        
                        // User management
                        .requestMatchers("/api/users/manage/**").hasRole("MOD")
                        .requestMatchers("/api/users/admin/**").hasRole("MOD")
                        
                        // Content moderation
                        .requestMatchers("/api/moderation/**").hasRole("MOD")
                        .requestMatchers("/api/admin/moderation/**").hasRole("MOD")
                        
                        // System configuration and monitoring
                        .requestMatchers("/api/system/**").hasRole("MOD")
                        .requestMatchers("/api/monitoring/**").hasRole("MOD")
                        
                        // Admin terms management
                        .requestMatchers("/api/admin/terms/**").hasRole("MOD")
                        
                        // Admin achievements management
                        .requestMatchers("/api/admin/achievements/**").hasRole("MOD")
                        .requestMatchers("/api/admin/achievements/system/**").hasRole("MOD")
                        
                        // Admin daily missions management
                        .requestMatchers("/api/admin/daily-missions/**").hasRole("MOD")
                        
                        // Admin author applications management
                        .requestMatchers("/api/admin/author-applications/**").hasRole("MOD")
                        
                        // Upload management
                        .requestMatchers("/api/uploads/**").hasRole("MOD")

                        // === FALLBACK ===
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 3. Bean cấu hình chi tiết cho CORS
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép Frontend chạy ở cổng 5173 và 5174 truy cập
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        // Cho phép các method
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Cho phép mọi header
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
