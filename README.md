# MindMend

A comprehensive mental health and habit tracking application with both mobile and web components.

## Structure

This is a monorepo containing:

- **app/**: React Native mobile application
- **website/**: Next.js web application

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

Install dependencies for all workspaces:

```bash
npm run install:all
```

### Development

#### Daily Development Workflow

Start the mobile app for local development:

```bash
npm run dev:app
```

This starts Expo development server with QR code - scan with Expo Go app on your phone for instant testing during development.

Start the web application:

```bash
npm run dev:web
```

#### Publishing Updates to Expo

When you want to push updates to users who have your app installed:

```bash
cd app
eas update --branch dev --message "your update message"
```

This publishes over-the-air updates that users will receive automatically.

### Building

Build the web application:

```bash
npm run build:web
```

## Individual Projects

Each subdirectory contains its own README with specific setup and development instructions:

- [Mobile App README](./app/README.md)
- [Web App README](./website/README.md)
