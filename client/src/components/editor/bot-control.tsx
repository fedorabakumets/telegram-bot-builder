/**
 * @fileoverview Компонент для управления конфигурациями ботов и их контролем в редакторе
 *
 * Этот компонент предоставляет интерфейс для:
 * - Просмотра и управления токенами ботов
 * - Запуска и остановки ботов
 * - Редактирования информации о ботах
 * - Управления настройками базы данных
 * - Контроля логов выполнения ботов
 *
 * @module BotControl
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotToken, type BotProject } from '@shared/schema';
import { Play, Square, Clock, Trash2, Edit2, Bot, Plus, MoreHorizontal, Database, Terminal as TerminalIcon, Code } from 'lucide-react';
import { setCommentsEnabled, areCommentsEnabled } from '@/lib/utils/generateGeneratedComment';
import { BotTerminal } from './BotTerminal';
import { TokenDisplayEdit } from './TokenDisplayEdit';
import { type BotInfo, BotProfileEditor } from './BotProfileEditor';

// Типы для функции renderBotControlPanel
type ProjectTokenType = { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; };
type BotTokenType = { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; };
type EditingFieldType = { tokenId: number; field: string; } | null;
type TokenInfoType = { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; } | null;

/**
 * Свойства компонента управления ботом
 * @interface BotControlProps
 */
interface BotControlProps {
  projectId?: number;
  projectName?: string;
  onBotStarted?: () => void;
}

/**
 * Интерфейс экземпляра бота
 * @interface BotInstance
 */
interface BotInstance {
  /** Уникальный идентификатор экземпляра */
  id: number;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
  /** Статус бота */
  status: 'running' | 'stopped' | 'error';
  /** Токен бота */
  token: string;
  /** Идентификатор процесса */
  processId?: string;
  /** Время запуска */
  startedAt: Date;
  /** Время остановки */
  stoppedAt?: Date;
  /** Сообщение об ошибке */
  errorMessage?: string;
}

/**
 * Ответ API со статусом бота
 * @interface BotStatusResponse
 */
interface BotStatusResponse {
  /** Статус бота */
  status: 'running' | 'stopped' | 'error';
  /** Экземпляр бота или null */
  instance: BotInstance | null;
}

// Используем тип BotToken из shared/schema.ts



/**
 * Функция для форматирования времени выполнения
 * @param seconds - Количество секунд
 * @returns Отформатированная строка времени
 */
function formatExecutionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);
  if (secs > 0 && hours === 0) parts.push(`${secs}с`);

  return parts.length > 0 ? parts.join(' ') : '0с';
}

/**
 * Компонент аватарки бота с fallback
 * @param photoUrl - URL фотографии бота
 * @param botName - Имя бота для генерации инициалов
 * @param size - Размер аватарки в пикселях
 * @param className - Дополнительные CSS классы
 */
