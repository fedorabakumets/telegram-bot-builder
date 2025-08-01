# Telegram Bot Builder

## Overview

This application provides a visual Telegram bot builder, enabling users to create bots via a drag-and-drop interface. It's a full-stack web application with a React frontend and Express.js backend, offering real-time bot preview and Python code generation. The business vision is to democratize bot creation, allowing individuals and small businesses to rapidly deploy sophisticated Telegram bots without coding expertise, tapping into the growing demand for automated communication solutions. The project aims to be the leading no-code platform for Telegram bot development.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 1, 2025)

### Conditional Button Implementation
- **Fixed Conditional Buttons**: Conditional message buttons now function as actual answer choices that save to database
- **Database Integration**: Conditional buttons use format `conditional_variableName_value` to save user selections
- **Automatic Profile Updates**: After updating a variable via conditional button, profile command is automatically triggered
- **Template Updates**: All system templates updated with working conditional button functionality

### Bot Generator Critical Fixes (July 31, 2025)
- **Fixed navTargetNode Error**: Removed JavaScript variable references (`navTargetNode.type`) in generated Python code that caused runtime errors
- **Enhanced Navigation Logic**: Added proper handling for `keyboard` nodes with `enableTextInput: true` 
- **Text Input Processing**: Improved code generation for user input collection nodes

### Template Navigation Fixes (July 31, 2025)
- **"Опрос пользователей" Template**: Fixed navigation flow where gender selection now correctly leads to name input instead of profile command
- **Database Updates**: Updated both active projects and base templates with corrected navigation paths
- **Node Relationships**: Corrected button actions from "command" type to "goto" type with proper target node IDs

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables for theming, supporting comprehensive dark theme.
- **State Management**: React hooks
- **Data Fetching**: TanStack Query
- **Routing**: Wouter
- **Design Philosophy**: Responsive design, intuitive drag-and-drop interface, interactive elements, consistent theming. Enhanced visual effects and animations for canvas and UI elements.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session storage
- **API**: RESTful JSON API
- **Key Features**:
    - **Bot Editor Core**: Canvas-based visual flow editor with various node types (start, message, photo, keyboard, condition, input, command). Real-time property editing and a component sidebar.
    - **Bot Preview System**: Live, interactive bot simulation with message flow and button interaction testing.
    - **Code Generation**: Converts visual flows to aiogram (Python) code. Includes validation and export options (copy/download). Generates syntactically correct Python code, handling boolean conversions, indentation, and various node types.
    - **Storage System**: Persistent storage of bot projects using a PostgreSQL database with JSON flow storage. Supports in-memory fallback for development.
    - **Bot Execution**: Manages bot instances with start/stop controls, real-time status monitoring, and Python process management. Handles bot token storage securely.
    - **Template System**: Advanced template management with metadata (difficulty, author, usage, rating), category filtering, search, and a redesigned tabbed interface.
    - **Connection Management**: Dedicated interface for managing connections, offering intelligent suggestions, validation rules, and visualization.
    - **Media Handling**: Comprehensive support for various media types (photo, video, audio, document) with file optimization, preview, and local file support.
    - **Geolocation**: Supports integration with mapping services (Yandex, Google Maps, 2GIS) for coordinate extraction and route generation.
    - **User Input & Data Collection**: Dedicated node type for collecting user input (text, number, email, phone, media) with validation, persistence, and support for button-based answers (single/multiple choice) with customizable navigation.
    - **Conditional Messaging**: Advanced logic for conditional messages based on user data, with intelligent variable replacement and dynamic next node navigation.
    - **Text Formatting**: Works like Telegram Web, with hotkeys and toggle functionality for Markdown and HTML formatting. Auto-detects and applies `ParseMode`.
    - **User Database & Analytics**: Automatically collects user data (username, first_name, last_name, registration) and command statistics in PostgreSQL. Provides a UI for viewing user responses and stats.

### Data Flow
User changes in the visual editor are immediately reflected in the bot's data structure, which is then persisted to the database via API. The preview mode allows real-time testing, and the validated bot structure can be exported as Python code.

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
- **Python Execution**: tsx (for development)

### Development Tools
- **Build System**: Vite
- **Type Checking**: TypeScript
- **Code Quality**: ESLint, Prettier

### Python Bot Dependencies (Generated Code)
- **Telegram Bot API**: aiogram
- **HTTP Client**: aiohttp
- **HTTP Requests**: requests
- **PostgreSQL Client**: asyncpg
```