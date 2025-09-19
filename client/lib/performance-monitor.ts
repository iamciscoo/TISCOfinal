/**
 * Performance Monitoring Utilities for TISCO Platform
 * Tracks database query performance, cache hit rates, and API response times
 */

export interface PerformanceMetrics {
  timestamp: number;
  operation: string;
  duration: number;
  cacheHit?: boolean;
  queryType?: 'select' | 'insert' | 'update' | 'delete';
  tableName?: string;
  rowCount?: number;
  errorCount?: number;
}

export interface PerformanceSnapshot {
  avgResponseTime: number;
  cacheHitRate: number;
  slowQueries: PerformanceMetrics[];
  errorRate: number;
  throughput: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  /**
   * Records a performance metric
   */
  record(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow queries
    if (metric.duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn('Slow query detected:', {
        operation: metric.operation,
        duration: metric.duration,
        table: metric.tableName,
        type: metric.queryType
      });
    }
  }

  /**
   * Times a database operation
   */
  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Partial<PerformanceMetrics>
  ): Promise<T> {
    const startTime = performance.now();
    let errorOccurred = false;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      errorOccurred = true;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.record({
        operation,
        duration,
        errorCount: errorOccurred ? 1 : 0,
        ...metadata
      });
    }
  }

  /**
   * Gets performance snapshot for the last N minutes
   */
  getSnapshot(minutesBack: number = 5): PerformanceSnapshot {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        errorRate: 0,
        throughput: 0,
        timestamp: Date.now()
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgResponseTime = totalDuration / recentMetrics.length;

    const cacheMetrics = recentMetrics.filter(m => m.cacheHit !== undefined);
    const cacheHits = cacheMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheMetrics.length > 0 ? (cacheHits / cacheMetrics.length) * 100 : 0;

    const slowQueries = recentMetrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD);
    
    const errorCount = recentMetrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
    const errorRate = (errorCount / recentMetrics.length) * 100;

    const throughput = recentMetrics.length / minutesBack; // operations per minute

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueries,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      timestamp: Date.now()
    };
  }

  /**
   * Gets performance breakdown by operation type
   */
  getOperationBreakdown(minutesBack: number = 5): Record<string, {
    count: number;
    avgDuration: number;
    errorRate: number;
  }> {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    const breakdown: Record<string, {
      count: number;
      totalDuration: number;
      errorCount: number;
    }> = {};

    recentMetrics.forEach(metric => {
      if (!breakdown[metric.operation]) {
        breakdown[metric.operation] = {
          count: 0,
          totalDuration: 0,
          errorCount: 0
        };
      }

      breakdown[metric.operation].count++;
      breakdown[metric.operation].totalDuration += metric.duration;
      breakdown[metric.operation].errorCount += metric.errorCount || 0;
    });

    const result: Record<string, {
      count: number;
      avgDuration: number;
      errorRate: number;
    }> = {};

    Object.entries(breakdown).forEach(([operation, data]) => {
      result[operation] = {
        count: data.count,
        avgDuration: Math.round((data.totalDuration / data.count) * 100) / 100,
        errorRate: Math.round((data.errorCount / data.count) * 100) * 100 / 100
      };
    });

    return result;
  }

  /**
   * Clears old metrics
   */
  clearOldMetrics(hoursBack: number = 24) {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Exports metrics for external analysis
   */
  exportMetrics(minutesBack?: number): PerformanceMetrics[] {
    if (!minutesBack) return [...this.metrics];
    
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for monitoring database operations
 */
export function monitorPerformance(
  operation: string,
  metadata?: Partial<PerformanceMetrics>
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function(this: any, ...args: Parameters<T>) {
      return performanceMonitor.timeOperation(
        operation,
        () => originalMethod.apply(this, args),
        metadata
      );
    } as T;

    return descriptor;
  };
}

/**
 * Performance baseline constants for comparison
 */
export const PERFORMANCE_BASELINES = {
  // Database query performance (milliseconds)
  FAST_QUERY: 100,
  ACCEPTABLE_QUERY: 500,
  SLOW_QUERY: 1000,
  
  // Cache hit rates (percentage)
  EXCELLENT_CACHE: 90,
  GOOD_CACHE: 75,
  POOR_CACHE: 50,
  
  // API response times (milliseconds)
  FAST_API: 200,
  ACCEPTABLE_API: 1000,
  SLOW_API: 2000,
  
  // Error rates (percentage)
  EXCELLENT_ERROR: 0.1,
  ACCEPTABLE_ERROR: 1,
  HIGH_ERROR: 5
} as const;
