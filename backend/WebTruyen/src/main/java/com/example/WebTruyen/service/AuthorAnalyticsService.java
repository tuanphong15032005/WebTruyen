package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.response.AuthorAnalyticsPoint;
import com.example.WebTruyen.dto.response.AuthorChapterPerformanceItem;
import com.example.WebTruyen.dto.response.AuthorStoryAnalyticsResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthorAnalyticsService {
    private static final int CHART_DAYS = 7;
    private static final DateTimeFormatter LABEL_FORMAT = DateTimeFormatter.ofPattern("dd/MM");

    private static final String STORY_INFO_SQL = """
            SELECT s.id, s.title, COALESCE(s.view_count, 0)
            FROM stories s
            WHERE s.id = ? AND s.author_id = ?
            """;

    private static final String TOTAL_COIN_SQL = """
            SELECT COALESCE(SUM(cu.coin_cost), 0)
            FROM chapter_unlocks cu
            JOIN chapters c ON c.id = cu.chapter_id
            JOIN volumes v ON v.id = c.volume_id
            WHERE v.story_id = ?
            """;

    private static final String TOTAL_FOLLOWERS_SQL = """
            SELECT COUNT(*)
            FROM follows_stories fs
            WHERE fs.story_id = ?
            """;

    private static final String VIEW_EVENTS_BY_DAY_SQL = """
            SELECT DATE(e.event_time) AS event_day, COUNT(*) AS total_events
            FROM (
                SELECT b.created_at AS event_time
                FROM bookmarks b
                JOIN chapters c ON c.id = b.chapter_id
                JOIN volumes v ON v.id = c.volume_id
                WHERE v.story_id = ? AND b.created_at >= ?
                UNION ALL
                SELECT cu.created_at AS event_time
                FROM chapter_unlocks cu
                JOIN chapters c ON c.id = cu.chapter_id
                JOIN volumes v ON v.id = c.volume_id
                WHERE v.story_id = ? AND cu.created_at >= ?
            ) e
            GROUP BY DATE(e.event_time)
            ORDER BY event_day
            """;

    private static final String REVENUE_BY_DAY_SQL = """
            SELECT DATE(cu.created_at) AS event_day, COALESCE(SUM(cu.coin_cost), 0) AS total_coin
            FROM chapter_unlocks cu
            JOIN chapters c ON c.id = cu.chapter_id
            JOIN volumes v ON v.id = c.volume_id
            WHERE v.story_id = ? AND cu.created_at >= ?
            GROUP BY DATE(cu.created_at)
            ORDER BY event_day
            """;

    private static final String FOLLOWERS_BY_DAY_SQL = """
            SELECT DATE(fs.created_at) AS event_day, COUNT(*) AS follower_count
            FROM follows_stories fs
            WHERE fs.story_id = ? AND fs.created_at >= ?
            GROUP BY DATE(fs.created_at)
            ORDER BY event_day
            """;

    private static final String BASE_FOLLOWERS_SQL = """
            SELECT COUNT(*)
            FROM follows_stories fs
            WHERE fs.story_id = ? AND fs.created_at < ?
            """;

    private static final String CHAPTER_PERFORMANCE_SQL = """
            SELECT c.id,
                   c.title,
                   c.sequence_index,
                   c.status,
                   COALESCE(bm.bookmark_events, 0) + COALESCE(unl.unlock_events, 0) AS total_views,
                   COALESCE(unl.coin_earned, 0) AS total_coin
            FROM chapters c
            JOIN volumes v ON v.id = c.volume_id
            LEFT JOIN (
                SELECT b.chapter_id, COUNT(*) AS bookmark_events
                FROM bookmarks b
                GROUP BY b.chapter_id
            ) bm ON bm.chapter_id = c.id
            LEFT JOIN (
                SELECT cu.chapter_id,
                       COUNT(*) AS unlock_events,
                       COALESCE(SUM(cu.coin_cost), 0) AS coin_earned
                FROM chapter_unlocks cu
                GROUP BY cu.chapter_id
            ) unl ON unl.chapter_id = c.id
            WHERE v.story_id = ?
            ORDER BY v.sequence_index ASC, c.sequence_index ASC
            """;

    private static final String CURRENT_COIN_TO_CASH_RATE_SQL = """
            SELECT cash_amount / coin_amount
            FROM coin_conversion_rates
            WHERE is_active = 1 AND effective_date <= CURRENT_DATE()
            ORDER BY effective_date DESC, id DESC
            LIMIT 1
            """;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public AuthorStoryAnalyticsResponse getStoryAnalytics(Long storyId, Long authorId) {
        Object[] storyInfo = getStoryInfo(storyId, authorId);
        Long totalCoin = getSingleLong(TOTAL_COIN_SQL, storyId);
        Long totalFollowers = getSingleLong(TOTAL_FOLLOWERS_SQL, storyId);
        BigDecimal currentCoinToCashRate = getCurrentCoinToCashRate();
        BigDecimal estimatedCashRevenue = calculateCashRevenue(totalCoin, currentCoinToCashRate);

        LocalDate today = LocalDate.now();
        LocalDate startDay = today.minusDays(CHART_DAYS - 1L);
        LocalDateTime startDateTime = startDay.atStartOfDay();

        List<AuthorAnalyticsPoint> viewsSeries = buildDailySeries(
                queryDayValue(VIEW_EVENTS_BY_DAY_SQL, storyId, startDateTime, storyId, startDateTime),
                startDay,
                false,
                0L
        );

        List<AuthorAnalyticsPoint> revenueSeries = buildDailySeries(
                queryDayValue(REVENUE_BY_DAY_SQL, storyId, startDateTime),
                startDay,
                false,
                0L
        );

        Long followerBase = getSingleLong(BASE_FOLLOWERS_SQL, storyId, startDateTime);
        List<AuthorAnalyticsPoint> followerGrowthSeries = buildDailySeries(
                queryDayValue(FOLLOWERS_BY_DAY_SQL, storyId, startDateTime),
                startDay,
                true,
                followerBase
        );

        List<AuthorChapterPerformanceItem> chapterItems = getChapterPerformance(storyId);

        return AuthorStoryAnalyticsResponse.builder()
                .storyId(toLong(storyInfo[0]))
                .storyTitle(toString(storyInfo[1]))
                .totalViews(toLong(storyInfo[2]))
                .totalCoinEarned(totalCoin)
                .currentCoinToCashRate(currentCoinToCashRate)
                .estimatedCashRevenue(estimatedCashRevenue)
                .totalFollowers(totalFollowers)
                .viewsOverTime(viewsSeries)
                .coinRevenueOverTime(revenueSeries)
                .followerGrowthOverTime(followerGrowthSeries)
                .chapterPerformance(chapterItems)
                .build();
    }

    private BigDecimal getCurrentCoinToCashRate() {
        try {
            List<?> rows = entityManager.createNativeQuery(CURRENT_COIN_TO_CASH_RATE_SQL).getResultList();
            if (rows.isEmpty()) {
                return BigDecimal.ZERO;
            }
            BigDecimal rate = toBigDecimal(rows.get(0));
            return rate == null ? BigDecimal.ZERO : rate;
        } catch (Exception ignored) {
            // Conversion table might not be available in older environments.
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal calculateCashRevenue(Long totalCoin, BigDecimal rate) {
        if (totalCoin == null || totalCoin <= 0 || rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(totalCoin)
                .multiply(rate)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private Object[] getStoryInfo(Long storyId, Long authorId) {
        List<Object[]> rows = entityManager.createNativeQuery(STORY_INFO_SQL)
                .setParameter(1, storyId)
                .setParameter(2, authorId)
                .getResultList();
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Story not found");
        }
        return rows.get(0);
    }

    private Long getSingleLong(String sql, Object... params) {
        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) {
            query.setParameter(i + 1, params[i]);
        }
        Object value = query.getSingleResult();
        return toLong(value, 0L);
    }

    private Map<LocalDate, Long> queryDayValue(String sql, Object... params) {
        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) {
            query.setParameter(i + 1, params[i]);
        }
        List<Object[]> rows = query.getResultList();
        Map<LocalDate, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate date = toLocalDate(row[0]);
            if (date != null) {
                result.put(date, toLong(row[1], 0L));
            }
        }
        return result;
    }

    private List<AuthorAnalyticsPoint> buildDailySeries(Map<LocalDate, Long> dayToValue,
                                                        LocalDate startDay,
                                                        boolean cumulative,
                                                        Long startValue) {
        List<AuthorAnalyticsPoint> items = new ArrayList<>();
        long running = startValue == null ? 0L : startValue;
        for (int i = 0; i < CHART_DAYS; i++) {
            LocalDate day = startDay.plusDays(i);
            long value = dayToValue.getOrDefault(day, 0L);
            if (cumulative) {
                running += value;
                value = running;
            }
            items.add(AuthorAnalyticsPoint.builder()
                    .label(day.format(LABEL_FORMAT))
                    .value(value)
                    .build());
        }
        return items;
    }

    private List<AuthorChapterPerformanceItem> getChapterPerformance(Long storyId) {
        List<Object[]> rows = entityManager.createNativeQuery(CHAPTER_PERFORMANCE_SQL)
                .setParameter(1, storyId)
                .getResultList();
        List<AuthorChapterPerformanceItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            items.add(AuthorChapterPerformanceItem.builder()
                    .chapterId(toLong(row[0]))
                    .chapterTitle(toString(row[1]))
                    .chapterNumber(toInteger(row[2]))
                    .chapterStatus(toString(row[3]))
                    .views(toLong(row[4], 0L))
                    .coinEarned(toLong(row[5], 0L))
                    .build());
        }
        return items;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime().toLocalDate();
        }
        return null;
    }

    private Long toLong(Object value) {
        return toLong(value, null);
    }

    private Long toLong(Object value, Long fallback) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return fallback;
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private String toString(Object value) {
        return value == null ? null : value.toString();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return null;
    }
}
