# Postman Collection - Fordza API

## 📦 Files

### **Collections**
- `Fordza-Complete.postman_collection.json` - **Complete collection** dengan semua endpoints & error scenarios ✅ **Updated with proper error responses**

### **Environments**
- `Fordza-Development.postman_environment.json` - Development environment (localhost:3000)
- `Fordza-Production.postman_environment.json` - Production environment (production URL)

### **Documentation**
- `ERROR_RESPONSES.md` - ⭐ **NEW!** Complete error response reference
- `QUICK_START.md` - Quick start guide

### **Legacy (Deprecated)**
- `Fordza-Local.postman_environment.json` - ⚠️ Deprecated, gunakan Fordza-Development
- `Fordza-API.postman_collection.json` - ⚠️ Deprecated, gunakan Fordza-Complete

---

## 🚨 Error Responses (NEW!)

Semua error responses sekarang mengikuti format standar:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "traceId": "req_abc123",
  "errors": {},      // Optional: validation errors
  "field": "string"  // Optional: duplicate field
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input data
- `DUPLICATE_ENTRY` (409) - Kode produk/username sudah digunakan
- `NOT_FOUND` (404) - Resource tidak ditemukan
- `UNAUTHORIZED` (401) - Token invalid/expired

**📖 See [ERROR_RESPONSES.md](./ERROR_RESPONSES.md) for complete reference with examples.**

---

## 🚀 Quick Start

### 1. Import Environment

1. Buka Postman
2. Click **Environments** (sidebar kiri)
3. Click **Import**
4. Pilih file:
   - **Development:** `Fordza-Development.postman_environment.json`
   - **Production:** `Fordza-Production.postman_environment.json`
5. Select environment di dropdown (kanan atas)

### 2. Import Collection

1. Click **Collections** (sidebar kiri)
2. Click **Import**
3. Pilih file `Fordza-Complete.postman_collection.json`
4. Collection akan muncul di sidebar

### 3. Configure Production Environment (if needed)

1. Click **Environments** → **Fordza - Production**
2. Update values:
   - `base_url`: Your production URL (e.g., `https://api.fordza.com`)
   - `admin_password`: Your production admin password
   - `admin_pin`: Your production admin PIN

### 4. Login

1. Buka collection **Fordza API - Complete Collection**
2. Folder **🔐 Auth** → Request **✅ Login (Success)**
3. Click **Send**
4. Access token akan otomatis tersimpan di environment

### 5. Test Endpoints

Semua request sudah menggunakan `{{access_token}}` dari environment.

## 📝 Environment Variables

### **Common Variables (Both Environments)**

| Variable | Auto-filled? | Description |
|----------|--------------|-------------|
| `base_url` | No | API base URL |
| `access_token` | ✅ Yes (after login) | JWT access token |
| `refresh_token` | ✅ Yes (after login) | JWT refresh token |
| `user_id` | ✅ Yes (after login) | Current user ID |
| `user_role` | ✅ Yes (after login) | Current user role (ADMIN/KASIR) |
| `admin_username` | No | Admin username |
| `admin_password` | No | Admin password |
| `admin_pin` | No | Admin PIN (for void transaction) |

### **Resource ID Variables (Auto-filled by tests)**

| Variable | Description |
|----------|-------------|
| `product_id` | Last created/fetched product ID |
| `variant_id` | Last created/fetched variant ID |
| `sku_id` | Last created/fetched SKU ID |
| `category_id` | Last created/fetched category ID |
| `banner_id` | Last created/fetched banner ID |
| `testimonial_id` | Last created/fetched testimonial ID |
| `size_template_id` | Last created/fetched size template ID |
| `promo_id` | Last created/fetched promo ID |
| `transaction_id` | Last created/fetched transaction ID |
| `shift_id` | Last created/fetched shift ID |

### **Development vs Production**

| Variable | Development | Production |
|----------|-------------|------------|
| `base_url` | `http://localhost:3000` | `https://your-domain.com` |
| `admin_password` | `fordza2026` (default) | Your production password |
| `admin_pin` | `1234` (default) | Your production PIN |

