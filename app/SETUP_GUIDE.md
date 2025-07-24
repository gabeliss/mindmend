# MindMend Setup Guide - What You Need to Do

This guide outlines **exactly** what you need to configure to make MindMend fully functional. Everything marked with ⚠️ **REQUIRED** must be done for the app to work properly.

## 🔧 **Backend Environment Variables**

### ⚠️ **REQUIRED: Database Configuration**

**File**: `/backend/.env`

```bash
# PostgreSQL Database URL - REPLACE WITH YOUR ACTUAL DATABASE
DATABASE_URL="postgresql://username:password@localhost:5432/mindmend_db"

# Example for local PostgreSQL:
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mindmend"

# Example for managed database (Railway, Supabase, etc.):
DATABASE_URL="postgresql://postgres:xxxxx@db.railway.app:5432/railway"
```

**What you need to do:**
1. **Set up PostgreSQL database** (locally or managed service)
2. **Replace the DATABASE_URL** with your actual connection string
3. **Run migrations**: `cd backend && npx prisma migrate deploy`

### ⚠️ **REQUIRED: OpenAI API Configuration**

```bash
# OpenAI API Key - GET FROM https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# OpenAI Model (can leave as default)
OPENAI_MODEL="gpt-3.5-turbo"

# OpenAI Base URL (leave as default unless using proxy)
OPENAI_BASE_URL="https://api.openai.com/v1"
```

**What you need to do:**
1. **Sign up for OpenAI**: Go to https://platform.openai.com/
2. **Create an API key**: Navigate to API Keys section
3. **Add billing method**: OpenAI requires a payment method for API usage
4. **Copy the API key** and replace `OPENAI_API_KEY` value
5. **Start with $5-10 credit** - that's plenty for testing

**⚠️ Without OpenAI API key:**
- AI insights will not work
- Weekly summaries will use fallback text only
- Daily tips will not generate

### 📦 **Optional: Production Configuration**

```bash
# Node Environment
NODE_ENV="production"  # Set to "production" when deploying

# Server Port
PORT=3000  # Can change if needed

# CORS Origins (for production)
CORS_ORIGINS="https://your-frontend-domain.com,https://your-app-domain.com"

# Rate Limiting (adjust as needed)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window

# Logging Level
LOG_LEVEL="info"  # Can be "debug", "info", "warn", "error"
```

## 📱 **Mobile App Configuration**

### ⚠️ **REQUIRED: API Base URL**

**File**: `/src/services/api.ts`

**Current placeholder:**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-backend-api.com/api'; // Production - UPDATE THIS
```

**What you need to do:**
1. **For local development**: Keep `localhost:3000` (or change port if different)
2. **For production**: Replace `your-backend-api.com` with your actual deployed backend URL

**Examples:**
```typescript
// Railway deployment
: 'https://mindmend-backend-production.up.railway.app/api'

// Render deployment  
: 'https://mindmend-backend.onrender.com/api'

// Custom domain
: 'https://api.mindmend.app/api'
```

### 🔥 **Optional but Recommended: Firebase Authentication**

**Current status**: Using mock authentication (works for testing)

**To implement real Firebase:**

1. **Create Firebase project**: https://console.firebase.google.com/
2. **Enable Authentication** with Email/Password
3. **Install Firebase SDK**:
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/auth
   ```
4. **Replace mock auth** in `/src/services/auth.ts` with real Firebase calls
5. **Add configuration** to `app.config.js`

**For now**: Mock auth works fine for testing and initial deployment

## 🚀 **Deployment Setup**

### ⚠️ **REQUIRED: Backend Deployment**

You need to deploy your backend to a cloud service. Here are the easiest options:

#### **Option 1: Railway (Recommended)**

1. **Sign up**: https://railway.app/
2. **Connect GitHub**: Link your repository
3. **Deploy backend**: 
   - Select your backend folder
   - Railway auto-detects Node.js
   - Add environment variables in Railway dashboard
4. **Add PostgreSQL**: Click "Add Service" → "PostgreSQL"
5. **Update DATABASE_URL** with Railway's provided URL

