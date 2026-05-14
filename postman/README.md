# Postman Collection - Fordza API

## 📦 Files

- `Fordza-Local.postman_environment.json` - Environment variables untuk local development
- `Fordza-API.postman_collection.json` - Main collection (Auth endpoints)
- `Products.postman_collection.json` - Product management endpoints
- `Categories.postman_collection.json` - Category management endpoints
- `Banners.postman_collection.json` - Banner management endpoints
- `POS.postman_collection.json` - POS/Kasir endpoints
- `Public.postman_collection.json` - Public API endpoints

## 🚀 Quick Start

### 1. Import Environment

1. Buka Postman
2. Click **Environments** (sidebar kiri)
3. Click **Import**
4. Pilih file `Fordza-Local.postman_environment.json`
5. Select environment "Fordza Local" di dropdown (kanan atas)

### 2. Import Collections

1. Click **Collections** (sidebar kiri)
2. Click **Import**
3. Pilih semua file `.postman_collection.json`
4. Collections akan muncul di sidebar

### 3. Login

1. Buka collection **Fordza API Collection**
2. Folder **Auth** → Request **Login**
3. Click **Send**
4. Access token akan otomatis tersimpan di environment

### 4. Test Endpoints

Semua request sudah menggunakan `{{access_token}}` dari environment.

## 📝 Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API base URL |
| `access_token` | (auto-filled) | JWT access token |
| `refresh_token` | (auto-filled) | JWT refresh token |
| `user_id` | (auto-filled) | Current user ID |
| `admin_username` | `admin` | Default admin username |
| `admin_password` | `fordza2026` | Default admin password |

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

### Auth
- Login
- Refresh Token
- Get Me
- Logout

### Products
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

### Categories
- List Categories
- Get Category by ID
- Create Category
- Update Category
- Delete Category

### Banners
- List Banners
- Get Banner by ID
- Create Banner
- Update Banner
- Delete Banner

### Promo
- List Promos
- Get Promo by ID
- Create Promo
- Update Promo
- Delete Promo

### Users
- List Users
- Create User
- Update User
- Delete User

### POS/Kasir
- List Products (POS)
- Checkout
- List Transactions
- Get Transaction by ID
- Void Transaction
- Verify Admin PIN
- Open Shift
- Close Shift
- Get Current Shift

### Reports
- Sales Summary
- Sales by Items
- Export Summary
- Export Items

### Public API
- List Products (Public)
- Get Product by ID (Public)
- List Categories (Public)
- List Banners (Public)
- List Testimonials (Public)
- List Size Templates (Public)

### Health
- Health Check

## 🧪 Testing Tips

### 1. Test Rate Limiting

Try login 6 times rapidly:
- First 5 attempts: Success
- 6th attempt: 429 Too Many Requests

### 2. Test Token Expiry

Wait 15 minutes after login, then try any protected endpoint:
- Should return 401 Unauthorized
- Use **Refresh Token** request to get new access token

### 3. Test Validation

Send invalid data to test Zod validation:

```json
{
  "name": "",  // Empty string
  "imageUrl": "not-a-url"  // Invalid URL
}
```

Expected: 400 Bad Request with validation errors

### 4. Test Error Handling

Try to get non-existent resource:

```
GET /api/admin/products/invalid-id
```

Expected: 404 Not Found with error code

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

**Last Updated:** 2026-05-14
