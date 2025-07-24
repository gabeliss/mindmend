# Database Setup Guide

## Overview
This guide covers the Prisma database setup for the MindMend MVP backend.

## Database Schema

The MVP uses a simplified PostgreSQL schema with these core tables:

### Core Tables
- **users** - User profiles and preferences
- **habits** - User's habit definitions
- **habit_events** - Habit completion/skip/relapse events  
- **journal_entries** - User journal entries with mood tracking
- **ai_insights** - AI-generated insights and summaries
- **daily_stats** - Aggregated daily analytics

### Key Features
- UUID primary keys for all tables
- Proper foreign key relationships with cascade deletes
- Optimized indexes for common queries
- Enum types for consistent data values
- JSON fields for flexible AI data storage

## Setup Instructions

### 1. Prerequisites
You need a PostgreSQL database running. Options:

**Local PostgreSQL:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb mindmend_dev
```

**Docker PostgreSQL:**
```bash
docker run --name mindmend-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mindmend_dev \
  -p 5432:5432 -d postgres:15
```

**Cloud PostgreSQL:**
- Railway, Render, Supabase, or AWS RDS

### 2. Environment Configuration
Update `.env` with your database URL:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/mindmend_dev"
```

### 3. Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Optional: Seed with test data
npm run db:seed
```

### 4. Verify Setup
```bash
# Test the health endpoint
npm run dev
curl http://localhost:3000/health

# Expected response:
{
  "status": "OK",
  "message": "MindMend API is running",
  "database": {
    "status": "healthy",
    "message": "Database is healthy",
    "responseTime": 15
  }
}
```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations in development
- `npm run db:migrate:prod` - Deploy migrations in production
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:seed` - Run seed script
- `npm run db:reset` - Reset database and run migrations

## Database Schema Highlights

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  firebase_uid VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  display_name VARCHAR,
  timezone VARCHAR DEFAULT 'UTC',
  coach_style coach_style_enum DEFAULT 'supportive'
);
```

### Habits & Events
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  habit_type habit_type_enum NOT NULL -- 'avoid' or 'build'
);

CREATE TABLE habit_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  habit_id UUID REFERENCES habits(id),
  event_type event_type_enum NOT NULL, -- 'completed', 'skipped', 'relapsed'
  occurred_at TIMESTAMP NOT NULL
);
```

### AI Integration
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  insight_type insight_type_enum, -- 'weekly_summary', 'daily_tip', etc.
  title VARCHAR,
  content TEXT,
  data_used JSONB -- Flexible storage for AI prompt context
);
```

## Next Steps

After database setup is complete, you can proceed to:
- Step 3: Basic Express Server & Middleware
- Step 4: Firebase Authentication Integration
- Step 5: User Management System

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL is correct
- Check if PostgreSQL service is running
- Ensure database exists and user has permissions

### Migration Issues  
- Run `npm run db:reset` to start fresh
- Check Prisma schema syntax
- Verify environment variables are loaded

### Performance
- Monitor query performance in development logs
- Consider connection pooling for production
- Review indexes for slow queries