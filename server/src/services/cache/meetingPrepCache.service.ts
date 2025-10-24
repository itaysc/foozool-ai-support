import { getRedisClient } from '../redis/client';
import { MeetingPrepResult } from '../insights/types';

export interface CachedMeetingPrepData {
  pdfBuffer: Buffer;
  filename: string;
  generatedAt: Date;
  generatedBy: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  version: string; // For cache invalidation
}

export interface CacheMetadata {
  generatedAt: Date;
  generatedBy: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  version: string;
  expiresAt: Date;
}

export class MeetingPrepCacheService {
  private static instance: MeetingPrepCacheService;
  private readonly CACHE_PREFIX = 'meeting_prep';
  private readonly METADATA_PREFIX = 'meeting_prep_meta';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly VERSION_TTL = 7 * 24 * 60 * 60; // 7 days for version tracking

  private constructor() {}

  public static getInstance(): MeetingPrepCacheService {
    if (!MeetingPrepCacheService.instance) {
      MeetingPrepCacheService.instance = new MeetingPrepCacheService();
    }
    return MeetingPrepCacheService.instance;
  }

  /**
   * Generate cache key for meeting prep document
   */
  private generateCacheKey(organizationId: string, customerId: string, version?: string): string {
    const versionSuffix = version ? `:v${version}` : '';
    return `${this.CACHE_PREFIX}:${organizationId}:${customerId}${versionSuffix}`;
  }

  /**
   * Generate metadata cache key
   */
  private generateMetadataKey(organizationId: string, customerId: string): string {
    return `${this.METADATA_PREFIX}:${organizationId}:${customerId}`;
  }

  /**
   * Generate version key for cache invalidation
   */
  private generateVersionKey(organizationId: string, customerId: string): string {
    return `${this.CACHE_PREFIX}:version:${organizationId}:${customerId}`;
  }

  /**
   * Get current version for a customer's meeting prep cache
   */
  public async getCurrentVersion(organizationId: string, customerId: string): Promise<string> {
    try {
      const redis = await getRedisClient();
      const versionKey = this.generateVersionKey(organizationId, customerId);
      const version = await redis.get(versionKey);
      return version || '1';
    } catch (error) {
      console.error('Error getting cache version:', error);
      return '1';
    }
  }

  /**
   * Increment version for cache invalidation
   */
  public async incrementVersion(organizationId: string, customerId: string): Promise<string> {
    try {
      const redis = await getRedisClient();
      const versionKey = this.generateVersionKey(organizationId, customerId);
      const newVersion = await redis.incr(versionKey);
      await redis.expire(versionKey, this.VERSION_TTL);
      return newVersion.toString();
    } catch (error) {
      console.error('Error incrementing cache version:', error);
      return '1';
    }
  }

