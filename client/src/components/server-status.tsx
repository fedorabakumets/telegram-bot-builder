import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ServerHealthStatus {
  database: boolean;
  templates: boolean;
  telegram: boolean;
  ready: boolean;
}

export function ServerStatus() {
  const [status, setStatus] = useState<ServerHealthStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
      
      // Автоматически скрываем индикатор когда все готово
      if (data.ready) {
        setTimeout(() => setIsVisible(false), 2000);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      // Повторяем проверку через 2 секунды при ошибке
      setTimeout(checkHealth, 2000);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Только делаем один запрос при загрузке, дальше полагаемся на кеширование
    let interval: NodeJS.Timeout | null = null;
    
    if (!status?.ready) {
      // Проверяем каждые 5 секунд только если сервер не готов
      interval = setInterval(checkHealth, 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status?.ready]);

  // Не показываем индикатор если статус неизвестен или система готова и прошло время
  if (!status || (!isVisible && status.ready)) {
    return null;
  }

  // Не показываем если уже все готово
  if (status.ready && isVisible) {
    return (
      <Alert className="fixed top-4 right-4 w-80 z-50 border-green-200 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Сервер готов к работе!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="fixed top-4 right-4 w-80 z-50">
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Загрузка сервера...</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkHealth}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {status.database ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
              )}
              <span className={status.database ? 'text-green-700 dark:text-green-300' : 'text-orange-600 dark:text-orange-400'}>
                База данных
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {status.templates ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
              )}
              <span className={status.templates ? 'text-green-700 dark:text-green-300' : 'text-orange-600 dark:text-orange-400'}>
                Шаблоны
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {status.telegram ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
              )}
              <span className={status.telegram ? 'text-green-700 dark:text-green-300' : 'text-orange-600 dark:text-orange-400'}>
                Telegram
              </span>
            </div>
          </div>
          
          {!status.ready && (
            <div className="text-xs text-muted-foreground mt-2">
              Некоторые функции могут быть временно недоступны
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}