# Fordza-Web

> Sistem E-Commerce & Point of Sale (POS) terintegrasi untuk toko sepatu

[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2.0-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)](https://www.postgresql.org/)

---

## 📋 Overview

Fordza-Web adalah platform e-commerce dan POS modern yang dirancang khusus untuk toko sepatu. Sistem ini menggabungkan CMS admin yang powerful dengan sistem kasir real-time, dilengkapi fitur-fitur canggih seperti multi-variant products, hierarchical promo system, dan KNN-based product recommendations.

**Key Highlights:**
- 🛍️ **E-Commerce** - Katalog produk dengan varian kompleks (warna, ukuran, harga berbeda)
- 💳 **POS System** - Sistem kasir lengkap dengan shift management & invoice printing
- 📊 **Analytics** - Dashboard & laporan penjualan real-time
- 🎯 **Smart Promo** - Sistem promo bertingkat dengan conditional rules
- 🤖 **AI Recommendation** - KNN algorithm untuk product recommendation
- 📦 **Stock Management** - Two-level stock tracking dengan audit trail lengkap

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js >= 18.x
- PostgreSQL >= 14.x
- AWS S3 account

### **Installation**

```bash
# Clone repository
git clone https://github.com/your-org/fordza-web.git
cd fordza-web

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi kamu

# Setup database
npx prisma migrate dev
npm run seed

# Run development server
npm run dev
```

Server akan berjalan di **http://localhost:3000**

### **Default Credentials**

**Admin Dashboard:** http://localhost:3000/login
- Username: `admin`
- Password: `fordza2026`

**POS System:** http://localhost:3000/pos
- Login dengan credentials admin

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI + Shadcn/UI
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query

### **Backend**
- **Runtime:** Node.js
- **API:** Next.js API Routes (REST)
- **ORM:** Prisma 7
- **Database:** PostgreSQL
- **Auth:** JWT (Jose) + bcrypt
- **Storage:** AWS S3

### **DevOps**
- **Deployment:** Vercel (recommended) / VPS
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics / Sentry

---

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`fordza-docs/`](./fordza-docs/):

### **Getting Started**
- **[GETTING_STARTED.md](./fordza-docs/GETTING_STARTED.md)** - Setup & instalasi lengkap
- **[DEPLOYMENT.md](./fordza-docs/DEPLOYMENT.md)** - Panduan deployment production

### **Architecture & Development**
- **[ARCHITECTURE.md](./fordza-docs/ARCHITECTURE.md)** - Arsitektur sistem & design decisions
- **[FOLDER_STRUCTURE.md](./fordza-docs/FOLDER_STRUCTURE.md)** - Struktur folder & best practices
- **[DATABASE.md](./fordza-docs/DATABASE.md)** - Database schema & ERD
- **[API_REFERENCE.md](./fordza-docs/API_REFERENCE.md)** - API endpoints documentation
- **[UI_SYSTEM.md](./fordza-docs/UI_SYSTEM.md)** - Design system & komponen UI

### **User Guides**
- **[ADMIN_GUIDE.md](./fordza-docs/ADMIN_GUIDE.md)** - Panduan Admin Dashboard
- **[KASIR_GUIDE.md](./fordza-docs/KASIR_GUIDE.md)** - Panduan sistem POS

### **Features**
- **[FEATURES.md](./fordza-docs/FEATURES.md)** - Dokumentasi fitur-fitur utama

---

## ✨ Core Features

### **1. Multi-Variant Product Management**
- Support varian kompleks (warna, ukuran, material)
- SKU-level stock tracking
- Price override untuk bigsize
- Multiple images per product & variant

### **2. Advanced Stock Management**
- Two-level tracking (Product & SKU)
- Complete audit trail (StockLog & SkuStockLog)
- Bulk stock update
- Low stock alerts

### **3. Hierarchical Promo System**
- 4-level targeting: VARIANT → PRODUCT → CATEGORY → GLOBAL
- Percentage & nominal discounts
- Conditional promo (min purchase)
- Auto-apply di katalog & POS

### **4. Point of Sale (POS)**
- Shift management (open/close dengan rekap)
- Real-time product search
- Cart management
- Thermal invoice printing
- Void transaction dengan admin PIN

