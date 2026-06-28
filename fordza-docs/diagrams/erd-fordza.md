# ERD — Fordza Web Database Schema

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#1e3a5f"
    primaryTextColor: "#ffffff"
    primaryBorderColor: "#2d5986"
    lineColor: "#4a90c4"
    secondaryColor: "#163351"
    tertiaryColor: "#0f2233"
    background: "#0f2233"
    mainBkg: "#1e3a5f"
    nodeBorder: "#4a90c4"
    clusterBkg: "#163351"
    titleColor: "#ffffff"
    edgeLabelBackground: "#1e3a5f"
    fontFamily: "Inter, sans-serif"
---
erDiagram

  %% ─── CORE PRODUCT ───────────────────────────────────────────────────────────

  PRODUCT ||--o{ PRODUCT_VARIANT        : "has variants"
  PRODUCT ||--o{ PRODUCT_IMAGE          : "has images"
  PRODUCT ||--o{ PRODUCT_CATEGORY       : "categorized in"
  PRODUCT ||--o{ TESTIMONIAL            : "receives"
  PRODUCT ||--o{ TRANSACTION_ITEM       : "sold as"
  PRODUCT ||--o{ STOCK_LOG              : "tracked in"
  PRODUCT ||--o{ SKU_SALES_SUMMARY      : "summarized in"
  PRODUCT ||--o| PRODUCT_DETAIL         : "has detail"

  PRODUCT_VARIANT ||--o{ PRODUCT_SKU         : "has sizes"
  PRODUCT_VARIANT ||--o{ PRODUCT_VARIANT_IMAGE: "has images"
  PRODUCT_VARIANT ||--o{ TRANSACTION_ITEM    : "sold as"

  PRODUCT_SKU ||--o{ TRANSACTION_ITEM   : "purchased as"
  PRODUCT_SKU ||--o{ SKU_STOCK_LOG      : "tracked in"
  PRODUCT_SKU ||--o{ SKU_SALES_SUMMARY  : "summarized in"

  PRODUCT_DETAIL }o--o| SIZE_TEMPLATE   : "uses template"

  %% ─── CATEGORY ───────────────────────────────────────────────────────────────

  CATEGORY ||--o{ PRODUCT_CATEGORY      : "applied to"

  %% ─── TRANSACTION / POS ──────────────────────────────────────────────────────

  ADMIN       ||--o{ TRANSACTION        : "processes"
  CASHIER_SHIFT ||--o{ TRANSACTION      : "contains"
  TRANSACTION ||--|{ TRANSACTION_ITEM   : "has items"

  %% ─── SHIFT ──────────────────────────────────────────────────────────────────

  ADMIN       ||--o{ CASHIER_SHIFT      : "opens"

  %% ─── PROMO ──────────────────────────────────────────────────────────────────

  ADMIN       ||--o{ PROMO              : "manages"

  %% ─── AUDIT & STOCK ──────────────────────────────────────────────────────────

  ADMIN       ||--o{ STOCK_LOG          : "performs"
  ADMIN       ||--o{ SKU_STOCK_LOG      : "performs"

  %% ─── ADMIN AUDIT TRAILS ──────────────────────────────────────────────────────

  ADMIN       ||--o{ PRODUCT            : "creates (audit)"
  ADMIN       ||--o{ CATEGORY           : "creates (audit)"
  ADMIN       ||--o{ BANNER             : "manages"

  %% ═══════════════════════════════════════════════════════════════════════════
  %% ENTITY DEFINITIONS
  %% ═══════════════════════════════════════════════════════════════════════════

  ADMIN {
    cuid    id          PK
    varchar username    UK  "NOT NULL"
    varchar password        "Bcrypt hash"
    varchar name
    enum    role            "ADMIN | KASIR"
    varchar pin             "Nullable — untuk otorisasi void/diskon"
    datetime created_at
    datetime updated_at
    datetime deleted_at     "Soft delete"
  }

  PRODUCT {
    cuid    id              PK
    varchar product_code    UK  "NOT NULL"
    varchar name
    varchar short_description
    decimal price               "Cached — harga terendah varian"
    int     stock               "Cached — total semua SKU"
    varchar product_type        "shoes | apparel | accessories"
    varchar gender              "Unisex | Pria | Wanita"
    bool    is_popular
    bool    is_bestseller
    bool    is_new
    bool    is_active
    float   avg_rating          "Cached dari testimonial"
    int     total_reviews       "Cached dari testimonial"
    cuid    created_by_id   FK
    cuid    updated_by_id   FK
    datetime created_at
    datetime updated_at
    datetime deleted_at         "Soft delete"
  }

  PRODUCT_DETAIL {
    cuid    id              PK
    cuid    product_id      FK  "UNIQUE — 1 to 1"
    text    description
    text    notes
    varchar material
    varchar outsole
    varchar insole
    varchar closure_type
    varchar origin
    cuid    size_template_id FK "Nullable"
    varchar custom_sizes        "String array"
    json    custom_measurements "Nullable"
  }

  PRODUCT_VARIANT {
    cuid    id              PK
    varchar variant_code    UK  "NOT NULL"
    varchar color
    decimal base_price          "Harga jual dasar"
    decimal comparison_price    "Harga gimmick / coret"
    float   discount_percent    "Nullable"
    bool    is_active
    cuid    product_id      FK
    datetime created_at
    datetime updated_at
    datetime deleted_at         "Soft delete"
  }

  PRODUCT_SKU {
    cuid    id              PK
    varchar size                "39-46 atau custom"
    int     stock               "Per ukuran"
    decimal price_override      "Nullable — override base_price"
    bool    is_active
    cuid    variant_id      FK
    datetime created_at
    datetime updated_at
    datetime deleted_at         "Soft delete"
  }

  PRODUCT_IMAGE {
    cuid    id          PK
    varchar url
    varchar image_key
    cuid    product_id  FK
  }

  PRODUCT_VARIANT_IMAGE {
    cuid    id          PK
    varchar url
    varchar image_key
    cuid    variant_id  FK
  }

  CATEGORY {
    cuid    id              PK
    varchar name
    varchar short_description
    varchar image_url
    varchar image_key       "Nullable"
    bool    is_active
    int     order           "Display order"
    cuid    created_by_id   FK
    cuid    updated_by_id   FK
    datetime created_at
    datetime updated_at
    datetime deleted_at     "Soft delete"
  }

  PRODUCT_CATEGORY {
    cuid    product_id  FK  PK
    cuid    category_id FK  PK
    datetime assigned_at
  }

  SIZE_TEMPLATE {
    cuid    id          PK
    varchar name
    varchar type            "sepatu | apparel | aksesoris"
    varchar sizes           "String array — e.g. [39,40,41]"
    json    measurements    "Nullable — dimensi per ukuran"
    datetime created_at
    datetime updated_at
  }

  TRANSACTION {
    cuid    id              PK
    varchar invoice_no      UK  "NOT NULL"
    decimal total_price
    decimal amount_paid
    decimal change
    enum    status              "PAID | VOID"
    varchar payment_method      "CASH | DEBIT | QRIS"
    text    notes               "Nullable"
    text    cancel_reason       "Nullable"
    cuid    shift_id        FK  "Nullable"
    cuid    kasir_id        FK  "NOT NULL"
    varchar customer_name       "Nullable — CRM lite"
    varchar customer_phone      "Nullable"
    datetime created_at
  }

  TRANSACTION_ITEM {
    cuid    id                  PK
    int     quantity
    decimal price_at_sale           "basePriceAtSale snapshot"
    varchar product_name            "Snapshot"
    varchar product_code            "Nullable snapshot"
    decimal discount_amount         "Nominal diskon per item"
    cuid    variant_id          FK  "Nullable snapshot"
    varchar variant_color           "Snapshot warna"
    cuid    sku_id              FK  "Nullable snapshot"
    varchar sku_size                "Snapshot ukuran"
    decimal comparison_price_at_sale "Nullable — harga gimmick"
    varchar promo_name               "Nullable — nama promo"
    cuid    transaction_id      FK
    cuid    product_id          FK  "Nullable"
  }

  CASHIER_SHIFT {
    cuid    id                  PK
    cuid    admin_id            FK  "NOT NULL"
    datetime start_time             "DEFAULT NOW()"
    datetime end_time               "Nullable — null jika masih buka"
    decimal starting_cash
    decimal expected_ending_cash    "Nullable — dihitung saat tutup"
    decimal actual_ending_cash      "Nullable — diinput kasir"
    enum    status                  "OPEN | CLOSED"
    text    notes                   "Nullable"
    datetime created_at
    datetime updated_at
  }

  PROMO {
    cuid    id          PK
    varchar name
    text    description "Nullable"
    enum    type            "PERCENTAGE | NOMINAL"
    decimal value
    enum    target_type     "GLOBAL | CATEGORY | PRODUCT | VARIANT"
    varchar target_ids      "String array — ID target"
    decimal min_purchase    "DEFAULT 0"
    bool    is_active
    datetime start_date
    datetime end_date
    cuid    created_by_id FK
    cuid    updated_by_id FK
    datetime created_at
    datetime updated_at
  }

  STOCK_LOG {
    cuid    id          PK
    cuid    product_id  FK
    int     delta           "Positif=masuk, Negatif=keluar"
    int     current_stock
    varchar type            "SALE | VOID | RESTOCK | ADJUSTMENT"
    text    notes       "Nullable"
    cuid    operator_id FK  "Nullable"
    datetime created_at
  }

  SKU_STOCK_LOG {
    cuid    id          PK
    cuid    sku_id      FK  "Nullable"
    int     delta           "Positif=masuk, Negatif=keluar"
    int     current_stock
    varchar size            "Snapshot ukuran"
    varchar color           "Snapshot warna"
    varchar type            "SALE | VOID | RESTOCK | ADJUSTMENT"
    text    notes       "Nullable"
    cuid    operator_id FK  "Nullable"
    datetime created_at
  }

  SKU_SALES_SUMMARY {
    cuid    id          PK
    datetime date           "Hari penjualan (00:00 WIB)"
    cuid    sku_id      FK  "Nullable"
    cuid    product_id  FK
    varchar product_name    "Snapshot"
    varchar product_code    "Snapshot"
    varchar variant_color   "Snapshot"
    varchar sku_size        "Snapshot"
    int     total_qty       "DEFAULT 0"
    decimal total_revenue   "DEFAULT 0"
    decimal total_discount  "DEFAULT 0"
    int     total_orders    "DEFAULT 0"
    datetime created_at
    datetime updated_at
  }

  TESTIMONIAL {
    cuid    id              PK
    cuid    product_id      FK
    varchar customer_name
    int     rating              "1–5"
    text    content
    bool    is_active
    datetime created_at
  }

  BANNER {
    cuid    id          PK
    varchar title       "Nullable"
    varchar image_url
    varchar image_key
    varchar link_url    "Nullable"
    bool    is_active
    cuid    created_by_id FK
    cuid    updated_by_id FK
    datetime created_at
    datetime updated_at
    datetime deleted_at "Soft delete"
  }
```
