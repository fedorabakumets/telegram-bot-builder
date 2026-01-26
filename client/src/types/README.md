# Types

TypeScript типы и интерфейсы для Telegram Bot Builder.

## Структура типов

### Основные сущности
- **User** - пользователь системы
- **Bot** - Telegram бот
- **Template** - шаблон бота
- **Node** - узел в конструкторе
- **Connection** - связь между узлами

### API типы
- **Request/Response** - типы для API запросов и ответов
- **Error** - типы ошибок
- **Pagination** - типы для пагинации

### UI типы
- **Component Props** - типы пропсов компонентов
- **Form Data** - типы данных форм
- **Event Handlers** - типы обработчиков событий

## Примеры типов

### Основные сущности
```typescript
// types/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ru' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserRequest = Partial<Pick<User, 'name' | 'avatar' | 'settings'>>;
```

```typescript
// types/Bot.ts
export interface Bot {
  id: string;
  name: string;
  description?: string;
  token?: string;
  username?: string;
  isActive: boolean;
  userId: string;
  templateId?: string;
  nodes: BotNode[];
  connections: BotConnection[];
  settings: BotSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  style?: NodeStyle;
}

export interface BotConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  style?: ConnectionStyle;
}

export type NodeType = 
  | 'start'
  | 'message'
  | 'command'
  | 'condition'
  | 'action'
  | 'end';

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  content?: string;
  command?: string;
  condition?: string;
  action?: string;
  [key: string]: any;
}
```

### API типы
```typescript
// types/Api.ts
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Типы для конкретных API endpoints
export type GetBotsResponse = PaginatedResponse<Bot>;
export type CreateBotRequest = Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBotRequest = Partial<CreateBotRequest>;
```

### UI типы
```typescript
// types/Components.ts
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Формы
```typescript
// types/Forms.ts
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface BotFormData {
  name: string;
  description?: string;
  templateId?: string;
  settings: {
    welcomeMessage?: string;
    errorMessage?: string;
    language: 'ru' | 'en';
  };
}

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
}
```

## Утилитарные типы

### Общие утилиты
```typescript
// types/Utils.ts
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type ValueOf<T> = T[keyof T];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

### Состояние приложения
```typescript
// types/State.ts
export interface AppState {
  user: User | null;
  currentBot: Bot | null;
  ui: UIState;
  settings: AppSettings;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  loading: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}
```

### События
```typescript
// types/Events.ts
export interface NodeEvent {
  type: 'node:select' | 'node:deselect' | 'node:move' | 'node:delete';
  nodeId: string;
  data?: any;
}

export interface ConnectionEvent {
  type: 'connection:create' | 'connection:delete';
  connectionId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface EditorEvent {
  type: 'editor:save' | 'editor:load' | 'editor:export';
  botId: string;
  data?: any;
}

export type AppEvent = NodeEvent | ConnectionEvent | EditorEvent;

export interface EventHandler<T extends AppEvent = AppEvent> {
  (event: T): void;
}
```

## Валидация типов

### Zod схемы
```typescript
// types/Validation.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  token: z.string().optional(),
  username: z.string().optional(),
  isActive: z.boolean(),
  userId: z.string().uuid(),
});

export const CreateBotSchema = BotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Вывод типов из схем
export type UserValidation = z.infer<typeof UserSchema>;
export type BotValidation = z.infer<typeof BotSchema>;
export type CreateBotValidation = z.infer<typeof CreateBotSchema>;
```

### Type Guards
```typescript
// types/Guards.ts
export function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string'
  );
}

export function isBot(value: any): value is Bot {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.isActive === 'boolean'
  );
}

export function isApiError(value: any): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.message === 'string' &&
    typeof value.code === 'string'
  );
}
```

## Организация типов

### Индексные файлы
```typescript
// types/index.ts
export * from './User';
export * from './Bot';
export * from './Template';
export * from './Api';
export * from './Components';
export * from './Forms';
export * from './State';
export * from './Events';
export * from './Utils';
export * from './Validation';
export * from './Guards';
```

### Модульная организация
```
types/
├── entities/          # Основные сущности
│   ├── User.ts
│   ├── Bot.ts
│   └── Template.ts
├── api/              # API типы
│   ├── Request.ts
│   ├── Response.ts
│   └── Error.ts
├── ui/               # UI типы
│   ├── Components.ts
│   ├── Forms.ts
│   └── Events.ts
├── utils/            # Утилитарные типы
│   ├── Common.ts
│   └── Helpers.ts
└── index.ts          # Главный экспорт
```

## Лучшие практики

### Именование типов
- Используйте PascalCase для типов и интерфейсов
- Добавляйте суффиксы для ясности: `UserData`, `BotConfig`
- Используйте префиксы для групп: `ApiResponse`, `FormData`

### Структура интерфейсов
- Группируйте связанные поля
- Используйте опциональные поля разумно
- Добавляйте комментарии для сложных типов

### Переиспользование типов
- Создавайте базовые типы для расширения
- Используйте утилитарные типы TypeScript
- Избегайте дублирования определений