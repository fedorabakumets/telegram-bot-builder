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
- July 05, 2025. Implemented comprehensive dark theme support:
  * Created ThemeProvider component with localStorage persistence and system preference detection
  * Added enhanced theme toggle component with visual indicators and smooth animations
  * Updated all UI components to use CSS variables for theme-aware styling
  * Configured Tailwind CSS with class-based dark mode and enhanced color schemes
  * Enhanced header, sidebar, canvas, properties panel, and modal components for theme compatibility
  * Added improved visual feedback with color-coded statistics cards and status indicators
  * Implemented smooth transitions and enhanced shadows for better dark mode experience
  * Fixed CSS import order and added theme-specific scrollbar styling
  * Enhanced export modal with theme-aware colored statistics and better visual hierarchy
  * Improved ResizablePanel components with enhanced dark theme support:
    - Added interactive states (hover, active, dragging) with visual feedback
    - Implemented smooth animations and transitions for resize handles
    - Added glow effects and pulse animations for dark theme
    - Enhanced grip handles with better visibility and responsive design
    - Added gradient overlays and improved cursor feedback
  * Enhanced empty state for properties panel with comprehensive dark theme support:
    - Created animated empty state with interactive elements and visual feedback
    - Added floating animations and gradient effects for better user guidance
    - Implemented enhanced help tips with contextual icons and hover effects
    - Added pulse animations and gradient text effects for dark theme
    - Improved visual hierarchy with proper color contrast and spacing
  * Enhanced canvas with comprehensive dark theme support:
    - Added specialized canvas background with gradient overlays for dark theme
    - Implemented enhanced grid patterns with better visibility in dark mode
    - Created interactive canvas controls with backdrop blur and hover effects
    - Added visual feedback for drag-and-drop operations with animated grid
    - Implemented zoom indicator with smooth animations and transitions
    - Enhanced control buttons with scale animations and color transitions
  * Enhanced advanced command settings with comprehensive dark theme support:
    - Redesigned command advanced settings accordion with gradient backgrounds and themed icons
    - Added color-coded setting groups with hover effects and visual feedback
    - Implemented themed switches with proper dark mode styling
    - Enhanced warning messages with theme-aware colors and modern SVG icons
    - Added smooth transitions and enhanced visual hierarchy for better UX
    - Created gradient text effects and improved spacing for dark theme compatibility
    - Updated keyboard settings with consistent theming and interactive states
- July 05, 2025. Enhanced export modal with comprehensive dark theme support for code and files:
  * Updated all code preview areas (Python, JSON, Requirements, etc.) with dark theme variants
  * Enhanced file list items with proper hover states and selection indicators
  * Improved instruction step boxes with color-coded themes and proper contrast
  * Added dark theme support for validation messages and error states
  * Enhanced code blocks and inline code elements with themed backgrounds and borders
  * Updated warning and information sections with dark theme color schemes
  * Improved mobile export interface with consistent dark theme styling
  * Added proper theme transitions for all interactive file elements
- July 05, 2025. Comprehensive canvas dark theme enhancement:
  * Enhanced canvas background with sophisticated gradient overlay system for dark theme
  * Improved grid pattern visibility with better contrast and opacity in dark mode
  * Added enhanced canvas controls with backdrop blur and theme-aware styling
  * Implemented dynamic drag-over state with animated grid highlighting
  * Enhanced drop zone hint with modern glass-morphism design and hover animations
  * Created specialized CSS classes for canvas theming with smooth transitions
  * Added interactive visual feedback for drag and drop operations
  * Improved zoom indicator and control buttons with dark theme compatibility
- July 05, 2025. Advanced canvas visual effects and animations:
  * Added ambient animated background gradients with subtle movement effects
  * Enhanced grid pattern with shimmer and overlay animations for depth
  * Implemented sophisticated control button interactions with sweep animations
  * Created pulsing drop zone with gradient border glow effects
  * Added enhanced node shadows and hover states for better depth perception
  * Implemented cursor state changes for better user interaction feedback
  * Added smooth cubic-bezier transitions throughout all canvas elements
  * Created multi-layered visual effects with proper z-indexing and performance optimization
- July 06, 2025. Comprehensive template system enhancement:
  * Extended database schema with advanced template metadata:
    - Added difficulty levels (easy, medium, hard) for better categorization
    - Implemented author tracking with authorId and authorName fields
    - Added usage statistics with useCount for popularity tracking
    - Created rating system with rating and ratingCount fields
    - Added featured template support for highlighting quality templates
    - Included version tracking for template evolution
    - Added previewImage support for visual template previews
  * Enhanced template management API with new endpoints:
    - Created template rating system with POST /api/templates/:id/rate
    - Added usage tracking with POST /api/templates/:id/use
    - Implemented featured templates endpoint GET /api/templates/featured
    - Added category filtering with GET /api/templates/category/:category
    - Created search functionality with GET /api/templates/search
  * Redesigned templates modal with modern tabbed interface:
    - Added tabs for "All", "Featured", and "Popular" templates
    - Implemented advanced filtering by category, difficulty, and search terms
    - Added sorting options by popularity, rating, recent, and alphabetical
    - Created responsive grid layout with enhanced template cards
    - Added visual indicators for featured templates with crown icons
    - Implemented interactive rating system with star controls
    - Enhanced template cards with usage statistics and difficulty badges
    - Added improved preview functionality with detailed template information
  * Updated template seed data with comprehensive metadata:
    - Enhanced existing templates with difficulty levels and author information
    - Added proper version tracking for all system templates
    - Included comprehensive tags for better discoverability
