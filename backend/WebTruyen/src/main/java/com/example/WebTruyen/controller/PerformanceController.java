package com.example.WebTruyen.controller;

import com.example.WebTruyen.monitoring.DailyTaskMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Performance monitoring controller for daily tasks
 */
@Slf4j
@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PerformanceController {

    private final DailyTaskMetrics metrics;

    /**
     * Get performance summary
     */
    @GetMapping("/daily-tasks/summary")
    public ResponseEntity<DailyTaskMetrics.PerformanceSummary> getPerformanceSummary() {
        log.info("Admin requested performance summary");
        
        DailyTaskMetrics.PerformanceSummary summary = metrics.getPerformanceSummary();
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Get detailed performance metrics
     */
    @GetMapping("/daily-tasks/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedMetrics() {
        log.info("Admin requested detailed performance metrics");
        
        DailyTaskMetrics.PerformanceSummary summary = metrics.getPerformanceSummary();
        
        Map<String, Object> detailed = new HashMap<>();
        detailed.put("summary", summary);
        detailed.put("performanceGrade", summary.getPerformanceGrade());
        detailed.put("recommendations", summary.getRecommendations());
        detailed.put("timestamp", java.time.LocalDateTime.now());
        
        return ResponseEntity.ok(detailed);
    }

    /**
     * Reset all metrics (admin only)
     */
    @PostMapping("/daily-tasks/reset")
    public ResponseEntity<Map<String, String>> resetMetrics() {
        log.warn("Admin requested to reset all daily task metrics");
        
        metrics.resetMetrics();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "All daily task metrics have been reset successfully");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get performance health check
     */
    @GetMapping("/daily-tasks/health")
    public ResponseEntity<Map<String, Object>> getPerformanceHealth() {
        log.info("Admin requested performance health check");
        
        DailyTaskMetrics.PerformanceSummary summary = metrics.getPerformanceSummary();
        
        Map<String, Object> health = new HashMap<>();
        
        // Determine health status
        boolean isHealthy = summary.getCacheHitRatio() >= 50 && 
                          summary.getAverageTaskCompletionTime() < 500;
        
        health.put("status", isHealthy ? "HEALTHY" : "WARNING");
        health.put("cacheHitRatio", summary.getCacheHitRatio());
        health.put("averageResponseTime", summary.getAverageTaskCompletionTime());
        health.put("uptimeMinutes", summary.getUptimeMinutes());
        health.put("lastChecked", java.time.LocalDateTime.now());
        
        if (!isHealthy) {
            health.put("issues", summary.getRecommendations());
        }
        
        return ResponseEntity.ok(health);
    }
}
