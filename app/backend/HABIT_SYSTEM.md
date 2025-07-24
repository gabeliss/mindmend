# Habit CRUD System

## Overview
Step 6 implements comprehensive habit management with creation, reading, updating, deletion, and advanced features like bulk operations and statistics.

## Habit Model

### Habit Schema
```typescript
interface Habit {
  id: string;              // UUID
  userId: string;          // Owner reference
  title: string;           // Habit name (max 100 chars)
  description?: string;    // Optional description (max 500 chars)
  habitType: 'AVOID' | 'BUILD';  // Type of habit
  isActive: boolean;       // Soft delete flag
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Habit Types
- **BUILD**: Positive habits to develop (e.g., "Exercise daily", "Meditate")
- **AVOID**: Negative habits to eliminate (e.g., "No social media", "Quit smoking")

### Business Rules
- **Max 20 active habits** per user (prevents overwhelming users)
- **Unique titles** per user (case-insensitive)
- **Soft deletion** (habits marked inactive, not deleted)
- **Input sanitization** for all text fields

## API Endpoints

### 🔒 All endpoints require authentication

### `POST /api/habits`
Create a new habit:

**Request:**
```json
{
  "title": "Morning Exercise",
  "description": "30 minutes of cardio every morning",
  "habitType": "BUILD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Morning Exercise",
    "description": "30 minutes of cardio every morning",
    "habitType": "BUILD",
    "isActive": true,
    "createdAt": "2024-01-01T08:00:00Z",
    "updatedAt": "2024-01-01T08:00:00Z",
    "_count": {
      "habitEvents": 0
    }
  },
  "message": "Habit created successfully"
}
```

**Validation:**
- Title: Required, 1-100 characters
- Description: Optional, max 500 characters  
- HabitType: Required, must be "AVOID" or "BUILD"
- Duplicate title check (case-insensitive)
- 20 habit limit enforcement

### `GET /api/habits`
Get all user habits:

**Query Parameters:**
- `includeInactive` (boolean): Include inactive habits (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "habits": [
      {
        "id": "uuid",
        "title": "Morning Exercise", 
        "habitType": "BUILD",
        "isActive": true,
        "_count": {
          "habitEvents": 45
        }
      }
    ],
    "meta": {
      "total": 5,
      "active": 4,
      "inactive": 1
    }
  },
  "message": "Habits retrieved successfully"
}
```

### `GET /api/habits/summary`
Get habits dashboard summary:

**Response:**
```json
{
  "success": true,
  "data": {
    "totalActive": 5,
    "byType": {
      "avoid": 2,
      "build": 3
    },
    "recentlyCreated": 1,
    "habits": [
      {
        "id": "uuid",
        "title": "Morning Exercise",
        "habitType": "BUILD",
        "totalEvents": 45,
        "createdAt": "2024-01-01T08:00:00Z"
      }
    ]
  }
}
```

### `GET /api/habits/:habitId`
Get specific habit with recent events:

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Morning Exercise",
    "description": "30 minutes of cardio",
    "habitType": "BUILD",
    "isActive": true,
    "habitEvents": [
      {
        "eventType": "COMPLETED",
        "occurredAt": "2024-01-01T09:00:00Z",
        "notes": "Great workout today!"
      }
    ],
    "_count": {
      "habitEvents": 45
    }
  }
}
```

### `PUT /api/habits/:habitId`
Update a habit:

**Request:**
```json
{
  "title": "Updated Exercise Routine",
  "description": "45 minutes of mixed cardio and strength",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Exercise Routine",
    "description": "45 minutes of mixed cardio and strength",
    "isActive": true,
    "updatedAt": "2024-01-02T10:00:00Z"
  },
  "message": "Habit updated successfully"
}
```

**Validation:**
- All fields are optional
- Same validation rules as creation
- Duplicate title check (excluding current habit)

### `DELETE /api/habits/:habitId`
Soft delete a habit (mark as inactive):

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Morning Exercise",
    "isActive": false,
    "updatedAt": "2024-01-02T10:00:00Z"
  },
  "message": "Habit deleted successfully"
}
```

### `POST /api/habits/:habitId/reactivate`
Reactivate an inactive habit:

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Morning Exercise",
    "isActive": true,
    "_count": {
      "habitEvents": 45
    }
  },
  "message": "Habit reactivated successfully"
}
```

**Validation:**
- Habit must be inactive
- 20 active habit limit still applies

### `GET /api/habits/:habitId/stats`
Get detailed habit statistics:

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 50,
    "completedEvents": 42,
    "skippedEvents": 6, 
    "relapsedEvents": 2,
    "completionRate": "84%",
    "currentStreak": 7,
    "habit": {
      "id": "uuid",
      "title": "Morning Exercise",
      "habitType": "BUILD",
      "createdAt": "2024-01-01T08:00:00Z"
    }
  },
  "message": "Habit statistics retrieved successfully"
}
```

