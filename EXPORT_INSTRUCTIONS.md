# How to Export Your LiveStream Platform Source Code

## Quick Export Methods

### Method 1: Download from Git (Recommended)

If you have git access to this project:

```bash
# Clone the repository
git clone <your-repository-url>
cd livestream-platform

# Create a clean export without git history
git archive --format=zip --output=livestream-platform-export.zip HEAD
```

### Method 2: Manual File Export

Download these directories and files:

#### Essential Directories
```
src/                    # All source code
├── components/         # UI components
├── layouts/           # Layout components
├── lib/               # Utilities and contexts
├── pages/             # All pages
├── server/            # Backend code
│   ├── api/          # API endpoints
│   ├── db/           # Database schema
│   ├── middleware/   # Middleware
│   └── services/     # External services
└── styles/           # CSS files

public/                # Static assets
├── assets/           # User uploads
│   └── avatars/     # Profile pictures
└── favicon.ico

drizzle/              # Database migrations
```

#### Essential Files
```
package.json          # Dependencies
package-lock.json     # Locked dependencies
tsconfig.json         # TypeScript config
vite.config.ts        # Vite configuration
tailwind.config.js    # Tailwind CSS config
postcss.config.js     # PostCSS config
drizzle.config.ts     # Database config
bundle.js             # Server bundler
index.html            # HTML entry point
.env.example          # Environment template
DEPLOYMENT_GUIDE.md   # This deployment guide
```

### Method 3: Create Archive via Terminal

```bash
# Create a complete archive
tar -czf livestream-platform-$(date +%Y%m%d).tar.gz \
  src/ \
  public/ \
  drizzle/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  vite.config.ts \
  tailwind.config.js \
  postcss.config.js \
  drizzle.config.ts \
  bundle.js \
  index.html \
  .env.example \
  DEPLOYMENT_GUIDE.md \
  EXPORT_INSTRUCTIONS.md
```

---

## What to Export

### ✅ Include These

**Source Code:**
- `src/` - All application code
- `public/` - Static assets (except user uploads if large)
- `drizzle/` - Database migrations

**Configuration:**
- `package.json` - Dependencies list
- `tsconfig.json` - TypeScript settings
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `drizzle.config.ts` - Database ORM config
- `bundle.js` - Server bundler script

**Documentation:**
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `README.md` - Project overview
- `.env.example` - Environment variables template

### ❌ Exclude These

**Build Artifacts:**
- `dist/` - Built files (regenerate on new server)
- `node_modules/` - Dependencies (reinstall with npm)

**Environment & Secrets:**
- `.env` - Contains your API keys (create new on target server)
- `.env.local` - Local environment overrides

**Development Files:**
- `.git/` - Git history (optional)
- `logs/` - Application logs
- `.DS_Store` - macOS system files

**User Data:**
- `public/assets/avatars/*` - User uploaded avatars (backup separately if needed)

---

## Complete File Checklist

### Core Application Files

```
✅ src/components/ui/              # shadcn UI components (40+ files)
✅ src/components/AuthDialog.tsx
✅ src/components/GiftAnimation.tsx
✅ src/components/GiftSelector.tsx
✅ src/components/ProtectedRoute.tsx
✅ src/components/Spinner.tsx

✅ src/layouts/parts/Header.tsx
✅ src/layouts/parts/Footer.tsx
✅ src/layouts/RootLayout.tsx
✅ src/layouts/Website.tsx

✅ src/lib/auth-context.tsx
✅ src/lib/firebase-client.ts
✅ src/lib/api-client.ts
✅ src/lib/utils.ts

✅ src/pages/index.tsx              # Home page
✅ src/pages/go-live.tsx            # Start streaming
✅ src/pages/broadcast/[streamId].tsx
✅ src/pages/broadcast/broadcaster-view.tsx
✅ src/pages/stream/[streamId].tsx
✅ src/pages/stream/viewer-view.tsx
✅ src/pages/user/[userId].tsx
✅ src/pages/profile-edit.tsx
✅ src/pages/account-settings.tsx
✅ src/pages/sync-user.tsx
✅ src/pages/buy-coins.tsx
✅ src/pages/earnings.tsx
✅ src/pages/help.tsx
✅ src/pages/_404.tsx

✅ src/server/api/auth/me/GET.ts
✅ src/server/api/auth/sync/POST.ts
✅ src/server/api/streams/start/POST.ts
✅ src/server/api/streams/live/GET.ts
✅ src/server/api/streams/[streamId]/GET.ts
✅ src/server/api/streams/[streamId]/PUT.ts
✅ src/server/api/streams/[streamId]/DELETE.ts
✅ src/server/api/users/[userId]/GET.ts
✅ src/server/api/users/[userId]/PUT.ts
✅ src/server/api/users/[userId]/DELETE.ts
✅ src/server/api/gifts/GET.ts
✅ src/server/api/gifts/send/POST.ts
✅ src/server/api/wallet/balance/GET.ts
✅ src/server/api/wallet/earnings/GET.ts
✅ src/server/api/stripe/create-checkout-session/POST.ts
✅ src/server/api/stripe/webhook/POST.ts
✅ src/server/api/upload/avatar/POST.ts

✅ src/server/db/client.ts
✅ src/server/db/config.ts
✅ src/server/db/schema.ts
✅ src/server/db/seed-gifts.ts

✅ src/server/services/firebase.ts
✅ src/server/services/agora.ts
✅ src/server/services/socket.ts

✅ src/server/configure.js

✅ src/styles/globals.css

✅ src/App.tsx
✅ src/main.tsx
✅ src/routes.tsx
```

