//package com.example.WebTruyen.repository;
//
//import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
//import org.springframework.data.jpa.repository.JpaRepository;
//import java.util.Optional;
//
//public interface UserRepository extends JpaRepository<UserEntity, Integer> {
//    // Tìm user bằng username (để check đăng nhập)
//    Optional<UserEntity> findByUsername(String username);
//
//    // Kiểm tra xem username đã tồn tại chưa (để check đăng ký)
//    boolean existsByUsername(String username);
//
//    // Kiểm tra email đã tồn tại chưa
//    boolean existsByEmail(String email);
//}