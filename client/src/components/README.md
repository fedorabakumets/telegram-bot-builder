# Дизайн-система компонентов

Эта документация описывает архитектуру и использование компонентов дизайн-системы Telegram Bot Builder.

## 📋 Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Установка и настройка](#установка-и-настройка)
- [Использование компонентов](#использование-компонентов)
- [Создание новых компонентов](#создание-новых-компонентов)
- [Тестирование](#тестирование)
- [Storybook](#storybook)
- [Лучшие практики](#лучшие-практики)

## 🎯 Обзор

Дизайн-система построена на принципах **Atomic Design** и включает:

- **Атомы** - базовые неделимые компоненты (Button, Input, Icon)
- **Молекулы** - комбинации атомов (FormField, SearchBox, StatCard)
- **Организмы** - сложные компоненты (DataTable, Navigation, UserCard)
- **Шаблоны** - макеты страниц (DashboardLayout, EditorLayout)
- **Страницы** - полные страницы приложения

### Ключевые особенности

✅ **Типобезопасность** - полная поддержка TypeScript  
✅ **Производительность** - оптимизация с React.memo и useMemo  
✅ **Доступность** - соответствие стандартам WCAG  
✅ **Темизация** - поддержка светлой и темной тем  
✅ **Адаптивность** - мобильная оптимизация  
✅ **Тестируемость** - полное покрытие тестами  

## 🏗️ Архитектура

```
client/src/components/
├── atoms/              # Базовые компоненты
│   ├── Button/
│   ├── Input/
│   ├── Icon/
│   ├── Label/
│   └── Typography/
├── molecules/          # Составные компоненты
│   ├── FormField/
│   ├── SearchBox/
│   ├── StatCard/
│   └── UserAvatar/
├── organisms/          # Сложные компоненты
│   ├── DataTable/
│   ├── FormSection/
│   ├── Navigation/
│   └── UserCard/
├── templates/          # Макеты страниц
│   ├── DashboardLayout/
│   ├── EditorLayout/
│   └── AuthLayout/
├── types/              # Общие типы
│   └── component-types.ts
└── index.ts            # Экспорт всех компонентов
```

### Дизайн-система

```
client/src/design-system/
├── tokens/             # Дизайн-токены
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── shadows.ts
├── themes/             # Темы
│   ├── light.ts
│   └── dark.ts
└── utils/              # Утилиты
    ├── cn.ts
    └── variants.ts
```

## 🚀 Установка и настройка

### Импорт компонентов

```tsx
// Импорт отдельных компонентов
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';

// Импорт из индексного файла
import { Button, FormField, DataTable } from '@/components';

// Импорт типов
import type { ButtonProps, FormFieldProps } from '@/components/types';
```

### Настройка темы

```tsx
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <YourApp />
    </ThemeProvider>
  );
}
```

## 🧩 Использование компонентов

### Атомарные компоненты

#### Button

```tsx
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

// Базовая кнопка
<Button variant="primary" size="md">
  Нажми меня
</Button>

// Кнопка с иконкой
<Button 
  variant="outline" 
  icon={<Icon name="fa-solid fa-plus" />}
>
  Добавить
</Button>

// Кнопка в состоянии загрузки
<Button loading disabled>
  Сохранение...
</Button>

// Полиморфная кнопка (как ссылка)
<Button asChild>
  <a href="/profile">Профиль</a>
</Button>
```

#### Input

```tsx
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';

// Базовое поле ввода
<Input placeholder="Введите текст" />

// Поле с иконками
<Input 
  startIcon={<Icon name="fa-solid fa-search" />}
  placeholder="Поиск..."
/>

// Поле с ошибкой
<Input 
  error="Это поле обязательно"
  placeholder="Email"
/>

// Поле в состоянии загрузки
<Input loading placeholder="Поиск..." />
```

### Молекулярные компоненты

#### FormField

```tsx
import { FormField } from '@/components/molecules/FormField';
import { Input } from '@/components/atoms/Input';

// Поле формы с валидацией
<FormField
  label="Email адрес"
  id="email"
  required
  description="Мы используем email для входа в систему"
  error={errors.email}
>
  <Input 
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>

// Горизонтальное поле (для чекбоксов)
<FormField
  label="Получать уведомления"
  id="notifications"
  orientation="horizontal"
  description="Email уведомления о новых функциях"
>
  <input 
    id="notifications"
    type="checkbox"
    checked={notifications}
    onChange={(e) => setNotifications(e.target.checked)}
  />
</FormField>
```

#### StatCard

```tsx
import { StatCard } from '@/components/molecules/StatCard';

// Карточка статистики с изменениями
<StatCard
  title="Всего пользователей"
  value={12567}
  subtitle="Зарегистрированных"
  change={{
    value: '+8.2%',
    type: 'increase',
    label: 'за месяц',
  }}
  variant="success"
  iconName="fa-solid fa-users"
  interactive
  onClick={() => navigate('/users')}
/>

// Карточка в состоянии загрузки
<StatCard
  title="Активные сессии"
  value={0}
  loading
/>
```

### Организменные компоненты

#### DataTable

```tsx
import { DataTable } from '@/components/organisms/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Имя',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Роль',
  },
];

<DataTable
  data={users}
  columns={columns}
  pagination={{
    page: currentPage,
    pageSize: 10,
    total: totalUsers,
    onPageChange: setCurrentPage,
  }}
  sorting={{
    field: sortField,
    direction: sortDirection,
    onSort: handleSort,
  }}
  selection={{
    selectedRows: selectedUsers,
    onSelectionChange: setSelectedUsers,
  }}
/>
```

## 🔧 Создание новых компонентов

### Структура компонента

```
ComponentName/
├── ComponentName.tsx      # Основной компонент
├── ComponentName.test.tsx # Тесты
├── ComponentName.stories.tsx # Storybook stories
└── index.ts              # Экспорт
```

### Шаблон компонента

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BaseComponentProps } from "@/components/types";

/**
 * Варианты компонента с использованием class-variance-authority
 */
const componentVariants = cva(
  "базовые-классы", // базовые стили
  {
    variants: {
      variant: {
        default: "стили-по-умолчанию",
        primary: "основные-стили",
      },
      size: {
        sm: "маленький-размер",
        md: "средний-размер",
        lg: "большой-размер",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

/**
 * Свойства компонента
 */
export interface ComponentNameProps
  extends BaseComponentProps<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  /**
   * Описание свойства
   * 
   * @example
   * ```tsx
   * <ComponentName title="Заголовок" />
   * ```
   */
  title: string;
  
  /**
   * Опциональное свойство с значением по умолчанию
   * 
   * @default false
   */
  optional?: boolean;
}

/**
 * Компонент ComponentName
 * 
 * @description
 * Подробное описание компонента, его назначения и особенностей использования.
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   title="Заголовок"
 *   variant="primary"
 *   size="lg"
 * />
 * ```
 */
const ComponentName = React.memo(
  React.forwardRef<HTMLDivElement, ComponentNameProps>(
    ({ 
      className, 
      variant, 
      size, 
      title, 
      optional = false,
      children,
      ...props 
    }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(componentVariants({ variant, size }), className)}
          {...props}
        >
          <h2>{title}</h2>
          {children}
        </div>
      );
    }
  )
);

ComponentName.displayName = "ComponentName";

export { ComponentName, componentVariants };
```

### Создание тестов

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<ComponentName title="Test" variant="primary" />);
    // Проверка применения правильных CSS классов
  });

  // Дополнительные тесты...
});
```

### Создание Storybook stories

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Описание компонента для документации',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary'],
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Component',
  },
};

export const Primary: Story = {
  args: {
    title: 'Primary Component',
    variant: 'primary',
  },
};
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Запуск всех тестов
npm run test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с покрытием
npm run test:coverage

# Запуск тестов с UI
npm run test:ui
```

### Утилиты для тестирования

```tsx
import { render, screen, userEvent } from '@/test/test-utils';

// render автоматически оборачивает компоненты в провайдеры
const { rerender } = render(<Button>Test</Button>);

// Поддержка тем в тестах
render(<Button>Test</Button>, { theme: 'dark' });

// Мокирование данных
import { mockUser, mockBot } from '@/test/test-utils';
```

## 📚 Storybook

### Запуск Storybook

```bash
# Запуск в режиме разработки
npm run storybook

# Сборка для продакшена
npm run build-storybook
```

### Организация stories

- **Atoms** - `atoms/ComponentName`
- **Molecules** - `molecules/ComponentName`
- **Organisms** - `organisms/ComponentName`
- **Templates** - `templates/LayoutName`

### Полезные аддоны

- **Controls** - интерактивное изменение props
- **Docs** - автоматическая документация
- **A11y** - проверка доступности
- **Viewport** - тестирование на разных экранах

## 💡 Лучшие практики

### Именование

```tsx
// ✅ Хорошо - PascalCase для компонентов
const UserCard = () => {};

// ✅ Хорошо - camelCase для props
interface Props {
  userName: string;
  isActive: boolean;
}

// ✅ Хорошо - kebab-case для CSS классов
className="user-card-container"
```

### Типизация

```tsx
// ✅ Хорошо - явная типизация props
interface ButtonProps extends BaseComponentProps<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: ComponentSize;
}

// ✅ Хорошо - использование дженериков
interface DataTableProps<T> {
  data: T[];
  onRowClick?: (row: T) => void;
}
```

### Производительность

```tsx
// ✅ Хорошо - мемоизация компонентов
const ExpensiveComponent = React.memo(Component);

// ✅ Хорошо - мемоизация вычислений
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Хорошо - стабильные ссылки на функции
const handleClick = useCallback(() => {
  onClick?.(value);
}, [onClick, value]);
```

### Доступность

```tsx
// ✅ Хорошо - семантические HTML теги
<button type="button" aria-label="Закрыть диалог">
  <Icon name="fa-solid fa-times" />
</button>

// ✅ Хорошо - ARIA атрибуты
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// ✅ Хорошо - поддержка клавиатуры
<div 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

### Стилизация

```tsx
// ✅ Хорошо - использование утилиты cn()
className={cn(
  "базовые-классы",
  variant === 'primary' && "primary-классы",
  disabled && "disabled-классы",
  className
)}

// ✅ Хорошо - использование CSS переменных для тем
className="bg-background text-foreground border-border"
```

## 🔗 Полезные ссылки

- [Tailwind CSS](https://tailwindcss.com/) - CSS фреймворк
- [Radix UI](https://www.radix-ui.com/) - Примитивы UI
- [Class Variance Authority](https://cva.style/) - Утилита для вариантов
- [React Hook Form](https://react-hook-form.com/) - Работа с формами
- [Storybook](https://storybook.js.org/) - Инструмент разработки
- [Vitest](https://vitest.dev/) - Фреймворк тестирования
- [Testing Library](https://testing-library.com/) - Утилиты тестирования

## 📝 Changelog

### v1.0.0
- Начальная версия дизайн-системы
- Базовые атомарные компоненты (Button, Input, Icon, Label, Typography)
- Молекулярные компоненты (FormField, SearchBox, StatCard, UserAvatar)
- Система дизайн-токенов и тем
- Полное покрытие тестами
- Storybook документация