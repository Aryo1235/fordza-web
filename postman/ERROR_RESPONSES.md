# Error Response Reference

## Standard Error Format

Semua error response mengikuti format standar:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "traceId": "req_abc123",
  "errors": {},      // Optional: untuk validation errors
  "field": "string", // Optional: untuk duplicate errors
  "details": {}      // Optional: untuk additional info
}
```

---

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token but no permission |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Duplicate entry (unique constraint) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database connection error |

---

## Error Codes & Examples

### 1. VALIDATION_ERROR (400)

**Scenario:** Input data tidak valid

```json
{
  "success": false,
  "message": "Data produk tidak valid",
  "code": "VALIDATION_ERROR",
  "errors": {
    "productCode": ["Kode produk wajib diisi"],
    "name": ["Nama produk wajib diisi", "Nama minimal 3 karakter"],
    "variants": ["Minimal 1 varian wajib ditambahkan"]
  },
  "traceId": "req_abc123"
}
```

**Common Causes:**
- Empty required fields
- Invalid format (email, phone, etc)
- Out of range values
- Type mismatch

---

### 2. DUPLICATE_ENTRY (409)

**Scenario:** Data sudah ada (unique constraint violation)

```json
{
  "success": false,
  "message": "Kode produk sudah digunakan",
  "code": "DUPLICATE_ENTRY",
  "field": "productCode",
  "traceId": "req_abc123"
}
```

**Field-Specific Messages:**
- `productCode` → "Kode produk sudah digunakan"
- `username` → "Username sudah digunakan"
- `email` → "Email sudah terdaftar"

**Prisma Error Code:** P2002

---

### 3. NOT_FOUND (404)

**Scenario:** Resource tidak ditemukan

```json
{
  "success": false,
  "message": "Produk tidak ditemukan",
  "code": "NOT_FOUND",
  "traceId": "req_abc123"
}
```

**Common Resources:**
- Product
- Category
- User
- Transaction
- Variant

**Prisma Error Code:** P2025

---

### 4. UNAUTHORIZED (401)

**Scenario:** Token tidak valid atau expired

```json
{
  "success": false,
  "message": "Token tidak valid atau sudah expired",
  "code": "UNAUTHORIZED",
  "traceId": "req_abc123"
}
```

**Common Causes:**
- Missing Authorization header
- Invalid token format
- Expired token
- Wrong credentials (login)

---

### 5. FORBIDDEN (403)

**Scenario:** User tidak punya permission

```json
{
  "success": false,
  "message": "Anda tidak memiliki akses ke resource ini",
  "code": "FORBIDDEN",
  "traceId": "req_abc123"
}
```

**Example:** KASIR role trying to access admin-only endpoint

---

### 6. RATE_LIMIT_EXCEEDED (429)

**Scenario:** Terlalu banyak request

```json
{
  "success": false,
  "message": "Terlalu banyak request, coba lagi nanti",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": "2026-05-21T14:30:00Z"
  },
  "traceId": "req_abc123"
}
```

---

### 7. DATABASE_ERROR (503)

**Scenario:** Database connection error

```json
{
  "success": false,
  "message": "Gagal terhubung ke database",
  "code": "DATABASE_ERROR",
  "traceId": "req_abc123"
}
```

**Prisma Error Codes:**
- `PrismaClientInitializationError`
- `PrismaClientRustPanicError`

---

### 8. INTERNAL_SERVER_ERROR (500)

**Scenario:** Unexpected error

```json
{
  "success": false,
  "message": "Terjadi kesalahan pada server",
  "code": "INTERNAL_SERVER_ERROR",
  "traceId": "req_abc123"
}
```

**Note:** Ini adalah fallback untuk error yang tidak ter-handle

---

## Product-Specific Errors

### POST /api/admin/products

**400 - Empty Variant**
```json
{
  "success": false,
  "message": "Minimal 1 varian warna wajib ditambahkan",
  "code": "VALIDATION_ERROR",
  "traceId": "req_abc123"
}
```

**400 - Invalid Data**
```json
{
  "success": false,
  "message": "Data produk tidak valid",
  "code": "VALIDATION_ERROR",
  "errors": {
    "productCode": ["Kode produk wajib diisi"],
    "name": ["Nama produk wajib diisi"],
    "productType": ["Tipe produk tidak valid"]
  },
  "traceId": "req_abc123"
}
```

**409 - Duplicate Code**
```json
{
  "success": false,
  "message": "Kode produk sudah digunakan",
  "code": "DUPLICATE_ENTRY",
  "field": "productCode",
  "traceId": "req_abc123"
}
```

---

### PUT /api/admin/products/:id

**400 - Empty Name**
```json
{
  "success": false,
  "message": "Nama produk tidak boleh kosong",
  "code": "VALIDATION_ERROR",
  "traceId": "req_abc123"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Produk tidak ditemukan",
  "code": "NOT_FOUND",
  "traceId": "req_abc123"
}
```

**409 - Duplicate Code**
```json
{
  "success": false,
  "message": "Kode produk sudah digunakan",
  "code": "DUPLICATE_ENTRY",
  "field": "productCode",
  "traceId": "req_abc123"
}
```

---

### GET /api/admin/products/:id

**404 - Not Found**
```json
{
  "success": false,
  "message": "Produk tidak ditemukan",
  "code": "NOT_FOUND",
  "traceId": "req_abc123"
}
```

---

### DELETE /api/admin/products/:id

**404 - Not Found**
```json
{
  "success": false,
  "message": "Produk tidak ditemukan",
  "code": "NOT_FOUND",
  "traceId": "req_abc123"
}
```

---

## Frontend Error Handling

### React/Next.js Example

```typescript
try {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // Handle error based on code
    switch (result.code) {
      case 'VALIDATION_ERROR':
        // Show field errors
        Object.entries(result.errors).forEach(([field, messages]) => {
          console.error(`${field}: ${messages.join(', ')}`);
        });
        break;
        
      case 'DUPLICATE_ENTRY':
        // Show duplicate message
        toast.error(result.message);
        break;
        
      case 'UNAUTHORIZED':
        // Redirect to login
        router.push('/login');
        break;
        
      case 'NOT_FOUND':
        // Show not found message
        toast.error(result.message);
        break;
        
      default:
        // Generic error
        toast.error(result.message);
    }
  }
} catch (error) {
  console.error('Network error:', error);
  toast.error('Gagal terhubung ke server');
}
```

---

## Testing Error Responses

### Using Postman

1. Import `Fordza-Complete.postman_collection.json`
2. Set environment variables
3. Navigate to error scenario folders
4. Run requests to see error responses

### Using cURL

**Duplicate Product Code:**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "productCode=EXISTING-CODE" \
  -F "name=Test Product"
```

**Validation Error:**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "productCode=" \
  -F "name="
```

**Not Found:**
```bash
curl -X GET http://localhost:3000/api/admin/products/invalid-id \
  -H "Authorization: Bearer $TOKEN"
```

---

## Logging & Debugging

Setiap error response include `traceId` untuk tracking:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "traceId": "req_abc123"  // ← Use this for log searching
}
```

**Check logs:**
```bash
# Search by traceId
grep "req_abc123" logs/app.log

# Filter by error level
grep "ERROR" logs/app.log | grep "req_abc123"
```

---

## Best Practices

1. **Always check `success` field first**
   ```typescript
   if (!response.success) {
     // Handle error
   }
   ```

2. **Use `code` for programmatic handling**
   ```typescript
   if (response.code === 'VALIDATION_ERROR') {
     // Show validation errors
   }
   ```

3. **Show `message` to users**
   ```typescript
   toast.error(response.message);
   ```

4. **Log `traceId` for debugging**
   ```typescript
   console.error(`Error ${response.code}: ${response.traceId}`);
   ```

5. **Handle network errors separately**
   ```typescript
   try {
     const response = await fetch(...);
   } catch (error) {
     // Network error, not API error
     toast.error('Gagal terhubung ke server');
   }
   ```