#### **Option 2: Render**

1. **Sign up**: https://render.com/
2. **Create Web Service**: Connect your repo
3. **Configure**:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. **Add PostgreSQL**: Create new PostgreSQL service
5. **Set environment variables** in Render dashboard

#### **Option 3: Heroku**

1. **Sign up**: https://heroku.com/
2. **Install Heroku CLI**
3. **Create app**: `heroku create mindmend-backend`
4. **Add PostgreSQL**: `heroku addons:create heroku-postgresql:mini`
5. **Deploy**: `git push heroku main`

### 📱 **Mobile App Deployment (Optional)**

#### **Option 1: Expo Development Build**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS/Android
eas build --platform all
```

#### **Option 2: App Stores (Later)**
- **iOS**: Need Apple Developer Account ($99/year)
- **Android**: Google Play Console ($25 one-time)

## 🧪 **Testing Your Setup**

### **1. Test Backend API**

```bash
# In backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Start server
npm run dev

# Test health endpoint
curl http://localhost:3000/health
```

### **2. Test API Integration**

```bash
# In mobile app directory
node test-integration.js
```

**Expected output:** Most tests should pass. AI tests may fail without OpenAI key.

### **3. Test Mobile App**

```bash
# Install dependencies
npm install

# Start Expo
npm start

# Test on device/simulator
# Press 'i' for iOS simulator or 'a' for Android
```

## ⚠️ **Critical Issues to Fix**

### **1. Missing OpenAI API Key**
**Symptoms**: AI insights don't generate, weekly summaries are basic
**Fix**: Add valid OpenAI API key to backend `.env`

### **2. Database Connection Errors**
**Symptoms**: "Failed to connect to database" on backend startup
**Fix**: Verify DATABASE_URL is correct and database is accessible

### **3. Mobile App Can't Connect to Backend**
**Symptoms**: "Network Error" or "Failed to fetch" in mobile app
**Fix**: Update API_BASE_URL in `/src/services/api.ts`

### **4. CORS Errors**
**Symptoms**: "CORS policy" errors in browser/mobile
**Fix**: Add your frontend domain to CORS_ORIGINS in backend

## 📋 **Quick Setup Checklist**

**Backend Setup:**
- [ ] PostgreSQL database created and accessible
- [ ] `DATABASE_URL` set in `/backend/.env`
- [ ] OpenAI API key added to `/backend/.env`
- [ ] Backend runs successfully (`npm run dev`)
- [ ] Health check returns success (`curl http://localhost:3000/health`)

**Mobile App Setup:**
- [ ] `API_BASE_URL` updated in `/src/services/api.ts`
- [ ] Dependencies installed (`npm install`)
- [ ] App starts successfully (`npm start`)
- [ ] Can create account and sign in
- [ ] Can view habits, streaks, and journal

**Deployment (Optional):**
- [ ] Backend deployed to cloud service
- [ ] Production `API_BASE_URL` updated
- [ ] Environment variables set in deployment platform
- [ ] Database accessible from deployed backend

## 🆘 **Need Help?**

### **Common Error Messages:**

**"ENOTFOUND localhost"** → Backend not running or wrong URL
**"Invalid API key"** → OpenAI API key missing or incorrect
**"Connection refused"** → Database not accessible
**"CORS error"** → Frontend domain not in CORS whitelist
**"Invalid token"** → Authentication issue, try signing out and back in

### **Debug Mode:**

Enable debug logging in `/src/services/api.ts`:
```typescript
const DEBUG_API = true; // Set to true for detailed logging
```

### **Quick Test Commands:**

```bash
# Test backend health
curl http://localhost:3000/health

# Test database connection
cd backend && npx prisma db pull

# Test OpenAI (replace with your key)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here"

# Test mobile integration
node test-integration.js
```

---

**🎯 Priority Order:**
1. **Set up database** (PostgreSQL)
2. **Add OpenAI API key** 
3. **Test backend locally**
4. **Update mobile API URL**
5. **Test end-to-end locally**
6. **Deploy backend**
7. **Update production API URL**

**Once these are done, your MindMend app will be fully functional! 🚀**