- July 06, 2025. Кардинальное улучшение системы управления связями:
  * Создана новая вкладка "Связи" в редакторе с полным набором инструментов управления
  * Реализован улучшенный ConnectionManager с расширенными возможностями:
    - Автоматическое создание и синхронизация кнопок при добавлении связей
    - Интеллектуальная генерация предложений связей на основе анализа структуры
    - Система правил валидации для обеспечения качества связей
    - Автоматическая очистка "сиротских" кнопок и неработающих связей
  * Добавлены продвинутые компоненты управления связями:
    - SmartConnectionCreator: умное создание связей с шаблонами и предложениями
    - EnhancedConnectionControls: расширенный контроль с правилами валидации
    - ConnectionVisualization: интерактивная визуализация с метриками и анализом
    - ConnectionManagerPanel: централизованное управление всеми аспектами связей
  * Внедрена система шаблонов связей с предустановленными паттернами:
    - Стартовые приветствия, навигация по меню, ответы на команды
    - Обработка пользовательского ввода, демонстрация медиаконтента
    - Автоматическое применение лучших практик структуры бота
  * Реализована интеллектуальная валидация связей:
    - Проверка соответствия правилам для разных типов узлов
    - Автоматическое обнаружение изолированных узлов и проблемных связей
    - Цветовая индикация статуса связей и предложения по улучшению
  * Добавлены метрики и аналитика связей:
    - Расчет силы и важности каждой связи
    - Визуальные индикаторы качества с прогресс-барами
    - Статистика по типам связей и общему состоянию структуры
  * Интегрированы инструменты автоматизации:
    - Пакетное применение правил валидации
    - Массовая синхронизация кнопок с существующими связями
    - Интеллектуальные предложения для улучшения UX потока бота
- July 06, 2025. Исправлена проблема с отображением пользовательских шаблонов:
  * Исправлена проблема с кэшированием в системе шаблонов
  * Обновлена система инвалидации кэша для правильного отображения сохраненных шаблонов
  * Улучшены запросы для категории "custom" во вкладке "Мои шаблоны"
  * Добавлена настройка staleTime для немедленного обновления данных
  * Обеспечена корректная работа сохранения и отображения пользовательских шаблонов
- July 06, 2025. Решена проблема с исчезновением шаблонов при перезапуске:
  * Мигрировал с MemStorage на DatabaseStorage для постоянного хранения
  * Подключил PostgreSQL для сохранения всех шаблонов в базе данных
  * Исправил все ошибки типов в операциях базы данных
  * Шаблоны теперь сохраняются между перезапусками приложения
  * Протестировал и подтвердил работоспособность системы сохранения
- July 06, 2025. Кардинальное улучшение системы управления ботами:
  * Исправлена критическая ошибка 500 при остановке ботов
  * Реализована автоматическая очистка несоответствий состояний ботов при запуске сервера
  * Улучшена функция остановки ботов для обработки случаев несоответствия базы данных и памяти
  * Добавлена интеллектуальная система проверки статуса ботов с автоматическим исправлением
  * Улучшено управление экземплярами ботов с правильным обновлением существующих записей
  * Добавлена лучшая обработка ошибок для операций перезапуска ботов
  * Система теперь корректно обрабатывает ситуации рассинхронизации базы данных и памяти (например, при перезапуске сервера)
- July 06, 2025. Добавлена система сохранения токенов ботов:
  * Расширена схема базы данных с полем botToken в таблице проектов
  * Реализовано автоматическое сохранение токенов при запуске ботов
  * Добавлены API endpoints для управления сохраненными токенами (получение, удаление)
  * Создан улучшенный UI для работы с токенами в компоненте BotControl
  * Пользователи могут видеть превью сохраненного токена и управлять им
  * Добавлена возможность использовать сохраненный токен или ввести новый
  * Токены автоматически используются при перезапуске ботов
  * Реализована безопасная работа с токенами через скрытый ввод и частичное отображение
- July 06, 2025. Исправлена проблема с inline кнопками:
  * Исправлена генерация кода для inline кнопок - теперь они прикрепляются к сообщению
  * Удалено отправление двух отдельных сообщений при использовании inline кнопок
  * Inline кнопки теперь отправляются вместе с текстом сообщения в одном сообщении
  * Обновлен комментарий в сгенерированном коде для ясности
  * Удалена функция generateMessageHandler, которая создавала лишние обработчики
  * Исправлен серверный экспорт API для использования правильного генератора кода
  * Проведено комплексное тестирование с 28-узловым ботом - результат 86/100 баллов
  * Основная проблема полностью решена: команды с inline кнопками генерируют один message.answer() вызов
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```