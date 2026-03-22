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

import java.nio.charset.StandardCharsets;
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
                .message(normalizeNotificationText(message))
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
                normalizeNotificationText(entity.getMessage()),
                isRead,
                entity.getCreatedAt(),
                entity.getRefId(),
                entity.getStoryId(),
                entity.getChapterId()
        );
    }

    private String generateTitle(NotificationKind kind, String refType) {
        return switch (kind) {
            case new_chapter -> "Chương mới";
            case topup -> "Nạp tiền";
            case report -> "Báo cáo";
            case system -> "Thành tựu";
            case comment -> "Bình luận mới";
            case transaction -> LEGACY_SETTLEMENT_REF_TYPE.equalsIgnoreCase(refType == null ? "" : refType)
                    ? "Doanh thu chương"
                    : "Giao dịch";
            case story_moderation -> "Kiểm duyệt truyện";
            case new_story -> "Truyện mới";
            case chapter_schedule -> "Lịch phát hành chương";
        };
    }

    private String normalizeNotificationText(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        String normalized = repairMojibake(value);

        return normalized
                .replace("Thong bao", "Thông báo")
                .replace("Tac gia", "Tác giả")
                .replace("Truyen", "Truyện")
                .replace("truyen", "truyện")
                .replace("Chuong", "Chương")
                .replace("chuong", "chương")
                .replace("Lich", "Lịch")
                .replace("lich", "lịch")
                .replace("Cap nhat", "Cập nhật")
                .replace("cua truyen", "của truyện")
                .replace("cua ban", "của bạn")
                .replace("da co chuong moi", "đã có chương mới")
                .replace("da duoc duyet", "đã được duyệt")
                .replace("da bi tu choi", "đã bị từ chối")
                .replace("da bi huy", "đã bị hủy")
                .replace("da duoc cap nhat thanh", "đã được cập nhật thành")
                .replace("du kien phat hanh vao luc", "dự kiến phát hành vào lúc")
                .replace("Ghi chu tu admin", "Ghi chú từ admin")
                .replace("vua co truyen moi", "vừa có truyện mới")
                .replace("Ban da mua chuong", "Bạn đã mua chương")
                .replace("voi gia", "với giá")
                .replace("Nap tien", "Nạp tiền")
                .replace("Giao dich", "Giao dịch")
                .replace("Thanh tuu", "Thành tựu")
                .replace("Bao cao", "Báo cáo")
                .replace("Binh luan", "Bình luận");
    }

    private String repairMojibake(String value) {
        if (!looksLikeMojibake(value)) {
            return value;
        }

        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return value;
        }
    }

    private boolean looksLikeMojibake(String value) {
        return value.contains("Ã")
                || value.contains("Ä")
                || value.contains("Â")
                || value.contains("â")
                || value.contains("áº")
                || value.contains("á»");
    }
}
