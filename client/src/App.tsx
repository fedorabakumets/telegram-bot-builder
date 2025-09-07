import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ServerStatus } from "@/components/server-status";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
import TemplatesPage from "@/pages/templates";
import DatabaseManager from "@/pages/DatabaseManager";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Editor} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/projects" component={Home} />
      <Route path="/projects/:id" component={Editor} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/database" component={DatabaseManager} />
      <Route component={NotFound} />
    </Switch>
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
