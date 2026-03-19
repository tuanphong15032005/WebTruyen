package com.example.WebTruyen.controller;

import com.example.WebTruyen.dto.notification.NotificationListResponseDto;
import com.example.WebTruyen.dto.notification.UnreadNotificationCountDto;
import com.example.WebTruyen.entity.enums.NotificationCategory;
import com.example.WebTruyen.security.UserPrincipal;
import com.example.WebTruyen.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/public/test")
    public ResponseEntity<String> publicTest() {
        return ResponseEntity.ok("Notifications API working - " + System.currentTimeMillis());
    }

    @PostMapping("/public/create-test")
    public ResponseEntity<String> createTestNotification() {
        // Create a test notification for user ID 1 (assuming it exists)
        try {
            notificationService.createNotification(
                1L, // userId
                "system", 
                "Test Notification",
                "Đây là thông báo test để verify system hoạt động",
                null, // referenceId
                null, // storyId  
                null  // chapterId
            );
            return ResponseEntity.ok("Test notification created successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Notifications API working");
    }

    @GetMapping
    public ResponseEntity<NotificationListResponseDto> getNotifications(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Pageable pageable = PageRequest.of(page, size);
        Long userId = userPrincipal.getUser().getId();

        NotificationListResponseDto response;
        if (category != null && !category.isEmpty()) {
            try {
                NotificationCategory notificationCategory = NotificationCategory.valueOf(category.toUpperCase());
                response = notificationService.getNotificationsByCategory(userId, notificationCategory, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid category: " + category);
            }
        } else {
            response = notificationService.getAllNotifications(userId, pageable);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountDto> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal.getUser().getId();
        UnreadNotificationCountDto response = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal.getUser().getId();
        notificationService.markNotificationAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead(
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal.getUser().getId();
        if (category != null && !category.isEmpty()) {
            try {
                NotificationCategory notificationCategory = NotificationCategory.valueOf(category.toUpperCase());
                notificationService.markAllNotificationsAsRead(userId, notificationCategory);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid category: " + category);
            }
        } else {
            // Mark all notifications as read by calling for each category
            for (NotificationCategory notificationCategory : NotificationCategory.values()) {
                notificationService.markAllNotificationsAsRead(userId, notificationCategory);
            }
        }

        return ResponseEntity.ok().build();
    }
}
