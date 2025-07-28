import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Play, Square, AlertCircle, CheckCircle, Clock, Trash2, Edit, Settings, AlertTriangle, Activity } from 'lucide-react';
import { TokenManager } from './token-manager';

interface BotControlProps {
  projectId: number;
  projectName: string;
}

interface BotInstance {
  id: number;
  projectId: number;
  status: 'running' | 'stopped' | 'error';
  token: string;
  processId?: string;
  startedAt: Date;
  stoppedAt?: Date;
  errorMessage?: string;
}

interface BotStatusResponse {
  status: 'running' | 'stopped' | 'error';
  instance: BotInstance | null;
}

interface TokenInfo {
  hasToken: boolean;
  tokenPreview: string | null;
}

interface BotToken {
  id: number;
  projectId: number;
  name: string;
  token: string;
  isDefault: number;
  isActive: number;
  description?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DefaultTokenResponse {
  hasDefault: boolean;
  token: BotToken | null;
}

export function BotControl({ projectId, projectName }: BotControlProps) {
  const [token, setToken] = useState('');
  const [useNewToken, setUseNewToken] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [startMode, setStartMode] = useState<'token' | 'new' | 'saved'>('token'); // token management, new token, or legacy saved token
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем статус бота
  const { data: botStatus, isLoading: isLoadingStatus } = useQuery<BotStatusResponse>({
    queryKey: [`/api/projects/${projectId}/bot`],
    refetchInterval: 1000, // Обновляем каждую секунду для лучшего отслеживания
  });

  // Получаем информацию о сохраненном токене (legacy)
  const { data: tokenInfo } = useQuery<TokenInfo>({
    queryKey: [`/api/projects/${projectId}/token`],
  });

  // Получаем все токены проекта
  const { data: tokens = [] } = useQuery<BotToken[]>({
    queryKey: [`/api/projects/${projectId}/tokens`],
  });

  // Получаем токен по умолчанию
  const { data: defaultTokenData } = useQuery<DefaultTokenResponse>({
    queryKey: [`/api/projects/${projectId}/tokens/default`],
  });

  // Запуск бота
  const startBotMutation = useMutation({
    mutationFn: async ({ token, tokenId }: { token?: string; tokenId?: number }) => {
      const payload: any = {};
      if (token) payload.token = token;
      if (tokenId) payload.tokenId = tokenId;
      return apiRequest('POST', `/api/projects/${projectId}/bot/start`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Бот запущен",
        description: "Бот успешно запущен и готов к работе.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка запуска",
        description: error.message || "Не удалось запустить бота. Проверьте токен.",
        variant: "destructive",
      });
    },
  });

