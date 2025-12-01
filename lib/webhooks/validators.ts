import { createHash, createHmac } from 'crypto';

// Validate webhook secret from header
export function validateWebhookSecret(
  providedSecret: string | null,
  expectedSecret: string
): boolean {
  if (!providedSecret) return false;
  return providedSecret === expectedSecret;
}

// Validate HMAC signature (for webhooks that use signatures)
export function validateHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const hmac = createHmac(algorithm, secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// Validate UptimeRobot webhook (uses simple secret)
export function validateUptimeRobotWebhook(
  secret: string | null,
  expectedSecret: string
): boolean {
  return validateWebhookSecret(secret, expectedSecret);
}

// Validate FileMaker webhook (uses custom auth header)
export function validateFileMakerWebhook(
  authHeader: string | null,
  expectedSecret: string
): boolean {
  if (!authHeader) return false;
  
  // FileMaker might use Bearer token or custom format
  const token = authHeader.replace('Bearer ', '').trim();
  return token === expectedSecret;
}

// Validate Backup System webhook
export function validateBackupWebhook(
  secret: string | null,
  expectedSecret: string
): boolean {
  return validateWebhookSecret(secret, expectedSecret);
}

// Validate AWS S3 webhook (SNS signature validation)
export function validateAWSS3Webhook(
  payload: any,
  signature: string | null,
  expectedSecret: string
): boolean {
  // For development, allow simple secret validation
  if (signature && signature === expectedSecret) {
    return true;
  }
  
  // In production, you should validate SNS signature properly
  // This is a simplified version
  if (!signature) return false;
  
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return validateHmacSignature(payloadString, signature, expectedSecret);
}

// Rate limiting helper (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
}

// Clean up old rate limit records (call periodically)
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}
