# Express Server & Middleware Setup

## Overview
Step 3 implements a robust middleware stack for the MindMend API with proper error handling, security, validation, and logging.

## Middleware Stack (in order)

### 1. Request ID Middleware
- Assigns unique request ID to each request
- Useful for tracing and debugging
- Sets `X-Request-ID` header in response

### 2. Security Headers
- Removes `X-Powered-By` header
- Adds security headers (XSS protection, content type options, frame options)
- Sets HSTS in production
- Configures permissions policy

### 3. Helmet.js Security
- Additional security middleware
- Protects against common vulnerabilities
- Configures CSP, HSTS, and other security policies

### 4. CORS Configuration
- Allows cross-origin requests for frontend
- Configures allowed origins, methods, and headers
- Supports credentials for authenticated requests

### 5. Rate Limiting
- In-memory rate limiting (Redis-based for production)
- Global: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- AI endpoints: 10 requests per hour

### 6. Body Parsing
- JSON parsing with 10MB limit
- URL-encoded form data support
- Type-safe content parsing

### 7. Request Logging
- Custom request/response logging
- Tracks response time, status codes, content length
- Structured JSON logging for production

### 8. Morgan HTTP Logging
- Standard HTTP request logging
- Development vs production formats
- Integrates with custom logger

## Error Handling System

### Global Error Handler
```typescript
// Handles all types of errors:
- AppError (custom application errors)
- Prisma database errors
- Validation errors
- JSON parsing errors
- Unexpected errors
```

### Error Types
- **400 Bad Request**: Validation failures, invalid data
- **401 Unauthorized**: Authentication required
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate data (e.g., email already exists)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected errors

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/habits",
  "method": "POST",
  "details": {},
  "stack": "..." // Only in development
}
```

## Validation System

### Built-in Validators
- `validateRequiredFields(fields)`: Check required fields
- `validateUUID(paramName)`: Validate UUID parameters
- `validateEmail(email)`: Email format validation
- `validateMoodRating(rating)`: 1-10 mood validation
- `validateHabitType(type)`: AVOID/BUILD validation
- `validateEventType(type)`: COMPLETED/SKIPPED/RELAPSED
- `validateCoachStyle(style)`: SUPPORTIVE/DIRECT/MOTIVATIONAL

### Usage Examples
```typescript
// Validate required fields in request body
router.post('/habits', 
  validateRequiredFields(['title', 'habitType']),
  createHabit
);

// Validate UUID parameters
router.get('/habits/:id', 
  validateUUID('id'),
  getHabit
);

// Custom validation
router.post('/journal',
  validateRequestBody({
    moodRating: validateMoodRating,
    content: (content) => content.length <= 5000
  }),
  createJournalEntry
);
```

## Rate Limiting Configuration

### Global Rate Limiting
```typescript
const globalLimiter = new InMemoryRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100             // 100 requests
);
```

### Endpoint-Specific Limiting
```typescript
// Auth endpoints - stricter limits
const authLimiter = new InMemoryRateLimiter(
  15 * 60 * 1000, // 15 minutes  
  5               // 5 requests
);

// AI endpoints - resource intensive
const aiLimiter = new InMemoryRateLimiter(
  60 * 60 * 1000, // 1 hour
  10              // 10 requests
);
```

## API Endpoints

### System Endpoints
- `GET /health` - Simple health check
- `GET /api/status` - Detailed system status
- `GET /api/version` - API version info
- `GET /` - Welcome message with endpoint list

### Status Response Example
```json
{
  "success": true,
  "data": {
    "service": "MindMend API",
    "version": "v1", 
    "environment": "development",
    "uptime": 3600,
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "memory": {
      "used": 45,
      "total": 128,
      "external": 12
    }
  }
}
```

## Logging System

### Custom Logger
```typescript
Logger.info('Request processed', {
  method: 'POST',
  url: '/api/habits',
  responseTime: '45ms',
  userId: 'user-123'
});

Logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  context: { userId, habitId }
});
```

### Log Levels
- `info`: General information (requests, responses)
- `warn`: Warning conditions (deprecated features)
- `error`: Error conditions (exceptions, failures)  
- `debug`: Debug information (development only)

### Structured Logging
All logs include:
- Timestamp (ISO 8601)
- Log level
- Message
- Metadata (request info, user context, etc.)

## Security Features

### Headers Added
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (production)
```

### Input Sanitization
- HTML tag removal from text inputs
- SQL injection prevention (via Prisma)
- XSS protection via headers and validation
- JSON parsing safety

## Request/Response Cycle

### 1. Incoming Request
```
Client → Rate Limit → CORS → Security → Body Parsing → Logging
```

### 2. Route Processing
```
Route Handler → Validation → Business Logic → Database
```

### 3. Response
```
Response → Error Handling → Logging → Client
```

### 4. Error Handling
```
Error → Error Handler → Logging → Structured Response → Client
```

## Testing the Setup

### Start Server
```bash
npm run dev
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Status check
curl http://localhost:3000/api/status

# Version info
curl http://localhost:3000/api/version

# Test rate limiting
for i in {1..5}; do curl http://localhost:3000/health; done
```

### Expected Responses
All responses follow the format:
```json
{
  "success": true,
  "data": {},
  "message": "optional message",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Production Considerations

### Rate Limiting
- Replace in-memory store with Redis
- Implement distributed rate limiting
- Add user-specific rate limits

### Logging
- Use structured logging service (e.g., DataDog, CloudWatch)
- Implement log aggregation
- Set up alerting for error patterns

### Security
- Implement proper CORS origins
- Add API key authentication
- Enable HTTPS only
- Implement request signing

### Monitoring
- Add APM tools (DataDog, New Relic)
- Monitor response times and error rates
- Set up health check endpoints for load balancers

## Next Steps

After middleware setup is complete:
- Step 4: Firebase Authentication Integration
- Step 5: User Management System
- Step 6: Habit CRUD Operations

The server now has a robust foundation ready for business logic implementation.