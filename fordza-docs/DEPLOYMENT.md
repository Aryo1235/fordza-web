# Deployment Guide - Fordza-Web

## 📋 Overview

Panduan deployment Fordza-Web ke production environment.

**Recommended Platform:** Vercel (Next.js native)  
**Alternative:** VPS (Ubuntu/Debian)

---

## 🚀 Deployment ke Vercel

### **Prerequisites**

- Akun Vercel (https://vercel.com)
- GitHub/GitLab repository
- PostgreSQL database (Supabase/Neon/Railway)
- AWS S3 bucket

---

### **Step 1: Setup Database Production**

#### **Option A: Supabase (Recommended)**

1. Buat akun di https://supabase.com
2. Create new project
3. Copy **Connection String** (Pooling mode)
4. Format: `postgresql://user:pass@host:port/db?pgbouncer=true`

#### **Option B: Neon**

1. Buat akun di https://neon.tech
2. Create new project
3. Copy **Connection String**

#### **Option C: Railway**

1. Buat akun di https://railway.app
2. New Project → PostgreSQL
3. Copy **Connection String**

---

### **Step 2: Setup Environment Variables**

Di Vercel dashboard:

1. Project Settings → Environment Variables
2. Tambahkan semua env vars:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT Secrets (GENERATE BARU, JANGAN PAKAI DEV!)
JWT_ACCESS_SECRET="production-access-secret-min-32-chars"
JWT_REFRESH_SECRET="production-refresh-secret-min-32-chars"

# AWS S3
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="your-production-key"
AWS_SECRET_ACCESS_KEY="your-production-secret"
AWS_S3_BUCKET_NAME="fordza-production"

# App URL
NEXT_PUBLIC_API_URL="https://your-domain.vercel.app"
```

**Generate Production Secrets:**
```bash
openssl rand -base64 32
```

---

### **Step 3: Deploy via GitHub**

1. Push code ke GitHub
2. Login ke Vercel
3. Import Project → Select repository
4. Framework Preset: **Next.js** (auto-detect)
5. Root Directory: `./`
6. Build Command: `npm run build` (default)
7. Output Directory: `.next` (default)
8. Install Command: `npm install` (default)
9. Click **Deploy**

**Vercel akan otomatis:**
- Install dependencies
- Run `prisma generate`
- Build Next.js
- Deploy ke CDN

---

### **Step 4: Run Database Migrations**

Setelah deploy pertama kali:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Link project:
```bash
vercel link
```

4. Run migrations:
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

5. Seed data (admin + size templates):
```bash
npm run seed
```

---

### **Step 5: Setup Custom Domain (Optional)**

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `fordza.com`
3. Update DNS records di domain provider:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel IP)
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

4. Wait for DNS propagation (5-30 menit)
5. Vercel auto-provision SSL certificate

---

### **Step 6: Verify Deployment**

1. Buka `https://your-domain.vercel.app`
2. Test login admin
3. Test create produk
4. Test upload gambar (S3)
5. Test POS system
6. Test API endpoints

---

## 🖥️ Deployment ke VPS

### **Prerequisites**

- VPS (Ubuntu 22.04 LTS)
- Domain dengan DNS pointing ke VPS
- SSH access

---

### **Step 1: Setup VPS**

#### **1. Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

#### **2. Install Node.js 18+**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verify
```

#### **3. Install PostgreSQL**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **4. Create Database**
```bash
sudo -u postgres psql
CREATE DATABASE fordza_production;
CREATE USER fordza WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE fordza_production TO fordza;
\q
```

#### **5. Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **6. Install PM2**
```bash
sudo npm install -g pm2
```

---

### **Step 2: Deploy Application**

#### **1. Clone Repository**
```bash
cd /var/www
sudo git clone https://github.com/your-org/fordza-web.git
cd fordza-web
```

#### **2. Install Dependencies**
```bash
npm install
```

#### **3. Setup Environment**
```bash
sudo nano .env
```

Paste production env vars (sama seperti Vercel).

#### **4. Run Migrations**
```bash
npx prisma migrate deploy
npm run seed
```

#### **5. Build Application**
```bash
npm run build
```

#### **6. Start with PM2**
```bash
pm2 start npm --name "fordza-web" -- start
pm2 save
pm2 startup
```

---

### **Step 3: Setup Nginx Reverse Proxy**

#### **1. Create Nginx Config**
```bash
sudo nano /etc/nginx/sites-available/fordza
```

Paste config:
```nginx
server {
    listen 80;
    server_name fordza.com www.fordza.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **2. Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/fordza /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### **Step 4: Setup SSL (Let's Encrypt)**

#### **1. Install Certbot**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### **2. Get Certificate**
```bash
sudo certbot --nginx -d fordza.com -d www.fordza.com
```

Follow prompts, pilih redirect HTTP → HTTPS.

#### **3. Auto-Renewal**
```bash
sudo certbot renew --dry-run
```

Certbot auto-setup cron job untuk renewal.

---

### **Step 5: Setup Firewall**

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🔧 Post-Deployment Tasks

### **1. Change Default Admin Password**

```bash
# Login ke admin dashboard
# Settings → Change Password
```

### **2. Setup Monitoring**

#### **Option A: Vercel Analytics (Vercel only)**
- Auto-enabled di Vercel
- Dashboard → Analytics

#### **Option B: Sentry (Error Tracking)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### **Option C: LogRocket (Session Replay)**
```bash
npm install logrocket
```

### **3. Setup Backup**

#### **Database Backup (Cron Job)**
```bash
sudo crontab -e
```

Add:
```cron
0 2 * * * pg_dump -U fordza fordza_production > /backup/fordza_$(date +\%Y\%m\%d).sql
```

#### **S3 Backup**
- S3 sudah redundant (99.999999999% durability)
- Enable versioning di S3 bucket

---

## 📊 Performance Optimization

### **1. Enable Caching**

#### **Vercel (Auto)**
- Static pages: Cached di CDN
- API routes: Cache-Control headers

#### **VPS (Nginx)**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **2. Image Optimization**

- Next.js Image component (auto-optimize)
- S3 CloudFront CDN (optional)

### **3. Database Optimization**

- Connection pooling (PgBouncer)
- Indexes (sudah ada di schema)
- Query optimization

---

## 🚨 Troubleshooting

### **Build Failed**

**Error:** `Prisma Client not generated`

**Solution:**
```bash
npx prisma generate
npm run build
```

---

### **Database Connection Failed**

**Error:** `Can't reach database server`

**Solution:**
1. Cek DATABASE_URL format
2. Cek database running
3. Cek firewall rules
4. Test connection:
```bash
psql "postgresql://..."
```

---

### **S3 Upload Failed**

**Error:** `Access Denied`

**Solution:**
1. Cek IAM permissions
2. Cek bucket policy
3. Cek CORS config
4. Cek credentials di env vars

---

### **502 Bad Gateway (VPS)**

**Solution:**
1. Cek Next.js running:
```bash
pm2 status
pm2 logs fordza-web
```

2. Restart:
```bash
pm2 restart fordza-web
```

---

### **SSL Certificate Error**

**Solution:**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secrets (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall (UFW/Security Groups)
- [ ] Restrict database access (whitelist IPs)
- [ ] Enable S3 bucket encryption
- [ ] Setup rate limiting (Vercel auto, VPS manual)
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor error logs (Sentry)
- [ ] Use environment variables (never commit secrets)

---

## 📈 Scaling

### **Horizontal Scaling (Vercel)**
- Auto-scale berdasarkan traffic
- Serverless functions
- Global CDN

### **Vertical Scaling (VPS)**
- Upgrade VPS specs (CPU, RAM)
- Database read replicas
- Redis caching
- Load balancer (multiple VPS)

---

## 🔄 CI/CD Pipeline

### **Vercel (Auto)**
- Push ke `main` branch → Auto deploy
- Pull request → Preview deployment
- Rollback dengan 1 klik

### **VPS (Manual)**

#### **Setup GitHub Actions**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/fordza-web
            git pull origin main
            npm install
            npx prisma migrate deploy
            npm run build
            pm2 restart fordza-web
```

---

## 📚 Related Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Development setup
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API documentation

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
