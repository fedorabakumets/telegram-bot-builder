import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Play, Square, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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

export function BotControl({ projectId, projectName }: BotControlProps) {
  const [token, setToken] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем статус бота
  const { data: botStatus, isLoading: isLoadingStatus } = useQuery<BotStatusResponse>({
    queryKey: [`/api/projects/${projectId}/bot`],
    refetchInterval: 2000, // Обновляем каждые 2 секунды
  });

  // Запуск бота
  const startBotMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/start`, { token });
    },
    onSuccess: () => {
      toast({
        title: "Бот запущен",
        description: "Бот успешно запущен и готов к работе.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
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

  const isRunning = botStatus?.status === 'running';
  const isError = botStatus?.status === 'error';
  const isStopped = botStatus?.status === 'stopped' || !botStatus?.instance;

  const handleStart = () => {
    if (!token.trim()) {
      toast({
        title: "Требуется токен",
        description: "Введите токен бота для запуска.",
        variant: "destructive",
      });
      return;
    }
    startBotMutation.mutate({ token });
  };

  const handleStop = () => {
    stopBotMutation.mutate();
  };

  const getStatusIcon = () => {
    if (isRunning) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (isRunning) return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">Работает</Badge>;
    if (isError) return <Badge variant="destructive">Ошибка</Badge>;
    return <Badge variant="secondary">Остановлен</Badge>;
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

        {isError && botStatus?.instance?.errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Ошибка:</strong> {botStatus.instance.errorMessage}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Токен бота</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="Введите токен бота от @BotFather"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isRunning}
            />
            <p className="text-xs text-muted-foreground">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div className="flex gap-2">
            {isStopped || isError ? (
              <Button
                onClick={handleStart}
                disabled={startBotMutation.isPending || !token.trim()}
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
        </div>

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