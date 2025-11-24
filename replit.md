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

## Recent Changes (Session: Major Refactoring)
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
