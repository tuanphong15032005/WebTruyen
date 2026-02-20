package com.example.WebTruyen.service;

import com.example.WebTruyen.dto.request.CoinConversionRateUpsertRequest;
import com.example.WebTruyen.dto.response.CoinConversionRateItemResponse;
import com.example.WebTruyen.dto.response.CoinConversionRateManagementResponse;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class CoinConversionRateService {

    private static final String CREATE_RATE_TABLE_SQL = """
            CREATE TABLE IF NOT EXISTS coin_conversion_rates (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                coin_amount BIGINT NOT NULL,
                cash_amount DECIMAL(18,2) NOT NULL,
                effective_date DATE NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX ix_coin_conversion_rates_effective_date (effective_date),
                INDEX ix_coin_conversion_rates_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """;

    private static final String CREATE_HISTORY_TABLE_SQL = """
            CREATE TABLE IF NOT EXISTS coin_conversion_rate_history (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                conversion_rate_id BIGINT NOT NULL,
                action_type VARCHAR(20) NOT NULL,
                coin_amount BIGINT NOT NULL,
                cash_amount DECIMAL(18,2) NOT NULL,
                effective_date DATE NOT NULL,
                conversion_rate DECIMAL(18,8) NOT NULL,
                changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX ix_coin_conversion_rate_history_rate_id (conversion_rate_id),
                INDEX ix_coin_conversion_rate_history_changed_at (changed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """;

    private static final String CURRENT_RATE_SQL = """
            SELECT id, coin_amount, cash_amount, effective_date, is_active, created_at, updated_at
            FROM coin_conversion_rates
            WHERE is_active = 1 AND effective_date <= CURRENT_DATE()
            ORDER BY effective_date DESC, id DESC
            LIMIT 1
            """;

    private static final String LATEST_RATE_SQL = """
            SELECT id, coin_amount, cash_amount, effective_date, is_active, created_at, updated_at
            FROM coin_conversion_rates
            ORDER BY effective_date DESC, id DESC
            LIMIT 1
            """;

    private static final String HISTORY_SQL = """
            SELECT id, coin_amount, cash_amount, effective_date, is_active, created_at, updated_at
            FROM coin_conversion_rates
            ORDER BY effective_date DESC, updated_at DESC, id DESC
            """;

    @PersistenceContext
    private EntityManager entityManager;

    private final AtomicBoolean schemaReady = new AtomicBoolean(false);

    @Transactional(readOnly = true)
    public CoinConversionRateManagementResponse getManagementData() {
        return CoinConversionRateManagementResponse.builder()
                .currentRate(getCurrentRate())
                .history(getHistory())
                .build();
    }

    @Transactional(readOnly = true)
    public CoinConversionRateItemResponse getCurrentRate() {
        if (!isRateTablePresent()) {
            return null;
        }
        List<?> rows = entityManager.createNativeQuery(CURRENT_RATE_SQL).getResultList();
        if (rows.isEmpty()) {
            rows = entityManager.createNativeQuery(LATEST_RATE_SQL).getResultList();
        }
        if (rows.isEmpty()) {
            return null;
        }
        return mapRateRow((Object[]) rows.get(0));
    }

    @Transactional(readOnly = true)
    public List<CoinConversionRateItemResponse> getHistory() {
        if (!isRateTablePresent() || !isHistoryTablePresent()) {
            return Collections.emptyList();
        }
        List<?> rows = entityManager.createNativeQuery(HISTORY_SQL).getResultList();
        List<CoinConversionRateItemResponse> items = new ArrayList<>();
        for (Object row : rows) {
            items.add(mapRateRow((Object[]) row));
        }
        return items;
    }

    @Transactional
    public CoinConversionRateItemResponse createRate(CoinConversionRateUpsertRequest request) {
        ensureSchemaReady();
        LocalDate effectiveDate = validateRequest(request);
        entityManager.createNativeQuery("""
                INSERT INTO coin_conversion_rates (coin_amount, cash_amount, effective_date, is_active)
                VALUES (?, ?, ?, 1)
                """)
                .setParameter(1, request.getCoinAmount())
                .setParameter(2, request.getCashAmount())
                .setParameter(3, effectiveDate)
                .executeUpdate();

        Object idValue = entityManager.createNativeQuery("SELECT LAST_INSERT_ID()").getSingleResult();
        Long rateId = toLong(idValue);
        if (rateId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create conversion rate");
        }

        CoinConversionRateItemResponse created = getRateById(rateId);
        appendHistory(created, "CREATE");
        return created;
    }

    @Transactional
    public CoinConversionRateItemResponse updateRate(Long id, CoinConversionRateUpsertRequest request) {
        ensureSchemaReady();
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid conversion rate id");
        }
        LocalDate effectiveDate = validateRequest(request);
        int updated = entityManager.createNativeQuery("""
                UPDATE coin_conversion_rates
                SET coin_amount = ?, cash_amount = ?, effective_date = ?, is_active = 1
                WHERE id = ?
                """)
                .setParameter(1, request.getCoinAmount())
                .setParameter(2, request.getCashAmount())
                .setParameter(3, effectiveDate)
                .setParameter(4, id)
                .executeUpdate();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversion rate not found");
        }

        CoinConversionRateItemResponse updatedRate = getRateById(id);
        appendHistory(updatedRate, "UPDATE");
        return updatedRate;
    }

    private CoinConversionRateItemResponse getRateById(Long id) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT id, coin_amount, cash_amount, effective_date, is_active, created_at, updated_at
                FROM coin_conversion_rates
                WHERE id = ?
                LIMIT 1
                """)
                .setParameter(1, id)
                .getResultList();
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversion rate not found");
        }
        return mapRateRow((Object[]) rows.get(0));
    }

    private LocalDate validateRequest(CoinConversionRateUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.getCoinAmount() == null || request.getCoinAmount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coin amount must be greater than 0");
        }
        if (request.getCashAmount() == null || request.getCashAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cash amount must be greater than 0");
        }
        if (request.getEffectiveDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Effective date is required");
        }
        return request.getEffectiveDate();
    }

    private void appendHistory(CoinConversionRateItemResponse item, String actionType) {
        entityManager.createNativeQuery("""
                INSERT INTO coin_conversion_rate_history
                (conversion_rate_id, action_type, coin_amount, cash_amount, effective_date, conversion_rate)
                VALUES (?, ?, ?, ?, ?, ?)
                """)
                .setParameter(1, item.getId())
                .setParameter(2, actionType)
                .setParameter(3, item.getCoinAmount())
                .setParameter(4, item.getCashAmount())
                .setParameter(5, item.getEffectiveDate())
                .setParameter(6, item.getConversionRate())
                .executeUpdate();
    }

    private CoinConversionRateItemResponse mapRateRow(Object[] row) {
        Long coinAmount = toLong(row[1]);
        BigDecimal cashAmount = toBigDecimal(row[2]);
        BigDecimal conversionRate = BigDecimal.ZERO;
        if (coinAmount != null && coinAmount > 0 && cashAmount != null) {
            conversionRate = cashAmount.divide(BigDecimal.valueOf(coinAmount), 8, RoundingMode.HALF_UP);
        }
        return CoinConversionRateItemResponse.builder()
                .id(toLong(row[0]))
                .coinAmount(coinAmount)
                .cashAmount(cashAmount)
                .effectiveDate(toLocalDate(row[3]))
                .active(toBoolean(row[4]))
                .createdAt(toLocalDateTime(row[5]))
                .updatedAt(toLocalDateTime(row[6]))
                .conversionRate(conversionRate)
                .build();
    }

    private void ensureSchemaReady() {
        if (schemaReady.get()) {
            return;
        }
        synchronized (schemaReady) {
            if (schemaReady.get()) {
                return;
            }
            entityManager.createNativeQuery(CREATE_RATE_TABLE_SQL).executeUpdate();
            entityManager.createNativeQuery(CREATE_HISTORY_TABLE_SQL).executeUpdate();
            schemaReady.set(true);
        }
    }

    private boolean isRateTablePresent() {
        return isTablePresent("coin_conversion_rates");
    }

    private boolean isHistoryTablePresent() {
        return isTablePresent("coin_conversion_rate_history");
    }

    private boolean isTablePresent(String tableName) {
        Object value = entityManager.createNativeQuery("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = ?
                """)
                .setParameter(1, tableName)
                .getSingleResult();
        return toLong(value) != null && toLong(value) > 0;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
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

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        return null;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return null;
    }

    private boolean toBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof Number number) {
            return number.intValue() != 0;
        }
        return false;
    }
}