function BotAvatar({
  photoUrl,
  botName,
  size = 40,
  className = ""
}: {
  photoUrl?: string | null;
  botName: string;
  size?: number;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  // Получаем первые буквы названия бота для fallback
  const initials = botName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageError = () => {
    setImageError(true);
  };

  // Если есть аватарка, показываем её
  const showImage = photoUrl && !imageError;

  if (showImage) {
    return (
      <div
        className={`relative rounded-lg overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={photoUrl}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Fallback: показываем инициалы или иконку бота
  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span
          className="text-white font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      ) : (
        <Bot
          className="text-white"
          size={size * 0.5}
        />
      )}
    </div>
  );
}

/**
 * Компонент для редактирования профиля бота
 * @param projectId - Идентификатор проекта
 * @param botInfo - Информация о боте
 * @param onProfileUpdated - Колбэк при обновлении профиля
 */



/**
 * Основной компонент управления ботом
 * Предоставляет интерфейс для управления токенами, запуска/остановки бота,
 * редактирования профиля и настройки базы данных
 * @param projectId - Идентификатор проекта
 * @param projectName - Название проекта
 * @param onBotStarted - Callback при успешном запуске бота
 */
export function BotControl({ projectId }: BotControlProps) {
  // Используем projectId в BotTerminal компоненте
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _projectId = projectId;
  // Используем переменную, чтобы избежать ошибки TypeScript
  if (_projectId === undefined) {
    console.log('projectId is undefined');
  }
  // Состояние компонента
  /** Показывать ли форму добавления бота */
  const [showAddBot, setShowAddBot] = useState(false);
  /** Токен нового бота */
  const [newBotToken, setNewBotToken] = useState('');
  /** Проект, для которого добавляется бот */
  const [projectForNewBot, setProjectForNewBot] = useState<number | null>(null);
  /** Флаг процесса парсинга информации о боте */
  const [isParsingBot, setIsParsingBot] = useState(false);
  /** Редактируемый токен */
  const [editingToken, setEditingToken] = useState<BotToken | null>(null);
  /** Редактируемое имя */
  const [editName, setEditName] = useState('');
  /** Редактируемое описание */
  const [editDescription, setEditDescription] = useState('');

  // Состояние inline редактирования
  /** Редактируемое поле */
  const [editingField, setEditingField] = useState<{ tokenId: number, field: string } | null>(null);
  /** Значение редактируемого поля */
  const [editValue, setEditValue] = useState('');

  // Состояние таймеров для работающих ботов (по одному на каждый токен)
  /** Текущее время работы ботов в секундах (по ключу tokenId) */
  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState<Record<number, number>>({});

  // Состояние логгера - читается из localStorage
  /** Включены ли логи генератора */
  const [generatorLogsEnabled, setGeneratorLogsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('botcraft-generator-logs') === 'true';
    }
    return false;
  });

  // Состояние для переключения генерации комментариев
  /** Включена ли генерация комментариев */
  const [commentsGenerationEnabled, setCommentsGenerationEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem('botcraft-comments-generation');
      if (storedValue !== null) {
        return storedValue === 'true';
      }
      // Если значение не найдено в localStorage, используем значение из утилиты
      const initialValue = areCommentsEnabled();
      // Обновляем localStorage значением из утилиты
      localStorage.setItem('botcraft-comments-generation', String(initialValue));
      return initialValue;
    }
    return true; // По умолчанию включено
  });


  /**
   * Обработчик переключения логов генератора
   * @param enabled - Включить или выключить логи
   */
  const handleToggleGeneratorLogs = (enabled: boolean) => {
    setGeneratorLogsEnabled(enabled);
    localStorage.setItem('botcraft-generator-logs', String(enabled));
    toast({
      title: enabled ? 'Логи генератора включены' : 'Логи генератора отключены',
      description: enabled ? 'Теперь вы видите логи генерации кода в консоли' : 'Логи генерации скрыты',
    });
  };

  /**
   * Обработчик переключения генерации комментариев
   * @param enabled - Включить или выключить генерацию комментариев
   */
  const handleToggleCommentsGeneration = (enabled: boolean) => {
    setCommentsGenerationEnabled(enabled);
    localStorage.setItem('botcraft-comments-generation', String(enabled));

    // Обновляем глобальный переключатель в utils
    setCommentsEnabled(enabled);

    toast({
      title: enabled ? 'Генерация комментариев включена' : 'Генерация комментариев отключена',
      description: enabled ? 'Теперь в сгенерированном коде будут добавляться комментарии' : 'Комментарии больше не будут добавляться в сгенерированный код',
    });
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Синхронизируем состояние переключателя с глобальным значением из утилиты при загрузке
  useEffect(() => {
    const storedValue = localStorage.getItem('botcraft-comments-generation');
    if (storedValue === null) {
      // Если значение не найдено в localStorage, используем значение из утилиты
      const initialValue = areCommentsEnabled();
      setCommentsGenerationEnabled(initialValue);
      localStorage.setItem('botcraft-comments-generation', String(initialValue));
    }
  }, []);

  // Получаем все проекты
  const { data: projects = [], isLoading: projectsLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
  });

  // Получаем токены для всех проектов
  const tokensQueries = projects.map(project =>
    useQuery<BotToken[]>({
      queryKey: [`/api/projects/${project.id}/tokens`],
      queryFn: () => apiRequest('GET', `/api/projects/${project.id}/tokens`),
      enabled: !!projects.length,
    })
  );

  // Объединяем результаты всех запросов в один массив
  const allTokens = tokensQueries.map(query => query.data || []).filter(data => data.length > 0);

  // Мутация для обновления информации о боте через Telegram API
  /** Мутация для обновления информации о боте */
  const updateBotInfoMutation = useMutation({
    mutationFn: async ({ tokenId, field, value }: { tokenId: number, field: string, value: string }) => {
      // Нужно получить projectId для токена
      // Используем напрямую API для получения информации о токене, чтобы избежать проблем с кэшем
      const allTokensFlat = allTokens.flat();
      const token = allTokensFlat.find(t => t.id === tokenId);

      // Если токен не найден в кэше, попробуем получить его напрямую
      if (!token) {
        // В этом случае мы можем получить токены всех проектов снова
        for (const projectTokens of allTokens) {
          const foundToken = projectTokens.find(t => t.id === tokenId);
          if (foundToken) {
            const response = await apiRequest('PUT', `/api/projects/${foundToken.projectId}/tokens/${tokenId}/bot-info`, { field, value });
            return response;
          }
        }
        throw new Error('Токен не найден');
      }

      const response = await apiRequest('PUT', `/api/projects/${token.projectId}/tokens/${tokenId}/bot-info`, { field, value });
      return response;
    },
    onSuccess: (_, _variables) => {
      // Инвалидируем все токены
      queryClient.invalidateQueries({ queryKey: ['/api/projects/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/bot/info'] });
      setEditingField(null);
      toast({ title: 'Информация о боте обновлена', variant: 'default' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка обновления', description: error.message || 'Не удалось обновить информацию о боте', variant: 'destructive' });
    }
  });

  /**
   * Начать inline редактирование поля
   * @param tokenId - ID токена
   * @param field - Название поля
   * @param currentValue - Текущее значение
   */
  const handleStartEdit = (tokenId: number, field: string, currentValue: string) => {
    setEditingField({ tokenId, field });
    setEditValue(currentValue || '');
  };

  /**
   * Сохранить изменения inline редактирования
   */
  const handleSaveEdit = () => {
    if (!editingField) return;

    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      updateBotInfoMutation.mutate({
        tokenId: editingField.tokenId,
        field: editingField.field,
        value: trimmedValue
      });
    } else {
      setEditingField(null);
    }
  };

  /**
   * Отменить inline редактирование
   */
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Получаем статусы ботов для всех проектов
  const botStatusQueries = projects.map(project =>
    useQuery<BotStatusResponse>({
      queryKey: [`/api/projects/${project.id}/bot`],
      refetchInterval: 10000, // Уменьшили с 1 секунды до 10 секунд
      refetchIntervalInBackground: true, // Продолжаем опрашивать в фоне
      staleTime: 5000, // Считаем данные свежими 5 секунд
      enabled: !!projects.length,
    })
  );

  // Объединяем статусы ботов
  const allBotStatuses = botStatusQueries.map(query => query.data).filter(Boolean) as BotStatusResponse[];

  // Состояние для отслеживания выбранного токена
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Обновляем выбранный токен при изменении статусов ботов
  useEffect(() => {
    // Находим запущенный бот и устанавливаем его токен как выбранный
    const runningBot = allBotStatuses.find(status => status.status === 'running' && status.instance);
    if (runningBot && runningBot.instance) {
      setSelectedTokenId(runningBot.instance.tokenId);
    }
  }, [allBotStatuses]);


  // Timer effect - обновляем таймеры для каждого запущенного бота
  useEffect(() => {
    // Находим запущенные боты
    const runningBots = allBotStatuses.filter(status => status.status === 'running' && status.instance?.startedAt);

    // Обновляем таймеры для каждого запущенного бота
    const interval = setInterval(() => {
      const newElapsedSeconds: Record<number, number> = {};

      runningBots.forEach(bot => {
        if (bot.instance) {
          const startTime = new Date(bot.instance.startedAt).getTime();
          const now = Date.now();
          const elapsedMs = now - startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);

          newElapsedSeconds[bot.instance.tokenId] = elapsedSeconds;
        }
      });

      setCurrentElapsedSeconds(prev => ({
        ...prev,
        ...newElapsedSeconds
      }));
    }, 1000); // Обновляем каждую секунду

    // Очищаем таймеры для остановленных ботов
    const stoppedBotIds = Object.keys(currentElapsedSeconds)
      .map(Number)
      .filter(tokenId => !runningBots.some(bot =>
        bot.instance && bot.instance.tokenId === tokenId
      ));

    if (stoppedBotIds.length > 0) {
      setCurrentElapsedSeconds(prev => {
        const newState = {...prev};
        stoppedBotIds.forEach(id => delete newState[id]);
        return newState;
      });
    }

    return () => clearInterval(interval);
  }, [allBotStatuses, currentElapsedSeconds]);

  // Эффект для обновления статуса при возвращении на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Обновляем статусы ботов при возвращении на вкладку
        botStatusQueries.forEach(query => query.refetch());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [botStatusQueries]);

  // Получаем токены по умолчанию для всех проектов

  // Объединяем токены по умолчанию
  // Получаем информацию о ботах (getMe) для всех проектов
  const botInfoQueries = projects.map(project =>
    useQuery<BotInfo>({
      queryKey: [`/api/projects/${project.id}/bot/info`],
      enabled: !!projects.length,
      refetchInterval: allBotStatuses.some(status => status.status === 'running') ? 60000 : false, // Увеличили с 30 секунд до 1 минуты
      refetchIntervalInBackground: false, // Не опрашиваем в фоне
      staleTime: 30000, // Считаем данные свежими 30 секунд
    })
  );

  // Объединяем информацию о ботах
  const allBotInfos = botInfoQueries.map(query => query.data).filter(Boolean) as BotInfo[];

  // Toggle user database enabled mutation
  const toggleDatabaseMutation = useMutation({
    mutationFn: ({ projectId, enabled }: { projectId: number; enabled: boolean }) =>
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}`] });
      toast({
        title: variables.enabled ? "База данных включена" : "База данных выключена",
        description: variables.enabled
          ? "Функции работы с базой данных пользователей будут генерироваться в коде бота."
          : "Функции работы с базой данных НЕ будут генерироваться в коде бота.",
      });
    },
    onError: (_error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить настройку базы данных",
        variant: "destructive",
      });
    }
  });

  // Парсинг информации о боте по токену
  const parseBotInfoMutation = useMutation({
    mutationFn: async ({ token, projectId }: { token: string; projectId: number }) => {
      setIsParsingBot(true);
      try {
        return await apiRequest('POST', `/api/projects/${projectId}/tokens/parse`, { token });
      } finally {
        setIsParsingBot(false);
      }
    },
    onSuccess: (botInfo) => {
      // Автоматически создаем токен с полученной информацией
      if (projectForNewBot) {
        createBotMutation.mutate({
          name: botInfo.botFirstName ? `${botInfo.botFirstName}${botInfo.botUsername ? ` (@${botInfo.botUsername})` : ''}` : `@${botInfo.botUsername}`,
          token: newBotToken.trim(),
          description: botInfo.botShortDescription,
          isDefault: allTokens.flat().length === 0 ? 1 : 0, // Первый токен становится по умолчанию
          isActive: 1,
          // Добавляем всю спарсенную информацию о боте
          ...botInfo,
          projectId: projectForNewBot
        });
      }
    },
    onError: (error: any) => {
      setIsParsingBot(false);
      toast({
        title: 'Ошибка получения информации о боте',
        description: error.message || 'Проверьте правильность токена',
        variant: 'destructive'
      });
    }
  });

  // Создание бота/токена
  const createBotMutation = useMutation({
    mutationFn: async (botData: {
      name: string;
      token: string;
      description?: string;
      isDefault: number;
      isActive: number;
      botFirstName?: string;
      botUsername?: string;
      botDescription?: string;
      botShortDescription?: string;
      botPhotoUrl?: string;
      botCanJoinGroups?: number;
      botCanReadAllGroupMessages?: number;
      botSupportsInlineQueries?: number;
      botHasMainWebApp?: number;
      projectId: number;
    }) => {
      return apiRequest('POST', `/api/projects/${botData.projectId}/tokens`, {
        ...botData,
        projectId: botData.projectId
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/tokens`] });
      // Инвалидируем bot/info cache чтобы загрузить свежие данные нового токена
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/bot/info`] });
      toast({
        title: 'Бот успешно добавлен',
        description: 'Информация о боте автоматически получена из Telegram'
      });
      setShowAddBot(false);
      setNewBotToken('');
      setProjectForNewBot(null);
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при добавлении бота', description: error.message, variant: 'destructive' });
    }
  });

  // Удаление бота/токена
  const deleteBotMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      // Нужно получить projectId для токена
      // Используем напрямую API для получения информации о токене, чтобы избежать проблем с кэшем
      const allTokensFlat = allTokens.flat();
      const token = allTokensFlat.find(t => t.id === tokenId);

      // Если токен не найден в кэше, попробуем получить его напрямую
      if (!token) {
        // В этом случае мы можем получить токены всех проектов снова
        for (const projectTokens of allTokens) {
          const foundToken = projectTokens.find(t => t.id === tokenId);
          if (foundToken) {
            return apiRequest('DELETE', `/api/projects/${foundToken.projectId}/tokens/${tokenId}`);
          }
        }
        throw new Error('Токен не найден');
      }

      return apiRequest('DELETE', `/api/projects/${token.projectId}/tokens/${tokenId}`);
    },
    onSuccess: (_, _tokenId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/tokens'] });
      // Инвалидируем bot/info cache т.к. может измениться токен по умолчанию
      queryClient.invalidateQueries({ queryKey: ['/api/projects/bot/info'] });
      toast({ title: 'Бот удален' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при удалении бота', description: error.message, variant: 'destructive' });
    }
  });

  // Обновление информации о токене
  const updateTokenMutation = useMutation({
    mutationFn: async ({ tokenId, data }: { tokenId: number; data: { name?: string; description?: string | null; trackExecutionTime?: number } }) => {
      // Нужно получить projectId для токена
      // Используем напрямую API для получения информации о токене, чтобы избежать проблем с кэшем
      const allTokensFlat = allTokens.flat();
      const token = allTokensFlat.find(t => t.id === tokenId);

      // Если токен не найден в кэше, попробуем получить его напрямую
      if (!token) {
        // В этом случае мы можем получить токены всех проектов снова
        for (const projectTokens of allTokens) {
          const foundToken = projectTokens.find(t => t.id === tokenId);
          if (foundToken) {
            return apiRequest('PUT', `/api/projects/${foundToken.projectId}/tokens/${tokenId}`, data);
          }
        }
        throw new Error('Токен не найден');
      }

      return apiRequest('PUT', `/api/projects/${token.projectId}/tokens/${tokenId}`, data);
    },
    onSuccess: (_, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/tokens'] });
      toast({ title: 'Информация о боте обновлена' });
      setEditingToken(null);
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при обновлении', description: error.message, variant: 'destructive' });
    }
  });

  // Запуск бота
  const startBotMutation = useMutation({
    mutationFn: async ({ tokenId, projectId }: { tokenId: number; projectId: number }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/start`, { tokenId });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Бот запущен", description: "Бот успешно запущен и готов к работе." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/bot`] });
      // Сразу обновляем статус на фронтенде
      queryClient.invalidateQueries({ queryKey: ['/api/projects/bot'] });
      // Обновляем информацию о боте (имя, описание)
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/bot/info`] });
      // Обновляем список токенов чтобы показать актуальное имя бота
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/tokens`] });

      // Устанавливаем запущенный токен как активный для WebSocket
      setSelectedTokenId(variables.tokenId);
    },
    onError: (error: any) => {
      toast({ title: "Ошибка запуска", description: error.message || "Не удалось запустить бота.", variant: "destructive" });
    },
  });

  // Остановка бота
  const stopBotMutation = useMutation({
    mutationFn: async ({ tokenId, projectId }: { tokenId: number; projectId: number }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/stop`, { tokenId });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Бот остановлен", description: "Бот успешно остановлен." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/bot`] });
      // Сразу обновляем статус на фронтенде
      queryClient.invalidateQueries({ queryKey: ['/api/projects/bot'] });

      // Если останавливаем текущий активный токен, сбрасываем его
      if (selectedTokenId === variables.tokenId) {
        setSelectedTokenId(null);
      }
    },
    onError: (error: any) => {
      toast({ title: "Ошибка остановки", description: error.message || "Не удалось остановить бота.", variant: "destructive" });
    },
  });

  const handleAddBot = () => {
    if (!newBotToken.trim()) {
      toast({
        title: "Требуется токен",
        description: "Введите токен бота.",
        variant: "destructive",
      });
      return;
    }

    if (!projectForNewBot) {
      toast({
        title: "Требуется проект",
        description: "Выберите проект для добавления бота.",
        variant: "destructive",
      });
      return;
    }

    // Сначала получаем информацию о боте, затем создаем токен
    parseBotInfoMutation.mutate({ token: newBotToken.trim(), projectId: projectForNewBot });
  };

  const getStatusBadge = (token: BotToken) => {
    // Находим статус бота для этого токена
    const botStatusForToken = allBotStatuses.find(status =>
      status.instance && status.instance.tokenId === token.id
    );

    if (botStatusForToken && botStatusForToken.status === 'running') {
      return (
        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Активный
          </div>
        </Badge>
      );
    }

    if (token.isDefault) {
      return (
        <Badge variant="secondary">
          По умолчанию
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        Готов
      </Badge>
    );
  };

  return (
    <>
      {renderBotControlPanel(setShowAddBot, projectsLoading, projects, allTokens, allBotInfos, setProjectForNewBot, allBotStatuses, editingField, editValue, setEditValue, handleSaveEdit, handleCancelEdit, handleStartEdit, getStatusBadge, queryClient, startBotMutation, stopBotMutation, deleteBotMutation, toggleDatabaseMutation, generatorLogsEnabled, handleToggleGeneratorLogs, commentsGenerationEnabled, handleToggleCommentsGeneration, currentElapsedSeconds, showAddBot, projectForNewBot, newBotToken, setNewBotToken, isParsingBot, createBotMutation, handleAddBot, editingToken, setEditingToken, editName, setEditName, updateTokenMutation, editDescription, setEditDescription)}
    </>
  );
}

