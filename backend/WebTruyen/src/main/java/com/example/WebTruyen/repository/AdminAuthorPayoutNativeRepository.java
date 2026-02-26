package com.example.WebTruyen.repository;

import com.example.WebTruyen.dto.response.AdminPayoutEligibleAuthorResponse;
import com.example.WebTruyen.dto.response.AdminPayoutHistoryResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class AdminAuthorPayoutNativeRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    public List<AdminPayoutEligibleAuthorResponse> findEligibleAuthors() {
        String sql = """
                select wr.id as request_id,
                       u.id as author_id,
                       coalesce(nullif(u.author_pen_name, ''), u.username) as author_name,
                       wr.net_coin_b as available_coin,
                       wr.status as payment_status
                from withdraw_requests wr
                         join users u on u.id = wr.user_id
                         join users_roles ur on ur.user_id = u.id
                         join roles r on r.id = ur.role_id and r.code = 'AUTHOR'
                         left join (
                    select min_withdraw_coin_b, max_withdraw_coin_b
                    from withdraw_rules
                    where is_active = 1 and coin = 'B'
                    order by id desc
                    limit 1
                ) rule on 1 = 1
                where wr.status = 'REQUESTED'
                  and wr.net_coin_b >= coalesce(rule.min_withdraw_coin_b, 0)
                  and (rule.max_withdraw_coin_b is null or wr.net_coin_b <= rule.max_withdraw_coin_b)
                order by wr.requested_at asc, wr.id asc
                """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> new AdminPayoutEligibleAuthorResponse(
                asLong(row[0]),
                asLong(row[1]),
                asString(row[2]),
                asLong(row[3]),
                asString(row[4])
        )).toList();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    public List<AdminPayoutHistoryResponse> findPayoutHistory() {
        String sql = """
                select wr.id as request_id,
                       u.id as author_id,
                       coalesce(nullif(u.author_pen_name, ''), u.username) as author_name,
                       wr.net_coin_b as coin_amount,
                       wr.payment_method_details,
                       wr.status,
                       coalesce(wr.paid_at, wr.requested_at) as paid_at
                from withdraw_requests wr
                         join users u on u.id = wr.user_id
                where wr.status in ('PAID', 'APPROVED', 'REJECTED', 'CANCELLED')
                order by coalesce(wr.paid_at, wr.requested_at) desc, wr.id desc
                """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        return rows.stream().map(row -> new AdminPayoutHistoryResponse(
                asLong(row[0]),
                asLong(row[1]),
                asString(row[2]),
                asLong(row[3]),
                extractCashAmount(asString(row[4])),
                asString(row[5]),
                asLocalDateTime(row[6])
        )).toList();
    }

    // Minhdq - 25/02/2026
    // [Fix admin-author-payout-db/id - V2 - branch: minhfinal2]
    public int markRequestAsPaid(Long requestId, Long adminId, BigDecimal cashAmount) {
        String sql = """
                update withdraw_requests
                set status = 'PAID',
                    paid_at = now(),
                    admin_id = :adminId,
                    payment_method_details = concat(
                            coalesce(nullif(payment_method_details, ''), 'BANK_TRANSFER'),
                            '|ADMIN_PAYOUT_CASH=',
                            :cashAmount
                    )
                where id = :requestId
                  and status = 'REQUESTED'
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("adminId", adminId);
        query.setParameter("requestId", requestId);
        query.setParameter("cashAmount", cashAmount);
        return query.executeUpdate();
    }

    private Long asLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        return Long.parseLong(String.valueOf(value));
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp ts) return ts.toLocalDateTime();
        if (value instanceof LocalDateTime dateTime) return dateTime;
        return LocalDateTime.parse(String.valueOf(value).replace(' ', 'T'));
    }

    private BigDecimal extractCashAmount(String details) {
        if (details == null || details.isBlank()) return BigDecimal.ZERO;
        String marker = "ADMIN_PAYOUT_CASH=";
        int index = details.indexOf(marker);
        if (index < 0) return BigDecimal.ZERO;
        String text = details.substring(index + marker.length()).trim();
        int delimiter = text.indexOf('|');
        String amountText = delimiter >= 0 ? text.substring(0, delimiter).trim() : text;
        try {
            return new BigDecimal(amountText);
        } catch (Exception ignored) {
            return BigDecimal.ZERO;
        }
    }
}
