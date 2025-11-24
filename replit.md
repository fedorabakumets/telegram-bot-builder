# Telegram Bot Builder - NO-CODE Platform

## Overview
This application provides a **no-code visual Telegram bot builder** that enables users to create sophisticated bots via a drag-and-drop interface without any programming knowledge. It's a full-stack web application with a React frontend and Express.js backend, offering real-time bot preview and Python code generation. The business vision is to democratize bot creation, allowing individuals and small businesses to rapidly deploy Telegram bots without coding expertise, tapping into the growing demand for automated communication solutions.

## Key Features
- **Visual drag-and-drop editor** - No coding required
- **Real-time bot preview** - Test immediately
- **Automatic code generation** - Generates Python code for aiogram
- **Database integration** - Automatically collects user data
- **Templates library** - Start from pre-built examples
- **User analytics** - Track bot usage and statistics
- **Media support** - Photos, videos, audio, documents
- **User data collection** - Forms and input validation

## User Preferences
Preferred communication style: Simple, everyday language. No-code platform for non-technical users.

## Recent Changes (Current Session)
- **✅ Telegram Login Widget - Complete Authentication System** (telegram-login-widget.tsx + use-telegram-auth.ts + adaptive-header.tsx + routes.ts):
  - Fixed "LogIn is not defined" error - removed old button references
  - Fixed authorization error - removed undefined session middleware dependency
  - **🔴 → ✅ Fixed widget flashing/pulsing** - optimized useEffect dependencies to load script only once
  - **🔴 → ✅ Fixed auth persistence** - now saves user to localStorage and persists between page reloads
  
  **Features:**
  - Widget configured with environment variable VITE_TELEGRAM_BOT_USERNAME
  - Automatically strips @ from username (e.g., @blogspotbotbotbot → blogspotbotbotbot)
  - Uses custom hook `useTelegramAuth()` for state management with localStorage
  - After successful auth, shows user profile with name instead of login button
  - Users can logout with X button to clear localStorage
  - Backend endpoint `/api/auth/telegram` handles OAuth callback without session errors
  - Returns authenticated user data to frontend on successful auth
  
  **Storage:**
  - localStorage key: `telegram_user`
  - Persists: id, first_name, last_name, username, photo_url
  
  **Note**: Widget requires HTTPS to display (Telegram requirement). On production/HTTPS URLs it will show Telegram login button
  - On localhost HTTP, widget loads but doesn't render (use Replit production domain to test)
  - **Status**: ✅ Ready for production deployment with full persistence
  
- **✨ Telegram Login Widget setup** (telegram-login-widget.tsx + routes.ts + adaptive-header.tsx):
  - Official Telegram Login Widget - standard OAuth-style authorization from Telegram
  - User clicks button, signs in with Telegram account, receives auth data
  - Simple authorization endpoint `/api/auth/telegram` that creates user session
  - Replaces old Client API авторизация - now official Telegram OAuth login
  - Flow: Click Telegram button in header → User signs in with Telegram → Returns authenticated
  
- Previous: **✨ Simplified Telegram Login Flow** (telegram-auth.tsx + telegram-client.ts):
  - Removed credentials input step - API ID/Hash now configured via env vars
  - Simplified flow: Номер телефона → Код подтверждения → (опционально) Пароль 2FA
  - User no longer needs to provide API credentials

- Previous session: **✨ Added bot execution time tracking counter** (bot-control.tsx):
  - New toggle "📊 Отслеживать время" to enable/disable time tracking per bot
  - Displays total execution time in format (10ч 30м, 5м 20с, etc.)
  - Shows time when tracking is enabled in bot information section (⏱️ Времени работы: Xч Xм)
  - Tracks execution time via `trackExecutionTime` and `totalExecutionSeconds` fields in botTokens table

## Previous Session: Major Refactoring
- Removed standalone node types: photo, video, audio, document, keyboard
- Integrated media and keyboard functionality as properties within message nodes
- Cleaned up ~9,000 lines of redundant code from bot-generator.ts
- Achieved 0 LSP errors (was 773+ errors)
- Simplified codebase and improved maintainability

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks + TanStack Query
- **Routing**: Wouter
- **Design**: Drag-and-drop canvas editor, responsive design

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session storage
- **API**: RESTful JSON API

### Core Systems
1. **Bot Editor Canvas**: Visual node-based flow editor
2. **Bot Preview System**: Live bot simulation for testing
3. **Code Generation**: Converts visual flows to Python (aiogram)
4. **Storage System**: PostgreSQL database for projects and user data
5. **Bot Execution**: Manages bot instances with start/stop controls
6. **Template System**: Pre-built bot templates for quick start
7. **Media Management**: File upload and optimization
8. **User Analytics**: Automatic user data collection and statistics

## Project Structure
```
telegram-bot-builder/
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       │   ├── ui/      # Base components
│       │   └── editor/  # Editor components
│       ├── pages/       # Application pages
│       └── lib/         # Utilities and hooks
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database interface
│   ├── db.ts            # Database connection
│   └── telegram-client.ts # Telegram API
├── shared/              # Shared types
│   └── schema.ts        # Drizzle ORM schemas
├── bots/                # Generated bot files
└── uploads/             # User uploaded files
```

## Data Model

### Node Types (in message-based flow)
- **start**: Initialization node
- **message**: Text messages with formatting, keyboard, and media support
- **command**: Command handlers (/start, /help, etc.)
- **condition**: Conditional logic
- **voice, animation, location, contact**: Special handlers
- **user_input**: Data collection forms

### Node Properties
- **messageText**: Main text content
- **buttons**: Array of buttons (inline or reply)
- **keyboardType**: "inline", "reply", or none
- **collectUserInput**: Enable user input mode
- **enableConditionalMessages**: Conditional logic
- **autoTransitionTo**: Auto-advance to next node
- **media properties**: File handling for attachments

## External Dependencies

### Frontend Libraries
- React, Radix UI, Shadcn/ui, Tailwind CSS, TypeScript
- React Hook Form, Zod for validation
- TanStack Query for data fetching
- Lucide React for icons

### Backend Libraries
- Express.js, Drizzle ORM, TypeScript
- PostgreSQL driver (@neondatabase/serverless)
- Express Session with PostgreSQL storage

### Generated Bot Dependencies
- aiogram (Telegram Bot API)
- asyncpg (async PostgreSQL)
- aiohttp (HTTP client)

## Development Guidelines
- Follow modern web application patterns
- Put most logic in frontend, backend handles persistence
- Minimize file count, collapse similar components
- Always use data model first (shared/schema.ts)
- Prefer in-memory storage for development
- Keep routes thin, use storage interface
- Use TanStack Query for data fetching
- Add data-testid to all interactive elements
