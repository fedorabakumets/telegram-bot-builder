# Components

React компоненты для пользовательского интерфейса Telegram Bot Builder.

## Структура

### `ui/` - Базовые UI компоненты
Переиспользуемые компоненты пользовательского интерфейса на основе Radix UI:
- **Кнопки** - различные варианты кнопок
- **Формы** - поля ввода, селекты, чекбоксы
- **Модальные окна** - диалоги и всплывающие окна
- **Навигация** - табы, меню, хлебные крошки
- **Обратная связь** - уведомления, загрузчики, прогресс-бары

### `editor/` - Компоненты редактора ботов
Специализированные компоненты для визуального конструктора:
- **Canvas** - холст для размещения узлов
- **Nodes** - различные типы узлов (команды, сообщения, условия)
- **Connections** - связи между узлами
- **Toolbar** - панель инструментов
- **Properties Panel** - панель свойств выбранного узла

### `forms/` - Компоненты форм
Специализированные формы для различных задач:
- **Bot Creation Form** - форма создания нового бота
- **Settings Form** - форма настроек
- **Authentication Forms** - формы входа и регистрации
- **Template Forms** - формы для работы с шаблонами

### `layout/` - Компоненты макета
Компоненты для организации структуры страниц:
- **Header** - шапка приложения
- **Sidebar** - боковая панель навигации
- **Footer** - подвал страницы
- **Container** - контейнеры для контента

### `dashboard/` - Компоненты панели управления
Компоненты для отображения данных и управления ботами:
- **Bot Cards** - карточки ботов
- **Statistics** - статистика и аналитика
- **Tables** - таблицы данных
- **Charts** - графики и диаграммы

## Принципы разработки компонентов

### Композиция над наследованием
```typescript
// Хорошо: композиция
function Dialog({ children, ...props }) {
  return (
    <DialogRoot {...props}>
      <DialogContent>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}

// Плохо: наследование
class Dialog extends BaseDialog {
  // ...
}
```

### Единственная ответственность
Каждый компонент должен иметь одну четко определенную задачу:
```typescript
// Хорошо: компонент только для отображения пользователя
function UserAvatar({ user, size = 'md' }) {
  return (
    <img 
      src={user.avatar} 
      alt={user.name}
      className={`avatar avatar-${size}`}
    />
  );
}

// Плохо: компонент делает слишком много
function UserComponent({ user }) {
  // логика аутентификации
  // логика обновления профиля
  // логика отображения
  // и т.д.
}
```

### Контролируемые компоненты
Предпочитайте контролируемые компоненты неконтролируемым:
```typescript
// Хорошо: контролируемый компонент
function Input({ value, onChange, ...props }) {
  return (
    <input 
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}

// Использование
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

## Паттерны компонентов

### Compound Components
Для сложных компонентов с несколькими частями:
```typescript
function Dialog({ children }) {
  return <DialogProvider>{children}</DialogProvider>;
}

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;

// Использование
<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>Title</Dialog.Header>
    <p>Content</p>
    <Dialog.Footer>
      <Button>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

### Render Props
Для переиспользования логики рендеринга:
```typescript
function DataFetcher({ url, children }) {
  const [data, loading, error] = useFetch(url);
  
  return children({ data, loading, error });
}

// Использование
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

### Higher-Order Components (HOC)
Для добавления функциональности к компонентам:
```typescript
function withAuth<T>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user, loading } = useAuth();
    
    if (loading) return <Spinner />;
    if (!user) return <LoginForm />;
    
    return <Component {...props} />;
  };
}

// Использование
const ProtectedDashboard = withAuth(Dashboard);
```

## Стилизация компонентов

### Tailwind CSS классы
```typescript
function Button({ variant = 'primary', size = 'md', children, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50'
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg'
  };
  
  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
```

### CSS Modules (при необходимости)
```typescript
import styles from './Component.module.css';

function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Title</h1>
    </div>
  );
}
```

## Тестирование компонентов

### Unit тесты
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Storybook истории
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};
```