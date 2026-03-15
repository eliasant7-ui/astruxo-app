# Quick Export Guide - LiveStream Platform

## 🚀 Fast Export (5 Minutes)

### Step 1: Download Source Code

**Option A: Git Clone (Recommended)**
```bash
git clone <your-repository-url>
cd livestream-platform
```

**Option B: Create Archive**
```bash
tar -czf livestream-export-$(date +%Y%m%d).tar.gz \
  src/ \
  public/ \
  drizzle/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  vite.config.ts \
  tailwind.config.js \
  drizzle.config.ts \
  bundle.js \
  index.html \
  *.md \
  DATABASE_SCHEMA.sql
```

### Step 2: Read Documentation

**Start Here:**
1. 📖 **EXPORT_SUMMARY.md** - Overview and quick start (5 min read)
2. 📖 **DEPLOYMENT_GUIDE.md** - Complete technical guide (30 min read)
3. 📖 **EXPORT_INSTRUCTIONS.md** - Migration steps (10 min read)

### Step 3: Setup New Server

**Minimum Requirements:**
- Node.js 22+
- MySQL 8.0+
- 4GB RAM
- 50GB Storage

**Quick Commands:**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
nano .env  # Fill in your API keys

# 3. Setup database
mysql -u root -p
CREATE DATABASE livestream_platform;
EXIT;

npm run db:generate
npm run db:migrate
npx tsx src/server/db/seed-gifts.ts

# 4. Build and start
npm run build
NODE_ENV=production node dist/server.bundle.cjs
```

---

## 📋 Essential Files Checklist

### ✅ Source Code
- [ ] `src/` directory (all application code)
- [ ] `public/` directory (static assets)
- [ ] `drizzle/` directory (database migrations)

### ✅ Configuration
- [ ] `package.json` (dependencies)
- [ ] `tsconfig.json` (TypeScript config)
- [ ] `vite.config.ts` (build config)
- [ ] `tailwind.config.js` (styling)
- [ ] `drizzle.config.ts` (database ORM)
- [ ] `bundle.js` (server bundler)
- [ ] `index.html` (entry point)
- [ ] `.env.example` (environment template)

### ✅ Documentation
- [ ] `DEPLOYMENT_GUIDE.md` (67 pages - complete guide)
- [ ] `EXPORT_INSTRUCTIONS.md` (migration guide)
- [ ] `EXPORT_SUMMARY.md` (overview)
- [ ] `DATABASE_SCHEMA.sql` (SQL schema)
- [ ] `README.md` (project overview)
- [ ] `QUICK_EXPORT.md` (this file)

---

## 🔑 API Keys You'll Need

### 1. Firebase (Authentication)
- **Where**: https://console.firebase.google.com/
- **What**: 6 frontend keys + 3 backend keys
- **Cost**: Free tier available

### 2. Agora (Video Streaming)
- **Where**: https://console.agora.io/
- **What**: App ID + App Certificate
- **Cost**: 10,000 free minutes/month

### 3. Stripe (Payments)
- **Where**: https://dashboard.stripe.com/
- **What**: Secret Key + Publishable Key
- **Cost**: Free (2.9% + $0.30 per transaction)

### 4. MySQL Database
- **Options**: 
  - Self-hosted (free)
  - PlanetScale (free tier)
  - Railway ($5/month)
  - DigitalOcean ($15/month)

---

## 💰 Hosting Cost Estimate

### Budget Option ($20-30/month)
- **VPS**: DigitalOcean Droplet ($20/month)
- **Domain**: Namecheap ($12/year)
- **SSL**: Let's Encrypt (free)
- **Firebase**: Free tier
- **Agora**: Free tier (10k min/month)
- **Stripe**: Pay per transaction

### Premium Option ($40-60/month)
- **VPS**: DigitalOcean 4GB ($40/month)
- **Managed MySQL**: DigitalOcean ($15/month)
- **Domain**: Premium domain ($20/year)
- **CDN**: Cloudflare (free)
- **Monitoring**: UptimeRobot (free)

---

## 🎯 Deployment Checklist

### Before Migration
- [ ] Export all source code
- [ ] Backup database (if migrating existing data)
- [ ] Backup user uploads (avatars)
- [ ] Document current API keys
- [ ] Test build locally

### Server Setup
- [ ] Install Node.js 22+
- [ ] Install MySQL 8.0+
- [ ] Configure firewall (ports 80, 443)
- [ ] Setup SSL certificate
- [ ] Install Nginx/Apache

### Application Setup
- [ ] Transfer files to server
- [ ] Run `npm install`
- [ ] Configure `.env` file
- [ ] Create database
- [ ] Run migrations
- [ ] Seed gift catalog
- [ ] Build application
- [ ] Start with PM2

### Post-Deployment
- [ ] Test all features
- [ ] Update DNS records
- [ ] Configure Stripe webhook
- [ ] Update Firebase authorized domains
- [ ] Setup automated backups
- [ ] Monitor logs for errors

---

## 🆘 Quick Troubleshooting

### Build Fails
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p
SHOW DATABASES;
```

### Port Already in Use
```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Socket.IO Not Connecting
- Check CORS configuration in `src/server/services/socket.ts`
- Verify WebSocket support in Nginx config
- Check firewall allows WebSocket connections

---

## 📞 Need Help?

### Documentation Order:
1. **EXPORT_SUMMARY.md** - Start here for overview
2. **DEPLOYMENT_GUIDE.md** - Complete technical details
3. **EXPORT_INSTRUCTIONS.md** - Step-by-step migration
4. **DATABASE_SCHEMA.sql** - Database reference

### Common Resources:
- [Node.js Docs](https://nodejs.org/docs/)
- [MySQL Docs](https://dev.mysql.com/doc/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)

---

## ✅ Success Criteria

Your export is complete when you have:
- ✅ All source code files
- ✅ All documentation files
- ✅ Configuration templates
- ✅ Database schema
- ✅ Migration instructions

Your deployment is successful when:
- ✅ Application starts without errors
- ✅ Users can register and login
- ✅ Streams can be started
- ✅ Video streaming works
- ✅ Chat messages send/receive
- ✅ Gifts can be sent
- ✅ Stripe payments work

---

## 🎉 You're Ready!

**Total Time to Deploy**: 2-4 hours (first time)

**What You Get**:
- Complete source code
- 100+ pages of documentation
- Production-ready platform
- All integrations configured
- Full ownership and control

**Next Steps**:
1. Export source code (5 min)
2. Read EXPORT_SUMMARY.md (5 min)
3. Setup server (1-2 hours)
4. Deploy application (30 min)
5. Test and launch! (30 min)

**Good luck with your deployment! 🚀**
