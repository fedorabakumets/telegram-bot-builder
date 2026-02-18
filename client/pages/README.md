# Pages

Компоненты страниц верхнего уровня для Telegram Bot Builder.

## Структура страниц

### Основные страницы
- **Home** - главная страница с обзором функций
- **Dashboard** - панель управления ботами пользователя
- **BotEditor** - визуальный конструктор ботов
- **Templates** - галерея шаблонов ботов
- **Settings** - настройки пользователя и приложения

### Аутентификация
- **Login** - страница входа в систему
- **Register** - страница регистрации
- **ForgotPassword** - восстановление пароля
- **Profile** - профиль пользователя

### Дополнительные страницы
- **About** - информация о проекте
- **Help** - справка и документация
- **NotFound** - страница 404
- **Error** - страница ошибки

## Архитектура страниц

### Структура компонента страницы
```typescript
// pages/Dashboard.tsx
import React from 'react';
import { Layout } from '@/components/layout';
import { BotList } from '@/components/dashboard';
import { useBots } from '@/hooks';

export function Dashboard() {
  const { bots, loading, error } = useBots();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <Layout>
      <Layout.Header>
        <h1>Мои боты</h1>
      </Layout.Header>
      
      <Layout.Content>
        <BotList bots={bots} />
      </Layout.Content>
    </Layout>
  );
}
```

### Роутинг
Страницы подключаются через роутер Wouter:
```typescript
// App.tsx
import { Route, Switch } from 'wouter';
import { Home, Dashboard, BotEditor, NotFound } from '@/pages';

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/editor/:botId?" component={BotEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

## Типы страниц

### Публичные страницы
Доступны без аутентификации:
- **Home** - лендинг страница
- **About** - информация о проекте
- **Login/Register** - аутентификация

### Приватные страницы
Требуют аутентификации:
- **Dashboard** - панель управления
- **BotEditor** - конструктор ботов
- **Settings** - настройки пользователя

### Защищенные маршруты
```typescript
import { withAuth } from '@/components/auth';

// Обертка для приватных страниц
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedBotEditor = withAuth(BotEditor);

// В роутере
<Route path="/dashboard" component={ProtectedDashboard} />
<Route path="/editor/:botId?" component={ProtectedBotEditor} />
```

## Управление состоянием страниц

### Локальное состояние
Для простого состояния страницы:
```typescript
function BotEditor() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // ...
}
```

### Серверное состояние
Для данных с сервера:
```typescript
function Dashboard() {
  const { 
    data: bots, 
    loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['bots'],
    queryFn: fetchBots
  });
  
  // ...
}
```

### URL состояние
Для состояния, которое должно сохраняться в URL:
```typescript
function BotEditor() {
  const [params, setParams] = useParams();
  const botId = params.botId;
  
  const updateBotId = (newBotId) => {
    setParams({ ...params, botId: newBotId });
  };
  
  // ...
}
```

## SEO и метаданные

### Заголовки страниц
```typescript
import { useTitle } from '@/hooks';

function Dashboard() {
  useTitle('Панель управления - Bot Builder');
  
  // ...
}
```

### Мета-теги
```typescript
import { Helmet } from 'react-helmet-async';

function Home() {
  return (
    <>
      <Helmet>
        <title>Telegram Bot Builder - Создавайте ботов без кода</title>
        <meta name="description" content="Визуальный конструктор для создания Telegram ботов без программирования" />
        <meta property="og:title" content="Telegram Bot Builder" />
        <meta property="og:description" content="Создавайте ботов без кода" />
      </Helmet>
      
      {/* Контент страницы */}
    </>
  );
}
```

## Обработка ошибок

### Границы ошибок
```typescript
import { ErrorBoundary } from '@/components/error';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* Страницы */}
      </Router>
    </ErrorBoundary>
  );
}
```

### Обработка ошибок на уровне страницы
```typescript
function Dashboard() {
  const { bots, loading, error } = useBots();
  
  if (error) {
    return (
      <ErrorPage 
        title="Ошибка загрузки"
        message="Не удалось загрузить список ботов"
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // ...
}
```

## Производительность

### Ленивая загрузка
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
const BotEditor = lazy(() => import('./BotEditor'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/editor" component={BotEditor} />
    </Suspense>
  );
}
```

### Предзагрузка
```typescript
import { preloadRoute } from 'wouter/preload';

function Navigation() {
  return (
    <nav>
      <Link 
        href="/dashboard"
        onMouseEnter={() => preloadRoute('/dashboard')}
      >
        Панель управления
      </Link>
    </nav>
  );
}
```

## Тестирование страниц

### Интеграционные тесты
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('displays user bots', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Мои боты')).toBeInTheDocument();
    });
  });
});
```

### E2E тесты
```typescript
// cypress/e2e/dashboard.cy.ts
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login(); // кастомная команда для входа
    cy.visit('/dashboard');
  });
  
  it('should display user bots', () => {
    cy.get('[data-testid="bot-card"]').should('have.length.greaterThan', 0);
  });
  
  it('should allow creating new bot', () => {
    cy.get('[data-testid="create-bot-button"]').click();
    cy.url().should('include', '/editor');
  });
});
```