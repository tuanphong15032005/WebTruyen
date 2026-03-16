package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.notification.NotificationListResponseDto;
import com.example.WebTruyen.dto.notification.NotificationResponseDto;
import com.example.WebTruyen.dto.notification.UnreadNotificationCountDto;
import com.example.WebTruyen.entity.enums.NotificationCategory;
import com.example.WebTruyen.entity.enums.NotificationKind;
import com.example.WebTruyen.entity.model.CoreIdentity.NotificationEntity;
import com.example.WebTruyen.entity.model.CoreIdentity.UserEntity;
import com.example.WebTruyen.repository.NotificationRepository;
import com.example.WebTruyen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationListResponseDto getNotificationsByCategory(Long userId, NotificationCategory category, Pageable pageable) {
        List<NotificationKind> kinds = getKindsByCategory(category);
        Page<NotificationEntity> notificationPage = notificationRepository.findByUserIdAndKindInOrderByCreatedAtDesc(userId, kinds, pageable);
        
        List<NotificationResponseDto> notifications = notificationPage.getContent().stream()
                .map(entity -> mapToResponseDto(entity, true)) // All notifications are considered unread for now
                .collect(Collectors.toList());

        return new NotificationListResponseDto(
                notifications,
                notificationPage.getNumber(),
                notificationPage.getTotalPages(),
                notificationPage.getTotalElements(),
                notificationPage.hasNext(),
                notificationPage.hasPrevious()
        );
    }

    public NotificationListResponseDto getAllNotifications(Long userId, Pageable pageable) {
        Page<NotificationEntity> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        List<NotificationResponseDto> notifications = notificationPage.getContent().stream()
                .map(entity -> mapToResponseDto(entity, true)) // All notifications are considered unread for now
                .collect(Collectors.toList());

        return new NotificationListResponseDto(
                notifications,
                notificationPage.getNumber(),
                notificationPage.getTotalPages(),
                notificationPage.getTotalElements(),
                notificationPage.hasNext(),
                notificationPage.hasPrevious()
        );
    }

    public UnreadNotificationCountDto getUnreadCount(Long userId) {
        long storyCount = notificationRepository.countByUserIdAndKinds(userId, getKindsByCategory(NotificationCategory.STORY));
        long interactionCount = notificationRepository.countByUserIdAndKinds(userId, getKindsByCategory(NotificationCategory.INTERACTION));
        long achievementCount = notificationRepository.countByUserIdAndKinds(userId, getKindsByCategory(NotificationCategory.ACHIEVEMENT));
        long transactionCount = notificationRepository.countByUserIdAndKinds(userId, getKindsByCategory(NotificationCategory.TRANSACTION));
        
        long totalCount = storyCount + interactionCount + achievementCount + transactionCount;

        return new UnreadNotificationCountDto(totalCount, storyCount, interactionCount, achievementCount, transactionCount);
    }

    public void markNotificationAsRead(Long notificationId, Long userId) {
        // Since we can't modify the schema, we'll just log this for now
        // In a real implementation, you might need a separate table to track read status
        System.out.println("Marking notification as read: " + notificationId + " for user: " + userId);
    }

    public void markAllNotificationsAsRead(Long userId, NotificationCategory category) {
        // Since we can't modify the schema, we'll just log this for now
        // In a real implementation, you might need a separate table to track read status
        System.out.println("Marking all notifications as read for user: " + userId + " in category: " + category);
    }

    public void createNotification(Long userId, String type, String title, String message, 
                                  Long referenceId, Long storyId, Long chapterId) {
        NotificationKind kind;
        try {
            kind = NotificationKind.valueOf(type.toLowerCase());
        } catch (IllegalArgumentException e) {
            // Default to system notification if kind is not recognized
            kind = NotificationKind.system;
        }
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .kind(kind)
                .message(message)
                .refType(type)
                .refId(referenceId)
                .storyId(storyId)
                .chapterId(chapterId)
                .build();

        notificationRepository.save(notification);
    }

    private NotificationResponseDto mapToResponseDto(NotificationEntity entity, boolean isRead) {
        return new NotificationResponseDto(
                entity.getId(),
                entity.getKind().name(),
                generateTitle(entity.getKind(), entity.getMessage()),
                entity.getMessage(),
                isRead, // We'll pass this as a parameter since we can't store it in the DB
                entity.getCreatedAt(),
                entity.getRefId(),
                entity.getStoryId(),
                entity.getChapterId()
        );
    }

    private String generateTitle(NotificationKind kind, String message) {
        return switch (kind) {
            case new_chapter -> "New Chapter";
            case topup -> "Transaction";
            case report -> "Report";
            case system -> "System";
            default -> "Notification";
        };
    }

    private List<NotificationKind> getKindsByCategory(NotificationCategory category) {
        return switch (category) {
            case STORY -> List.of(NotificationKind.new_chapter, NotificationKind.report);
            case INTERACTION -> List.of(NotificationKind.report);
            case ACHIEVEMENT -> List.of(NotificationKind.system);
            case TRANSACTION -> List.of(NotificationKind.topup);
        };
    }
}