  // Остановка бота
  const stopBotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/stop`, {});
    },
    onSuccess: () => {
      toast({
        title: "Бот остановлен",
        description: "Бот успешно остановлен.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка остановки",
        description: error.message || "Не удалось остановить бота.",
        variant: "destructive",
      });
    },
  });

  // Очистка сохраненного токена
  const clearTokenMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/projects/${projectId}/token`, {});
    },
    onSuccess: () => {
      toast({
        title: "Токен удален",
        description: "Сохраненный токен бота удален.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/token`] });
      setUseNewToken(true);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить токен.",
        variant: "destructive",
      });
    },
  });

  const isRunning = botStatus?.status === 'running';
  const isError = botStatus?.status === 'error';
  const isStopped = botStatus?.status === 'stopped' || !botStatus?.instance;

  const handleStart = () => {
    if (startMode === 'new') {
      // Используем новый токен
      const tokenToUse = token.trim();
      if (!tokenToUse) {
        toast({
          title: "Требуется токен",
          description: "Введите токен бота для запуска.",
          variant: "destructive",
        });
        return;
      }
      startBotMutation.mutate({ token: tokenToUse });
    } else if (startMode === 'token') {
      // Используем выбранный токен или токен по умолчанию
      if (selectedTokenId) {
        startBotMutation.mutate({ tokenId: selectedTokenId });
      } else if (defaultTokenData?.hasDefault && defaultTokenData.token) {
        startBotMutation.mutate({ tokenId: defaultTokenData.token.id });
      } else {
        toast({
          title: "Требуется токен",
          description: "Выберите токен или добавьте новый для запуска бота.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Legacy режим - используем сохраненный токен проекта
      const tokenToUse = useNewToken ? token.trim() : '';
      
      if (useNewToken && !tokenToUse) {
        toast({
          title: "Требуется токен",
          description: "Введите токен бота для запуска.",
          variant: "destructive",
        });
        return;
      }
      
      if (!useNewToken && !tokenInfo?.hasToken) {
        toast({
          title: "Требуется токен",
          description: "Токен не сохранен. Введите новый токен.",
          variant: "destructive",
        });
        setUseNewToken(true);
        return;
      }
      
      startBotMutation.mutate({ token: tokenToUse });
    }
  };

  const handleStop = () => {
    stopBotMutation.mutate();
  };

  const getStatusIcon = () => {
    if (isRunning) return <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />;
    if (isError) return <AlertCircle className="w-5 h-5 text-red-500 animate-bounce" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (isRunning) return (
      <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 animate-pulse">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
          Работает
        </div>
      </Badge>
    );
    if (isError) return (
      <Badge variant="destructive" className="animate-pulse">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
          Ошибка
        </div>
      </Badge>
    );
    return (
      <Badge variant="secondary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full" />
          Остановлен
        </div>
      </Badge>
    );
  };

  const getStatusDetails = () => {
    if (!botStatus?.instance) return null;
    
    const instance = botStatus.instance;
    const now = new Date();
    const startTime = new Date(instance.startedAt);
    const stopTime = instance.stoppedAt ? new Date(instance.stoppedAt) : null;
    
    if (isRunning) {
      const uptime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      return (
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Процесс ID:</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {instance.processId || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Время работы:</span>
            <span className="font-mono text-xs">
              {hours > 0 ? `${hours}ч ` : ''}{minutes > 0 ? `${minutes}м ` : ''}{seconds}с
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Запущен:</span>
            <span className="text-xs">{startTime.toLocaleTimeString()}</span>
          </div>
        </div>
      );
    }
    
    if (isError && instance.errorMessage) {
      return (
        <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Ошибка:</span>
            <span className="text-xs">{stopTime?.toLocaleTimeString()}</span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs font-mono">
            {instance.errorMessage}
          </div>
        </div>
      );
    }
    
    if (stopTime) {
      return (
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Остановлен:</span>
            <span className="text-xs">{stopTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Время работы:</span>
            <span className="text-xs font-mono">
              {Math.floor((stopTime.getTime() - startTime.getTime()) / 1000)}с
            </span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Управление ботом
          {isRunning && (
            <div className="flex items-center gap-1 ml-auto">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-sm font-normal text-green-600 dark:text-green-400">
                Активен
              </span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Запустите или остановите бота "{projectName}"
          {isRunning && botStatus?.instance?.processId && (
            <span className="block text-xs text-muted-foreground mt-1">
              Процесс ID: {botStatus.instance.processId}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Предупреждение о множественных процессах */}
        {isRunning && startBotMutation.isPending && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Внимание: Запуск нового процесса
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Уже запущен процесс {botStatus?.instance?.processId}. Новый процесс может создать конфликт.
            </p>
          </div>
        )}
        
        {/* Предупреждение о частых перезапусках */}
        {stopBotMutation.isPending && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Остановка процесса...
              </span>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Процесс {botStatus?.instance?.processId} завершается. Подождите завершения.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Статус:</span>
              {getStatusBadge()}
            </div>
            {isRunning && (
              <Button 
                onClick={handleStop} 
                variant="outline" 
                size="sm"
                disabled={stopBotMutation.isPending}
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                {stopBotMutation.isPending ? 'Остановка...' : 'Остановить'}
              </Button>
            )}
          </div>
          
          {getStatusDetails() && (
            <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg border">
              {getStatusDetails()}
            </div>
          )}
          
          {/* Индикатор обновления статуса */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span>Статус обновляется каждую секунду</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span>Онлайн</span>
            </div>
          </div>
        </div>

        <Separator />

        <Tabs value={startMode} onValueChange={(value) => setStartMode(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="token">Токены</TabsTrigger>
            <TabsTrigger value="new">Новый токен</TabsTrigger>
            <TabsTrigger value="saved">Сохраненный</TabsTrigger>
          </TabsList>
          
          <TabsContent value="token" className="space-y-4">
            <div className="space-y-3">
              {tokens.length > 0 ? (
                <div className="space-y-2">
                  <Label>Выберите токен для запуска:</Label>
                  <Select 
                    value={selectedTokenId?.toString() || (defaultTokenData?.token?.id.toString() || "")}
                    onValueChange={(value) => setSelectedTokenId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите токен" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.id} value={token.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{token.name}</span>
                            {token.isDefault === 1 && (
                              <Badge variant="secondary" className="ml-2">По умолчанию</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {defaultTokenData?.hasDefault && (
                    <p className="text-xs text-muted-foreground">
                      Токен по умолчанию: {defaultTokenData.token?.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Токены не найдены</p>
                  <p className="text-sm text-muted-foreground">
                    Добавьте токен для запуска бота
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="new-bot-token">Токен бота</Label>
              <Input
                id="new-bot-token"
                type="password"
                placeholder="Введите токен бота от @BotFather"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                Введите токен для одноразового запуска. Токен не будет сохранен.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4">
            <div className="space-y-3">
              {/* Информация о сохраненном токене */}
              {tokenInfo?.hasToken && !useNewToken && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Токен сохранен
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {tokenInfo.tokenPreview}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUseNewToken(true)}
                        className="text-xs"
                      >
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearTokenMutation.mutate()}
                        disabled={clearTokenMutation.isPending}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ввод нового токена */}
              {(useNewToken || !tokenInfo?.hasToken) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bot-token">Токен бота</Label>
                    {tokenInfo?.hasToken && useNewToken && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setUseNewToken(false);
                          setToken('');
                        }}
                        className="text-xs h-auto p-1"
                      >
                        Использовать сохраненный
                      </Button>
                    )}
                  </div>
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="Введите токен бота от @BotFather"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите токен у @BotFather в Telegram. Токен будет сохранен для следующих запусков.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex gap-2">
          {isStopped || isError ? (
            <Button
              onClick={handleStart}
              disabled={
                startBotMutation.isPending || 
                (startMode === 'new' && !token.trim()) ||
                (startMode === 'token' && !selectedTokenId && !defaultTokenData?.hasDefault) ||
                (startMode === 'saved' && ((useNewToken && !token.trim()) || (!useNewToken && !tokenInfo?.hasToken)))
              }
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {startBotMutation.isPending ? 'Запуск...' : 'Запустить бота'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={stopBotMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              {stopBotMutation.isPending ? 'Остановка...' : 'Остановить бота'}
            </Button>
          )}
        </div>

        {/* Token Management Section */}
        <Separator />
        
        <TokenManager 
          projectId={projectId} 
          onTokenSelect={setSelectedTokenId}
          selectedTokenId={selectedTokenId}
        />

        {botStatus?.instance && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Запущен:</strong> {new Date(botStatus.instance.startedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
            </p>
            {botStatus.instance.stoppedAt && (
              <p>
                <strong>Остановлен:</strong> {new Date(botStatus.instance.stoppedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}