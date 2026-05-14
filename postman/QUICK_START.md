# 🚀 Postman Quick Start Guide

## Step 1: Import Environment

1. Buka Postman
2. Click **Environments** (⚙️ icon di sidebar kiri)
3. Click **Import** button
4. Drag & drop file: `Fordza-Local.postman_environment.json`
5. Environment "Fordza Local" akan muncul
6. **Select environment** di dropdown (kanan atas)

## Step 2: Import Collection

1. Click **Collections** (📁 icon di sidebar kiri)
2. Click **Import** button
3. Drag & drop file: `Fordza-API.postman_collection.json`
4. Collection "Fordza API Collection" akan muncul

## Step 3: Start Server

```bash
cd fordza-web
npm run dev
```

Server running di: http://localhost:3000

## Step 4: Test Login

1. Expand collection **Fordza API Collection**
2. Expand folder **Auth**
3. Click request **Login**
4. Click **Send** button (biru)

**Expected Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "id": "...",
    "username": "admin",
    "name": "Admin Fordza",
    "role": "ADMIN",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

✅ Access token otomatis tersimpan di environment!

## Step 5: Test Protected Endpoint

1. Expand folder **Products**
2. Click request **List Products**
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "meta": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

## 🎯 Common Workflows

### Create Product Workflow

1. **Auth → Login** (get token)
2. **Categories → List Categories** (get category IDs)
3. **Products → Create Product** (use category IDs)
4. **Products → Get Product by ID** (verify)

### POS Workflow

1. **Auth → Login**
2. **POS/Kasir → Open Shift** (start shift)
3. **POS/Kasir → List Products (POS)** (browse)
4. **POS/Kasir → Checkout** (create transaction)
5. **POS/Kasir → Close Shift** (end shift)

### Test Rate Limiting

1. **Auth → Login** (send 6x rapidly)
2. 6th request akan return **429 Too Many Requests**

## 🔧 Troubleshooting

### Error: "Sesi habis. Silakan login kembali"

**Solution:** Access token expired (15 menit)
1. Go to **Auth → Refresh Token**
2. Click **Send**
3. New access token akan tersimpan

### Error: "Could not get response"

**Solution:** Server tidak running
```bash
npm run dev
```

### Error: 401 Unauthorized

**Solution:** Token tidak valid atau expired
1. Check environment variable `access_token`
2. Re-login: **Auth → Login**

### Error: 429 Too Many Requests

**Solution:** Rate limit exceeded
- Wait 1 minute
- Or restart server (reset rate limit cache)

## 📝 Environment Variables

Check current values:
1. Click **Environments** (⚙️)
2. Click **Fordza Local**
3. View **Current Value** column

| Variable | Auto-filled? | Description |
|----------|--------------|-------------|
| `base_url` | No | API base URL |
| `access_token` | ✅ Yes (after login) | JWT access token |
| `refresh_token` | ✅ Yes (after login) | JWT refresh token |
| `user_id` | ✅ Yes (after login) | Current user ID |
| `admin_username` | No | Default: admin |
| `admin_password` | No | Default: fordza2026 |

## 🎨 Tips & Tricks

### 1. View Request Headers

Click **Headers** tab di request untuk lihat:
- `Authorization: Bearer {{access_token}}`
- `x-request-id` (auto-generated)

### 2. View Response Headers

Setelah send request, click **Headers** tab di response untuk lihat:
- `x-request-id` (same as request)
- `x-ratelimit-limit`
- `x-ratelimit-remaining`

### 3. Save Response to Variable

Add test script:
```javascript
const response = pm.response.json();
pm.environment.set('product_id', response.data.id);
```

### 4. Use Variables in URL

```
{{base_url}}/api/admin/products/{{product_id}}
```

### 5. Duplicate Request

Right-click request → **Duplicate** → Modify

## 📚 Next Steps

1. ✅ Test all Auth endpoints
2. ✅ Create a product
3. ✅ Test POS workflow
4. ✅ Test rate limiting
5. ✅ Test public API (no auth)
6. ✅ Test health check

## 📞 Need Help?

- Check API docs: `fordza-docs/API_REFERENCE.md`
- Check security docs: `fordza-docs/SECURITY.md`
- Check server logs in terminal

---

**Happy Testing! 🎉**
