import { TTLCache } from "@isaacs/ttlcache";
import { config } from "../config";

const cache = new TTLCache<string, number>({ ttl: config.rateLimit.windowMs });

export function isRateLimited(userId: string): boolean {
  const count = cache.get(userId) ?? 0;

  if (count >= config.rateLimit.maxDetections) {
    return true;
  }

  cache.set(userId, count + 1, { noUpdateTTL: true });
  return false;
}
