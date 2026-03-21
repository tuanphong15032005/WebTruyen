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
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final long CACHE_DURATION_MINUTES = 5;
    private static final String LEGACY_SETTLEMENT_REF_TYPE = "chapter_settlement";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // Simple cache for unread counts (userId -> (count, timestamp))
    private final Map<Long, Pair<Long, LocalDateTime>> unreadCountCache = new ConcurrentHashMap<>();

    public NotificationListResponseDto getNotificationsByCategory(Long userId, NotificationCategory category, Pageable pageable) {
        Page<NotificationEntity> notificationPage = switch (category) {
            case STORY -> notificationRepository.findByUserIdAndKindInOrderByCreatedAtDescSimple(
                    userId,
                    List.of(
                            NotificationKind.new_chapter,
                            NotificationKind.story_moderation,
                            NotificationKind.new_story,
                            NotificationKind.chapter_schedule
                    ),
                    pageable
            );
            case INTERACTION -> notificationRepository.findByUserIdAndKindInOrderByCreatedAtDescSimple(
                    userId,
                    List.of(NotificationKind.report, NotificationKind.comment),
                    pageable
            );
            case ACHIEVEMENT -> notificationRepository.findByUserIdAndKindExcludingRefTypesOrderByCreatedAtDescSimple(
                    userId,
                    NotificationKind.system,
                    List.of(LEGACY_SETTLEMENT_REF_TYPE),
                    pageable
            );
            case TRANSACTION -> notificationRepository.findByUserIdAndKindsOrLegacyRefTypesOrderByCreatedAtDescSimple(
                    userId,
                    List.of(NotificationKind.topup, NotificationKind.transaction),
                    NotificationKind.system,
                    List.of(LEGACY_SETTLEMENT_REF_TYPE),
                    pageable
            );
        };

        List<NotificationResponseDto> notifications = notificationPage.getContent().stream()
                .map(entity -> mapToResponseDto(entity, true))
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
        Page<NotificationEntity> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDescSimple(userId, pageable);

        List<NotificationResponseDto> notifications = notificationPage.getContent().stream()
                .map(entity -> mapToResponseDto(entity, true))
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
        Pair<Long, LocalDateTime> cached = unreadCountCache.get(userId);
        LocalDateTime now = LocalDateTime.now();

        if (cached != null && cached.getRight().plusMinutes(CACHE_DURATION_MINUTES).isAfter(now)) {
            long count = cached.getLeft();
            return new UnreadNotificationCountDto(count, count, 0, 0, 0);
        }

        List<Object[]> results = notificationRepository.countNotificationsByKindAndRefTypeForUser(userId);

        long storyCount = 0;
        long interactionCount = 0;
        long achievementCount = 0;
        long transactionCount = 0;

        for (Object[] result : results) {
            NotificationKind kind = (NotificationKind) result[0];
            String refType = (String) result[1];
            Long count = (Long) result[2];

            if (kind == NotificationKind.new_chapter
                    || kind == NotificationKind.story_moderation
                    || kind == NotificationKind.new_story
                    || kind == NotificationKind.chapter_schedule) {
                storyCount += count;
            } else if (kind == NotificationKind.report || kind == NotificationKind.comment) {
                interactionCount += count;
            } else if (kind == NotificationKind.system && !LEGACY_SETTLEMENT_REF_TYPE.equals(refType)) {
                achievementCount += count;
            } else if (kind == NotificationKind.topup
                    || kind == NotificationKind.transaction
                    || (kind == NotificationKind.system && LEGACY_SETTLEMENT_REF_TYPE.equals(refType))) {
                transactionCount += count;
            }
        }

        long totalCount = storyCount + interactionCount + achievementCount + transactionCount;
        unreadCountCache.put(userId, Pair.of(totalCount, now));

        return new UnreadNotificationCountDto(totalCount, storyCount, interactionCount, achievementCount, transactionCount);
    }

    @Transactional
    public void createNotification(Long userId, String type, String title, String message,
                                   Long referenceId, Long storyId, Long chapterId) {
        NotificationKind kind;
        try {
            kind = NotificationKind.valueOf(type.toLowerCase());
        } catch (IllegalArgumentException e) {
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
        unreadCountCache.remove(userId);
    }

    @Transactional
    public void deleteNotificationsByKindAndChapterId(NotificationKind kind, Long chapterId) {
        if (kind == null || chapterId == null) {
            return;
        }

        List<Long> affectedUserIds = notificationRepository.findDistinctUserIdsByKindAndChapterId(kind, chapterId);
        notificationRepository.deleteByKindAndChapterId(kind, chapterId);
        affectedUserIds.forEach(unreadCountCache::remove);
    }

    private NotificationResponseDto mapToResponseDto(NotificationEntity entity, boolean isRead) {
        return new NotificationResponseDto(
                entity.getId(),
                entity.getKind().name(),
                generateTitle(entity.getKind(), entity.getRefType()),
                entity.getMessage(),
                isRead,
                entity.getCreatedAt(),
                entity.getRefId(),
                entity.getStoryId(),
                entity.getChapterId()
        );
    }

    private String generateTitle(NotificationKind kind, String refType) {
        return switch (kind) {
            case new_chapter -> "Chuong moi";
            case topup -> "Nap tien";
            case report -> "Bao cao";
            case system -> "Thanh tuu";
            case comment -> "Binh luan moi";
            case transaction -> LEGACY_SETTLEMENT_REF_TYPE.equalsIgnoreCase(refType == null ? "" : refType)
                    ? "Doanh thu chuong"
                    : "Giao dich";
            case story_moderation -> "Kiem duyet truyen";
            case new_story -> "Truyen moi";
            case chapter_schedule -> "Lich phat hanh chuong";
        };
    }
}
