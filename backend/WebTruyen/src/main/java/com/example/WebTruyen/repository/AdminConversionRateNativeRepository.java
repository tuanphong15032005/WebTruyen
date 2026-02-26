package com.example.WebTruyen.repository;

import com.example.WebTruyen.dto.response.AdminConversionRateResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Repository
public class AdminConversionRateNativeRepository {

    @PersistenceContext
    private EntityManager entityManager;

    private static final String TABLE_NAME = "coin_conversion_rates";
    private static final List<String> ID_COLUMN_CANDIDATES = List.of("id", "conversion_id", "rate_id");
    private static final List<String> COIN_COLUMN_CANDIDATES = List.of("coin_amount", "coin", "coin_value", "coins");
    private static final List<String> CASH_COLUMN_CANDIDATES = List.of("cash_value", "cash_amount", "amount_vnd", "money_value", "vnd_amount");
    private static final List<String> EFFECTIVE_DATE_COLUMN_CANDIDATES = List.of("effective_date", "effective_from", "start_date");
    private static final List<String> UPDATED_AT_COLUMN_CANDIDATES = List.of("updated_at", "last_updated_at", "modified_at", "created_at");
    private static final List<String> RATE_COLUMN_CANDIDATES = List.of("conversion_rate", "rate", "coin_to_cash_rate");

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    public List<AdminConversionRateResponse> findAll() {
        ResolvedColumns columns = resolveColumns();
        String rateSelect = columns.rateColumn() != null
                ? columns.rateColumn() + " as db_rate"
                : "null as db_rate";
        String updatedAtSelect = columns.updatedAtColumn() != null
                ? columns.updatedAtColumn()
                : "null as updated_at";

        String sql = """
                select id,
                       %s as coin_amount,
                       %s as cash_value,
                       %s as effective_date,
                       %s,
                       %s
                from coin_conversion_rates
                order by %s desc, id desc
                """.formatted(
                columns.coinAmountColumn(),
                columns.cashValueColumn(),
                columns.effectiveDateColumn(),
                updatedAtSelect,
                rateSelect,
                columns.effectiveDateColumn()
        );
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(this::toResponse).toList();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    public AdminConversionRateResponse insert(BigDecimal coinAmount, BigDecimal cashValue, LocalDate effectiveDate) {
        BigDecimal safeCoin = sanitizeAmount(coinAmount);
        BigDecimal safeCash = sanitizeAmount(cashValue);
        BigDecimal safeRate = calculateRate(safeCoin, safeCash);
        ResolvedColumns columns = resolveColumns();

        StringBuilder sql = new StringBuilder();
        sql.append("insert into ").append(TABLE_NAME).append(" (")
                .append(columns.coinAmountColumn())
                .append(", ")
                .append(columns.cashValueColumn())
                .append(", ")
                .append(columns.effectiveDateColumn());
        if (columns.rateColumn() != null) {
            sql.append(", ").append(columns.rateColumn());
        }
        if (columns.updatedAtColumn() != null) {
            sql.append(", ").append(columns.updatedAtColumn());
        }
        sql.append(") values (:coinAmount, :cashValue, :effectiveDate");
        if (columns.rateColumn() != null) {
            sql.append(", :rate");
        }
        if (columns.updatedAtColumn() != null) {
            sql.append(", now()");
        }
        sql.append(")");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("coinAmount", safeCoin);
        query.setParameter("cashValue", safeCash);
        query.setParameter("effectiveDate", effectiveDate);
        if (columns.rateColumn() != null) {
            query.setParameter("rate", safeRate);
        }
        query.executeUpdate();

        Number id = (Number) entityManager.createNativeQuery("select last_insert_id()").getSingleResult();
        return findById(id.longValue());
    }

    // Minhdq - 25/02/2026
    // [Fix admin-conversion-rate-db/id - V2 - branch: minhfinal2]
    public AdminConversionRateResponse update(Long id, BigDecimal coinAmount, BigDecimal cashValue, LocalDate effectiveDate) {
        BigDecimal safeCoin = sanitizeAmount(coinAmount);
        BigDecimal safeCash = sanitizeAmount(cashValue);
        BigDecimal safeRate = calculateRate(safeCoin, safeCash);
        ResolvedColumns columns = resolveColumns();

        StringBuilder sql = new StringBuilder();
        sql.append("update ").append(TABLE_NAME).append(" set ");
        sql.append(columns.coinAmountColumn()).append(" = :coinAmount, ")
                .append(columns.cashValueColumn()).append(" = :cashValue, ")
                .append(columns.effectiveDateColumn()).append(" = :effectiveDate");
        if (columns.rateColumn() != null) {
            sql.append(", ").append(columns.rateColumn()).append(" = :rate");
        }
        if (columns.updatedAtColumn() != null) {
            sql.append(", ").append(columns.updatedAtColumn()).append(" = now()");
        }
        sql.append(" where ").append(columns.idColumn()).append(" = :id");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("coinAmount", safeCoin);
        query.setParameter("cashValue", safeCash);
        query.setParameter("effectiveDate", effectiveDate);
        query.setParameter("id", id);
        if (columns.rateColumn() != null) {
            query.setParameter("rate", safeRate);
        }
        query.executeUpdate();

        return findById(id);
    }

    public AdminConversionRateResponse findById(Long id) {
        ResolvedColumns columns = resolveColumns();
        String rateSelect = columns.rateColumn() != null
                ? columns.rateColumn() + " as db_rate"
                : "null as db_rate";
        String updatedAtSelect = columns.updatedAtColumn() != null
                ? columns.updatedAtColumn()
                : "null as updated_at";

        String sql = """
                select id,
                       %s as coin_amount,
                       %s as cash_value,
                       %s as effective_date,
                       %s,
                       %s
                from coin_conversion_rates
                where %s = :id
                """.formatted(
                columns.coinAmountColumn(),
                columns.cashValueColumn(),
                columns.effectiveDateColumn(),
                updatedAtSelect,
                rateSelect,
                columns.idColumn()
        );
        Object[] row = (Object[]) entityManager.createNativeQuery(sql)
                .setParameter("id", id)
                .getSingleResult();
        return toResponse(row);
    }

    private AdminConversionRateResponse toResponse(Object[] row) {
        Long id = asLong(row[0]);
        BigDecimal coinAmount = asBigDecimal(row[1]);
        BigDecimal cashValue = asBigDecimal(row[2]);
        LocalDate effectiveDate = asLocalDate(row[3]);
        LocalDateTime updatedAt = asLocalDateTime(row[4]);
        BigDecimal dbRate = asBigDecimal(row[5]);
        BigDecimal rate = dbRate.compareTo(BigDecimal.ZERO) > 0
                ? dbRate
                : calculateRate(coinAmount, cashValue);
        return new AdminConversionRateResponse(id, coinAmount, cashValue, rate, effectiveDate, updatedAt);
    }

    private Set<String> getTableColumns() {
        String sql = """
                select column_name
                from information_schema.columns
                where table_schema = database()
                  and table_name = :tableName
                """;
        @SuppressWarnings("unchecked")
        List<String> result = entityManager.createNativeQuery(sql)
                .setParameter("tableName", TABLE_NAME)
                .getResultList();
        Set<String> columns = new HashSet<>();
        for (String column : result) {
            if (column != null) {
                columns.add(column.toLowerCase());
            }
        }
        return columns;
    }

    private ResolvedColumns resolveColumns() {
        Set<String> columns = getTableColumns();
        String idColumn = pickRequired(columns, ID_COLUMN_CANDIDATES, "id");
        String coinColumn = pickRequired(columns, COIN_COLUMN_CANDIDATES, "coin amount");
        String cashColumn = pickRequired(columns, CASH_COLUMN_CANDIDATES, "cash value");
        String effectiveDateColumn = pickRequired(columns, EFFECTIVE_DATE_COLUMN_CANDIDATES, "effective date");
        String updatedAtColumn = pickOptional(columns, UPDATED_AT_COLUMN_CANDIDATES);
        String rateColumn = pickOptional(columns, RATE_COLUMN_CANDIDATES);
        return new ResolvedColumns(idColumn, coinColumn, cashColumn, effectiveDateColumn, updatedAtColumn, rateColumn);
    }

    private String pickRequired(Set<String> columns, List<String> candidates, String label) {
        String picked = pickOptional(columns, candidates);
        if (picked != null) {
            return picked;
        }
        throw new IllegalStateException(
                "coin_conversion_rates missing required column for " + label + ". Found: " + columns
        );
    }

    private String pickOptional(Set<String> columns, List<String> candidates) {
        for (String candidate : candidates) {
            if (columns.contains(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private BigDecimal sanitizeAmount(BigDecimal value) {
        if (value == null) return BigDecimal.ZERO;
        return value.max(BigDecimal.ZERO);
    }

    private BigDecimal calculateRate(BigDecimal coinAmount, BigDecimal cashValue) {
        if (coinAmount == null || coinAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (cashValue == null) {
            return BigDecimal.ZERO;
        }
        return cashValue.divide(coinAmount, 6, RoundingMode.HALF_UP);
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(String.valueOf(value));
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bigDecimal) return bigDecimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(String.valueOf(value));
    }

    private LocalDate asLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof Date date) return date.toLocalDate();
        if (value instanceof LocalDate localDate) return localDate;
        return LocalDate.parse(String.valueOf(value));
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof LocalDateTime localDateTime) return localDateTime;
        if (value instanceof Date date) return date.toLocalDate().atStartOfDay();
        if (value instanceof LocalDate localDate) return localDate.atStartOfDay();
        String text = String.valueOf(value).replace(' ', 'T');
        return LocalDateTime.parse(text);
    }

    private record ResolvedColumns(
            String idColumn,
            String coinAmountColumn,
            String cashValueColumn,
            String effectiveDateColumn,
            String updatedAtColumn,
            String rateColumn
    ) {
    }
}
