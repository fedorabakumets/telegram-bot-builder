# Telegram Bot Builder

## Overview

This is a visual Telegram bot builder application that allows users to create Telegram bots through a drag-and-drop interface. The application is built as a full-stack web application with a React frontend and Express.js backend, featuring real-time bot preview and Python code generation capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks with custom bot editor hook
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **API**: RESTful API design with JSON responses
- **Development**: Development server with hot module replacement via Vite middleware

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Single table for bot projects with JSON storage for bot flow data
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Bot Editor Core
- **Visual Flow Editor**: Canvas-based drag-and-drop interface for building bot flows
- **Node System**: Different node types (start, message, photo, keyboard, condition, input, command)
- **Properties Panel**: Real-time editing of node properties and configurations
- **Component Sidebar**: Library of draggable bot components

### Bot Preview System
- **Live Preview**: Interactive bot simulation within the application
- **Message Flow**: Step-through bot conversation simulation
- **Button Interactions**: Test inline and reply keyboards

### Code Generation
- **Python Generator**: Converts visual bot flows to aiogram (Telegram Bot API) Python code
- **Validation**: Bot structure validation before code generation
- **Export Options**: Copy to clipboard or download as Python file

### Storage System
- **In-Memory Fallback**: MemStorage implementation for development
- **Database Integration**: Full CRUD operations for bot projects
- **JSON Schema**: Structured bot data storage with type validation

## Data Flow

1. **Bot Creation**: Users drag components from sidebar to canvas
2. **Property Configuration**: Selected nodes show editable properties in right panel
3. **Real-time Updates**: All changes immediately update the bot data structure
4. **Preview Mode**: Users can test bot flows in simulated Telegram environment
5. **Code Export**: Bot structure validates and generates Python code
6. **Persistence**: All changes auto-save to database via API

## External Dependencies

### Frontend Libraries
- **UI Framework**: React with TypeScript support
- **Component Library**: Radix UI primitives with Shadcn/ui styling
- **Icons**: Lucide React for modern icons
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date manipulation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Backend Libraries
- **Web Framework**: Express.js with TypeScript
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Validation**: Zod for runtime type checking
- **Session Management**: express-session with PostgreSQL store
- **Development**: tsx for TypeScript execution

### Development Tools
- **Build System**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implied by Shadcn/ui setup)
- **Replit Integration**: Custom plugins for Replit development environment

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API proxy
- **Hot Reload**: Full-stack hot module replacement
- **Database**: Development database with automatic migrations
- **Environment Variables**: DATABASE_URL required for database connection

### Production Build
- **Frontend**: Vite production build with optimized bundle
- **Backend**: esbuild compilation to single JavaScript file
- **Static Assets**: Served from Express with frontend routing fallback
- **Database**: Production PostgreSQL with connection pooling

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string (required)
- **Build Scripts**: Separate build and start commands for production deployment

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Enhanced command support:
  * Added standard command templates (/help, /settings, /menu)
  * Implemented command autocompletion and validation
  * Added advanced command settings (privacy, auth, admin-only)
  * Enhanced button command selection with dropdown
  * Improved code generation with security checks
  * Enhanced export modal with bot statistics and BotFather setup
- July 05, 2025. Improved responsive design for export modal:
  * Added mobile-friendly layout with adaptive tabs
  * Optimized statistics display for small screens
  * Created separate mobile export interface
  * Improved button layouts and text sizes for mobile
  * Added responsive file list and code preview areas
- July 05, 2025. Enhanced export documentation and instructions:
  * Added comprehensive step-by-step setup guide
  * Included detailed environment preparation instructions
  * Added security best practices and warnings
  * Expanded BotFather configuration instructions
  * Added detailed descriptions for all export file types
  * Included troubleshooting and testing guidelines
- July 05, 2025. Added bot execution functionality:
  * Created new "Bot" tab in the editor interface
  * Implemented bot instance management with start/stop controls
  * Added real-time status monitoring with automatic updates
  * Integrated Python process management for bot execution
  * Created comprehensive API endpoints for bot lifecycle management
  * Added proper error handling and logging for bot processes
  * Established database schema for tracking bot instances
  * Configured aiogram integration for Telegram Bot API
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```