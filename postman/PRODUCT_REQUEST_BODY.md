# Product Creation Request Body

## POST /api/admin/products

**Content-Type:** `multipart/form-data`

---

## Complete Request Body

### Text Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `productCode` | string | ✅ Yes | Kode unik produk | `PROD-001` |
| `name` | string | ✅ Yes | Nama produk | `Sepatu Oxford Pria` |
| `shortDescription` | string | No | Deskripsi singkat | `Sepatu formal untuk pria` |
| `productType` | string | ✅ Yes | Tipe produk | `Sepatu`, `Sandal`, `Tas` |
| `gender` | string | No | Gender target | `Pria`, `Wanita`, `Unisex` (default: `Unisex`) |
| `categoryIds` | string | ✅ Yes | Category IDs (comma-separated) | `cat-id-1,cat-id-2` |
| `description` | string | No | Deskripsi lengkap | `Sepatu oxford dengan...` |
| `material` | string | No | Material utama | `Kulit Sintetis` |
| `outsole` | string | No | Material outsole | `Rubber` |
| `insole` | string | No | Material insole | `EVA Foam` |
| `closureType` | string | No | Tipe penutup | `Tali`, `Velcro`, `Slip-On` |
| `origin` | string | No | Negara asal | `Indonesia` |
| `notes` | string | No | Catatan tambahan | `Catatan internal` |
| `sizeTemplateId` | string | No | Size template ID | `template-id-123` |
| `isPopular` | string | No | Popular flag | `true` / `false` (default: `false`) |
| `isBestseller` | string | No | Bestseller flag | `true` / `false` (default: `false`) |
| `isNew` | string | No | New product flag | `true` / `false` (default: `true`) |
| `isActive` | string | No | Active status | `true` / `false` (default: `true`) |
| `variants` | string (JSON) | ✅ Yes | Variants array (JSON string) | See below |

### File Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | file | No | Product main images (multiple files) |
| `variant_images_0` | file | No | Image for variant index 0 |
| `variant_images_1` | file | No | Image for variant index 1 |
| `variant_images_N` | file | No | Image for variant index N |

---

## Variants JSON Structure

**Field:** `variants`  
**Type:** JSON string (array of objects)

```json
[
  {
    "colorName": "Hitam",
    "colorHex": "#000000",
    "imageFileIndex": 0,
    "sizes": [
      {
        "size": "39",
        "stock": 10,
        "price": 500000
      },
      {
        "size": "40",
        "stock": 15,
        "price": 500000
      }
    ]
  },
  {
    "colorName": "Putih",
    "colorHex": "#FFFFFF",
    "imageFileIndex": 1,
    "sizes": [
      {
        "size": "39",
        "stock": 8,
        "price": 520000
      }
    ]
  }
]
```

