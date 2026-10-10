import { Request, Response, NextFunction } from "express";

/**
 * Applies security headers adhering to Phase 1 §28 security controls
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.removeHeader("X-Powered-By");
  next();
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitBucket>();

/**
 * In-memory sliding window rate limiter
 * @param maxRequests Maximum allowed requests per window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function rateLimiter(maxRequests: number = 120, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();
    let bucket = rateLimits.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimits.set(key, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please slow down and try again shortly.",
        },
      });
    }

    next();
  };
}