  /**
   * Cache meeting prep document
   */
  public async cacheMeetingPrep(
    organizationId: string,
    customerId: string,
    customerName: string,
    pdfDoc: any,
    filename: string,
    generatedBy: string,
    ttl?: number
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const version = await this.getCurrentVersion(organizationId, customerId);
      const cacheKey = this.generateCacheKey(organizationId, customerId, version);
      const metadataKey = this.generateMetadataKey(organizationId, customerId);
      
      // Convert PDF document to buffer
      const pdfBuffer = await this.pdfToBuffer(pdfDoc);
      
      const cachedData: CachedMeetingPrepData = {
        pdfBuffer,
        filename,
        generatedAt: new Date(),
        generatedBy,
        organizationId,
        customerId,
        customerName,
        version
      };

      const metadata: CacheMetadata = {
        generatedAt: cachedData.generatedAt,
        generatedBy,
        organizationId,
        customerId,
        customerName,
        version,
        expiresAt: new Date(Date.now() + (ttl || this.DEFAULT_TTL) * 1000)
      };

      // Store the cached data
      await redis.setEx(cacheKey, ttl || this.DEFAULT_TTL, JSON.stringify(cachedData));
      
      // Store metadata separately for easier access
      await redis.setEx(metadataKey, ttl || this.DEFAULT_TTL, JSON.stringify(metadata));
      
      console.log(`✅ Cached meeting prep document for org ${organizationId}, customer ${customerId} (version ${version})`);
    } catch (error) {
      console.error('Error caching meeting prep document:', error);
      // Don't throw error - caching failure shouldn't break the main flow
    }
  }

  /**
   * Get cached meeting prep document
   */
  public async getCachedMeetingPrep(
    organizationId: string,
    customerId: string
  ): Promise<MeetingPrepResult | null> {
    try {
      const redis = await getRedisClient();
      const version = await this.getCurrentVersion(organizationId, customerId);
      const cacheKey = this.generateCacheKey(organizationId, customerId, version);
      
      const cachedDataStr = await redis.get(cacheKey);
      if (!cachedDataStr) {
        return null;
      }

      const cachedData: CachedMeetingPrepData = JSON.parse(cachedDataStr);
      
      // Convert buffer back to PDF document
      const pdfDoc = await this.bufferToPdf(cachedData.pdfBuffer);
      
      console.log(`✅ Retrieved cached meeting prep document for org ${organizationId}, customer ${customerId} (version ${cachedData.version})`);
      
      return {
        pdfDoc,
        filename: cachedData.filename
      };
    } catch (error) {
      console.error('Error retrieving cached meeting prep document:', error);
      return null;
    }
  }

  /**
   * Get cache metadata without retrieving the full document
   */
  public async getCacheMetadata(
    organizationId: string,
    customerId: string
  ): Promise<CacheMetadata | null> {
    try {
      const redis = await getRedisClient();
      const metadataKey = this.generateMetadataKey(organizationId, customerId);
      
      const metadataStr = await redis.get(metadataKey);
      if (!metadataStr) {
        return null;
      }

      const metadata: CacheMetadata = JSON.parse(metadataStr);
      return metadata;
    } catch (error) {
      console.error('Error retrieving cache metadata:', error);
      return null;
    }
  }

  /**
   * Invalidate cache for a specific customer
   */
  public async invalidateCache(organizationId: string, customerId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const version = await this.incrementVersion(organizationId, customerId);
      
      // Remove old cached data
      const oldCacheKey = this.generateCacheKey(organizationId, customerId, version);
      const metadataKey = this.generateMetadataKey(organizationId, customerId);
      
      await redis.del(oldCacheKey);
      await redis.del(metadataKey);
      
      console.log(`🗑️ Invalidated meeting prep cache for org ${organizationId}, customer ${customerId} (new version: ${version})`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Invalidate all caches for an organization
   */
  public async invalidateOrganizationCache(organizationId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}:${organizationId}:*`;
      const metadataPattern = `${this.METADATA_PREFIX}:${organizationId}:*`;
      const versionPattern = `${this.CACHE_PREFIX}:version:${organizationId}:*`;
      
      // Get all keys matching the patterns
      const [cacheKeys, metadataKeys, versionKeys] = await Promise.all([
        redis.keys(pattern),
        redis.keys(metadataPattern),
        redis.keys(versionPattern)
      ]);
      
      // Delete all matching keys
      const allKeys = [...cacheKeys, ...metadataKeys, ...versionKeys];
      if (allKeys.length > 0) {
        await redis.del(allKeys);
        console.log(`🗑️ Invalidated ${allKeys.length} meeting prep cache entries for organization ${organizationId}`);
      }
    } catch (error) {
      console.error('Error invalidating organization cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(organizationId?: string): Promise<{
    totalCached: number;
    organizationCached: number;
    totalSize: number;
  }> {
    try {
      const redis = await getRedisClient();
      const pattern = organizationId 
        ? `${this.CACHE_PREFIX}:${organizationId}:*`
        : `${this.CACHE_PREFIX}:*`;
      
      const keys = await redis.keys(pattern);
      let totalSize = 0;
      
      for (const key of keys) {
        const size = await redis.strLen(key);
        totalSize += size;
      }
      
      const orgPattern = organizationId 
        ? `${this.CACHE_PREFIX}:${organizationId}:*`
        : `${this.CACHE_PREFIX}:*`;
      const orgKeys = await redis.keys(orgPattern);
      
      return {
        totalCached: keys.length,
        organizationCached: orgKeys.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalCached: 0, organizationCached: 0, totalSize: 0 };
    }
  }

  /**
   * Convert PDF document to buffer
   */
  private async pdfToBuffer(pdfDoc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      pdfDoc.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Convert buffer back to PDF document stream
   */
  private async bufferToPdf(buffer: Buffer): Promise<any> {
    const { Readable } = require('stream');
    return Readable.from(buffer);
  }

  /**
   * Check if cache is valid (not expired)
   */
  public async isCacheValid(organizationId: string, customerId: string): Promise<boolean> {
    try {
      const metadata = await this.getCacheMetadata(organizationId, customerId);
      if (!metadata) {
        return false;
      }
      
      return new Date() < metadata.expiresAt;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Clean up expired caches
   */
  public async cleanupExpiredCaches(): Promise<number> {
    try {
      const redis = await getRedisClient();
      const metadataPattern = `${this.METADATA_PREFIX}:*`;
      const metadataKeys = await redis.keys(metadataPattern);
      
      let cleanedCount = 0;
      const now = new Date();
      
      for (const key of metadataKeys) {
        const metadataStr = await redis.get(key);
        if (metadataStr) {
          const metadata: CacheMetadata = JSON.parse(metadataStr);
          if (now > metadata.expiresAt) {
            // Extract organizationId and customerId from key
            const keyParts = key.split(':');
            if (keyParts.length >= 3) {
              const organizationId = keyParts[2];
              const customerId = keyParts[3];
              
              await this.invalidateCache(organizationId, customerId);
              cleanedCount++;
            }
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} expired meeting prep caches`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired caches:', error);
      return 0;
    }
  }
}
