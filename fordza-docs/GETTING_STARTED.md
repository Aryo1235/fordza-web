# Getting Started - Fordza-Web

## 📋 Prerequisites

Pastikan sistem kamu sudah terinstall:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14.x
- **AWS Account** (untuk S3 storage)
- **Git**

---

## 🚀 Quick Start

### **1. Clone Repository**

```bash
git clone https://github.com/your-org/fordza-web.git
cd fordza-web
```

---

### **2. Install Dependencies**

```bash
npm install
```

Ini akan install semua dependencies dan otomatis run `prisma generate`.

---

### **3. Setup Environment Variables**

Buat file `.env` di root folder:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi kamu:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fordza_db"

# JWT Secrets (generate random string)
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# AWS S3
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="fordza-assets"

# App URL
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Generate JWT Secrets:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

### **4. Setup Database**

#### **A. Buat Database**

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE fordza_db;

# Keluar
\q
```

#### **B. Run Migrations**

```bash
npx prisma migrate dev
```

Ini akan:
- Buat semua tabel di database
- Generate Prisma Client

#### **C. Seed Data**

```bash
npm run seed
```

Ini akan create:
- **Admin default:**
  - Username: `admin`
  - Password: `fordza2026`
  - Role: ADMIN
  
- **Size templates** (EU, US, UK)

**Optional: Seed Sample Products**

```bash
npx tsx prisma/seed-products.ts
```

---

### **5. Setup AWS S3**

#### **A. Buat S3 Bucket**

1. Login ke AWS Console
2. Buka S3 service
3. Klik "Create bucket"
4. Bucket name: `fordza-assets` (atau sesuai `.env`)
5. Region: `ap-southeast-1` (atau sesuai `.env`)
6. **Uncheck** "Block all public access"
7. Create bucket

#### **B. Setup Bucket Policy**

Buka bucket → Permissions → Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::fordza-assets/*"
    }
  ]
}
```

#### **C. Setup CORS**

Buka bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### **D. Buat IAM User**

1. Buka IAM service
2. Users → Add user
3. User name: `fordza-s3-user`
4. Access type: Programmatic access
5. Attach policy: `AmazonS3FullAccess`
6. Copy **Access Key ID** dan **Secret Access Key**
7. Paste ke `.env`

---

### **6. Run Development Server**

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

---

## 🔐 Default Credentials

### **Admin Dashboard**
- URL: `http://localhost:3000/login`
- Username: `admin`
- Password: `fordza2026`

### **Kasir POS**
- URL: `http://localhost:3000/pos`
- Login dengan admin credentials dulu
- Atau buat user kasir baru di dashboard

---

## 📂 Project Structure

```
fordza-web/
├── app/                # Next.js App Router
├── backend/            # Business logic
├── features/           # Feature modules
├── lib/                # Utilities
├── components/         # UI components
├── prisma/             # Database schema
├── public/             # Static files
└── fordza-docs/        # Documentation
```

Lihat [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) untuk detail lengkap.

---

## 🧪 Testing API

### **1. Install Postman**

Download: https://www.postman.com/downloads/

### **2. Import Collection**

Buat collection baru dengan endpoints dari [API_REFERENCE.md](./API_REFERENCE.md)

### **3. Test Login**

```http
POST http://localhost:3000/api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "fordza2026"
}
```

Copy `accessToken` dari response.

### **4. Test Protected Endpoint**

```http
GET http://localhost:3000/api/admin/products
Authorization: Bearer <accessToken>
```

---

## 🛠️ Common Commands

### **Development**

```bash
# Run dev server
npm run dev

# Run dev server (with turbo)
npm run dev --turbo

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### **Database**

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npm run seed
```

### **Prisma Studio**

```bash
npx prisma studio
```

Buka browser: http://localhost:5555

---

## 🐛 Troubleshooting

### **Error: "Can't reach database server"**

**Solusi:**
1. Pastikan PostgreSQL running:
   ```bash
   # Linux/Mac
   sudo service postgresql status
   
   # Windows
   # Check Services app
   ```

2. Cek connection string di `.env`
3. Test connection:
   ```bash
   psql -U username -d fordza_db
   ```

---

### **Error: "Prisma Client not generated"**

**Solusi:**
```bash
npx prisma generate
```

---

### **Error: "AWS S3 Access Denied"**

**Solusi:**
1. Cek IAM user permissions
2. Cek bucket policy
3. Cek credentials di `.env`
4. Test dengan AWS CLI:
   ```bash
   aws s3 ls s3://fordza-assets --profile default
   ```

---

### **Error: "JWT Secret too short"**

**Solusi:**
Generate secret minimal 32 karakter:
```bash
openssl rand -base64 32
```

---

### **Port 3000 already in use**

**Solusi:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

Atau ubah port di `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

---

### **Migration Error: "Table already exists"**

**Solusi:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or drop database manually
psql -U postgres
DROP DATABASE fordza_db;
CREATE DATABASE fordza_db;
\q

# Then run migrations
npx prisma migrate dev
```

---

## 📚 Next Steps

1. **Explore Admin Dashboard:** http://localhost:3000/dashboard
2. **Buat Produk Pertama:** Dashboard → Products → New Product
3. **Test POS System:** http://localhost:3000/pos
4. **Baca Dokumentasi:**
   - [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Panduan admin
   - [KASIR_GUIDE.md](./KASIR_GUIDE.md) - Panduan kasir
   - [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
   - [FEATURES.md](./FEATURES.md) - Feature overview

---

## 🔧 Development Tips

### **Hot Reload**

Next.js otomatis reload saat file berubah. Jika tidak:
1. Restart dev server
2. Clear `.next` folder:
   ```bash
   rm -rf .next
   npm run dev
   ```

### **Database Changes**

Setiap ubah `schema.prisma`:
```bash
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

### **Clear Cache**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules (if needed)
rm -rf node_modules
npm install
```

---

## 🚀 Production Checklist

Sebelum deploy ke production:

- [ ] Update `.env` dengan production values
- [ ] Set strong JWT secrets
- [ ] Setup production database
- [ ] Setup production S3 bucket
- [ ] Update CORS origins
- [ ] Change default admin password
- [ ] Run `npm run build` untuk test
- [ ] Setup SSL/HTTPS
- [ ] Setup domain
- [ ] Enable rate limiting
- [ ] Setup monitoring (Sentry, LogRocket)

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.

---

## 📞 Support

- **Documentation:** [fordza-docs/](../fordza-docs/)
- **Issues:** GitHub Issues
- **Email:** support@fordza.com

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
