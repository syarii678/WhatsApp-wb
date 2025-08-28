# 🚀 Panduan Deployment ke Vercel

## Persiapan

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```
Ikuti instruksi untuk login ke akun Vercel Anda.

### 3. Setup Environment Variables
Buat file `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="file:./dev.db"
```

## Cara Deploy

### Metode 1: Menggunakan Script (Rekomendasi)

```bash
# Jalankan deployment script
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### Metode 2: Manual Step by Step

#### Langkah 1: Build Project
```bash
npm install --legacy-peer-deps
npm run build
```

#### Langkah 2: Deploy ke Vercel
```bash
vercel --prod
```

#### Langkah 3: Konfigurasi Environment Variables di Vercel Dashboard
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Klik "Settings" → "Environment Variables"
4. Tambahkan environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `file:./dev.db`
   - **Environment**: Production, Preview, Development

### Metode 3: Deploy via GitHub (Terbaik untuk Production)

#### Langkah 1: Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit: WhatsApp Bot Web"
git branch -M main
git remote add origin https://github.com/username/whatsapp-bot-web.git
git push -u origin main
```

#### Langkah 2: Import ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik "New Project"
3. Pilih repository GitHub Anda
4. Konfigurasi project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install --legacy-peer-deps`

#### Langkah 3: Setup Environment Variables
Di Vercel project settings, tambahkan:
```
DATABASE_URL = file:./dev.db
```

#### Langkah 4: Deploy
Klik "Deploy" dan Vercel akan otomatis mendeploy project Anda.

## Konfigurasi Khusus Vercel

### File `vercel.json`
File ini sudah disediakan dengan konfigurasi:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "file:./dev.db"
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Penting: Database di Vercel
Karena Vercel adalah serverless platform, database SQLite tidak akan persist antar deployments. Untuk production, disarankan:

#### Opsi 1: Gunakan Database Eksternal (Rekomendasi)
Ubah `DATABASE_URL` di environment variables:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### Opsi 2: Gunakan Vercel Postgres
1. Di Vercel Dashboard, pilih "Storage"
2. Create "Postgres" database
3. Copy connection string ke `DATABASE_URL`

#### Opsi 3: Tetap Gunakan SQLite (Untuk Development)
Untuk development/testing, SQLite masih bisa digunakan tapi data akan reset setiap redeploy.

## Testing Setelah Deployment

### 1. Cek Website
Buka URL Vercel Anda dan pastikan:
- Halaman loading dengan benar
- Semua tab berfungsi (Dashboard, Connect, Commands, Logs)
- Tidak ada error di console browser

### 2. Test API Endpoints
```bash
# Test status endpoint
curl https://your-app.vercel.app/api/bot/status

# Test health endpoint
curl https://your-app.vercel.app/api/health
```

### 3. Test Bot Connection
1. Buka web interface
2. Masukkan nomor WhatsApp
3. Generate pairing code
4. Coba connect ke WhatsApp

## Troubleshooting

### Masalah Umum

#### 1. Build Error
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

#### 2. Database Connection Error
- Pastikan `DATABASE_URL` sudah benar di environment variables
- Untuk production, gunakan database eksternal

#### 3. Pairing Code Tidak Muncul
- Pastikan nomor WhatsApp valid (dengan kode negara, tanpa "+")
- Cek network connection
- Restart deployment

#### 4. Bot Tidak Bisa Connect
- Hapus session directory di local
- Redeploy aplikasi
- Generate pairing code baru

### Log Monitoring

#### 1. Vercel Logs
```bash
vercel logs your-app-name
```

#### 2. Real-time Logs
```bash
vercel logs your-app-name --follow
```

## Best Practices untuk Production

### 1. Environment Variables
```env
# Production
DATABASE_URL="postgresql://user:password@host:port/database"
BOT_PREFIX="!"
OWNER_NUMBER="6281234567890"
OWNER_NAME="Your Name"
SESSION_SECRET="your-super-secret-key"
```

### 2. Security
- Jangan commit sensitive data ke GitHub
- Gunakan environment variables untuk konfigurasi
- Enable auto-deploy protection di Vercel

### 3. Monitoring
- Setup Vercel Analytics
- Monitor error rates
- Set up alerts untuk downtime

### 4. Backup
- Regular backup database
- Keep source code di GitHub
- Document deployment process

## Custom Domain

### 1. Setup Custom Domain
1. Di Vercel Dashboard, pilih project
2. Klik "Settings" → "Domains"
3. Tambahkan custom domain Anda

### 2. SSL Certificate
Vercel otomatis menyediakan SSL certificate untuk custom domain.

## Update dan Maintenance

### 1. Update Code
```bash
# Pull latest changes
git pull origin main

# Redeploy
vercel --prod
```

### 2. Rollback
```bash
# Lihat deployment history
vercel ls your-app-name

# Rollback ke deployment sebelumnya
vercel rollback your-app-name
```

## Support

Jika mengalami masalah:
1. Cek Vercel logs: `vercel logs`
2. Cek browser console untuk errors
3. Review environment variables
4. Cek dokumentasi di README.md
5. Create issue di GitHub repository

---

🎉 **Selamat! WhatsApp Bot Web Anda sekarang siap digunakan di Vercel!**