/**
 * Функция для рендеринга панели управления ботами
 *
 * @param setShowAddBot - Функция для отображения/скрытия формы добавления бота
 * @param projectsLoading - Состояние загрузки проектов
 * @param projects - Массив проектов
 * @param allTokens - Массив всех токенов ботов
 * @param allBotInfos - Информация о всех ботах
 * @param setProjectForNewBot - Функция для установки проекта для нового бота
 * @param allBotStatuses - Статусы всех ботов
 * @param editingField - Поле, которое в данный момент редактируется
 * @param editValue - Текущее значение редактируемого поля
 * @param setEditValue - Функция для установки значения редактируемого поля
 * @param handleSaveEdit - Обработчик сохранения редактируемого поля
 * @param handleCancelEdit - Обработчик отмены редактирования
 * @param handleStartEdit - Обработчик начала редактирования
 * @param getStatusBadge - Функция для получения статуса бота
 * @param queryClient - Клиент для работы с запросами
 * @param startBotMutation - Мутация для запуска бота
 * @param stopBotMutation - Мутация для остановки бота
 * @param deleteBotMutation - Мутация для удаления бота
 * @param toggleDatabaseMutation - Мутация для переключения базы данных
 * @param generatorLogsEnabled - Состояние включения логов генератора
 * @param handleToggleGeneratorLogs - Обработчик переключения логов генератора
 * @param commentsGenerationEnabled - Состояние включения генерации комментариев
 * @param handleToggleCommentsGeneration - Обработчик переключения генерации комментариев
 * @param currentElapsedSeconds - Текущее количество прошедших секунд (по ключу tokenId)
 * @param showAddBot - Состояние отображения формы добавления бота
 * @param projectForNewBot - Проект для нового бота
 * @param newBotToken - Токен нового бота
 * @param setNewBotToken - Функция для установки токена нового бота
 * @param isParsingBot - Состояние парсинга бота
 * @param createBotMutation - Мутация для создания бота
 * @param handleAddBot - Обработчик добавления бота
 * @param editingToken - Токен, который в данный момент редактируется
 * @param setEditingToken - Функция для установки редактируемого токена
 * @param editName - Редактируемое имя
 * @param setEditName - Функция для установки редактируемого имени
 * @param updateTokenMutation - Мутация для обновления токена
 * @param editDescription - Редактируемое описание
 * @param setEditDescription - Функция для установки редактируемого описания
 * @returns JSX элемент панели управления ботами
 */
