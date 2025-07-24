# MindMend API Backend

A TypeScript-based REST API for the MindMend habit tracking and AI coaching application.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm run type-check` - Check TypeScript types without building
- `npm run clean` - Clean build directory

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── controllers/        # Route controllers
├── services/           # Business logic services
├── middleware/         # Custom middleware
├── routes/             # API routes
├── models/             # Database models (Prisma)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── config/             # Configuration files
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

*More endpoints will be added in subsequent implementation steps.*

## Environment Variables

See `.env.example` for all required environment variables.

## Current Status

✅ **Step 1 Complete**: Basic project structure initialized
- Express.js server with TypeScript
- Basic middleware setup (CORS, Helmet, Morgan)
- Project folder structure
- Development scripts configured
- Health check endpoint

## Next Steps

- Step 2: Database setup with Prisma
- Step 3: Authentication middleware
- Step 4: User management system