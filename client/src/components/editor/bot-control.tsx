import { useState, useEffect } from 'react';
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
import { Play, Square, AlertCircle, CheckCircle, Clock, Trash2, Edit, Settings } from 'lucide-react';
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
  const [currentUptime, setCurrentUptime] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем статус бота с улучшенным обновлением
  const { data: botStatus, isLoading: isLoadingStatus, isError: isStatusError } = useQuery<BotStatusResponse>({
    queryKey: [`/api/projects/${projectId}/bot`],
    refetchInterval: 2000, // Обновляем каждые 2 секунды
    refetchOnWindowFocus: true, // Обновляем при возврате к окну
    retry: 3, // Повторяем запросы при ошибках
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

  // Автоматически выбираем токен по умолчанию при загрузке
  useEffect(() => {
    if (defaultTokenData?.hasDefault && defaultTokenData.token && !selectedTokenId) {
      setSelectedTokenId(defaultTokenData.token.id);
    } else if (tokens.length === 1 && !selectedTokenId) {
      // Если есть только один токен, выбираем его автоматически
      setSelectedTokenId(tokens[0].id);
    }
  }, [defaultTokenData, tokens, selectedTokenId]);

  // Запуск бота
  const startBotMutation = useMutation({
    mutationFn: async ({ token, tokenId }: { token?: string; tokenId?: number }) => {
      const payload: any = {};
      if (token) payload.token = token;
      if (tokenId) payload.tokenId = tokenId;
      return apiRequest('POST', `/api/projects/${projectId}/bot/start`, payload);
    },
    onSuccess: (data) => {
      toast({
        title: "Бот запущен",
        description: "Бот успешно запущен и готов к работе. Структура бота автоматически применена.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens/default`] });
      // Сбрасываем состояние формы после успешного запуска
      setToken('');
      setSelectedTokenId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка запуска",
        description: error.message || "Не удалось запустить бота. Проверьте токен и убедитесь, что он не используется в другом месте.",
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
        description: "Бот успешно остановлен. Для перезапуска используйте актуальные настройки.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка остановки",
        description: error.message || "Не удалось остановить бота. Попробуйте еще раз или перезагрузите страницу.",
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

  // Обновляем время работы каждую секунду для запущенных ботов
  useEffect(() => {
    if (!isRunning || !botStatus?.instance?.startedAt) {
      setCurrentUptime('');
      return;
    }

    const updateUptime = () => {
      const startTime = new Date(botStatus.instance!.startedAt).getTime();
      const now = new Date().getTime();
      const uptime = now - startTime;
      
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
      
      let uptimeString = '';
      if (days > 0) uptimeString += `${days}д `;
      if (hours > 0) uptimeString += `${hours}ч `;
      if (minutes > 0) uptimeString += `${minutes}м `;
      uptimeString += `${seconds}с`;
      
      setCurrentUptime(uptimeString);
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [isRunning, botStatus?.instance?.startedAt]);

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
        // Автоматически используем токен по умолчанию
        setSelectedTokenId(defaultTokenData.token.id);
        startBotMutation.mutate({ tokenId: defaultTokenData.token.id });
      } else if (tokens.length === 1) {
        // Если есть только один токен, используем его автоматически
        setSelectedTokenId(tokens[0].id);
        startBotMutation.mutate({ tokenId: tokens[0].id });
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
    if (isLoadingStatus) return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
    if (isRunning) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isStatusError) return <AlertCircle className="w-4 h-4 text-orange-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (isLoadingStatus) return <Badge variant="secondary" className="animate-pulse">Проверка...</Badge>;
    if (isRunning) return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">Работает</Badge>;
    if (isError) return <Badge variant="destructive">Ошибка</Badge>;
    if (isStatusError) return <Badge variant="outline" className="text-orange-600 border-orange-300">Соединение</Badge>;
    return <Badge variant="secondary">Остановлен</Badge>;
  };

  const getStatusDetails = () => {
    if (isRunning && currentUptime) {
      return `Работает ${currentUptime}`;
    }
    if (isError && botStatus?.instance?.errorMessage) {
      return `Ошибка: ${botStatus.instance.errorMessage}`;
    }
    if (isStatusError) {
      return "Проблема с подключением к серверу";
    }
    if (isLoadingStatus) {
      return "Проверяем состояние бота...";
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Управление ботом
        </CardTitle>
        <CardDescription>
          Запустите или остановите бота "{projectName}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Статус:</span>
              {getStatusBadge()}
            </div>
            {botStatus?.instance?.processId && (
              <span className="text-xs text-muted-foreground">
                PID: {botStatus.instance.processId}
              </span>
            )}
          </div>
          
          {getStatusDetails() && (
            <div className="text-sm text-muted-foreground">
              {getStatusDetails()}
            </div>
          )}
          
          {isRunning && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-xs text-green-700 dark:text-green-300">
                ✅ Бот работает с текущими настройками. При изменении структуры в редакторе бот автоматически перезапустится с новыми параметрами.
              </p>
            </div>
          )}
        </div>

        {isError && botStatus?.instance?.errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Ошибка:</strong> {botStatus.instance.errorMessage}
            </p>
          </div>
        )}

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
                      <SelectValue placeholder="Выберите токен для запуска" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.id} value={token.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{token.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {token.token.substring(0, 10)}...
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {token.isDefault === 1 && (
                                <Badge variant="default" className="text-xs">По умолчанию</Badge>
                              )}
                              {token.lastUsedAt && (
                                <Badge variant="outline" className="text-xs">Использовался</Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {defaultTokenData?.hasDefault && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        🔧 Токен по умолчанию: <strong>{defaultTokenData.token?.name}</strong>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        При изменении структуры бота он автоматически перезапустится с этим токеном.
                      </p>
                    </div>
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
              <strong>Запущен:</strong> {new Date(botStatus.instance.startedAt).toLocaleString('ru-RU')}
            </p>
            {botStatus.instance.stoppedAt && (
              <p>
                <strong>Остановлен:</strong> {new Date(botStatus.instance.stoppedAt).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}