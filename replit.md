# Telegram Bot Builder Platform - Dual Mode Authentication

## Project Overview
A web-based Telegram bot builder where:
- **Unauthenticated users** work with localStorage (temporary browser storage)
- **Telegram-authenticated users** get persistent PostgreSQL storage accessible across devices
- Both user types can create and manage bot projects, tokens, and templates

## Current Status (Session: Dual-Mode System Implementation)

### ✅ Completed Tasks

#### Task 1: Database Schema Updates
- Added `ownerId` foreign key fields to:
  - `bot_projects` table (references `telegram_users.id`)
  - `bot_tokens` table (references `telegram_users.id`)
  - `bot_templates` table (references `telegram_users.id`)
- Created `telegram_users` table for storing Telegram user profiles
- Migration executed successfully

#### Task 2: LocalStorageService Implementation
- **File**: `client/src/lib/local-storage.ts`
- Safe error handling for restricted storage (Safari private mode, etc.)
- Type-safe with ISO string date persistence and Date object revival
- Methods implemented:
  - Projects: `getProjects()`, `getProject()`, `saveProject()`, `updateProject()`, `deleteProject()`
  - Tokens: `getTokens()`, `getToken()`, `saveToken()`, `updateToken()`, `deleteToken()`
  - Templates: `getTemplates()`, `getTemplate()`, `saveTemplate()`, `updateTemplate()`, `deleteTemplate()`
  - Utilities: `clearAll()`, `exportData()`, `importData()`
- All operations wrapped with safe error handling (`safeGetItem`, `safeSetItem`, `safeRemoveItem`)

#### Task 3: API Endpoints for User-Specific Data
- **File**: `server/routes.ts` (lines 6055-6303)
- Implemented endpoints:
  - `GET/POST/PATCH/DELETE /api/user/projects`
  - `GET/POST/PATCH/DELETE /api/user/tokens`
  - `GET/POST/PATCH/DELETE /api/user/templates`
- Authentication check: Returns 401 if `req.user.id` missing
- Authorization check: Returns 403 if resource doesn't belong to user (ownership verification)

#### Task 4: Storage Layer Enhancement
- **File**: `server/storage.ts`
- Added interface methods:
  - `getUserBotProjects(ownerId: number): Promise<BotProject[]>`
  - `getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]>`
  - `getUserBotTemplates(ownerId: number): Promise<BotTemplate[]>`
- Implementations:
  - **MemStorage**: Basic array filtering
  - **DatabaseStorage (DbStorage)**: SQL queries with `WHERE` clause filtering
  - **EnhancedDatabaseStorage (CachedStorage)**: Delegation to parent class

#### Task 5: Frontend Hook for Data Management
- **File**: `client/src/hooks/use-user-data.ts`
- `useUserData` hook family:
  - `useProjects()`, `useTokens()`, `useTemplates()` - Query hooks
  - `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
  - `useCreateToken()`, `useUpdateToken()`, `useDeleteToken()`
  - `useCreateTemplate()`, `useUpdateTemplate()`, `useDeleteTemplate()`
- Auto-switches data source based on authentication:
  - Mode `'local'`: Uses `LocalStorageService` for unauthenticated users
  - Mode `'server'`: Uses `/api/user/*` endpoints for authenticated users
- Proper cache invalidation on mutations

### 🔄 Remaining Tasks (Pending Implementation)

#### Task 7: Component List Modifications
- Modify project/token/template list components to:
  - Show local data when unauthenticated
  - Switch to server data when authenticated
  - Display data source indicator (badge/icon)
  - Handle loading states during data migration

#### Task 8: Public Templates System
- Add `isPublic` flag filtering in UI
- Create public template browsing page
- Implement template sharing and discovery features
- Add rating/download/like functionality for public templates

#### Task 9: Export/Import Functionality
- Implement JSON export of projects with nested data
- File-based import with conflict resolution
- Backup/restore capability for data portability

#### Task 10: Full System Testing
- Test local → authenticated migration flow
- Verify data persistence across sessions
- Test authorization checks
- Edge cases: Safari private mode, network failures

## Project Architecture

### Frontend Structure
```
client/src/
├── lib/
│   ├── local-storage.ts (localStorage service)
│   └── queryClient.ts
├── hooks/
│   └── use-user-data.ts (dual-mode data management)
├── pages/
├── components/
└── App.tsx
```

### Backend Structure
```
server/
├── storage.ts (IStorage interface + implementations)
├── routes.ts (API endpoints including /api/user/*)
├── db.ts (database connection)
└── db-utils.ts
```

### Key Files Modified
- `shared/schema.ts` - Types & database schema with `ownerId` fields
- `client/src/lib/local-storage.ts` - NEW: localStorage service
- `client/src/hooks/use-user-data.ts` - NEW: dual-mode hook
- `server/routes.ts` - NEW: /api/user/* endpoints (250+ lines added)
- `server/storage.ts` - NEW: getUserBot* methods + implementations

## Technical Decisions

### Date Handling in localStorage
- **Problem**: JSON can't serialize Date objects directly
- **Solution**: 
  - Store as ISO strings (`createdAt: "2024-11-25T..."`")
  - Revive to Date objects on read via `reviveDates()` helper
  - Type safety with `StoredProject` vs `BotProject` types

### Authentication Model
- Frontend: `isAuthenticated` flag determines data source
- Backend: `(req as any).user?.id` for authenticated requests
- Future: Should integrate proper authentication middleware (Passport.js)

### Data Migration Path
1. User works offline with localStorage
2. User authorizes via Telegram
3. LocalStorage data exported and offered for server import
4. Server-side data used for all subsequent operations
5. Logout returns to localStorage mode with optional clear

## Known Issues & TODOs
- 10 LSP diagnostics in `server/storage.ts` (type compatibility warnings)
- Authentication middleware not implemented - currently uses `req.user` (type: any)
- No actual data migration UI yet (Tasks 7-10 will implement this)

## User Preferences
- Fullstack JavaScript application (React + Express + PostgreSQL)
- Using shadcn/ui components with Tailwind CSS
- TypeScript for type safety
- TanStack Query for server state management

## Next Steps (For Future Sessions)
1. Complete Task 7: Update components to use `use-user-data` hooks
2. Complete Task 8: Implement public template system
3. Complete Task 9: Add export/import functionality
4. Complete Task 10: Full system testing
5. Implement proper authentication middleware
6. Add data migration UI with progress indicator
7. Test edge cases and error scenarios
