import { getRedisClient } from '../redis/client';

export class BotPerformanceCacheService {
  private static readonly CACHE_PREFIX = 'bot-performance';
  private static readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private static readonly DASHBOARD_TTL = 300; // 5 minutes for dashboard data
  private static readonly SUMMARY_TTL = 1800; // 30 minutes for summary data
  private static readonly ANALYTICS_TTL = 7200; // 2 hours for analytics
  private static readonly BENCHMARKS_TTL = 86400; // 24 hours for benchmarks (changes rarely)

  /**
   * Generate cache key for bot performance data
   */
  private static getCacheKey(type: string, organizationId: string, params?: Record<string, any>): string {
    const baseKey = `${this.CACHE_PREFIX}:${type}:${organizationId}`;
    
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join(':');
      return `${baseKey}:${sortedParams}`;
    }
    
    return baseKey;
  }

  /**
   * Get cached data
   */
  static async get<T>(type: string, organizationId: string, params?: Record<string, any>): Promise<T | null> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getCacheKey(type, organizationId, params);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`📦 Cache HIT for ${type} (org: ${organizationId})`);
        return data;
      }
      
      console.log(`📦 Cache MISS for ${type} (org: ${organizationId})`);
      return null;
    } catch (error) {
      console.error(`❌ Redis cache GET error for ${type}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with appropriate TTL
   */
  static async set(type: string, organizationId: string, data: any, params?: Record<string, any>, customTTL?: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getCacheKey(type, organizationId, params);
      
      // Determine TTL based on data type
      let ttl = customTTL || this.DEFAULT_TTL;
      switch (type) {
        case 'dashboard':
          ttl = this.DASHBOARD_TTL;
          break;
        case 'summary':
          ttl = this.SUMMARY_TTL;
          break;
        case 'analytics':
          ttl = this.ANALYTICS_TTL;
          break;
        case 'benchmarks':
          ttl = this.BENCHMARKS_TTL;
          break;
        case 'kpis':
          ttl = this.DASHBOARD_TTL;
          break;
        case 'trends':
          ttl = this.SUMMARY_TTL;
          break;
      }
      
      await redis.setEx(cacheKey, ttl, JSON.stringify(data));
      console.log(`📦 Cache SET for ${type} (org: ${organizationId}, TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`❌ Redis cache SET error for ${type}:`, error);
    }
  }

  /**
   * Delete specific cache entry
   */
  static async delete(type: string, organizationId: string, params?: Record<string, any>): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getCacheKey(type, organizationId, params);
      await redis.del(cacheKey);
      console.log(`📦 Cache DELETE for ${type} (org: ${organizationId})`);
    } catch (error) {
      console.error(`❌ Redis cache DELETE error for ${type}:`, error);
    }
  }

  /**
   * Clear all bot performance cache for an organization
   */
  static async clearOrganizationCache(organizationId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}:*:${organizationId}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`📦 Cleared ${keys.length} cache entries for organization ${organizationId}`);
      }
    } catch (error) {
      console.error(`❌ Redis cache CLEAR error for org ${organizationId}:`, error);
    }
  }

  /**
   * Clear all bot performance cache (useful for system updates)
   */
  static async clearAllCache(): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`📦 Cleared ${keys.length} bot performance cache entries`);
      }
    } catch (error) {
      console.error(`❌ Redis cache CLEAR ALL error:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    keysByType: Record<string, number>;
  }> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}:*`;
      const keys = await redis.keys(pattern);
      
      const keysByType: Record<string, number> = {};
      
      keys.forEach(key => {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const type = parts[1];
          keysByType[type] = (keysByType[type] || 0) + 1;
        }
      });
      
      return {
        totalKeys: keys.length,
        keysByType
      };
    } catch (error) {
      console.error(`❌ Redis cache STATS error:`, error);
      return {
        totalKeys: 0,
        keysByType: {}
      };
    }
  }

  /**
   * Invalidate cache when new metrics are calculated
   */
  static async invalidateAfterMetricsUpdate(organizationId: string): Promise<void> {
    try {
      // Clear dashboard and summary caches as they depend on latest metrics
      await Promise.all([
        this.delete('dashboard', organizationId),
        this.delete('summary', organizationId),
        this.delete('kpis', organizationId),
        this.delete('analytics', organizationId)
      ]);
      
      console.log(`📦 Invalidated dependent caches after metrics update for org ${organizationId}`);
    } catch (error) {
      console.error(`❌ Cache invalidation error for org ${organizationId}:`, error);
    }
  }

  /**
   * Warm cache with fresh data (useful for background jobs)
   */
  static async warmCache(organizationId: string, data: {
    dashboard?: any;
    summary?: any;
    analytics?: any;
    benchmarks?: any;
  }): Promise<void> {
    try {
      const promises: Promise<void>[] = [];
      
      if (data.dashboard) {
        promises.push(this.set('dashboard', organizationId, data.dashboard));
      }
      
      if (data.summary) {
        promises.push(this.set('summary', organizationId, data.summary));
      }
      
      if (data.analytics) {
        promises.push(this.set('analytics', organizationId, data.analytics));
      }
      
      if (data.benchmarks) {
        promises.push(this.set('benchmarks', organizationId, data.benchmarks));
      }
      
      await Promise.all(promises);
      console.log(`📦 Cache warmed for organization ${organizationId}`);
    } catch (error) {
      console.error(`❌ Cache warming error for org ${organizationId}:`, error);
    }
  }
}