# Directory Structure & Usage Guide

## Project Structure
```
mindmend/                          # ROOT DIRECTORY
├── app/                          # REACT NATIVE APP DIRECTORY
│   ├── src/
│   ├── convex/_generated/        # Generated API for app (outdated/unused)
│   ├── package.json             # React Native dependencies
│   ├── .env.local               # App environment variables
│   └── ...
├── convex/                      # CONVEX BACKEND DIRECTORY
│   ├── schema.ts
│   ├── chat.ts
│   ├── chatContext.ts
│   ├── habits.ts
│   ├── auth.config.ts
│   ├── _generated/              # Generated API for backend (ACTIVE)
│   └── ...
├── package.json                 # ROOT dependencies (includes Convex, OpenAI)
├── .env.local                   # ROOT environment variables
├── convex.json                  # Convex configuration
└── DIRECTORY_GUIDE.md          # This file
```

## When to Use Which Directory

### 🟢 ROOT Directory (`/Users/gabeliss/Desktop/mindmend/`)

**Use ROOT for:**
- ✅ All Convex operations: `npx convex dev`, `npx convex env set`
- ✅ Installing backend packages: `npm install openai`
- ✅ Backend environment variables: `.env.local` (CLERK_JWT_ISSUER_DOMAIN, OPENAI_API_KEY)
- ✅ Git operations: `git commit`, `git push`
- ✅ Project-wide configurations

**Commands that MUST run from ROOT:**
```bash
npx convex dev                    # Deploy backend functions
npx convex env set KEY value      # Set backend environment variables
npx convex env list              # List backend environment variables
npm install [backend-package]    # Install packages for Convex backend
```

### 🔵 APP Directory (`/Users/gabeliss/Desktop/mindmend/app/`)

**Use APP for:**
- ✅ React Native operations: `npm start`, `npx expo start`
- ✅ Installing React Native packages: `npm install react-native-*`
- ✅ App environment variables: `.env.local` (EXPO_PUBLIC_* variables)
- ✅ TypeScript compilation of app code

**Commands that MUST run from APP:**
```bash
npm start                        # Start React Native app
npx expo start                   # Start Expo development server
npm install [react-native-package] # Install React Native packages
npx tsc --noEmit app-file.ts     # TypeScript compilation (when in root)
```

## Key Environment Variables

### ROOT `.env.local` (Backend):
```bash
CONVEX_DEPLOYMENT=dev:cool-firefly-732
CLERK_JWT_ISSUER_DOMAIN=https://caring-pegasus-51.clerk.accounts.dev
OPENAI_API_KEY=sk-proj-...
```

### APP `.env.local` (Frontend):
```bash
CONVEX_DEPLOYMENT=dev:cool-firefly-732
EXPO_PUBLIC_CONVEX_URL=https://cool-firefly-732.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://caring-pegasus-51.clerk.accounts.dev
```

## Common Mistakes to Avoid

❌ **Running `npx convex dev` from APP directory** → Auth/deployment failures
❌ **Installing OpenAI in APP instead of ROOT** → Import failures in backend
❌ **Setting backend env vars in APP .env.local** → Backend can't access them
❌ **Using app/convex/_generated API** → This is outdated, use ROOT generated API

## API Import Paths

### ✅ Correct: Use temporary API from app services
```typescript
// In app/src/**/*.ts files:
import { api } from '../services/convex';  // Uses temporary API definitions
```

### ❌ Incorrect: Direct imports from generated API
```typescript
// DON'T DO THIS - causes module resolution issues:
import { api } from '../../../convex/_generated/api';
```

## Quick Reference Commands

### Backend Development (run from ROOT):
```bash
cd /Users/gabeliss/Desktop/mindmend
npx convex dev                    # Start backend
npx convex env set KEY value      # Set environment variable
npm install [backend-package]     # Install backend package
```

### Frontend Development (run from APP):
```bash
cd /Users/gabeliss/Desktop/mindmend/app
npm start                        # Start React Native
npm install [frontend-package]   # Install frontend package
```

## Troubleshooting

**"No auth provider found"** → Convex not running from ROOT directory
**"Module not found: openai"** → OpenAI not installed in ROOT directory  
**"Unable to read package.json"** → Wrong directory for the command
**"Functions ready" but no functions deployed** → Wrong directory, no modules found

---

💡 **Remember: Backend operations use ROOT, Frontend operations use APP**