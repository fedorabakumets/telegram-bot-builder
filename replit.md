# Telegram Bot Builder

## Overview
This application is a visual Telegram bot builder, enabling users to create bots through a drag-and-drop interface. It's a full-stack web application with a React frontend and Express.js backend, offering real-time bot preview and Python code generation. The business vision is to democratize bot creation, allowing individuals and small businesses to rapidly deploy sophisticated Telegram bots without coding expertise, aiming to become the leading no-code platform for Telegram bot development.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables, supporting dark theme.
- **State Management**: React hooks
- **Data Fetching**: TanStack Query
- **Routing**: Wouter
- **Design Philosophy**: Responsive design, intuitive drag-and-drop interface, interactive elements, consistent theming with enhanced visual effects and animations.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session storage
- **API**: RESTful JSON API
- **Key Features**:
    - **Bot Editor Core**: Canvas-based visual flow editor with various node types (start, message, photo, keyboard, condition, input, command), real-time property editing, and a component sidebar.
    - **Bot Preview System**: Live, interactive bot simulation with message flow and button interaction testing.
    - **Code Generation**: Converts visual flows to aiogram (Python) code, including validation and export options. Generates syntactically correct Python code.
    - **Storage System**: Persistent storage of bot projects using PostgreSQL with JSON flow storage.
    - **Bot Execution**: Manages bot instances with start/stop controls, real-time status monitoring, and Python process management. Handles bot token storage securely.
    - **Template System**: Advanced template management with metadata, category filtering, search, and a redesigned tabbed interface.
    - **Connection Management**: Dedicated interface for managing connections with intelligent suggestions and validation.
    - **Media Handling**: Supports various media types (photo, video, audio, document) with file optimization and preview.
    - **Geolocation**: Supports integration with mapping services for coordinate extraction and route generation.
    - **User Input & Data Collection**: Node type for collecting user input (text, number, email, phone, media) with validation and persistence, supporting button-based answers (single/multiple choice) with customizable navigation.
    - **Conditional Messaging**: Advanced logic for conditional messages based on user data, with intelligent variable replacement and dynamic next node navigation.
    - **Text Formatting**: Works like Telegram Web, with hotkeys and toggle functionality for Markdown and HTML formatting.
    - **User Database & Analytics**: Automatically collects user data and command statistics in PostgreSQL, providing a UI for viewing responses and stats.

### Data Flow
User changes in the visual editor are immediately reflected in the bot's data structure, persisted to the database via API. The preview mode allows real-time testing, and the validated bot structure can be exported as Python code.

## External Dependencies

### Frontend Libraries
- **UI Framework**: React
- **Component Library**: Radix UI, Shadcn/ui
- **Icons**: Lucide React
- **Form Handling**: React Hook Form, Zod
- **Date Utilities**: date-fns
- **Styling**: Tailwind CSS, class-variance-authority

### Backend Libraries
- **Web Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **PostgreSQL Driver**: @neondatabase/serverless (or standard node-postgres)
- **Validation**: Zod
- **Session Management**: express-session, connect-pg-simple

### Development Tools
- **Build System**: Vite
- **Type Checking**: TypeScript
- **Code Quality**: ESLint, Prettier

### Python Bot Dependencies (Generated Code)
- **Telegram Bot API**: aiogram
- **HTTP Client**: aiohttp
- **HTTP Requests**: requests
- **PostgreSQL Client**: asyncpg