function renderBotControlPanel(
  setShowAddBot: (show: boolean) => void,
  projectsLoading: boolean,
  projects: { data: unknown; id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; botToken: string | null; userDatabaseEnabled: number | null; }[],
  allTokens: ProjectTokenType[][],
  allBotInfos: BotInfo[],
  setProjectForNewBot: (projectId: number | null) => void,
  allBotStatuses: BotStatusResponse[],
  editingField: EditingFieldType,
  editValue: string,
  setEditValue: (value: string) => void,
  handleSaveEdit: () => void,
  handleCancelEdit: () => void,
  handleStartEdit: (tokenId: number, field: string, currentValue: string) => void,
  getStatusBadge: (token: BotTokenType) => JSX.Element,
  queryClient: any,
  startBotMutation: any,
  stopBotMutation: any,
  deleteBotMutation: any,
  toggleDatabaseMutation: any,
  generatorLogsEnabled: boolean,
  handleToggleGeneratorLogs: (enabled: boolean) => void,
  commentsGenerationEnabled: boolean,
  handleToggleCommentsGeneration: (enabled: boolean) => void,
  currentElapsedSeconds: Record<number, number>,
  showAddBot: boolean,
  projectForNewBot: number | null,
  newBotToken: string,
  setNewBotToken: (token: string) => void,
  isParsingBot: boolean,
  createBotMutation: any,
  handleAddBot: () => void,
  editingToken: TokenInfoType,
  setEditingToken: (token: TokenInfoType) => void,
  editName: string,
  setEditName: (name: string) => void,
  updateTokenMutation: any,
  editDescription: string,
  setEditDescription: (desc: string) => void
) {
  return <div className="space-y-4 sm:space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Боты
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground pl-10 sm:pl-12 -mt-1">
          Управление ботами из всех проектов
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setShowAddBot(true)}
          className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 h-10 sm:h-auto px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-base"
          data-testid="button-connect-bot"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Подключить бот</span>
        </Button>
      </div>
    </div>
    {projectsLoading ? (
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : projects.length === 0 ? (
      <Card className="border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 dark:from-slate-800/30 dark:to-slate-900/20">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center mb-4 sm:mb-6">
            <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">Нет доступных проектов</h3>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 max-w-md">
            Создайте проект, чтобы начать добавление и управление Telegram-ботами
          </p>
        </CardContent>
      </Card>
    ) : renderBotManagementInterface(projects, allTokens, allBotInfos, setProjectForNewBot, setShowAddBot, allBotStatuses, editingField, editValue, setEditValue, handleSaveEdit, handleCancelEdit, handleStartEdit, getStatusBadge, queryClient, startBotMutation, stopBotMutation, deleteBotMutation, toggleDatabaseMutation, generatorLogsEnabled, handleToggleGeneratorLogs, commentsGenerationEnabled, handleToggleCommentsGeneration, currentElapsedSeconds)}
    {/* Add Bot Dialog */}
    {renderBotProjectCard(showAddBot, setShowAddBot, projectForNewBot, setProjectForNewBot, projects, newBotToken, setNewBotToken, isParsingBot, createBotMutation, handleAddBot)}
    {/* Edit Bot Token Dialog */}
    {renderBotTokenManagementSection(editingToken, setEditingToken, editName, setEditName, updateTokenMutation, editDescription, setEditDescription)}
  </div>;
}