## 🔐 Authentication

### Auto-Login Script

Request **Login** memiliki test script yang otomatis menyimpan tokens:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('access_token', response.data.accessToken);
    pm.environment.set('refresh_token', response.data.refreshToken);
    pm.environment.set('user_id', response.data.id);
}
```

### Bearer Token

Semua protected endpoints menggunakan Bearer token dari environment:

```
Authorization: Bearer {{access_token}}
```

## 📚 Collection Structure

### **🔐 Auth** (9 requests)
- ✅ Login (Success)
- ❌ Login (Invalid Credentials)
- ❌ Login (Rate Limit Exceeded)
- ❌ Login (Validation Error)
- ✅ Refresh Token (Success)
- ❌ Refresh Token (Invalid Token)
- ✅ Get Me (Success)
- ❌ Get Me (Unauthorized)
- ✅ Logout (Success)

### **🏥 Health** (1 request)
- ✅ Health Check

### **📦 Products** (Coming in full collection)
- List Products (with filters)
- Get Product by ID
- Create Product
- Update Product
- Delete Product
- Upload Product Images
- Delete Product Image
- Bulk Import (CSV)
- Bulk Stock Update
- Export Products
- **Error scenarios:** 401, 404, 400, 403

### **🎨 Categories** (Coming in full collection)
- List Categories
- Get Category by ID
- Create Category
- Update Category
- Delete Category
- **Error scenarios:** 401, 404, 400, 409

### **🖼️ Banners** (Coming in full collection)
- List Banners
- Get Banner by ID
- Create Banner
- Update Banner
- Delete Banner
- **Error scenarios:** 401, 404, 400

### **💬 Testimonials** (Coming in full collection)
- List Testimonials
- Get Testimonial by ID
- Create Testimonial
- Update Testimonial
- Delete Testimonial
- **Error scenarios:** 401, 404, 400

### **📏 Size Templates** (Coming in full collection)
- List Size Templates
- Get Size Template by ID
- Create Size Template
- Update Size Template
- Delete Size Template
- **Error scenarios:** 401, 404, 400

### **🎨 Variants & SKUs** (Coming in full collection)
- List Variants by Product
- Create Variant
- Update Variant
- Delete Variant
- Create SKU
- Update SKU
- Delete SKU
- **Error scenarios:** 401, 404, 400

### **👥 Users** (Coming in full collection)
- List Users
- Create User
- Update User
- Delete User
- List Cashiers
- **Error scenarios:** 401, 404, 400, 409

### **📊 Stock Management** (Coming in full collection)
- Get Stock Logs
- Get SKU Stock Logs
- Export Stock Logs
- Export SKU Stock Logs
- **Error scenarios:** 401, 400

### **🎁 Promo** (Coming in full collection)
- List Promos
- Get Promo by ID
- Create Promo
- Update Promo
- Delete Promo
- **Error scenarios:** 401, 404, 400

### **💳 POS/Kasir** (Coming in full collection)
- List Products (POS)
- Checkout
- List Transactions
- Get Transaction by ID
- Void Transaction
- Verify Admin PIN
- **Error scenarios:** 401, 404, 400, 403

### **⏰ Shifts** (Coming in full collection)
- Open Shift
- Close Shift
- Get Current Shift
- **Error scenarios:** 401, 400, 409

### **📈 Reports** (Coming in full collection)
- Sales Summary
- Sales by Items
- Export Summary
- Export Items
- **Error scenarios:** 401, 400

### **🌐 Public API** (Coming in full collection)
- List Products (Public)
- Get Product by ID (Public)
- List Categories (Public)
- List Banners (Public)
- List Testimonials (Public)
- List Size Templates (Public)
- Get Recommendations
- **Error scenarios:** 404, 400

### **📊 Transactions** (Coming in full collection)
- List Transactions
- Get Transaction by ID
- Export Transactions
- **Error scenarios:** 401, 404, 400

## 🧪 Testing Tips

### **1. Test Success Scenarios First**

Always test success scenarios (✅) before error scenarios (❌):
1. Login → Get access token
2. Create resource → Get resource ID
3. Update resource → Verify changes
4. Delete resource → Verify deletion

### **2. Test Error Scenarios**

Each endpoint has multiple error scenarios:

#### **401 Unauthorized**
- No access token provided
- Invalid access token
- Expired access token

**How to test:**
1. Remove `Authorization` header
2. Or use invalid token
3. Or wait 15 minutes after login

#### **400 Bad Request (Validation Error)**
- Empty required fields
- Invalid data format
- Invalid data type

**How to test:**
1. Send empty strings for required fields
2. Send invalid email format
3. Send string instead of number

#### **404 Not Found**
- Resource doesn't exist
- Invalid ID format

**How to test:**
1. Use non-existent ID: `invalid-id-123`
2. Use deleted resource ID

#### **429 Too Many Requests (Rate Limit)**
- Too many requests in short time

**How to test:**
1. Send same request 6+ times rapidly
2. Check response headers: `x-ratelimit-remaining`

**Rate limits:**
- Login: 5 attempts/minute
- Refresh: 10 attempts/minute
- PIN verification: 3 attempts/minute

#### **403 Forbidden**
- Insufficient permissions
- KASIR trying to access ADMIN endpoint

**How to test:**
1. Login as KASIR
2. Try to access admin-only endpoint (e.g., create user)

#### **409 Conflict**
- Duplicate unique field
- Resource already exists

**How to test:**
1. Create product with same `productCode`
2. Create category with same `name`
3. Open shift when shift already open

### **3. Test Rate Limiting**

Try login 6 times rapidly:
- First 5 attempts: Success or 401 (if wrong password)
- 6th attempt: 429 Too Many Requests

**Response:**
```json
{
  "success": false,
  "message": "Terlalu banyak percobaan login. Coba lagi dalam 1 menit."
}
```

### **4. Test Token Expiry**

Wait 15 minutes after login, then try any protected endpoint:
- Should return 401 Unauthorized
- Use **Refresh Token** request to get new access token

### **5. Test Validation**

Send invalid data to test Zod validation:

```json
{
  "name": "",  // Empty string
  "email": "not-an-email",  // Invalid format
  "price": "abc"  // Invalid type
}
```

Expected: 400 Bad Request with validation errors

### **6. Test Error Handling**

Try to get non-existent resource:

```
GET /api/admin/products/invalid-id-123
```

Expected: 404 Not Found

### **7. Test Pagination**

Test pagination with different parameters:
- `page=1&limit=10` (default)
- `page=999` (beyond total pages)
- `limit=1000` (exceeds max limit)

### **8. Test Filters**

Test product filters:
- `search=oxford`
- `gender=Man`
- `minPrice=500000&maxPrice=1000000`
- `categoryIds=cat1,cat2`
- `sortBy=cheapest`

### **9. Test File Upload**

Test image upload:
- Valid image (JPG, PNG, WEBP)
- Invalid file type (PDF, TXT)
- File too large (>5MB)
- Multiple files (>10 files)

### **10. Test Concurrent Requests**

Test race conditions:
1. Open 2 Postman windows
2. Send same request simultaneously
3. Check for conflicts or errors

## 🔄 Workflow Example

### Create Product Flow

1. **Login** → Get access token
2. **List Categories** → Get category IDs
3. **List Size Templates** → Get template ID
4. **Create Product** → Use category & template IDs
5. **Upload Product Images** → Attach images
6. **Get Product by ID** → Verify creation

### POS Flow

1. **Login** → Get access token
2. **Open Shift** → Start shift with initial cash
3. **List Products (POS)** → Browse products
4. **Checkout** → Create transaction
5. **Get Transaction by ID** → View invoice
6. **Close Shift** → End shift with cash count

## 📞 Support

Jika ada endpoint yang error:
1. Check environment variables
2. Check access token (might be expired)
3. Check request body format
4. Check API documentation: `fordza-docs/API_REFERENCE.md`

---

**Last Updated:** 2026-05-21 (Error responses updated)
