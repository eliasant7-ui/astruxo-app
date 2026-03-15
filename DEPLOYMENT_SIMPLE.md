# 🚀 astruXo Deployment Guide - Railway + Vercel

## Architecture

```
Frontend (Vercel) → Backend API (Railway) → Database (Railway MySQL)
```

---

## 📍 **STEP 1: Deploy Backend to Railway**

### 1.1 Go to Railway
- Open [railway.app](https://railway.app)
- Sign in with GitHub

### 1.2 Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose `astruxo-app` repository

### 1.3 Add MySQL Database FIRST
- In Railway project, click **"New"**
- Select **"Database"** → **"Add MySQL"**
- Wait 2-3 minutes for provisioning
- Railway will auto-generate these variables:
  - `DATABASE_URL`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

### 1.4 Add Remaining Environment Variables

In Railway dashboard → Variables tab, add:

**Firebase Frontend:**
```
VITE_FIREBASE_API_KEY=AIzaSyCSXk-EmcewLnRB58c8CVBALBr3IqTlass
VITE_FIREBASE_AUTH_DOMAIN=livestreamapp-bc3ac.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=livestreamapp-bc3ac
VITE_FIREBASE_STORAGE_BUCKET=livestreamapp-bc3ac.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=771804379807
VITE_FIREBASE_APP_ID=1:771804379807:web:4ac2b3eac6d798376b40aa
```

**Firebase Backend:**
```
FIREBASE_PROJECT_ID=livestreamapp-bc3ac
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@livestreamapp-bc3ac.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Stripe:**
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Server:**
```
NODE_ENV=production
HOST=0.0.0.0
PORT=5173
```

### 1.5 Deploy
- Railway will auto-deploy
- Start Command: `npm run railway`
- Wait for build (~5 minutes)
- Copy your Railway URL

---

## 📍 **STEP 2: Deploy Frontend to Vercel**

### 2.1 Go to Vercel
- Open [vercel.com](https://vercel.com)
- Sign in with GitHub

### 2.2 Import Project
- Click **"Add New Project"**
- Select `astruxo-app` repository

### 2.3 Configure Build Settings

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist/client`

### 2.4 Add Environment Variables

**Backend API:**
```
VITE_API_URL=https://your-railway-url.up.railway.app
```

**Firebase:**
```
VITE_FIREBASE_API_KEY=AIzaSyCSXk-EmcewLnRB58c8CVBALBr3IqTlass
VITE_FIREBASE_AUTH_DOMAIN=livestreamapp-bc3ac.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=livestreamapp-bc3ac
VITE_FIREBASE_STORAGE_BUCKET=livestreamapp-bc3ac.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=771804379807
VITE_FIREBASE_APP_ID=1:771804379807:web:4ac2b3eac6d798376b40aa
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 2.5 Deploy
- Click **"Deploy"**
- Wait ~3 minutes
- Your URL: `astruxo-app.vercel.app`

---

## ✅ **Testing Checklist**

Test on production:
- [ ] Login/Register works
- [ ] Report post shows confirmation
- [ ] Comment replies work
- [ ] PDF upload validation works
- [ ] Live streaming works
- [ ] Chat messages in real-time

---

## 🎉 **Done!**

Your app is live with all fixes deployed!
