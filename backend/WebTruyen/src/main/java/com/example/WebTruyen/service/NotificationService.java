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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    // Simple cache for unread counts (userId -> (count, timestamp))
    private final Map<Long, Pair<Long, LocalDateTime>> unreadCountCache = new ConcurrentHashMap<>();
    private static final long CACHE_DURATION_MINUTES = 5;

    public NotificationListResponseDto getNotificationsByCategory(Long userId, NotificationCategory category, Pageable pageable) {
        List<NotificationKind> kinds = getKindsByCategory(category);
        // Use simple query without JOIN FETCH to prevent N+1 queries
        Page<NotificationEntity> notificationPage = notificationRepository.findByUserIdAndKindInOrderByCreatedAtDescSimple(userId, kinds, pageable);
        
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
        // Use simple query without JOIN FETCH to prevent N+1 queries
        Page<NotificationEntity> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDescSimple(userId, pageable);
        
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
        // Check cache first
        Pair<Long, LocalDateTime> cached = unreadCountCache.get(userId);
        LocalDateTime now = LocalDateTime.now();
        
        if (cached != null && cached.getRight().plusMinutes(CACHE_DURATION_MINUTES).isAfter(now)) {
            // Return cached count
            long count = cached.getLeft();
            return new UnreadNotificationCountDto(count, count, 0, 0, 0); // Simplified for cache
        }
        
        // Cache miss or expired, fetch from DB
        List<Object[]> results = notificationRepository.countNotificationsByKindForUser(userId);
        
        long storyCount = 0, interactionCount = 0, achievementCount = 0, transactionCount = 0;
        
        for (Object[] result : results) {
            NotificationKind kind = (NotificationKind) result[0];
            Long count = (Long) result[1];
            
            if (kind == NotificationKind.new_chapter) {
                storyCount += count;
                interactionCount += count; // new_chapter also counts as interaction
            } else if (kind == NotificationKind.report) {
                interactionCount += count;
            } else if (kind == NotificationKind.system) {
                achievementCount += count;
            } else if (kind == NotificationKind.topup) {
                transactionCount += count;
            }
        }
        
        long totalCount = storyCount + interactionCount + achievementCount + transactionCount;
        
        // Update cache
        unreadCountCache.put(userId, Pair.of(totalCount, now));

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

    @Transactional
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
        
        // Clear cache for this user since they have a new notification
        unreadCountCache.remove(userId);
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
            case chapter_comment -> "New Comment";
            default -> "Notification";
        };
    }

    private List<NotificationKind> getKindsByCategory(NotificationCategory category) {
        return switch (category) {
            case STORY -> List.of(NotificationKind.new_chapter); // Chỉ thông báo truyện
            case INTERACTION -> List.of(NotificationKind.report, NotificationKind.chapter_comment); // Bao gồm cmt, report...
            case ACHIEVEMENT -> List.of(NotificationKind.system); // Chỉ bao gồm achievement, không phải daily tasks
            case TRANSACTION -> List.of(NotificationKind.topup); // Giao dịch tăng giảm coin
        };
    }
}
