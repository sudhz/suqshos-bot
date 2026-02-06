import { TTLCache } from "@isaacs/ttlcache";
import { config } from "../config";

const cache = new TTLCache<string, number>({ ttl: config.rateLimit.windowMs });

export function isRateLimited(userId: string): boolean {
  const count = cache.get(userId) ?? 0;
  return count >= config.rateLimit.maxDetections;
}

export function incrementRateLimit(userId: string): void {
  const count = cache.get(userId) ?? 0;
  cache.set(userId, count + 1, { noUpdateTTL: count > 0 });
}
