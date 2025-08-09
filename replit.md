# Telegram Bot Builder

## Overview
This application provides a visual Telegram bot builder, enabling users to create bots via a drag-and-drop interface. It's a full-stack web application with a React frontend and Express.js backend, offering real-time bot preview and Python code generation. The business vision is to democratize bot creation, allowing individuals and small businesses to rapidly deploy sophisticated Telegram bots without coding expertise, tapping into the growing demand for automated communication solutions. The project aims to be the leading no-code platform for Telegram bot development.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **August 9, 2025**: CRITICAL FIX: Fixed bot generator navigation bug affecting all text input nodes. Corrected 8 occurrences in client/src/lib/bot-generator.ts where connection properties used incorrect names (conn.source/conn.target instead of conn.sourceNodeId/conn.targetNodeId). VProgulke bot template now has complete working navigation: name_input → age_input → metro_selection → etc. All text-based user input collection flows now function correctly.
- **August 8, 2025**: CRITICAL FIX: Fixed VProgulke Bot template data collection issues. Added missing collectUserInput, inputVariable, and nextNodeId fields for all interactive nodes (gender_selection, join_request, age_input, marital_status, sexual_orientation, telegram_channel, extra_info). Implemented data->flow_data API mapping for proper template rendering. All user input collection and navigation flows now work correctly.
- **August 7, 2025**: CRITICAL FIX: Fixed multi-select state restoration bug in /start command handler. Added proper state recovery from database for "Change selection" and "Start over" buttons. Now generateStartHandler() properly initializes multi_select state with saved interests when allowMultipleSelection is enabled, ensuring checkmarks display correctly after navigation.
- **August 7, 2025**: Fixed column regulation for multi-select buttons in interest collection templates. Removed incorrect escapeForPython() usage and ensured proper calculateOptimalColumns() application for "Change selection" and "Start over" buttons. All button layout issues resolved.
- **August 7, 2025**: Completed comprehensive scale testing with 26 advanced test cases covering functionality, performance, security, and internationalization. Results: 84.6% success rate (22/26 tests passed). Added extensive test coverage for inline keyboard layout optimization and multi-column button distribution.
- **August 7, 2025**: Enhanced testing framework with stress tests (100+ concurrent users), performance benchmarks (10,000+ operations), memory monitoring (5,000+ user simulation), database stress operations (2,000+ batch users), error recovery mechanisms, and comprehensive analytics with user segmentation.
- **August 7, 2025**: Implemented advanced security testing including XSS protection, SQL injection prevention, input sanitization, and access control validation. Added internationalization support for Russian, English, and Spanish languages.
- **January 5, 2025**: Fixed database connection timeout issues by optimizing pool configuration and increasing connection timeout from 2s to 10s. Added better error handling for database connections.
- **January 5, 2025**: Removed deprecated 'input' node type from code generation. The legacy input node handling has been replaced with modern conditional input collection system.

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
    - **Bot Editor Core**: Canvas-based visual flow editor with various node types (start, message, photo, keyboard, condition, command). Real-time property editing and a component sidebar.
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
    - **Undo/Redo System**: Comprehensive undo/redo system with 50-state history limit, canvas toolbar integration, and keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z).

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

### Python Bot Dependencies (Generated Code)
- **Telegram Bot API**: aiogram
- **HTTP Client**: aiohttp
- **HTTP Requests**: requests
- **PostgreSQL Client**: asyncpg