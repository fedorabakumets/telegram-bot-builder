/**
 * @fileoverview Компонент управления участниками группы через Telegram Client API
 *
 * Предоставляет интерфейс для:
 * - Загрузки участников группы через Client API
 * - Отображения списка участников с сортировкой по источнику (БД / API)
 * - Управления участниками (бан, кик, продвижение и т.д.)
 *
 * @module GroupMembersClientPanel
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Loader2, Crown, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TelegramAuth } from '@/components/telegram-auth';

/**
 * Свойства компонента управления участниками
 */
interface GroupMembersClientPanelProps {
  projectId: number;
  groupId: string;
  groupName: string;
}

/**
 * Компонент управления участниками группы через Client API
 *
 * @param {GroupMembersClientPanelProps} props - Свойства компонента
 * @returns {JSX.Element} Панель управления участниками
 */
export function GroupMembersClientPanel({ projectId, groupId, groupName }: GroupMembersClientPanelProps) {
  const [clientApiMembers, setClientApiMembers] = useState<any[]>([]);
  const [savedMembers, setSavedMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ isAuthenticated: boolean; hasCredentials: boolean }>({
    isAuthenticated: false,
    hasCredentials: false
  });
  const { toast } = useToast();

  /**
   * Загрузка статуса авторизации
   */
  const loadAuthStatus = async () => {
    try {
      const response = await fetch(`/api/telegram-auth/status?projectId=${projectId}`);
      const status = await response.json();
      setAuthStatus({
        isAuthenticated: status.isAuthenticated || false,
        hasCredentials: status.hasCredentials || false
      });
    } catch (error) {
      console.error('Ошибка загрузки статуса авторизации:', error);
    }
  };

  // Загружаем статус при монтировании
  React.useEffect(() => {
    loadAuthStatus();
  }, [projectId]);

  /**
   * Загрузка участников группы через Client API
   */
  const loadMembers = async () => {
    if (!authStatus.isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Сначала выполните вход через Telegram Client API",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/telegram-client/group-members/${groupId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setClientApiMembers(data.members || []);
        toast({
          title: data.message,
          description: `Получено ${data.memberCount} участников через Client API`,
        });
      } else {
        toast({
          title: data.message || "Ошибка",
          description: data.explanation || "Не удалось получить данные",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к Client API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обработка успешной авторизации
   */
  const handleAuthSuccess = async () => {
    await loadAuthStatus();
    await loadMembers();
  };

  /**
   * Получение объединённого списка участников
   * @returns {Array} Массив участников с указанием источника
   */
  const getAllMembers = () => {
    const allMembers = [];

    // Добавляем сохранённых участников из базы данных
    if (savedMembers.length > 0) {
      allMembers.push(...savedMembers.map(member => ({ ...member, sourceType: 'database' })));
    }

    // Добавляем участников из Client API (если нет дубликатов)
    if (clientApiMembers.length > 0) {
      const uniqueApiMembers = clientApiMembers.filter(apiMember => {
        const apiUserId = apiMember.id?.toString() || apiMember.user?.id?.toString() || apiMember.userId?.toString();
        return !savedMembers.some(savedMember =>
          savedMember.user?.id?.toString() === apiUserId
        );
      });
      allMembers.push(...uniqueApiMembers.map(member => ({ ...member, sourceType: 'api' })));
    }

    return allMembers;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Заголовок и кнопка загрузки */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Участники группы</h3>
            <p className="text-sm text-muted-foreground">{groupName}</p>
          </div>
          <Button
            onClick={() => setShowAuthDialog(true)}
            disabled={isLoading}
            className="gap-2"
            variant={!authStatus.hasCredentials ? 'secondary' : 'default'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {!authStatus.hasCredentials ? 'Настроить Client API' :
              !authStatus.isAuthenticated ? 'Войти' :
              clientApiMembers.length > 0 ? 'Обновить' : 'Загрузить'}
          </Button>
        </div>

        {/* Статус авторизации */}
        {!authStatus.hasCredentials && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Требуется настройка Client API</p>
                <p>Сначала сохраните API ID и API Hash в настройках Telegram Client API</p>
              </div>
            </div>
          </div>
        )}
        {authStatus.hasCredentials && !authStatus.isAuthenticated && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">API Credentials сохранены ✓</p>
                <p>API ID и API Hash успешно сохранены. Нажмите «Войти» для авторизации через Telegram</p>
              </div>
            </div>
          </div>
        )}
        {authStatus.isAuthenticated && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-xs text-green-800 dark:text-green-200">
                <p className="font-semibold mb-1">Авторизован ✓</p>
                <p>Вы успешно авторизованы в Telegram Client API</p>
              </div>
            </div>
          </div>
        )}

        {/* Статистика */}
        {clientApiMembers.length > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Из API: <strong>{clientApiMembers.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Из БД: <strong>{savedMembers.length}</strong></span>
            </div>
          </div>
        )}

        {/* Список участников */}
        {getAllMembers().length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getAllMembers().map((member, index) => (
              <div
                key={`${member.sourceType}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  member.sourceType === 'database'
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40'
                    : 'border-border/50 bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    member.status === 'creator' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                    member.status === 'administrator' ? 'bg-blue-100 dark:bg-blue-900/40' :
                    member.isBot ? 'bg-slate-100 dark:bg-slate-900/40' :
                    'bg-green-100 dark:bg-green-900/40'
                  }`}>
                    {member.status === 'creator' ? (
                      <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    ) : member.status === 'administrator' ? (
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : member.isBot ? (
                      <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {member?.firstName || member?.user?.first_name || 'Неизвестно'}
                    </p>
                    {(member?.username || member?.user?.username) && (
                      <p className="text-xs text-muted-foreground">@{member?.username || member?.user?.username}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.status === 'creator' && (
                    <Badge variant="default" className="bg-yellow-600">Создатель</Badge>
                  )}
                  {member.status === 'administrator' && (
                    <Badge variant="default" className="bg-blue-600">Админ</Badge>
                  )}
                  {member.isBot && (
                    <Badge variant="secondary">Бот</Badge>
                  )}
                  {member.sourceType === 'database' && (
                    <Badge variant="outline" className="border-green-600 text-green-600">Из БД</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Участники не загружены</p>
            <p className="text-sm">Нажмите "Загрузить" для получения списка через Client API</p>
          </div>
        )}

        {/* Информация */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p><strong>Примечание:</strong> Client API позволяет получить полный список участников группы, даже если бот не является администратором.</p>
        </div>
      </div>

      <TelegramAuth
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        projectId={projectId}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
