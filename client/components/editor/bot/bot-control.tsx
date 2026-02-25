/**
 * @fileoverview Компонент для управления конфигурациями ботов и их контролем в редакторе
 *
 * Этот компонент предоставляет интерфейс для:
 * - Просмотра и управления токенами ботов
 * - Запуска и остановки ботов
 * - Редактирования информации о ботах
 * - Управления настройками базы данных
 * - Генерации комментариев в коде
 *
 * @module BotControl
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotToken, type BotProject } from '@shared/schema';
import { setCommentsEnabled, areCommentsEnabled } from '@/lib/utils/generateGeneratedComment';
import { type BotInfo } from './BotProfileEditor';
import { BotProfileSheet } from './BotProfileSheet';
import { BotControlPanel } from './BotControlPanel';


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

  // Состояние inline редактирования
  /** Редактируемое поле */
  const [editingField, setEditingField] = useState<{ tokenId: number, field: string } | null>(null);
  /** Значение редактируемого поля */
  const [editValue, setEditValue] = useState('');

  // Состояние для управления боковой панелью профиля бота
  /** Состояние открытия боковой панели редактирования профиля бота */
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  
  /** Выбранный проект для редактирования профиля бота */
  const [selectedProject, setSelectedProject] = useState<{ id: number; name: string; createdAt: Date | null; updatedAt: Date | null; ownerId: number | null; description: string | null; botToken: string | null; userDatabaseEnabled: number | null; } | null>(null);
  
  /** Информация о боте для редактирования */
  const [selectedBotInfo, setSelectedBotInfo] = useState<BotInfo | null>(null);

  // Состояние таймеров для работающих ботов (по одному на каждый токен)
  /** Текущее время работы ботов в секундах (по ключу tokenId) */
  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState<Record<number, number>>({});

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
   * Обработчик переключения генерации комментариев
   * @param enabled - Включить или выключить генерацию комментариев
   */
  const handleToggleCommentsGeneration = async (enabled: boolean) => {
    setCommentsGenerationEnabled(enabled);
    localStorage.setItem('botcraft-comments-generation', String(enabled));

    // Обновляем глобальный переключатель в utils
    setCommentsEnabled(enabled);

    // Отправляем обновление на сервер
    try {
      await apiRequest('POST', '/api/settings/comments-generation', { enabled });
      
      toast({
        title: enabled ? 'Генерация комментариев включена' : 'Генерация комментариев отключена',
        description: enabled ? 'Теперь в сгенерированном коде будут добавляться комментарии' : 'Комментарии больше не будут добавляться в сгенерированный код',
      });
    } catch (error) {
      console.error('Ошибка обновления настроек генерации комментариев на сервере:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройки генерации комментариев на сервере',
        variant: 'destructive'
      });
      // Восстанавливаем предыдущее значение только в UI и localStorage, но не в глобальном состоянии
      setCommentsGenerationEnabled(!enabled);
      localStorage.setItem('botcraft-comments-generation', String(!enabled));
    }
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
      <BotControlPanel
        setShowAddBot={setShowAddBot}
        projectsLoading={projectsLoading}
        projects={projects}
        allTokens={allTokens}
        allBotInfos={allBotInfos}
        setProjectForNewBot={setProjectForNewBot}
        allBotStatuses={allBotStatuses}
        editingField={editingField}
        editValue={editValue}
        setEditValue={setEditValue}
        handleSaveEdit={handleSaveEdit}
        handleCancelEdit={handleCancelEdit}
        handleStartEdit={handleStartEdit}
        getStatusBadge={getStatusBadge}
        queryClient={queryClient}
        startBotMutation={startBotMutation}
        stopBotMutation={stopBotMutation}
        deleteBotMutation={deleteBotMutation}
        toggleDatabaseMutation={toggleDatabaseMutation}
        handleToggleCommentsGeneration={handleToggleCommentsGeneration}
        commentsGenerationEnabled={commentsGenerationEnabled}
        currentElapsedSeconds={currentElapsedSeconds}
        showAddBot={showAddBot}
        projectForNewBot={projectForNewBot}
        newBotToken={newBotToken}
        setNewBotToken={setNewBotToken}
        isParsingBot={isParsingBot}
        createBotMutation={createBotMutation}
        handleAddBot={handleAddBot}
        setSelectedProject={setSelectedProject}
        setSelectedBotInfo={setSelectedBotInfo}
        setIsProfileSheetOpen={setIsProfileSheetOpen}
      />

      {/* Боковая панель редактирования профиля бота */}
      <BotProfileSheet
        projectId={selectedProject?.id || 0} // Используем выбранный проект или 0 по умолчанию
        botInfo={selectedBotInfo} // Используем выбранную информацию о боте
        onProfileUpdated={() => {
          // Обновляем информацию о боте для всех проектов
          queryClient.invalidateQueries({ queryKey: ['/api/projects/bot/info'] });
        }}
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
      />
    </>
  );
}