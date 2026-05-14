# Security Documentation - Fordza-Web

## 📋 Overview

Fordza-Web implements production-ready security features to protect against common vulnerabilities and attacks.

**Last Updated:** 2026-05-14  
**Security Level:** Production-Ready

---

## 🔐 Authentication & Authorization

### **JWT-Based Authentication**

#### **Dual Token System**
- **Access Token:** Short-lived (15 minutes), for API access
- **Refresh Token:** Long-lived (7 days), for session renewal

#### **Separate Secrets**
```env
JWT_ACCESS_SECRET="<32+ chars>"  # For access tokens
JWT_REFRESH_SECRET="<32+ chars>" # For refresh tokens
```

**Why separate secrets?**
- Token isolation - compromised refresh token can't forge access tokens
- Defense in depth
- Better security posture

#### **Token Storage**
- **Access Token:** HTTP-only cookie + localStorage (fallback)
- **Refresh Token:** HTTP-only cookie only
- **XSS Protection:** HTTP-only cookies prevent JavaScript access

#### **Validation**
- Automatic validation on server startup
- Minimum 32 characters enforced
- Server throws error if secrets missing or too short

### **Password Security**
- **Hashing:** bcrypt with configurable rounds (default: 12)
- **Salt:** Automatic per-password salt
- **No plaintext storage:** Passwords never stored in plain text

### **Role-Based Access Control (RBAC)**
- **Roles:** ADMIN, KASIR
- **Proxy Protection:** Routes protected at proxy level
- **Granular Permissions:** Different access levels per role

---

## 🛡️ Rate Limiting

### **Implementation**
- **Strategy:** In-memory LRU cache (single server)
- **Tracking:** Per IP address
- **Window:** 1 minute (60,000ms)

### **Limits**

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/admin/auth/login` | 5 | 1 min | Prevent brute force |
| `/api/admin/auth/refresh` | 10 | 1 min | Normal usage |
| `/api/kasir/auth/verify-pin` | 3 | 1 min | PIN brute force protection |

### **Configuration**
```env
RATE_LIMIT_LOGIN="5"
RATE_LIMIT_REFRESH="10"
RATE_LIMIT_PIN="3"
RATE_LIMIT_WINDOW="60000"
```

### **Response Headers**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2026-05-14T20:00:00.000Z
```

### **Error Response**
```json
{
  "success": false,
  "message": "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
  "retryAfter": "2026-05-14T20:00:00.000Z"
}
```

---

## 🔍 Request Tracking & Audit Trail

### **Request ID**
- **Header:** `x-request-id`
- **Format:** UUID v4
- **Scope:** All API requests
- **Purpose:** Trace requests across services, debugging

### **User Tracking**
- **Headers Injected by Proxy:**
  - `x-user-id` - User ID
  - `x-user-username` - Username
  - `x-user-role` - User role

### **Audit Fields**
- **createdById** - Who created the record
- **updatedById** - Who last updated the record
- **createdAt** - When created
- **updatedAt** - When last updated

**Models with Audit Trail:**
- Product
- Category
- Promo
- Banner

---

## ✅ Input Validation

### **Zod Schemas**
All inputs validated with Zod before reaching database.

**Example:**
```typescript
import { CreateBannerSchema } from '@/backend/schemas';

const validated = CreateBannerSchema.parse(body);
// Throws ZodError if invalid
```

### **Validation Layers**
1. **Client-side:** React Hook Form + Zod (UX)
2. **Server-side:** Zod schemas in services (Security)
3. **Database:** Prisma schema constraints (Data integrity)

### **SQL Injection Protection**
- **Prisma ORM:** Parameterized queries by default
- **No raw SQL:** Avoid `$queryRaw` unless necessary
- **Type-safe:** TypeScript prevents type mismatches

---

## 🚨 Error Handling

### **Custom Error Classes**
```typescript
// lib/errors.ts
AppError           // Base error class
ValidationError    // 400 - Invalid input
NotFoundError      // 404 - Resource not found
UnauthorizedError  // 401 - Not authenticated
ForbiddenError     // 403 - Not authorized
ConflictError      // 409 - Duplicate data
RateLimitError     // 429 - Too many requests
```

### **Centralized Handler**
```typescript
// lib/error-handler.ts
export function handleError(error: unknown) {
  // Handles AppError, ZodError, Prisma errors
  // Returns consistent error responses
}
```

