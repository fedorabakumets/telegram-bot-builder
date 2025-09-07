import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ServerStatus } from "@/components/server-status";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Ленивая загрузка страниц для улучшения производительности
const Home = lazy(() => import("@/pages/home"));
const Editor = lazy(() => import("@/pages/editor"));
const TemplatesPage = lazy(() => import("@/pages/templates").then(m => ({ default: m.TemplatesPage })));
const DatabaseManager = lazy(() => import("@/pages/DatabaseManager"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Компонент загрузки
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/" component={Editor} />
        <Route path="/editor/:id" component={Editor} />
        <Route path="/projects" component={Home} />
        <Route path="/projects/:id" component={Editor} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/database" component={DatabaseManager} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="telegram-bot-builder-theme">
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
