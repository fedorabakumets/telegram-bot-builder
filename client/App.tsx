/**
 * @file App.tsx
 * @brief Главный компонент приложения Telegram Bot Builder
 *
 * Этот файл содержит основной компонент приложения, который управляет:
 * - Роутингом между различными страницами
 * - Ленивой загрузкой компонентов для оптимизации производительности
 * - Обработкой авторизации через Telegram
 * - Предоставлением контекста и провайдеров для всего приложения
 *
 * @author Telegram Bot Builder Team
 * @version 1.0
 * @date 2026
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/editor/header/utils/theme-provider";
import { ServerStatus } from "@/components/server-status";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BotLogsProvider } from "./components/editor/bot/contexts/bot-logs-context";
import { ActiveTerminalsProvider } from "./components/editor/bot/contexts/ActiveTerminalsContext";
import { TerminalAutoRegister } from "./components/editor/bot/hooks/TerminalAutoRegister";
import { ProjectsChangedListener } from "@/components/projects-changed-listener";
import { SetupGuard } from "@/components/editor/setup";
import { NoProjectsScreen } from "@/components/editor/no-projects";
import { useTelegramAuth } from "@/components/editor/header/hooks/use-telegram-auth";
import { isGuest } from "@/types/telegram-user";
import { apiRequest } from "@/queryClient";

// Ленивая загрузка страниц для улучшения производительности
const Home = lazy(() => import("@/pages/home"));
const Editor = lazy(() => import("@/pages/editor"));
const TemplatesPage = lazy(() => import("@/components/editor/scenariy"));
const NotFound = lazy(() => import("@/pages/not-found"));

/**
 * @brief Компонент индикатора загрузки
 *
 * Отображает визуальный индикатор загрузки при ленивой загрузке компонентов.
 * Содержит анимированный спиннер и текст информирующий пользователя о процессе загрузки.
 *
 * @returns JSX.Element Компонент индикатора загрузки
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-6">
        {/* Логотип или иконка */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20"></div>
          <Loader2 className="h-16 w-16 animate-spin text-primary absolute inset-0" />
        </div>

        {/* Текст загрузки */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-foreground">Telegram Bot Builder</h3>
          <p className="text-sm text-muted-foreground">Загружаем интерфейс...</p>

          {/* Индикатор прогресса */}
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Гард проектов: если авторизованный пользователь не имеет проектов — показывает NoProjectsScreen.
 * Не срабатывает на страницах /templates и /not-found.
 * Во время загрузки не рендерит ничего — предотвращает мигание между страницами.
 */
function ProjectsGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, sessionReady } = useTelegramAuth();
  const isGuestUser = !user || isGuest(user);

  // На этих страницах гард не блокирует
  const isExcluded =
    location.startsWith('/templates') ||
    location.startsWith('/not-found');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects/list', isGuestUser ? 'anon' : (user as { id: number }).id],
    queryFn: () => apiRequest('GET', '/api/projects/list'),
    enabled: sessionReady && !isGuestUser && !isExcluded,
  });

  // Пока сессия не готова или идёт загрузка — не рендерим ничего, чтобы не было мигания
  if (!isExcluded && !isGuestUser && (!sessionReady || isLoading)) return null;

  const showNoProjects = sessionReady && !isLoading && !isGuestUser && !isExcluded && projects.length === 0;

  if (showNoProjects) return <NoProjectsScreen />;

  return <>{children}</>;
}

/**
 * @brief Компонент маршрутизации приложения
 *
 * Определяет маршруты приложения и сопоставляет их с соответствующими компонентами.
 * Использует Suspense для обработки ленивой загрузки компонентов.
 *
 * @returns JSX.Element Компонент маршрутизации
 */
function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SetupGuard>
        <TerminalAutoRegister />
        <ProjectsChangedListener />
        <ProjectsGuard>
          <Switch>
            <Route path="/projects" component={Home} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/editor/:id" component={Editor} />
            <Route path="/projects/:id" component={Editor} />
            <Route path="/" component={Editor} />
            <Route component={NotFound} />
          </Switch>
        </ProjectsGuard>
      </SetupGuard>
    </Suspense>
  );
}

/**
 * @brief Главный компонент приложения
 *
 * Основной компонент приложения, который:
 * - Обрабатывает события авторизации через Telegram
 * - Предоставляет провайдеры темы, запросов, тостов и подсказок
 * - Отображает статус сервера и маршрутизацию
 *
 * @returns JSX.Element Главный компонент приложения
 */
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="telegram-bot-builder-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BotLogsProvider>
            <ActiveTerminalsProvider>
              <ServerStatus />
              <Toaster />
              <Router />
            </ActiveTerminalsProvider>
          </BotLogsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/**
 * @brief Экспорт главного компонента приложения
 *
 * Экспортирует компонент App по умолчанию для использования в других модулях
 */
export default App;
