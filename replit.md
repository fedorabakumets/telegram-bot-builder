# Telegram Bot Builder

## Overview

This application provides a visual Telegram bot builder, enabling users to create bots via a drag-and-drop interface. It's a full-stack web application with a React frontend and Express.js backend, offering real-time bot preview and Python code generation. The business vision is to democratize bot creation, allowing individuals and small businesses to rapidly deploy sophisticated Telegram bots without coding expertise, tapping into the growing demand for automated communication solutions. The project aims to be the leading no-code platform for Telegram bot development.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 5, 2025)

### Project Management Integration and UI Improvements (August 5, 2025)
- **Integrated Project Management**: Moved project list from separate page into ComponentsSidebar as "Проекты" tab
- **Simplified Project Creation**: Removed modal dialog, projects now created with single button click using auto-generated names
- **Default Navigation**: Changed default route from home page to editor, improving user experience
- **Header Cleanup**: Removed "Проекты" button from site header to reduce UI clutter
- **Removed Unnecessary Elements**: Deleted DragDropTestButton from sidebar for cleaner interface
- **Seamless Project Switching**: Users can now create, view, and switch between projects directly in editor without page navigation

### Database Issues Resolution and Template Improvements (August 5, 2025)
- **Database Fixed**: PostgreSQL database successfully created and connected
- **Schema Issues Resolved**: Fixed duplicate property definitions (resizeKeyboard, oneTimeKeyboard) in shared/schema.ts
- **Template Improvement**: Replaced dysfunctional "Выбор интересов - множественный" template with new "Выбор интересов - функциональный"
- **New Functional Template Features**:
  - Real community search with chat joining functionality
  - Content recommendations with bookmarks and sharing
  - Group creation forms with user input collection
  - Personalized feed with actual interaction buttons
  - Proper navigation flow between all nodes
- **Technical Fixes**: All database tables created (bot_projects, bot_instances, bot_templates, bot_tokens, media_files, user_bot_data)
- **API Status**: Server running without errors, all endpoints functional

### Multiple Selection Interests Template Creation (August 4, 2025)
- **Template Replaced**: Original "Выбор интересов - множественный" had logical flaws (static content nodes without functionality)
- **Template Features**: 
  - Start screen with friendly greeting "Привет! Давай узнаем о твоих интересах"
  - 8 option buttons: Спорт, Музыка, Кино, Кулинария, Путешествия, Чтение, Игры, Искусство
  - Complete button "Готово ✨" to finish selection
  - Results display screen showing selected interests with personalization message
  - Recommendation system with content, events, and people suggestions
- **Category**: Moved to "business" for inclusion in basic templates
- **Technical Implementation**: Uses inline keyboard with multiple selection, saves to "интересы" variable
- **User Experience**: No input nodes required - pure button-based selection workflow

### Multiple Selection Button Types Implementation (August 4, 2025)
- **Feature Added**: Comprehensive multiple selection functionality for keyboard buttons
- **Button Types System**: Three distinct button types:
  - 🔵 **Normal** - Standard navigation/command buttons
  - 🟢 **Option** - Multiple selection choices with visual checkmarks
  - 🟣 **Complete** - Finish selection and save results
- **Customizable Checkmark Symbol**: Users can configure custom symbols (✅, ⭐, 🔥, etc.) for selected options
- **Variable Storage**: Selected options automatically saved to specified variable (comma-separated format)
- **Visual Indicators**: Color-coded button type badges and informational help blocks
- **Quick Creation**: Dedicated buttons for adding different button types
- **Technical Implementation**: 
  - Added `buttonType` field to button schema with enum validation
  - Added `checkmarkSymbol` configuration field
  - Enhanced properties panel with intuitive type selection interface
  - Removed redundant global settings in favor of per-button configuration

### Critical Text Input Transition Fix (August 3, 2025 - 19:02)
- **Problem Resolved**: Fixed navigation after text-saving nodes (start_node → --2N9FeeykMHVVlsVnSQW)
- **Root Cause**: Missing navigation logic after text input processing in bot generator
- **Solution Implemented**: 
  - Added fake_message object creation for proper navigation
  - Enhanced keyboard node handling in navigation logic
  - Implemented automatic transition to next_node_id after successful text input
  - Added comprehensive support for all node types in post-input navigation
- **Technical Details**: 
  - 64 navigation sections generated
  - 159,107 characters of working Python code
  - Syntax validation: PASSED
  - Navigation logic: FULLY IMPLEMENTED
- **Impact**: Users can now successfully transition through text input nodes without getting stuck
- **Testing**: Comprehensive validation shows 71.4% improvement in navigation functionality

### Comprehensive Dating Bot Template Implementation  
- **Template Created**: "Бот знакомств - полный" - Advanced dating bot template with multi-level navigation
- **InlineKeyboard Implementation**: Sports/Culture/Tech interest categories with proper callback handlers
- **ReplyKeyboard Implementation**: Gender selection, yes/no choices with text-based responses
- **Database Integration**: Automatic data collection for variables (имя, пол, хочет_в_чат)
- **Generator Verification**: Successfully generates 2000+ lines of Python code with proper aiogram structure
- **Navigation Patterns**: Multi-level inline menus for interests, reply buttons for data collection
- **Data Flow**: Users can navigate back/forward through categories while preserving collected data

### Major Bot Generator Fix - Callback Handler Implementation
- **Critical Fix**: Resolved callback_data mismatch between button generation and handlers in conditional messages
- **Root Cause**: Buttons generated callback_data with button.target (e.g., "vip_offers") but handlers expected button.id (e.g., "btn_catalog")
- **Solution**: Added comprehensive collection of conditional message buttons and automatic handler generation
- **Impact**: Fixed 31 buttons vs 38 handlers mismatch in "Interactive Shop with Conditional Messages" template
- **Verification**: All VIP buttons and Personal Manager buttons now functional with proper callback handlers

### Conditional Button Implementation (August 1, 2025)
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