### Configuration Files

```
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ tsconfig.node.json
✅ vite.config.ts
✅ vite-secrets-plugin.ts
✅ tailwind.config.js
✅ postcss.config.js
✅ drizzle.config.ts
✅ bundle.js
✅ components.json
✅ index.html
```

### Database Files

```
✅ drizzle/meta/_journal.json
✅ drizzle/meta/0000_snapshot.json
✅ drizzle/meta/0001_snapshot.json
✅ drizzle/meta/0002_snapshot.json
✅ drizzle/0000_boring_moira_mactaggert.sql
✅ drizzle/0001_lonely_silver_sable.sql
✅ drizzle/0002_cold_mantis.sql
```

### Documentation

```
✅ README.md
✅ DEPLOYMENT_GUIDE.md
✅ EXPORT_INSTRUCTIONS.md
✅ .env.example
```

---

## After Export: Setup on New Server

### 1. Transfer Files

```bash
# Upload to new server
scp livestream-platform-export.zip user@your-server.com:/var/www/

# Or use rsync for incremental sync
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  ./ user@your-server.com:/var/www/livestream-platform/
```

### 2. Install Dependencies

```bash
cd /var/www/livestream-platform
npm install
```

### 3. Configure Environment

```bash
# Copy example and edit
cp .env.example .env
nano .env

# Add all your API keys and credentials
```

### 4. Setup Database

```bash
# Create database
mysql -u root -p
CREATE DATABASE livestream_platform;
EXIT;

# Run migrations
npm run db:generate
npm run db:migrate

# Seed gifts
npx tsx src/server/db/seed-gifts.ts
```

### 5. Build & Deploy

```bash
# Build application
npm run build

# Start with PM2
pm2 start dist/server.bundle.cjs --name livestream-platform
pm2 save
```

---

## Backup User Data (Optional)

If you have user-generated content to migrate:

### Database Backup

```bash
# Export database
mysqldump -u root -p livestream_platform > database_backup.sql

# On new server, import
mysql -u root -p livestream_platform < database_backup.sql
```

### User Avatars

```bash
# Create archive of avatars
tar -czf avatars_backup.tar.gz public/assets/avatars/

# On new server, extract
tar -xzf avatars_backup.tar.gz -C /var/www/livestream-platform/public/assets/
```

---

## Verification Checklist

After deployment on new server, verify:

- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Firebase authentication works
- [ ] Users can register and login
- [ ] Streams can be started
- [ ] Video streaming works (Agora)
- [ ] Chat messages send/receive (Socket.IO)
- [ ] Gifts can be sent
- [ ] Stripe payments work
- [ ] Avatar uploads work
- [ ] All pages load correctly

---

## Migration Checklist

When moving to independent hosting:

### Before Migration
- [ ] Export all source code
- [ ] Backup database
- [ ] Backup user uploads (avatars)
- [ ] Document current environment variables
- [ ] Test build process locally

### During Migration
- [ ] Setup new server (VPS/Cloud)
- [ ] Install Node.js 22+
- [ ] Install MySQL 8.0+
- [ ] Configure firewall (ports 80, 443, 3306)
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Configure Nginx reverse proxy
- [ ] Transfer files
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Import database
- [ ] Build application
- [ ] Start with PM2

### After Migration
- [ ] Test all features
- [ ] Update DNS records
- [ ] Configure Stripe webhook URL
- [ ] Update Firebase authorized domains
- [ ] Monitor logs for errors
- [ ] Setup automated backups
- [ ] Configure monitoring (optional)

---

## Support

If you encounter issues during export or deployment:

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review error logs: `pm2 logs livestream-platform`
3. Verify environment variables are correct
4. Check database connection
5. Ensure all ports are open in firewall

---

## Quick Reference: Essential Commands

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed gift catalog
npx tsx src/server/db/seed-gifts.ts

# Build for production
npm run build

# Start production server
NODE_ENV=production node dist/server.bundle.cjs

# Or with PM2
pm2 start dist/server.bundle.cjs --name livestream-platform
pm2 logs livestream-platform
pm2 restart livestream-platform
pm2 stop livestream-platform
```

---

## File Size Estimates

- Source code: ~5-10 MB
- Dependencies (node_modules): ~500 MB (don't export)
- Build output (dist): ~2-5 MB (regenerate)
- Database: Varies by user data
- User avatars: Varies by uploads

**Recommended export size (without node_modules):** ~10-20 MB

---

## Next Steps

1. ✅ Review `DEPLOYMENT_GUIDE.md` for complete deployment instructions
2. ✅ Export source code using one of the methods above
3. ✅ Setup new server environment
4. ✅ Transfer files and configure
5. ✅ Test thoroughly before switching DNS

**Your platform is fully portable and ready for independent hosting! 🚀**
