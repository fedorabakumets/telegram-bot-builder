/**
 * @fileoverview Компонент конфигурации Telegram Client API
 *
 * Предоставляет интерфейс для настройки и управления Telegram Client API (Userbot):
 * - Настройка режима работы (Bot API / Hybrid / Client API Only)
 * - Ввод API ID и API Hash от my.telegram.org
 * - Авторизация через номер телефона
 * - Просмотр статуса сессии и информации о пользователе
 *
 * @module TelegramClientConfig
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Phone, CheckCircle2, AlertTriangle, LogOut, Settings, Loader2, Users, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TelegramAuth } from '@/components/telegram-auth';
import { GroupMembersClientPanel } from './GroupMembersClientPanel';
import { TEST_CONFIG } from './test-config';

/**
 * Статус авторизации Client API
 */
interface AuthStatus {
  isAuthenticated: boolean;
  hasCredentials: boolean;
  phoneNumber?: string;
  userId?: number;
  username?: string;
}

/**
 * Свойства компонента конфигурации Client API
 */
interface TelegramClientConfigProps {
  projectId: number;
}

/**
 * Компонент настройки Telegram Client API
 *
 * @param {TelegramClientConfigProps} props - Свойства компонента
 * @returns {JSX.Element} Панель конфигурации Client API
 */
export function TelegramClientConfig({ projectId }: TelegramClientConfigProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false, hasCredentials: false });
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const { toast } = useToast();

  /**
   * Загрузка статуса авторизации и настроек
   */
  const loadStatus = async () => {
    try {
      const response = await fetch(`/api/telegram-auth/status?projectId=${projectId}`);
      const status = await response.json();
      setAuthStatus(status);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  /**
   * Обработка успешной авторизации в диалоге
   */
  const handleAuthSuccess = () => {
    loadStatus(); // Обновляем статус после авторизации
    toast({
      title: "Авторизация успешна",
      description: "Теперь вы можете просматривать всех участников группы",
    });
  };

  /**
   * Сохранение API credentials
   */
  const saveCredentials = async () => {
    if (!apiId.trim() || !apiHash.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните API ID и API Hash', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest('POST', '/api/telegram-auth/save-credentials', { apiId, apiHash, projectId });
      if (result.success) {
        toast({ title: 'Успешно', description: 'API credentials сохранены' });
        loadStatus();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Выход из аккаунта Client API
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/telegram-auth/logout', { projectId });
      toast({ title: 'Выполнен выход', description: 'Вы успешно вышли из аккаунта' });
      loadStatus();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить выход', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Сброс API credentials для повторной настройки
   */
  const resetCredentials = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/telegram-auth/reset-credentials', { projectId });
      toast({ title: 'Сброшено', description: 'API credentials удалены. Введите новые данные' });
      setApiId('');
      setApiHash('');
      loadStatus();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сбросить credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Telegram Client API (Userbot)</CardTitle>
          </div>
          <CardDescription>
            Используйте личный аккаунт Telegram для расширенных возможностей
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* API Credentials */}
          {!authStatus.hasCredentials && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Telegram API Credentials</Label>
                <Button
                  onClick={() => {
                    setApiId(TEST_CONFIG.apiId);
                    setApiHash(TEST_CONFIG.apiHash);
                    toast({ title: 'Тестовые данные', description: 'API credentials заполнены' });
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                >
                  <FlaskConical className="h-3 w-3" />
                  Тестовые
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="api-id" className="text-xs">API ID</Label>
                  <Input
                    id="api-id"
                    placeholder="12345678"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="api-hash" className="text-xs">API Hash</Label>
                  <Input
                    id="api-hash"
                    placeholder="abcdef1234567890"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={saveCredentials} disabled={isLoading} className="w-full" size="sm">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
                  Сохранить
                </Button>
                <p className="text-xs text-muted-foreground">
                  Получите на <a href="https://my.telegram.org" target="_blank" className="underline">my.telegram.org</a>
                </p>
              </div>
            </div>
          )}

          {/* API Credentials сохранены */}
          {authStatus.hasCredentials && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Label className="text-sm font-medium text-green-800 dark:text-green-200">API Credentials сохранены</Label>
                </div>
                <Button
                  onClick={resetCredentials}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Сбросить
                </Button>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>• API ID и API Hash успешно сохранены в базе данных</p>
                <p>• Теперь вы можете авторизоваться через Telegram Client API</p>
                <p>• После авторизации будет доступен полный функционал</p>
              </div>
            </div>
          )}

          {/* Статус авторизации */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Статус сессии</Label>
              {authStatus.isAuthenticated ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Авторизован
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Не авторизован
                </Badge>
              )}
            </div>

            {authStatus.isAuthenticated && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><strong>Пользователь:</strong> {authStatus.username || authStatus.phoneNumber}</p>
                <p><strong>ID:</strong> {authStatus.userId}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!authStatus.isAuthenticated && (
                <Button onClick={() => setShowAuthDialog(true)} className="flex-1" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Войти
                </Button>
              )}
              {authStatus.isAuthenticated && (
                <Button onClick={logout} disabled={isLoading} variant="outline" className="flex-1" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              )}
            </div>
          </div>

          {/* Предупреждение */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-medium">Внимание!</p>
                <p>Массовые рассылки могут привести к блокировке аккаунта. Используйте с осторожностью.</p>
              </div>
            </div>
          </div>

          {/* Управление участниками группы */}
          {authStatus.isAuthenticated && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <Label className="text-sm font-medium">Управление участниками группы</Label>
              </div>

              {!showMembersPanel ? (
                <Button
                  onClick={() => setShowMembersPanel(true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Открыть панель участников
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="ID группы (например, -1001234567890)"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => setShowMembersPanel(false)}
                      variant="outline"
                      size="sm"
                    >
                      Закрыть
                    </Button>
                  </div>
                  {selectedGroupId && (
                    <GroupMembersClientPanel
                      projectId={projectId}
                      groupId={selectedGroupId}
                      groupName="Группа"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TelegramAuth
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        projectId={projectId}
        onSuccess={() => {
          loadStatus();
          setShowAuthDialog(false);
        }}
      />
    </>
  );
}
