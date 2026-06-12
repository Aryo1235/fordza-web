# 🚀 Postman Quick Start Guide

## 📦 What You'll Get

- ✅ **Complete API Collection** dengan 100+ requests
- ✅ **Error Scenarios** untuk setiap endpoint (401, 400, 404, 429, 403, 409)
- ✅ **Auto-save tokens** setelah login
- ✅ **Test scripts** untuk validasi response
- ✅ **2 Environments** (Development & Production)
- ✅ **Auto-fill resource IDs** untuk chaining requests

---

## Step 1: Import Environments

1. Buka Postman
2. Click **Environments** (⚙️ icon di sidebar kiri)
3. Click **Import** button
4. Drag & drop files:
   - `Fordza-Development.postman_environment.json`
   - `Fordza-Production.postman_environment.json`
5. **Select environment** di dropdown (kanan atas)
   - Pilih **"Fordza - Development"** untuk local testing

---

## Step 2: Import Collection

1. Click **Collections** (📁 icon di sidebar kiri)
2. Click **Import** button
3. Drag & drop file: `Fordza-Complete.postman_collection.json`
4. Collection "Fordza API - Complete Collection" akan muncul

---

## Step 3: Configure Environment

### **For Development (Default)**
Sudah configured, langsung bisa digunakan!

### **For Production**
1. Click **Environments** → **Fordza - Production**
2. Update **Current Value** untuk:
   - `base_url`: `https://your-production-domain.com`
   - `admin_password`: Your production password
   - `admin_pin`: Your production PIN
3. Click **Save**

---

## Step 4: Start Server (Development Only)

```bash
cd fordza-web
npm run dev
```

Server running di: **http://localhost:3000**

---

## Step 5: Test Login

1. Expand collection **Fordza API - Complete Collection**
2. Expand folder **🔐 Auth**
3. Click request **✅ Login (Success)**
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

✅ **Access token otomatis tersimpan di environment!**

Check di **Environments** → **Fordza - Development** → `access_token` (Current Value)

---

## Step 6: Test Health Check

1. Folder **🏥 Health**
2. Click request **✅ Health Check**
3. Click **Send**

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-20T10:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## Step 7: Test Error Scenarios

### **Test 401 Unauthorized**

1. Folder **🔐 Auth**
2. Click **❌ Get Me (Unauthorized)**
3. Click **Send**

**Expected Response:**
```json
{
  "success": false,
  "message": "Sesi habis. Silakan login kembali"
}
```

### **Test 400 Validation Error**

1. Folder **🔐 Auth**
2. Click **❌ Login (Validation Error)**
3. Click **Send**

**Expected Response:**
```json
{
  "success": false,
  "message": "Validasi gagal",
  "error": "Username dan password wajib diisi"
}
```

### **Test 429 Rate Limit**

1. Folder **🔐 Auth**
2. Click **❌ Login (Rate Limit Exceeded)**
3. Click **Send** **6 times rapidly**
4. 6th request akan return 429

**Expected Response:**
```json
{
  "success": false,
  "message": "Terlalu banyak percobaan login. Coba lagi dalam 1 menit."
}
```

---

## 🎯 Common Workflows

### **Workflow 1: Test All Auth Endpoints**

1. ✅ Login (Success) → Get tokens
2. ✅ Get Me (Success) → Verify session
3. ✅ Refresh Token (Success) → Get new access token
4. ✅ Logout (Success) → Clear tokens
5. ❌ Get Me (Unauthorized) → Verify logout

### **Workflow 2: Test Error Scenarios**

1. ❌ Login (Invalid Credentials)
2. ❌ Login (Validation Error)
3. ❌ Login (Rate Limit) - Send 6x rapidly
4. ❌ Get Me (Unauthorized) - No token
5. ❌ Refresh Token (Invalid Token)

### **Workflow 3: Production Testing**

1. Switch to **Fordza - Production** environment
2. Update `base_url` and `admin_password`
3. Test **✅ Health Check** first
4. Test **✅ Login (Success)**
5. Test other endpoints

---

## 🔧 Troubleshooting

### **Error: "Sesi habis. Silakan login kembali"**

**Solution:** Access token expired (15 menit)
1. Go to **🔐 Auth** → **✅ Refresh Token (Success)**
2. Click **Send**
3. New access token akan tersimpan

### **Error: "Could not get response"**

**Solution:** Server tidak running
```bash
npm run dev
```

### **Error: 401 Unauthorized**

**Solution:** Token tidak valid atau expired
1. Check environment variable `access_token`
2. Re-login: **🔐 Auth** → **✅ Login (Success)**

### **Error: 429 Too Many Requests**

**Solution:** Rate limit exceeded
- Wait 1 minute
- Or restart server (reset rate limit cache)

### **Error: Environment not selected**

**Solution:** Select environment
1. Click dropdown (kanan atas)
2. Select **Fordza - Development** or **Fordza - Production**

---

## 📝 Environment Variables Explained

### **Auto-filled Variables (After Login)**

| Variable | Description |
|----------|-------------|
| `access_token` | JWT access token (expires in 15 min) |
| `refresh_token` | JWT refresh token (expires in 7 days) |
| `user_id` | Current user ID |
| `user_role` | Current user role (ADMIN/KASIR) |

### **Manual Variables**

| Variable | Development | Production |
|----------|-------------|------------|
| `base_url` | `http://localhost:3000` | Your production URL |
| `admin_username` | `admin` | `admin` |
| `admin_password` | `fordza2026` | Your production password |
| `admin_pin` | `1234` | Your production PIN |

### **Resource ID Variables (Auto-filled by Tests)**

These variables are automatically filled when you create or fetch resources:
- `product_id`
- `variant_id`
- `sku_id`
- `category_id`
- `banner_id`
- `testimonial_id`
- `size_template_id`
- `promo_id`
- `transaction_id`
- `shift_id`

---

## 🎨 Tips & Tricks

### **1. View Request Headers**

Click **Headers** tab di request untuk lihat:
- `Authorization: Bearer {{access_token}}`
- `Content-Type: application/json`

### **2. View Response Headers**

Setelah send request, click **Headers** tab di response untuk lihat:
- `x-request-id` (for debugging)
- `x-ratelimit-limit`
- `x-ratelimit-remaining`

### **3. View Test Results**

Setelah send request, click **Test Results** tab untuk lihat:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- Console logs

### **4. Use Variables in URL**

```
{{base_url}}/api/admin/products/{{product_id}}
```

### **5. Duplicate Request**

Right-click request → **Duplicate** → Modify for testing

### **6. Run Collection**

Click **...** (three dots) → **Run collection** → Test all requests sequentially

---

## 📚 Next Steps

1. ✅ Test all Auth endpoints
2. ✅ Test Health check
3. ✅ Test error scenarios
4. ⏳ Wait for complete collection with all endpoints
5. ⏳ Test Products, Categories, Banners, etc.
6. ⏳ Test POS workflow
7. ⏳ Test Reports

---

## 📞 Need Help?

- Check API docs: `fordza-docs/API_REFERENCE.md`
- Check security docs: `fordza-docs/SECURITY.md`
- Check server logs in terminal
- Check Postman console (View → Show Postman Console)

---

**Happy Testing! 🎉**

**Version:** 1.0.0  
**Last Updated:** 2026-05-20
