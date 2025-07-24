# Firebase Authentication Integration

## Overview
Step 4 implements Firebase Authentication with the Admin SDK for server-side token verification, user management, and protected routes.

## Firebase Configuration

### Environment Variables Required
```bash
# Firebase Service Account
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

### Development Mode
In development, missing Firebase credentials will enable mock authentication:
- Use `Authorization: mock-token` header to authenticate as test user
- Automatically uses `test@mindmend.app` user from seed data

## Authentication Flow

### 1. Client-Side (React Native)
```javascript
// Firebase Auth setup in React Native
import auth from '@react-native-firebase/auth';

// User signs in
const userCredential = await auth().signInWithEmailAndPassword(email, password);
const idToken = await userCredential.user.getIdToken();

// Use token for API calls
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### 2. Server-Side Token Verification
```typescript
// Automatic user creation/retrieval
const decodedToken = await FirebaseConfig.verifyIdToken(idToken);

// Find or create user in database
let user = await prisma.user.findUnique({
  where: { firebaseUid: decodedToken.uid }
});

if (!user) {
  // Auto-register user
  user = await prisma.user.create({
    data: {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    }
  });
}
```

## Authentication Middleware

### `authenticateToken`
Verifies Firebase ID token and populates `req.user`:
```typescript
router.get('/protected-route', authenticateToken, (req, res) => {
  // req.user is available and populated
  console.log(req.user.id, req.user.email);
});
```

### `optionalAuth`
Attempts authentication but doesn't fail if no token:
```typescript
router.get('/public-route', optionalAuth, (req, res) => {
  // req.user may or may not be present
  if (req.user) {
    // Show personalized content
  } else {
    // Show public content
  }
});
```

### `requireVerifiedEmail`
Requires email verification:
```typescript
router.post('/sensitive-action', 
  authenticateToken, 
  requireVerifiedEmail, 
  handler
);
```

### `requireOwnership`
Ensures user can only access their own resources:
```typescript
router.get('/habits/:userId', 
  authenticateToken, 
  requireOwnership('userId'),
  getHabits
);
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### `POST /api/auth/verify`
Verify Firebase ID token without side effects:
```json
{
  "idToken": "firebase-id-token"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "User Name"
    },
    "firebase": {
      "uid": "firebase-uid",
      "emailVerified": true
    }
  }
}
```

#### `POST /api/auth/register`
Register new user or return existing:
```json
{
  "idToken": "firebase-id-token",
  "timezone": "America/New_York",
  "coachStyle": "SUPPORTIVE"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "coachStyle": "SUPPORTIVE"
    },
    "isNewUser": true
  }
}
```

#### `GET /api/auth/me` 🔒
Get current user profile with stats:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "User Name",
    "stats": {
      "activeHabits": 5,
      "totalJournalEntries": 23,
      "totalHabitEvents": 156
    }
  }
}
```

#### `POST /api/auth/refresh` 🔒
Refresh user data from Firebase:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "updated@example.com",
    "displayName": "Updated Name"
  }
}
```

#### `POST /api/auth/logout` 🔒
Revoke Firebase refresh tokens:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `DELETE /api/auth/account` 🔒
Delete user account (requires confirmation):
```json
{
  "confirmation": "DELETE"
}
```

### User Management Routes (`/api/users`)

#### `GET /api/users/profile` 🔒
Get user profile:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "User Name",
    "timezone": "America/New_York",
    "coachStyle": "SUPPORTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/users/profile` 🔒
Update user profile:
```json
{
  "displayName": "New Name",
  "timezone": "Europe/London",
  "coachStyle": "DIRECT"
}
```

#### `GET /api/users/stats` 🔒
Get user statistics:
```json
{
  "success": true,
  "data": {
    "habits": {
      "total": 8,
      "active": 6,
      "inactive": 2
    },
    "activity": {
      "totalEvents": 156,
      "completedEvents": 134,
      "completionRate": "86%",
      "journalEntries": 23
    },
    "trends": {
      "last30Days": 28,
      "avgMoodLast30Days": 7.2,
      "totalHabitsCompletedLast30Days": 89
    }
  }
}
```

#### `GET /api/users/preferences` 🔒
Get user preferences:
```json
{
  "success": true,
  "data": {
    "coaching": {
      "style": "SUPPORTIVE",
      "description": "Encouraging and empathetic coaching with emotional support"
    },
    "general": {
      "timezone": "America/New_York"
    },
    "notifications": {
      "dailyReminders": true,
      "weeklyReports": true,
      "achievementAlerts": true
    }
  }
}
```

#### `PUT /api/users/preferences` 🔒
Update user preferences:
```json
{
  "coachStyle": "MOTIVATIONAL",
  "timezone": "Pacific/Auckland"
}
```

## Security Features

### Token Validation
- Firebase ID tokens are cryptographically verified
- Token expiration is automatically checked
- Revoked tokens are rejected

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes
- User-specific rate limits for AI endpoints

### Input Validation
- Email format validation
- Coach style validation (SUPPORTIVE, DIRECT, MOTIVATIONAL)
- Timezone validation
- Display name sanitization

### Resource Ownership
- Users can only access their own data
- Automatic user ID validation
- Resource-level permissions

## Error Handling

### Authentication Errors
```json
{
  "success": false,
  "error": "Token expired",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Email not verified or insufficient permissions
- `404 Not Found`: User not found
- `409 Conflict`: Email already exists
- `429 Too Many Requests`: Rate limit exceeded

## Testing Authentication

### Development Testing
```bash
# Start server
npm run dev

# Test with mock token
curl -H "Authorization: mock-token" http://localhost:3000/api/auth/me

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"idToken": "mock-token"}'
```

### Production Testing
```bash
# Get Firebase ID token from client
const idToken = await user.getIdToken();

# Use in API calls
curl -H "Authorization: Bearer $ID_TOKEN" \
     http://localhost:3000/api/users/profile
```

## Auto-Registration Flow

When a user authenticates for the first time:

1. **Firebase token verified** ✓
2. **Check if user exists** in database
3. **If not exists**: Auto-create user with Firebase data
4. **If exists**: Update last active timestamp
5. **Attach user** to request object
6. **Continue** to protected route

This eliminates the need for separate registration endpoints and provides seamless user onboarding.

## Firebase Service Account Setup

1. **Go to Firebase Console** → Project Settings
2. **Service Accounts** tab
3. **Generate New Private Key**
4. **Copy credentials** to environment variables:
   ```bash
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com"
   ```

## Next Steps

After authentication is complete:
- Step 5: User Management System (completed as part of this step)
- Step 6: Habit CRUD Operations
- Step 7: Habit Events System
- Step 8: Streak Calculation Logic

The authentication system provides a secure foundation for all user-specific features in the MindMend API.