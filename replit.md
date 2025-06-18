# Overview

This is a React-based food inventory management application with a mobile-first design. The app helps users track food items, manage shopping lists, scan receipts, and get recipe suggestions. It features a modern tech stack with React frontend, Express backend, PostgreSQL database with Drizzle ORM, and integrates with Google's Gemini AI for receipt analysis.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with consistent error handling
- **File Upload**: Multer for handling receipt image uploads
- **Development**: Hot reload with Vite integration

## Data Storage Solutions
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL-based session storage for future auth implementation

# Key Components

## Database Schema
- **Users**: Basic user profile storage (currently disabled for guest mode)
- **Categories**: Food storage categories (refrigerator, freezer, vegetables, etc.)
- **Food Items**: Individual food items with expiry tracking and nutritional data
- **Shopping Items**: Shopping list management
- **Receipts**: Receipt storage and analysis results
- **Sessions**: Session management table for authentication

## Community & Engagement Features
- **Community Page**: User discussion forum with posts, tips, recipes, and Q&A
- **Achievement System**: Gamification with points, levels, and unlockable badges
- **Feedback System**: User-driven feature requests and improvement suggestions
- **Interactive ChatBot**: AI assistant for food management guidance and motivation
- **Social Integration**: LINEグループ participation and app sharing capabilities

## Authentication System
- **Current State**: Completely disabled for guest-only access
- **Future Implementation**: Ready for Replit Auth integration
- **Security**: All authentication middleware bypassed in development mode

## AI Integration
- **Service**: Google Gemini 1.5 Flash model
- **Purpose**: Receipt image analysis and food item extraction
- **Processing**: OCR-like functionality to identify food items from receipt photos
- **Output**: Structured data with item names, categories, quantities, and units

## Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices with max-width constraints
- **Navigation**: Bottom navigation bar for easy thumb access
- **Touch-Friendly**: Large touch targets and mobile-optimized interactions
- **Progressive Enhancement**: Works on desktop with mobile-first approach

# Data Flow

## Food Item Management
1. User scans receipt or manually adds items
2. Gemini AI extracts items from receipt images
3. Items are categorized and stored in PostgreSQL
4. Real-time updates via TanStack Query
5. Expiry notifications based on date tracking

## Receipt Processing
1. User uploads receipt image through mobile camera or file picker
2. Image sent to Gemini API for analysis
3. AI extracts food items with categories and quantities
4. User reviews and edits extracted items
5. Approved items added to inventory database

## Shopping List Workflow
1. Users create shopping items manually
2. Items can be marked as purchased
3. Integration with inventory for automatic addition
4. Persistent storage in PostgreSQL

# External Dependencies

## AI Services
- **Google Gemini API**: Receipt analysis and food item extraction
- **API Key**: Required in environment variables (GEMINI_API_KEY or GOOGLE_API_KEY)

## Database
- **Neon Serverless PostgreSQL**: Primary data storage
- **Connection String**: Required via DATABASE_URL environment variable

## Development Tools
- **Replit Integration**: Cartographer plugin for development environment
- **Error Handling**: Runtime error overlay for debugging

## UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **FontAwesome**: Additional icon support
- **TailwindCSS**: Utility-first styling

# Deployment Strategy

## Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Static Assets**: Frontend assets served from Express

## Environment Configuration
- **Development**: NODE_ENV=development with hot reload
- **Production**: NODE_ENV=production with optimized builds
- **Port Configuration**: Server runs on port 5000, external port 80

## Database Setup
- **Schema Push**: `npm run db:push` applies schema changes
- **Migrations**: Stored in `./migrations` directory
- **Connection Pooling**: Neon serverless handles connection management

# Changelog

Changelog:
- June 16, 2025. Initial setup
- June 16, 2025. Fixed iOS barcode scanning: QR mode → standard barcode detection, improved UI with horizontal scan frame
- June 16, 2025. Added community engagement features: user forum, achievement system, feedback collection, and interactive AI chatbot for continuous user motivation and app improvement
- June 18, 2025. Removed barcode scanner functionality completely per user request - removed BarcodeScanner component, uninstalled @zxing dependencies, and cleaned up all related UI elements and code

# User Preferences

Preferred communication style: Simple, everyday language.