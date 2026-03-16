package com.example.WebTruyen.monitoring;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple metrics monitoring for daily tasks performance (without external dependencies)
 */
@Component
@Slf4j
public class DailyTaskMetrics {

    // Simple counters using atomic longs
    private final AtomicLong taskCompletionCount = new AtomicLong(0);
    private final AtomicLong cacheHitCount = new AtomicLong(0);
    private final AtomicLong cacheMissCount = new AtomicLong(0);
    private final AtomicLong activityTrackingCount = new AtomicLong(0);
    
    // Performance tracking
    private final ConcurrentHashMap<String, Long> taskCompletionTimes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> cacheAccessTimes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> activityTrackingTimes = new ConcurrentHashMap<>();
    
    // Timestamps
    private final LocalDateTime startTime = LocalDateTime.now();

    /**
     * Record task completion
     */
    public void recordTaskCompletion(String missionCode, long durationMs) {
        taskCompletionCount.incrementAndGet();
        taskCompletionTimes.put(missionCode + "_" + System.currentTimeMillis(), durationMs);
        
        log.debug("Recorded task completion for mission: {} in {}ms", missionCode, durationMs);
    }

    /**
     * Record cache hit
     */
    public void recordCacheHit(String operation) {
        cacheHitCount.incrementAndGet();
        log.debug("Recorded cache hit for operation: {}", operation);
    }

    /**
     * Record cache miss
     */
    public void recordCacheMiss(String operation) {
        cacheMissCount.incrementAndGet();
        log.debug("Recorded cache miss for operation: {}", operation);
    }

    /**
     * Record activity tracking
     */
    public void recordActivityTracking(String activityType, long durationMs) {
        activityTrackingCount.incrementAndGet();
        activityTrackingTimes.put(activityType + "_" + System.currentTimeMillis(), durationMs);
        
        log.debug("Recorded activity tracking for type: {} in {}ms", activityType, durationMs);
    }

    /**
     * Record cache access time
     */
    public void recordCacheAccess(String operation, long durationMs) {
        cacheAccessTimes.put(operation + "_" + System.currentTimeMillis(), durationMs);
        log.debug("Recorded cache access for operation: {} in {}ms", operation, durationMs);
    }

    /**
     * Get performance summary
     */
    public PerformanceSummary getPerformanceSummary() {
        return PerformanceSummary.builder()
                .totalTaskCompletions(taskCompletionCount.get())
                .totalCacheHits(cacheHitCount.get())
                .totalCacheMisses(cacheMissCount.get())
                .totalActivityTrackings(activityTrackingCount.get())
                .averageTaskCompletionTime(calculateAverage(taskCompletionTimes))
                .averageCacheAccessTime(calculateAverage(cacheAccessTimes))
                .averageActivityTrackingTime(calculateAverage(activityTrackingTimes))
                .cacheHitRatio(calculateCacheHitRatio())
                .uptimeMinutes(calculateUptimeMinutes())
                .build();
    }

    /**
     * Calculate average from map of times
     */
    private double calculateAverage(ConcurrentHashMap<String, Long> times) {
        if (times.isEmpty()) return 0.0;
        
        double sum = times.values().stream().mapToLong(Long::longValue).sum();
        return sum / times.size();
    }

    /**
     * Calculate cache hit ratio
     */
    private double calculateCacheHitRatio() {
        double hits = cacheHitCount.get();
        double misses = cacheMissCount.get();
        double total = hits + misses;
        
        return total > 0 ? (hits / total) * 100 : 0.0;
    }

    /**
     * Calculate uptime in minutes
     */
    private long calculateUptimeMinutes() {
        return java.time.Duration.between(startTime, LocalDateTime.now()).toMinutes();
    }

    /**
     * Reset all metrics
     */
    public void resetMetrics() {
        taskCompletionCount.set(0);
        cacheHitCount.set(0);
        cacheMissCount.set(0);
        activityTrackingCount.set(0);
        taskCompletionTimes.clear();
        cacheAccessTimes.clear();
        activityTrackingTimes.clear();
        
        log.info("All daily task metrics have been reset");
    }

    /**
     * Performance summary DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class PerformanceSummary {
        private long totalTaskCompletions;
        private long totalCacheHits;
        private long totalCacheMisses;
        private long totalActivityTrackings;
        private double averageTaskCompletionTime;
        private double averageCacheAccessTime;
        private double averageActivityTrackingTime;
        private double cacheHitRatio;
        private long uptimeMinutes;
        
        public String getPerformanceGrade() {
            if (cacheHitRatio >= 80 && averageTaskCompletionTime < 100) {
                return "EXCELLENT";
            } else if (cacheHitRatio >= 60 && averageTaskCompletionTime < 200) {
                return "GOOD";
            } else if (cacheHitRatio >= 40 && averageTaskCompletionTime < 500) {
                return "FAIR";
            } else {
                return "POOR";
            }
        }
        
        public String getRecommendations() {
            StringBuilder recommendations = new StringBuilder();
            
            if (cacheHitRatio < 60) {
                recommendations.append("Consider increasing cache size or duration. ");
            }
            
            if (averageTaskCompletionTime > 200) {
                recommendations.append("Optimize database queries or add indexes. ");
            }
            
            if (averageActivityTrackingTime > 100) {
                recommendations.append("Consider async processing for activity tracking. ");
            }
            
            if (recommendations.length() == 0) {
                recommendations.append("Performance is optimal. ");
            }
            
            return recommendations.toString();
        }
    }
}