**Calculations:**
- **Completion Rate**: (completed / total) * 100
- **Current Streak**: Consecutive days from today backward
- **Event Breakdown**: Count by type (completed/skipped/relapsed)

### `PATCH /api/habits/bulk`
Bulk update habits (activate/deactivate multiple):

**Request:**
```json
{
  "habits": [
    { "id": "uuid-1", "isActive": false },
    { "id": "uuid-2", "isActive": true },
    { "id": "uuid-3", "isActive": false }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 3
  },
  "message": "Habits updated successfully"
}
```

**Validation:**
- Max 20 habits per request
- Each habit must have valid UUID and boolean isActive

## Service Layer Architecture

### HabitService Methods

#### `createHabit(userId, habitData)`
- Validates 20 habit limit
- Checks for duplicate titles (case-insensitive)
- Sanitizes input data
- Creates habit with proper defaults

#### `getUserHabits(userId, includeInactive)`
- Returns habits ordered by status (active first), then creation date
- Includes event counts for dashboard display
- Filters by active status unless explicitly requested

#### `getHabitById(habitId, userId)`
- Includes last 10 habit events
- Validates ownership
- Returns 404 if not found or not owned

#### `updateHabit(habitId, userId, updateData)`
- Validates ownership
- Checks for duplicate titles (excluding current)
- Only updates provided fields
- Sanitizes input data

#### `deleteHabit(habitId, userId)` 
- Soft delete (sets isActive = false)
- Preserves historical data
- Validates ownership

#### `reactivateHabit(habitId, userId)`
- Reactivates inactive habit
- Validates 20 habit limit
- Only works on inactive habits

#### `getHabitStats(habitId, userId)`
- Calculates comprehensive statistics
- Simple streak calculation (consecutive days from today)
- Event breakdown by type
- Completion rate calculation

#### `bulkUpdateHabits(userId, habitUpdates)`
- Mass activate/deactivate operation
- Validates all habits belong to user
- Transaction-safe updates

## Error Handling

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Title is required and must be a string",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Business Logic Errors (400/409)
```json
{
  "success": false,
  "error": "Maximum of 20 active habits allowed",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

```json
{
  "success": false,
  "error": "A habit with this title already exists",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Authorization Errors (404)
```json
{
  "success": false,
  "error": "Habit not found",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Input Validation & Sanitization

### Title Validation
- **Required**: Must be present and non-empty
- **Length**: 1-100 characters after trimming
- **Sanitization**: HTML tags removed, whitespace trimmed
- **Uniqueness**: Case-insensitive check per user

### Description Validation
- **Optional**: Can be null, empty string, or valid content
- **Length**: Max 500 characters after trimming
- **Sanitization**: HTML tags removed, whitespace trimmed

### Habit Type Validation
- **Required**: Must be exactly "AVOID" or "BUILD"
- **Case Sensitive**: Stored as uppercase enum values

## Security Features

### Ownership Validation
- All operations validate habit belongs to authenticated user
- Database queries include userId filter
- 404 returned for non-existent or unauthorized habits

### Input Sanitization
- HTML tag removal from all text inputs
- Whitespace trimming and normalization
- Length validation before database insertion

### Rate Limiting
- Standard API rate limits apply (100 requests/15min)
- No special limits for habit operations (they're typically infrequent)

## Performance Considerations

### Database Optimization
- Indexes on `userId` for fast user habit lookups
- Composite indexes on `(userId, isActive)` for filtered queries
- Soft deletes preserve data while maintaining performance

### Query Efficiency
- Only fetch required fields in list operations
- Include event counts via Prisma aggregation
- Limit recent events to 10 items to prevent large payloads

### Caching Strategy (Future)
- User habits lists are good candidates for short-term caching
- Habit statistics could be cached with invalidation on new events
- Summary data perfect for Redis caching

## Testing the Habit System

### Create a Habit
```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Meditation",
    "description": "10 minutes of mindfulness meditation",
    "habitType": "BUILD"
  }'
```

### Get All Habits
```bash
curl -H "Authorization: mock-token" \
     http://localhost:3000/api/habits
```

### Update a Habit
```bash
curl -X PUT http://localhost:3000/api/habits/{habitId} \
  -H "Authorization: mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Extended Meditation",
    "description": "15 minutes of mindfulness meditation"
  }'
```

### Get Habit Statistics
```bash
curl -H "Authorization: mock-token" \
     http://localhost:3000/api/habits/{habitId}/stats
```

## Integration with Frontend

### React Native Usage
```typescript
// Create habit
const createHabit = async (habitData) => {
  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(habitData)
  });
  return response.json();
};

// Get habits for dashboard
const getHabits = async () => {
  const response = await fetch('/api/habits/summary', {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return response.json();
};
```

## Next Steps

After habit CRUD is complete:
- Step 7: Habit Events System (track completions/skips/relapses)
- Step 8: Streak Calculation Logic (advanced streak tracking)
- Step 9: Basic Analytics System (habit performance metrics)

The habit system provides the foundation for all habit tracking features, with robust validation, ownership security, and performance optimization.