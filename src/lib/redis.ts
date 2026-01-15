import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache helper with automatic JSON serialization
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get<T>(key)
      return data
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error)
      return null
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.set(key, value, { ex: ttlSeconds })
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error)
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Redis DEL pattern error for ${pattern}:`, error)
    }
  },

  // Cache-aside pattern: get from cache or fetch and cache
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const fresh = await fetcher()
    await this.set(key, fresh, ttlSeconds)
    return fresh
  },
}

// Cache key builders
export const cacheKeys = {
  // Dashboard
  dashboardStats: (tenantId: string) => `dashboard:stats:${tenantId}`,
  revenueByMonth: (tenantId: string) => `dashboard:revenue:${tenantId}`,
  occupancy: (tenantId: string) => `dashboard:occupancy:${tenantId}`,
  reservationsByStatus: (tenantId: string) => `dashboard:reservations-status:${tenantId}`,

  // Properties
  properties: (tenantId: string) => `properties:list:${tenantId}`,
  property: (id: string) => `properties:${id}`,

  // Owners
  owners: (tenantId: string) => `owners:list:${tenantId}`,
  owner: (id: string) => `owners:${id}`,

  // Reservations
  reservations: (tenantId: string, month: string) => `reservations:${tenantId}:${month}`,

  // Calendar
  calendar: (tenantId: string, start: string, end: string, propertyId?: string) =>
    `calendar:${tenantId}:${start}:${end}:${propertyId || 'all'}`,

  // Notifications
  notifications: (tenantId: string) => `notifications:${tenantId}`,

  // Financial
  financialSummary: (tenantId: string, start: string, end: string) =>
    `financial:summary:${tenantId}:${start}:${end}`,

  // Invalidation patterns
  tenantPattern: (tenantId: string) => `*:${tenantId}*`,
  calendarPattern: (tenantId: string) => `calendar:${tenantId}:*`,
}

// TTL constants (in seconds)
// Com invalidação automática, TTLs mais longos são seguros
export const TTL = {
  SHORT: 300,       // 5 minutes (notifications, dados que mudam frequentemente)
  MEDIUM: 1800,     // 30 minutes (owners, properties, dashboard)
  LONG: 3600,       // 1 hour (dados mais estáveis)
  HOUR: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
}