/**
 * Функция для рендеринга диалога добавления нового бота
 *
 * @param showAddBot - Состояние отображения диалога добавления бота
 * @param setShowAddBot - Функция для управления состоянием отображения диалога
 * @param projectForNewBot - Проект для нового бота
 * @param setProjectForNewBot - Функция для установки проекта для нового бота
 * @param projects - Массив проектов
 * @param newBotToken - Токен нового бота
 * @param setNewBotToken - Функция для установки токена нового бота
 * @param isParsingBot - Состояние парсинга бота
 * @param createBotMutation - Мутация для создания бота
 * @param handleAddBot - Обработчик добавления бота
 * @returns JSX элемент диалога добавления бота
 */
function renderBotProjectCard(showAddBot: boolean, setShowAddBot: (show: boolean) => void, projectForNewBot: number | null, setProjectForNewBot: (projectId: number | null) => void, projects: { data: unknown; id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; botToken: string | null; userDatabaseEnabled: number | null; }[], newBotToken: string, setNewBotToken: (token: string) => void, isParsingBot: boolean, createBotMutation: any, handleAddBot: () => void) {
  return <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="space-y-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <DialogTitle className="text-xl sm:text-2xl">Подключить бота</DialogTitle>
          </div>
        </div>
        <DialogDescription className="text-sm">
          Добавьте нового бота, используя токен от <span className="font-semibold text-foreground">@BotFather</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 sm:space-y-5 py-2">
        {/* Project selection */}
        {!projectForNewBot && (
          <div className="space-y-2">
            <Label htmlFor="project-select" className="text-sm sm:text-base font-semibold">
              Выберите проект
            </Label>
            <select
              id="project-select"
              value={projectForNewBot || ''}
              onChange={(e) => setProjectForNewBot(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">��ыберите проект...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Help box */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 space-y-2">
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-600 rounded-full flex-shrink-0" />
            Как получить токен?
          </p>
          <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-3">
            <li>1. Откройте Telegram и найдите <span className="font-semibold">@BotFather</span></li>
            <li>2. Отправьте команду <span className="font-mono bg-blue-900/20 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">/newbot</span></li>
            <li>3. Следуйте инструкциям и скопируйте токен</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bot-token" className="text-sm sm:text-base font-semibold">
            Токен бота
          </Label>
          <div className="relative">
            <Input
              id="bot-token"
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={newBotToken}
              onChange={(e) => setNewBotToken(e.target.value)}
              disabled={isParsingBot || createBotMutation.isPending || !projectForNewBot}
              className="text-xs sm:text-sm pr-10"
              data-testid="input-bot-token" />
            {newBotToken && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          {isParsingBot && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin" />
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                Проверяем токен и получаем информацию о боте...
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowAddBot(false);
            setProjectForNewBot(null);
          } }
          disabled={isParsingBot || createBotMutation.isPending}
          className="text-sm sm:text-base"
          data-testid="button-cancel-add-bot"
        >
          Отмена
        </Button>
        <Button
          onClick={handleAddBot}
          disabled={isParsingBot || createBotMutation.isPending || !newBotToken.trim() || !projectForNewBot}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 text-sm sm:text-base"
          data-testid="button-add-bot"
        >
          {isParsingBot ? 'Проверка...' : createBotMutation.isPending ? 'Добавление...' : 'Добавить бота'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}

/**
 * Функция для рендеринга диалога редактирования токена бота
 *
 * @param editingToken - Токен, который в данный момент редактируется
 * @param setEditingToken - Функция для установки редактируемого токена
 * @param editName - Редактируемое имя
 * @param setEditName - Функция для установки редактируемого имени
 * @param updateTokenMutation - Мутация для обновления токена
 * @param editDescription - Редактируемое описание
 * @param setEditDescription - Функция для установки редактируемого описания
 * @returns JSX элемент диалога редактирования токена бота
 */
function renderBotTokenManagementSection(editingToken: { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; } | null, setEditingToken: (token: { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; } | null) => void, editName: string, setEditName: (name: string) => void, updateTokenMutation: any, editDescription: string, setEditDescription: (desc: string) => void) {
  return <Dialog open={!!editingToken} onOpenChange={() => setEditingToken(null)}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="space-y-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 dark:from-purple-500/30 dark:to-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Edit2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <DialogTitle className="text-xl sm:text-2xl">Редактировать токен</DialogTitle>
          </div>
        </div>
        <DialogDescription className="text-sm">
          Обновите параметры токена бота для лучшей организации
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 sm:space-y-5 py-2">
        <div className="space-y-2">
          <Label htmlFor="edit-bot-name" className="text-sm sm:text-base font-semibold">
            Имя токена
          </Label>
          <Input
            id="edit-bot-name"
            placeholder="Например: Основной бот, Test бот"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={updateTokenMutation.isPending}
            className="text-xs sm:text-sm"
            data-testid="input-edit-bot-name" />
          <p className="text-xs text-muted-foreground">
            Это имя будет использоваться для идентификации токена в приложении
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-bot-description" className="text-sm sm:text-base font-semibold">
            О��исание
          </Label>
          <Textarea
            id="edit-bot-description"
            placeholder="Описание назначения этого токена (необязательно)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={updateTokenMutation.isPending}
            rows={3}
            className="text-xs sm:text-sm resize-none"
            data-testid="textarea-edit-bot-description" />
          <p className="text-xs text-muted-foreground">
            Добавьте описа��ие для лучшей организации (максимум 500 символов)
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
        <Button
          variant="outline"
          onClick={() => setEditingToken(null)}
          disabled={updateTokenMutation.isPending}
          className="text-sm sm:text-base"
          data-testid="button-cancel-edit"
        >
          Отмена
        </Button>
        <Button
          onClick={() => {
            if (editingToken) {
              updateTokenMutation.mutate({
                tokenId: editingToken.id,
                data: {
                  name: editName.trim() || editingToken.name,
                  description: editDescription.trim() || null
                }
              });
            }
          } }
          disabled={updateTokenMutation.isPending || !editName.trim()}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 text-sm sm:text-base"
          data-testid="button-save-edit"
        >
          {updateTokenMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}

/**
 * Функция для рендеринга основного интерфейса управления ботами
 *
 * @param projects - Массив проектов
 * @param allTokens - Массив всех токенов ботов
 * @param allBotInfos - Информация о всех ботах
 * @param setProjectForNewBot - Функция для установки проекта для нового бота
 * @param setShowAddBot - Функция для отображения/скрытия формы добавления бота
 * @param allBotStatuses - Статусы всех ботов
 * @param editingField - Поле, которое в данный момент редактируется
 * @param editValue - Текущее значение редактируемого поля
 * @param setEditValue - Функция для установки значения редактируемого поля
 * @param handleSaveEdit - Обработчик сохранения редактируемого поля
 * @param handleCancelEdit - Обработчик отмены редактирования
 * @param handleStartEdit - Обработчик начала редактирования
 * @param getStatusBadge - Функция для получения статуса бота
 * @param queryClient - Клиент для работы с запросами
 * @param startBotMutation - Мутация для запуска бота
 * @param stopBotMutation - Мутация для остановки бота
 * @param deleteBotMutation - Мутация для удаления бота
 * @param toggleDatabaseMutation - Мутация для переключения базы данных
 * @param generatorLogsEnabled - Состояние включения логов генератора
 * @param handleToggleGeneratorLogs - Обработчик переключения логов генератора
 * @param commentsGenerationEnabled - Состояние включения генерации комментариев
 * @param handleToggleCommentsGeneration - Обработчик переключения генерации комментариев
 * @param currentElapsedSeconds - Текущее количество прошедших секунд (по ключу tokenId)
 * @returns JSX элемент основного интерфейса управления ботами
 */
function renderBotManagementInterface(projects: { data: unknown; id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; botToken: string | null; userDatabaseEnabled: number | null; }[], allTokens: { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; }[][], allBotInfos: BotInfo[], setProjectForNewBot: (projectId: number | null) => void, setShowAddBot: (show: boolean) => void, allBotStatuses: BotStatusResponse[], editingField: { tokenId: number; field: string; } | null, editValue: string, setEditValue: (value: string) => void, handleSaveEdit: () => void, handleCancelEdit: () => void, handleStartEdit: (tokenId: number, field: string, currentValue: string) => void, getStatusBadge: (token: { id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; projectId: number; token: string; isDefault: number | null; isActive: number | null; botFirstName: string | null; botUsername: string | null; botDescription: string | null; botShortDescription: string | null; botPhotoUrl: string | null; botCanJoinGroups: number | null; botCanReadAllGroupMessages: number | null; botSupportsInlineQueries: number | null; botHasMainWebApp: number | null; lastUsedAt: Date | null; trackExecutionTime: number | null; totalExecutionSeconds: number | null; }) => JSX.Element, queryClient: any, startBotMutation: any, stopBotMutation: any, deleteBotMutation: any, toggleDatabaseMutation: any, generatorLogsEnabled: boolean, handleToggleGeneratorLogs: (enabled: boolean) => void, commentsGenerationEnabled: boolean, handleToggleCommentsGeneration: (enabled: boolean) => void, currentElapsedSeconds: Record<number, number>) {
  return <div className="space-y-8">
    {projects.map((project, projectIndex) => {
      const projectTokens = allTokens[projectIndex] || [];
      const projectBotInfo = allBotInfos[projectIndex];

      return (
        <div key={project.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Ботов: {projectTokens.length}
              </span>
            </div>
          </div>

          {projectTokens.length === 0 ? (
            <Card className="border-2 border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-8 px-4">
                <Bot className="w-10 h-10 text-muted-foreground mb-2" />
                <h4 className="font-medium text-foreground mb-1">Нет подключенных ботов</h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Добавьте бота к этому проекту
                </p>
                <Button
                  onClick={() => {
                    setProjectForNewBot(project.id);
                    setShowAddBot(true);
                  } }
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить бота
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projectTokens.map((token) => {
                const tokenStatus = allBotStatuses.find(status => status.instance && status.instance.tokenId === token.id
                );
                const isThisTokenRunning = tokenStatus?.status === 'running';

                return (
                  <Card key={token.id} className="group/card overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 hover:border-border/50">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      {/* Header Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <BotAvatar
                          botName={token.botFirstName || token.name}
                          photoUrl={token.botPhotoUrl}
                          size={48}
                          className="flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {editingField?.tokenId === token.id && editingField?.field === 'name' ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  else if (e.key === 'Escape') handleCancelEdit();
                                } }
                                onBlur={handleSaveEdit}
                                autoFocus
                                className="font-bold text-base sm:text-lg h-auto px-2 py-1 flex-1 min-w-0"
                                data-testid="input-bot-name-edit" />
                            ) : (
                              <h3
                                className="font-bold text-base sm:text-lg cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors truncate"
                                onDoubleClick={() => handleStartEdit(token.id, 'name', token.botFirstName || token.name)}
                                title="Double-click to edit"
                                data-testid="text-bot-name"
                              >
                                {token.botFirstName || token.name}
                              </h3>
                            )}
                            {token.botUsername && (
                              <span className="text-xs sm:text-sm text-muted-foreground truncate">@{token.botUsername}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {getStatusBadge(token)}
                          </div>

                          {(token.botDescription || token.description) && (
                            editingField?.tokenId === token.id && editingField?.field === 'description' ? (
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  } else if (e.key === 'Escape') handleCancelEdit();
                                } }
                                onBlur={handleSaveEdit}
                                autoFocus
                                className="text-xs sm:text-sm resize-none min-h-[36px]"
                                rows={2}
                                data-testid="textarea-bot-description-edit" />
                            ) : (
                              <p
                                className="text-xs sm:text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onDoubleClick={() => handleStartEdit(token.id, 'description', token.botDescription || token.description || '')}
                                title="Double-click to edit"
                                data-testid="text-bot-description"
                              >
                                {token.botDescription || token.description}
                              </p>
                            )
                          )}

                          <TokenDisplayEdit
                            token={token.token}
                            tokenId={token.id}
                            projectId={project.id}
                            onTokenUpdate={() => {
                              // Обновляем информацию о боте
                              queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/bot/info`] });
                            }}
                          />

                          {token.botShortDescription && token.botShortDescription !== token.botDescription && (
                            editingField?.tokenId === token.id && editingField?.field === 'shortDescription' ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  else if (e.key === 'Escape') handleCancelEdit();
                                } }
                                onBlur={handleSaveEdit}
                                autoFocus
                                className="text-xs h-auto px-2 py-1 mb-1"
                                data-testid="input-bot-short-description-edit" />
                            ) : (
                              <p
                                className="text-xs text-muted-foreground line-clamp-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onDoubleClick={() => handleStartEdit(token.id, 'shortDescription', token.botShortDescription || '')}
                                title="Double-click to edit"
                                data-testid="text-bot-short-description"
                              >
                                {token.botShortDescription}
                              </p>
                            )
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            Добавлен: {new Date(token.createdAt!).toLocaleDateString('ru-RU')}
                            {token.lastUsedAt && (
                              <> • Последний: {new Date(token.lastUsedAt).toLocaleDateString('ru-RU')}</>
                            )}
                            {token.trackExecutionTime === 1 && (
                              <> • {formatExecutionTime(token.totalExecutionSeconds || 0)}</>
                            )}
                          </p>
                        </div>

                        {/* Actions - Responsive */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <BotProfileEditor
                            projectId={project.id}
                            botInfo={projectBotInfo}
                            onProfileUpdated={() => {
                              // Обновляем информацию о боте для всех проектов
                              queryClient.invalidateQueries({ queryKey: ['/api/projects/bot/info'] });
                            } } />

                          {(() => {
                            if (!isThisTokenRunning) {
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => startBotMutation.mutate({ tokenId: token.id, projectId: project.id })}
                                  disabled={startBotMutation.isPending}
                                  className="h-9 gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{startBotMutation.isPending ? 'Запуск...' : 'Запустить'}</span>
                                  <span className="sm:hidden">{startBotMutation.isPending ? '...' : 'Запуск'}</span>
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => stopBotMutation.mutate({ tokenId: token.id, projectId: project.id })}
                                  disabled={stopBotMutation.isPending}
                                  className="h-9 gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{stopBotMutation.isPending ? 'Остановка...' : 'Остановить'}</span>
                                  <span className="sm:hidden">{stopBotMutation.isPending ? '...' : 'Стоп'}</span>
                                </Button>
                              );
                            }
                          })()}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" data-testid="button-bot-menu">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => deleteBotMutation.mutate(token.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Settings Section - Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Database Toggle */}
                        <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${project.userDatabaseEnabled
                          ? 'bg-green-500/8 border-green-500/30 dark:bg-green-500/10 dark:border-green-500/40'
                          : 'bg-red-500/8 border-red-500/30 dark:bg-red-500/10 dark:border-red-500/40'}`} data-testid="database-toggle-container-bot-card">
                          <Database className={`w-4 h-4 flex-shrink-0 ${project.userDatabaseEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                          <Label htmlFor={`db-toggle-bot-${token.id}`} className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${project.userDatabaseEnabled
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'}`}>
                            {project.userDatabaseEnabled ? 'БД включена' : 'БД выключена'}
                          </Label>
                          <Switch
                            id={`db-toggle-bot-${token.id}`}
                            data-testid="switch-database-toggle-bot-card"
                            checked={project.userDatabaseEnabled === 1}
                            onCheckedChange={(checked) => toggleDatabaseMutation.mutate({ projectId: project.id, enabled: checked })}
                            disabled={toggleDatabaseMutation.isPending} />
                        </div>

                        {/* Generator Logs Toggle */}
                        <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${generatorLogsEnabled
                          ? 'bg-purple-500/8 border-purple-500/30 dark:bg-purple-500/10 dark:border-purple-500/40'
                          : 'bg-gray-500/8 border-gray-500/30 dark:bg-gray-500/10 dark:border-gray-500/40'}`} data-testid="generator-logs-toggle-container-bot-card">
                          <TerminalIcon className={`w-4 h-4 flex-shrink-0 ${generatorLogsEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
                          <Label htmlFor="generator-logs-toggle" className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${generatorLogsEnabled
                            ? 'text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300'}`}>Логи генератора</Label>
                          <Switch
                            id="generator-logs-toggle"
                            data-testid="switch-generator-logs-toggle"
                            checked={generatorLogsEnabled}
                            onCheckedChange={handleToggleGeneratorLogs} />
                        </div>

                        {/* Comments Generation Toggle */}
                        <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${commentsGenerationEnabled
                          ? 'bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40'
                          : 'bg-gray-500/8 border-gray-500/30 dark:bg-gray-500/10 dark:border-gray-500/40'}`} data-testid="comments-generation-toggle-container-bot-card">
                          <Code className={`w-4 h-4 flex-shrink-0 ${commentsGenerationEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                          <Label htmlFor="comments-generation-toggle" className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${commentsGenerationEnabled
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300'}`}>Генерация комментариев</Label>
                          <Switch
                            id="comments-generation-toggle"
                            data-testid="switch-comments-generation-toggle"
                            checked={commentsGenerationEnabled}
                            onCheckedChange={handleToggleCommentsGeneration} />
                        </div>

                        {/* Execution Timer */}
                        {isThisTokenRunning && (
                          <div className={`sm:col-span-2 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-gradient-to-r from-amber-500/8 to-orange-500/8 border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10 dark:border-amber-500/40`} data-testid="timer-display-bot-card">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                                Запущен
                              </p>
                              <p className="text-sm sm:text-base font-mono font-bold text-amber-600 dark:text-amber-300">
                                {(() => {
                                  // Найдем статус бота для этого токена
                                  const botStatusForToken = allBotStatuses.find(status =>
                                    status.instance && status.instance.tokenId === token.id
                                  );

                                  if (botStatusForToken && botStatusForToken.instance?.startedAt) {
                                    // Если у нас есть время запуска, вычислим текущее время выполнения
                                    const startTime = new Date(botStatusForToken.instance.startedAt).getTime();
                                    const now = Date.now();
                                    const elapsedMs = now - startTime;
                                    const elapsedSeconds = Math.floor(elapsedMs / 1000);

                                    // Используем вычисленное значение, если оно больше, чем из состояния
                                    return formatExecutionTime(Math.max(elapsedSeconds, currentElapsedSeconds[token.id] || 0));
                                  }

                                  // В противном случае используем значение из состояния
                                  return formatExecutionTime(currentElapsedSeconds[token.id] || 0);
                                })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Bot Terminal */}
                        <div className="sm:col-span-2 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-gradient-to-r from-purple-500/8 to-indigo-500/8 border-purple-500/30 dark:from-purple-500/10 dark:to-indigo-500/10 dark:border-purple-500/40">
                          <BotTerminal
                            projectId={project.id}
                            tokenId={token.id}
                            isBotRunning={isThisTokenRunning}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </div>;
}

