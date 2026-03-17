package com.example.WebTruyen.service;

import com.example.WebTruyen.monitoring.DailyTaskMetrics;
import com.example.WebTruyen.repository.UserDailyStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Batch processing service for daily tasks optimization
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyTaskBatchProcessor {

    private final UserDailyStatusRepository userDailyStatusRepository;
    private final DailyTaskOrchestrator dailyTaskOrchestrator;
    private final DailyTaskMetrics metrics;

    /**
     * Process pending tasks for recently active users
     * Runs every 5 minutes
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void batchProcessPendingTasks() {
        long startTime = System.currentTimeMillis();
        
        try {
            log.info("Starting batch processing of pending daily tasks");
            
            // Get recently active users (last 24 hours)
            LocalDate yesterday = LocalDate.now().minusDays(1);
            List<Long> activeUsers = userDailyStatusRepository.findActiveUsersSince(yesterday);
            
            if (activeUsers.isEmpty()) {
                log.info("No active users found for batch processing");
                return;
            }
            
            log.info("Found {} active users for batch processing", activeUsers.size());
            
            // Process in batches of 100 users
            int batchSize = 100;
            List<List<Long>> batches = partitionList(activeUsers, batchSize);
            
            // Process batches in parallel
            CompletableFuture<?>[] futures = batches.stream()
                    .map(batch -> CompletableFuture.runAsync(() -> processBatch(batch)))
                    .toArray(CompletableFuture[]::new);
            
            // Wait for all batches to complete
            CompletableFuture.allOf(futures).get(5, TimeUnit.MINUTES);
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("Batch processing completed in {}ms for {} users", duration, activeUsers.size());
            
            // Record batch processing metrics
            metrics.recordActivityTracking("BATCH_PROCESSING", duration);
            
        } catch (Exception e) {
            log.error("Error in batch processing: {}", e.getMessage(), e);
        }
    }

    /**
     * Process a batch of users
     */
    private void processBatch(List<Long> userIds) {
        log.debug("Processing batch of {} users", userIds.size());
        
        for (Long userId : userIds) {
            try {
                // Check if user needs any daily task processing
                // This is a simplified check - in production, you'd have more sophisticated logic
                dailyTaskOrchestrator.getUserDailyTaskStatus(userId);
                
            } catch (Exception e) {
                log.warn("Error processing user {} in batch: {}", userId, e.getMessage());
            }
        }
        
        log.debug("Completed processing batch of {} users", userIds.size());
    }

    /**
     * Partition list into smaller batches
     */
    private List<List<Long>> partitionList(List<Long> list, int batchSize) {
        int size = list.size();
        int numBatches = (size + batchSize - 1) / batchSize;
        
        return java.util.stream.IntStream.range(0, numBatches)
                .mapToObj(i -> list.subList(i * batchSize, Math.min((i + 1) * batchSize, size)))
                .toList();
    }

    /**
     * Cleanup old performance data
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldData() {
        log.info("Starting cleanup of old performance data");
        
        try {
            // Reset metrics to prevent memory leaks
            metrics.resetMetrics();
            
            log.info("Completed cleanup of old performance data");
            
        } catch (Exception e) {
            log.error("Error during cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Health check for batch processor
     */
    public boolean isHealthy() {
        try {
            // Simple health check - try to get active users
            LocalDate yesterday = LocalDate.now().minusDays(1);
            List<Long> activeUsers = userDailyStatusRepository.findActiveUsersSince(yesterday);
            
            return true; // If we get here, the processor is healthy
            
        } catch (Exception e) {
            log.error("Batch processor health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get batch processor statistics
     */
    public BatchProcessorStats getStats() {
        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            List<Long> activeUsers = userDailyStatusRepository.findActiveUsersSince(yesterday);
            
            return BatchProcessorStats.builder()
                    .activeUserCount(activeUsers.size())
                    .lastBatchProcessed(java.time.LocalDateTime.now())
                    .healthy(isHealthy())
                    .build();
                    
        } catch (Exception e) {
            log.error("Error getting batch processor stats: {}", e.getMessage());
            return BatchProcessorStats.builder()
                    .activeUserCount(0)
                    .lastBatchProcessed(null)
                    .healthy(false)
                    .build();
        }
    }

    /**
     * Batch processor statistics DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class BatchProcessorStats {
        private int activeUserCount;
        private java.time.LocalDateTime lastBatchProcessed;
        private boolean healthy;
    }
}