### **Prisma Error Mapping**
- **P2002:** Unique constraint violation → 409 Conflict
- **P2025:** Record not found → 404 Not Found
- **P2003:** Foreign key constraint → 400 Bad Request

### **Error Response Format**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* Optional additional info */ }
}
```

---

## 📝 Logging

### **Structured Logging (Pino)**
```typescript
import { logger } from '@/lib/logger';

logger.info({ userId, productId }, 'Product created');
logger.error({ error, requestId }, 'Failed to process request');
logger.warn({ stockLevel }, 'Low stock alert');
```

### **Log Levels**
- **error:** Errors that need attention
- **warn:** Warnings, potential issues
- **info:** General information (default)
- **debug:** Detailed debugging info
- **trace:** Very detailed tracing

### **Configuration**
```env
LOG_LEVEL="info"  # error | warn | info | debug | trace
```

### **Development vs Production**
- **Development:** Pretty-printed, colorized logs
- **Production:** JSON logs for log aggregation tools

---

## 🔒 File Upload Security

### **Validation**
- **File type:** Whitelist (JPG, PNG, WEBP)
- **File size:** Max 5MB
- **Filename:** UUID-based (prevent overwrite)

### **Storage**
- **AWS S3:** Secure cloud storage
- **Public access:** Read-only via bucket policy
- **CORS:** Restricted origins

### **Upload Flow**
```
1. Client uploads file
2. Server validates type & size
3. Generate unique key: folder/timestamp-uuid.ext
4. Upload to S3
5. Return public URL
6. Save URL + key to database
```

---

## 🏥 Health Monitoring

### **Health Check Endpoint**
```
GET /api/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-14T20:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-05-14T20:00:00.000Z",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

**Status Code:** 503 Service Unavailable (if unhealthy)

---

## 🔐 Environment Variables

### **Required**
```env
JWT_ACCESS_SECRET="<32+ chars>"
JWT_REFRESH_SECRET="<32+ chars>"
DATABASE_URL="postgresql://..."
```

### **Optional (with defaults)**
```env
BCRYPT_ROUNDS="12"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
RATE_LIMIT_LOGIN="5"
RATE_LIMIT_REFRESH="10"
RATE_LIMIT_PIN="3"
LOG_LEVEL="info"
```

### **Generating Secrets**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🛡️ Security Best Practices

### **DO:**
✅ Use separate JWT secrets for access & refresh  
✅ Set strong secrets (min 32 chars)  
✅ Enable rate limiting in production  
✅ Validate all inputs with Zod  
✅ Use structured logging  
✅ Monitor health endpoint  
✅ Keep dependencies updated  
✅ Use HTTPS in production  
✅ Set secure CORS origins  
✅ Change default admin password  

### **DON'T:**
❌ Commit secrets to Git  
❌ Use same secret for access & refresh  
❌ Disable rate limiting  
❌ Trust client-side validation only  
❌ Log sensitive data (passwords, tokens)  
❌ Use `any` type in TypeScript  
❌ Skip input validation  
❌ Expose stack traces in production  

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Generate strong JWT secrets (32+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Change default admin password
- [ ] Set up database backups
- [ ] Configure S3 bucket policy
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Test rate limiting
- [ ] Test health check endpoint
- [ ] Review error logs
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Enable database SSL
- [ ] Set up CDN for static assets

---

## 📊 Security Metrics

### **Current Status**
- ✅ JWT with separate secrets
- ✅ Rate limiting active
- ✅ Input validation (Zod)
- ✅ Centralized error handling
- ✅ Audit trail implemented
- ✅ Request tracking (UUID)
- ✅ Structured logging (Pino)
- ✅ Health monitoring
- ✅ Password hashing (bcrypt)
- ✅ SQL injection protection (Prisma)

### **OWASP Top 10 Coverage**
- ✅ A01: Broken Access Control → RBAC + Proxy protection
- ✅ A02: Cryptographic Failures → bcrypt + JWT
- ✅ A03: Injection → Prisma ORM + Zod validation
- ✅ A04: Insecure Design → Layered architecture
- ✅ A05: Security Misconfiguration → Validation on startup
- ✅ A06: Vulnerable Components → Regular updates
- ✅ A07: Authentication Failures → JWT + Rate limiting
- ✅ A08: Software Integrity Failures → Package lock
- ✅ A09: Logging Failures → Structured logging
- ✅ A10: SSRF → Input validation

---

## 📞 Security Contact

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@fordza.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
