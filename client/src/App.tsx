import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ServerStatus } from "@/components/server-status";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import React from "react";
import type { TelegramUser } from "@/hooks/use-telegram-auth";

// Ленивая загрузка страниц для улучшения производительности
const Home = lazy(() => import("@/pages/home"));
const Editor = lazy(() => import("@/pages/editor"));
const BotPreview = lazy(() => import("@/pages/bot-preview"));
const TemplatesPage = lazy(() => import("@/pages/templates-wrapper"));
const DatabaseManager = lazy(() => import("@/pages/DatabaseManager"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Более красивый компонент загрузки
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

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/projects" component={Home} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/database" component={DatabaseManager} />
        <Route path="/preview/:id" component={BotPreview} />
        <Route path="/editor/:id" component={Editor} />
        <Route path="/projects/:id" component={Editor} />
        <Route path="/" component={Editor} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Слушаем на событие авторизации из окна Telegram Login
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'telegram-auth' && event.data.user) {
        try {
          // КРИТИЧНО: Отправляем POST запрос на бэк для создания сессии
          const telegramUser = event.data.user;
          const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // КРИТИЧНО: отправляем cookies для сессии
            body: JSON.stringify({
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              username: telegramUser.username,
              photo_url: telegramUser.photo_url,
              auth_date: telegramUser.auth_date,
              hash: telegramUser.hash,
            }),
          });

          if (response.ok) {
            console.log('✅ Auth POST successful - session created on server');
            // Сохраняем пользователя в localStorage для обновления hook'а
            localStorage.setItem('telegramUser', JSON.stringify(event.data.user));
            // КРИТИЧНО: Явно инвалидируем ВСЕ кеши и рефрешим запросы
            setTimeout(() => {
              // Отправляем custom event для обновления всех компонентов
              window.dispatchEvent(new CustomEvent('telegram-auth-change', {
                detail: { user: event.data.user }
              }));
              // Инвалидируем и рефрешим запросы
              queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
              queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
              queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              // Явно рефрешим для немедленной загрузки
              queryClient.refetchQueries({ queryKey: ['/api/templates/category/custom'] });
              queryClient.refetchQueries({ queryKey: ['/api/projects'] });
            }, 100);
          } else {
            console.error('❌ Auth POST failed:', response.status);
          }
        } catch (e) {
          console.error('Error in auth flow:', e);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="telegram-bot-builder-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ServerStatus />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