### Variant Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `colorName` | string | ✅ Yes | Nama warna | 
| `colorHex` | string | ✅ Yes | Kode hex warna (dengan #) |
| `imageFileIndex` | number | No | Index file image variant (0, 1, 2, ...) |
| `existingImage` | object | No | Existing image object (for update) |
| `sizes` | array | ✅ Yes | Array of size objects |

### Size Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `size` | string | ✅ Yes | Ukuran (39, 40, 41, dll) |
| `stock` | number | ✅ Yes | Jumlah stok |
| `price` | number | ✅ Yes | Harga (dalam Rupiah) |

---

## Complete Example (Postman)

### FormData Fields

```
productCode: PROD-001
name: Sepatu Oxford Pria
shortDescription: Sepatu formal untuk pria
productType: Sepatu
gender: Pria
categoryIds: cat-id-1,cat-id-2
description: Sepatu oxford dengan material kulit sintetis berkualitas tinggi
material: Kulit Sintetis
outsole: Rubber
insole: EVA Foam
closureType: Tali
origin: Indonesia
notes: Produk best seller
isPopular: true
isBestseller: true
isNew: false
isActive: true

variants: [
  {
    "colorName": "Hitam",
    "colorHex": "#000000",
    "imageFileIndex": 0,
    "sizes": [
      { "size": "39", "stock": 10, "price": 500000 },
      { "size": "40", "stock": 15, "price": 500000 },
      { "size": "41", "stock": 12, "price": 500000 }
    ]
  },
  {
    "colorName": "Coklat",
    "colorHex": "#8B4513",
    "imageFileIndex": 1,
    "sizes": [
      { "size": "39", "stock": 8, "price": 500000 },
      { "size": "40", "stock": 10, "price": 500000 }
    ]
  }
]

images: [file] product-main-1.jpg
images: [file] product-main-2.jpg
variant_images_0: [file] variant-hitam.jpg
variant_images_1: [file] variant-coklat.jpg
```

---

## Image Upload Flow

### 1. Product Main Images

**Field:** `images` (multiple files allowed)

```
images: [file] image1.jpg
images: [file] image2.jpg
images: [file] image3.jpg
```

**Uploaded to:** `products/{productId}/`

**Result:**
```json
{
  "images": [
    { "url": "https://..../image1.jpg", "key": "products/abc-123/image1.jpg" },
    { "url": "https://..../image2.jpg", "key": "products/abc-123/image2.jpg" }
  ]
}
```

### 2. Variant Images

**Fields:** `variant_images_{index}`

```
variant_images_0: [file] variant-black.jpg
variant_images_1: [file] variant-white.jpg
```

**Uploaded to:** `products/{productId}/variants/`

**Mapping:**
- `imageFileIndex: 0` → `variant_images_0`
- `imageFileIndex: 1` → `variant_images_1`
- `imageFileIndex: 2` → `variant_images_2`

**Result:**
```json
{
  "variants": [
    {
      "colorName": "Hitam",
      "images": [
        { "url": "https://..../variant-black.jpg", "key": "products/abc-123/variants/variant-black.jpg" }
      ]
    }
  ]
}
```

---

## Validation Rules

### Required Fields

1. **productCode** - Must be unique
2. **name** - Min 3 characters
3. **productType** - Must be valid type
4. **categoryIds** - At least 1 category
5. **variants** - At least 1 variant
6. **variants[].colorName** - Required
7. **variants[].colorHex** - Must be valid hex color
8. **variants[].sizes** - At least 1 size
9. **variants[].sizes[].size** - Required
10. **variants[].sizes[].stock** - Must be >= 0
11. **variants[].sizes[].price** - Must be > 0

### Optional Fields

- All other fields are optional
- Images are optional (can create product without images)
- Variant images are optional (can use product main images)

---

## Error Scenarios

### 1. Empty Required Fields (400)

**Request:**
```
productCode: 
name: 
productType: Sepatu
```

**Response:**
```json
{
  "success": false,
  "message": "Data produk tidak valid",
  "code": "VALIDATION_ERROR",
  "errors": {
    "productCode": ["Kode produk wajib diisi"],
    "name": ["Nama produk wajib diisi"]
  },
  "traceId": "req_abc123"
}
```

### 2. Duplicate Product Code (409)

**Request:**
```
productCode: EXISTING-CODE
name: Test Product
...
```

**Response:**
```json
{
  "success": false,
  "message": "Kode produk sudah digunakan",
  "code": "DUPLICATE_ENTRY",
  "field": "productCode",
  "traceId": "req_abc123"
}
```

### 3. No Variants (400)

**Request:**
```
productCode: PROD-001
name: Test Product
variants: []
```

**Response:**
```json
{
  "success": false,
  "message": "Minimal 1 varian warna wajib ditambahkan",
  "code": "VALIDATION_ERROR",
  "traceId": "req_abc123"
}
```

### 4. Invalid Variant Data (400)

**Request:**
```json
variants: [
  {
    "colorName": "Hitam",
    "colorHex": "invalid",
    "sizes": []
  }
]
```

**Response:**
```json
{
  "success": false,
  "message": "Data produk tidak valid",
  "code": "VALIDATION_ERROR",
  "errors": {
    "variants.0.colorHex": ["Format hex color tidak valid"],
    "variants.0.sizes": ["Minimal 1 ukuran wajib ditambahkan"]
  },
  "traceId": "req_abc123"
}
```

---

## Success Response (201)

```json
{
  "success": true,
  "message": "Produk berhasil dibuat",
  "data": {
    "id": "cm3abc123",
    "productCode": "PROD-001",
    "name": "Sepatu Oxford Pria",
    "slug": "sepatu-oxford-pria",
    "shortDescription": "Sepatu formal untuk pria",
    "productType": "Sepatu",
    "gender": "Pria",
    "description": "Sepatu oxford dengan...",
    "material": "Kulit Sintetis",
    "outsole": "Rubber",
    "insole": "EVA Foam",
    "closureType": "Tali",
    "origin": "Indonesia",
    "notes": "Produk best seller",
    "isPopular": true,
    "isBestseller": true,
    "isNew": false,
    "isActive": true,
    "images": [
      {
        "url": "https://storage.supabase.co/.../image1.jpg",
        "key": "products/cm3abc123/image1.jpg"
      }
    ],
    "variants": [
      {
        "id": "var-123",
        "colorName": "Hitam",
        "colorHex": "#000000",
        "images": [
          {
            "url": "https://storage.supabase.co/.../variant-black.jpg",
            "key": "products/cm3abc123/variants/variant-black.jpg"
          }
        ],
        "skus": [
          {
            "id": "sku-123",
            "size": "39",
            "stock": 10,
            "price": 500000
          },
          {
            "id": "sku-124",
            "size": "40",
            "stock": 15,
            "price": 500000
          }
        ]
      }
    ],
    "categories": [
      {
        "id": "cat-id-1",
        "name": "Sepatu Formal"
      }
    ],
    "createdAt": "2026-05-21T13:30:00Z",
    "updatedAt": "2026-05-21T13:30:00Z"
  }
}
```

---

## cURL Example

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "productCode=PROD-001" \
  -F "name=Sepatu Oxford Pria" \
  -F "shortDescription=Sepatu formal untuk pria" \
  -F "productType=Sepatu" \
  -F "gender=Pria" \
  -F "categoryIds=cat-id-1,cat-id-2" \
  -F "description=Sepatu oxford dengan material kulit sintetis" \
  -F "material=Kulit Sintetis" \
  -F "outsole=Rubber" \
  -F "insole=EVA Foam" \
  -F "closureType=Tali" \
  -F "origin=Indonesia" \
  -F "isPopular=true" \
  -F "isBestseller=true" \
  -F "isNew=false" \
  -F "isActive=true" \
  -F 'variants=[{"colorName":"Hitam","colorHex":"#000000","imageFileIndex":0,"sizes":[{"size":"39","stock":10,"price":500000}]}]' \
  -F "images=@/path/to/product-main.jpg" \
  -F "variant_images_0=@/path/to/variant-black.jpg"
```

---

## Tips

1. **Always include at least 1 variant** - Product without variants will be rejected
2. **Use imageFileIndex** - To map variant images to specific variants
3. **Multiple main images** - You can upload multiple product main images
4. **Image format** - Supported: JPG, PNG, WEBP
5. **Image size** - Max 5MB per file
6. **categoryIds format** - Comma-separated string, not array
7. **Boolean fields** - Use string "true" or "false", not boolean
8. **variants field** - Must be valid JSON string, not object

---

## Common Mistakes

### ❌ Wrong: variants as object
```
variants: {"colorName": "Hitam", ...}
```

### ✅ Correct: variants as JSON string array
```
variants: [{"colorName": "Hitam", ...}]
```

---

### ❌ Wrong: categoryIds as array
```
categoryIds: ["cat-1", "cat-2"]
```

### ✅ Correct: categoryIds as comma-separated string
```
categoryIds: cat-1,cat-2
```

---

### ❌ Wrong: Boolean as boolean
```
isPopular: true
```

### ✅ Correct: Boolean as string
```
isPopular: "true"
```

---

### ❌ Wrong: Missing imageFileIndex
```json
{
  "colorName": "Hitam",
  "sizes": [...]
}
```

### ✅ Correct: With imageFileIndex
```json
{
  "colorName": "Hitam",
  "imageFileIndex": 0,
  "sizes": [...]
}
```