### **5. Sales Reporting**
- Dashboard analytics real-time
- Sales summary & items report
- Export to Excel
- Filter by date, kasir, product

### **6. KNN Product Recommendation**
- AI-based product similarity
- Feature vectors (gender, type, category, material, price)
- Euclidean distance calculation

### **7. Bulk Operations**
- CSV import products
- Bulk stock update
- Export products, transactions, logs

### **8. Image Management**
- AWS S3 integration
- Client-side compression
- Drag & drop upload
- Auto-delete on record removal

---

## 📊 Project Status

| Component | Status | Progress |
|-----------|--------|----------|
| **Backend API** | ✅ Complete | 100% |
| **Admin Dashboard** | ✅ Complete | 100% |
| **POS System** | ✅ Complete | 100% |
| **Public Pages** | 🚧 In Progress | 40% |
| **Documentation** | ✅ Complete | 100% |

### **Completed:**
- ✅ Authentication & Authorization (JWT)
- ✅ Product Management (CRUD, variants, SKU)
- ✅ Category, Banner, Testimonial Management
- ✅ User & Role Management
- ✅ Stock Management & Logs
- ✅ Transaction & Shift Management
- ✅ Promo System
- ✅ Sales Reporting
- ✅ POS Interface
- ✅ Admin Dashboard UI
- ✅ Product Detail Page (public)

### **In Progress:**
- 🚧 Homepage
- 🚧 Product Catalog Page
- 🚧 Category Page
- 🚧 About Page
- 🚧 Size Guide Page

---

## 🗂️ Project Structure

```
fordza-web/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages
│   ├── (admin)/           # Admin dashboard
│   ├── (kasir)/           # POS system
│   └── api/               # API routes
├── backend/               # Business logic
│   ├── repositories/      # Data access layer
│   └── services/          # Business logic layer
├── features/              # Feature modules
├── components/            # UI components
├── lib/                   # Utilities
├── prisma/                # Database schema
└── fordza-docs/           # Documentation
```

Lihat [FOLDER_STRUCTURE.md](./fordza-docs/FOLDER_STRUCTURE.md) untuk detail lengkap.

---

## 🔐 Security

- JWT-based authentication (separate Access + Refresh token secrets)
- Password hashing dengan bcrypt (configurable rounds)
- Role-based access control (ADMIN, KASIR)
- Admin PIN untuk void transaction
- HTTP-only cookies untuk token storage
- Input validation dengan Zod schemas
- SQL injection protection (Prisma ORM)
- Rate limiting (brute force protection)
- Request ID tracking & audit trail
- Centralized error handling
- Structured logging (Pino)
- Health monitoring endpoint

**See [SECURITY.md](./fordza-docs/SECURITY.md) for complete security documentation.**

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Push ke GitHub
git push origin main

# Deploy via Vercel dashboard
# Import repository → Auto-deploy
```

### **VPS**
```bash
# Build production
npm run build

# Start with PM2
pm2 start npm --name "fordza-web" -- start
```

Lihat [DEPLOYMENT.md](./fordza-docs/DEPLOYMENT.md) untuk panduan lengkap.

---

## 🧪 Testing

### **API Testing (Postman)**

1. Login untuk dapat access token:
```http
POST http://localhost:3000/api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "fordza2026"
}
```

2. Gunakan token di header:
```http
Authorization: Bearer <accessToken>
```

Lihat [API_REFERENCE.md](./fordza-docs/API_REFERENCE.md) untuk semua endpoints.

---

## 📈 Performance

- **Database:** Indexed queries, cached fields (price, stock, rating)
- **API:** Pagination, selective fields, batch operations
- **Frontend:** TanStack Query caching, lazy loading, optimistic updates
- **Images:** S3 CDN, client-side compression
- **OLAP:** Pre-agregasi data penjualan (SkuSalesSummary)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer:** Your Name
- **Designer:** Designer Name
- **Project Manager:** PM Name

---

## 📞 Support

- **Documentation:** [fordza-docs/](./fordza-docs/)
- **Issues:** [GitHub Issues](https://github.com/your-org/fordza-web/issues)
- **Email:** support@fordza.com

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
