# WhatsApp Bot Web - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: One-Click Deploy (Easiest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/whatsapp-bot-web)

### Method 2: Manual Deploy

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy
```bash
# Install dependencies
npm install --legacy-peer-deps

# Build project
npm run build

# Deploy to Vercel
vercel --prod
```

## ⚙️ Environment Variables Setup

After deployment, add these environment variables in Vercel Dashboard:

1. Go to your Vercel project → Settings → Environment Variables
2. Add the following:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Production, Preview, Development |

## 📱 Important Notes for Vercel Deployment

### Database Considerations
- **SQLite on Vercel**: Data will be lost between deployments (serverless limitation)
- **For Production**: Use external database like PostgreSQL, MySQL, or Vercel Postgres
- **For Testing**: SQLite works fine for temporary testing

### Production Database Setup
```env
# Example for PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Vercel Postgres (Recommended)
1. In Vercel Dashboard → Storage → Create Postgres
2. Copy connection string to `DATABASE_URL`

## 🔍 Testing Your Deployment

### 1. Check Website
- Open your Vercel URL
- Verify all pages load correctly
- Test all tabs (Dashboard, Connect, Commands, Logs)

### 2. Test API Endpoints
```bash
# Test bot status
curl https://your-app.vercel.app/api/bot/status

# Test health check
curl https://your-app.vercel.app/api/health
```

### 3. Test Bot Connection
1. Enter your WhatsApp number in the Connect tab
2. Generate pairing code
3. Try to connect with WhatsApp

## 🛠️ Troubleshooting

### Common Issues

#### Build Error
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

#### Database Issues
- Verify `DATABASE_URL` is set correctly
- For production, use external database
- Check Vercel function logs

#### Pairing Code Issues
- Ensure phone number format is correct (no + sign)
- Check network connectivity
- Try generating new pairing code

### View Logs
```bash
# View deployment logs
vercel logs your-app-name

# Real-time logs
vercel logs your-app-name --follow
```

## 🌐 Custom Domain

### Setup Custom Domain
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Configure DNS (Vercel will provide instructions)

## 🔄 Updates

### Update Your App
```bash
# Pull latest changes
git pull origin main

# Redeploy
vercel --prod
```

### Rollback
```bash
# View deployments
vercel ls your-app-name

# Rollback to previous version
vercel rollback your-app-name
```

---

## 📋 Deployment Checklist

- [ ] Install Vercel CLI
- [ ] Login to Vercel account
- [ ] Set up environment variables
- [ ] Test build locally (`npm run build`)
- [ ] Deploy to Vercel
- [ ] Configure custom domain (optional)
- [ ] Test all functionality
- [ ] Set up monitoring (optional)

---

🎉 **Your WhatsApp Bot Web is now live on Vercel!**