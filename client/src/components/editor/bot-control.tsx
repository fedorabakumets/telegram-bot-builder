import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotToken } from '@shared/schema';
import { Play, Square, AlertCircle, CheckCircle, Clock, Trash2, Edit2, Settings, Bot, RefreshCw, Check, X, Plus, MoreHorizontal, Database, Zap, Terminal } from 'lucide-react';

interface BotControlProps {
  projectId: number;
  projectName: string;
}

interface BotInstance {
  id: number;
  projectId: number;
  tokenId: number;
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

// Используем тип BotToken из shared/schema.ts

interface DefaultTokenResponse {
  hasDefault: boolean;
  token: BotToken | null;
}

interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
  description?: string;
  short_description?: string;
  photoUrl?: string;
  photo?: {
    small_file_id: string;
    small_file_unique_id: string;
    big_file_id: string;
    big_file_unique_id: string;
  };
}

// Функция для форматирования времени выполнения
function formatExecutionTime(seconds: number): string {
  if (seconds === 0) return 'Нет данных';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);
  if (secs > 0 && hours === 0) parts.push(`${secs}с`);
  
  return parts.length > 0 ? parts.join(' ') : '0с';
}

// Компонент аватарки бота с fallback
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

// Компонент для редактирования профиля бота
function BotProfileEditor({ 
  projectId, 
  botInfo, 
  onProfileUpdated 
}: { 
  projectId: number; 
  botInfo?: BotInfo | null; 
  onProfileUpdated: () => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  // Обновляем состояние когда botInfo загружается
  useEffect(() => {
    if (botInfo) {
      setName(botInfo.first_name || '');
      setDescription(botInfo.description || '');
      setShortDescription(botInfo.short_description || '');
    }
  }, [botInfo]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Мутация для обновления имени бота
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/name`, { name: newName });
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Успешно",
        description: "Имя бота обновлено. Перезапускаем бота для применения изменений...",
      });
      
      try {
        // Перезапускаем бота для применения нового имени
        await apiRequest('POST', `/api/projects/${projectId}/bot/restart`);
        
        toast({
          title: "Готово!",
          description: "Бот перезапущен с новым именем",
        });
      } catch (error) {
        // Если перезапуск не удался, просто обновляем данные
        console.warn('Не удалось перезапустить бота:', error);
      }
      
      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить имя бота",
        variant: "destructive",
      });
    }
  });

  // Мутация для обновления описания бота
  const updateDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/description`, { description: newDescription });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Описание бота обновлено",
      });
      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить описание бота",
        variant: "destructive",
      });
    }
  });

  // Мутация для обновления краткого описания бота
  const updateShortDescriptionMutation = useMutation({
    mutationFn: async (newShortDescription: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/short-description`, { short_description: newShortDescription });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Краткое описание бота обновлено",
      });
      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить краткое описание бота",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    if (!botInfo) {
      toast({
        title: "Ошибка",
        description: "Информация о боте не загружена",
        variant: "destructive",
      });
      return;
    }

    try {
      // Обновляем только те поля, которые изменились
      if (name !== botInfo.first_name) {
        await updateNameMutation.mutateAsync(name);
      }
      if (description !== (botInfo.description || '')) {
        await updateDescriptionMutation.mutateAsync(description);
      }
      if (shortDescription !== (botInfo.short_description || '')) {
        await updateShortDescriptionMutation.mutateAsync(shortDescription);
      }
      
      setIsOpen(false);
      // Принудительно обновляем данные после сохранения всех изменений
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
    } catch (error) {
      // Ошибки уже обработаны в мутациях
    }
  };

  const handleCancel = () => {
    // Сбрасываем значения к исходным
    setName(botInfo?.first_name || '');
    setDescription(botInfo?.description || '');
    setShortDescription(botInfo?.short_description || '');
    setIsOpen(false);
  };

  const isLoading = updateNameMutation.isPending || updateDescriptionMutation.isPending || updateShortDescriptionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          data-testid="button-edit-bot-profile"
          disabled={!botInfo}
          title={!botInfo ? "Загрузка информации о боте..." : "Редактировать профиль бота"}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать профиль бота</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="bot-name">Имя бота</Label>
            <Input
              id="bot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя бота"
              maxLength={64}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 64 символа. Это имя будет отображаться в Telegram.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-short-description">Краткое описание</Label>
            <Input
              id="bot-short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Краткое описание бота"
              maxLength={120}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 120 символов. Отображается в профиле и предпросмотрах ссылок.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-description">Полное описание</Label>
            <Textarea
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Полное описание бота"
              maxLength={512}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 512 символов. Отображается в пустых чатах с ботом.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Компонент профиля бота
function BotProfile({ 
  projectId,
  botInfo, 
  onRefresh, 
  isRefreshing,
  fallbackName = 'Бот',
  isDatabaseEnabled = false,
  onToggleDatabase,
  isTogglingDatabase = false
}: { 
  projectId: number;
  botInfo?: BotInfo | null; 
  onRefresh: () => void; 
  isRefreshing: boolean; 
  fallbackName?: string;
  isDatabaseEnabled?: boolean;
  onToggleDatabase?: (enabled: boolean) => void;
  isTogglingDatabase?: boolean;
}) {
  if (!botInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BotAvatar 
                botName={fallbackName} 
                size={48}
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Информация о боте недоступна
                </p>
                <p className="text-xs text-muted-foreground">
                  Запустите бота для получения данных
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <BotAvatar 
              photoUrl={botInfo.photoUrl} 
              botName={botInfo.first_name} 
              size={56}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight mb-1">{botInfo.first_name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  @{botInfo.username}
                </Badge>
                {botInfo.is_bot && (
                  <Badge variant="outline" className="text-xs">
                    Бот
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BotProfileEditor 
              projectId={projectId} 
              botInfo={botInfo} 
              onProfileUpdated={onRefresh} 
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Обновить информацию о боте"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Описание бота */}
          {(botInfo.description || botInfo.short_description) && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {botInfo.description || botInfo.short_description}
              </p>
            </div>
          )}
          
          {/* Возможности бота */}
          <div className="flex flex-wrap gap-2">
            {botInfo.can_join_groups && (
              <Badge variant="secondary" className="text-xs">
                Может присоединяться к группам
              </Badge>
            )}
            {botInfo.can_read_all_group_messages && (
              <Badge variant="secondary" className="text-xs">
                Читает все сообщения
              </Badge>
            )}
            {botInfo.supports_inline_queries && (
              <Badge variant="secondary" className="text-xs">
                Поддерживает inline запросы
              </Badge>
            )}
          </div>
        </div>
        
        {/* Database Toggle */}
        {onToggleDatabase && (
          <>
            <Separator className="my-3" />
            <div className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
              isDatabaseEnabled 
                ? 'bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-600' 
                : 'bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600'
            }`} data-testid="database-toggle-container">
              <Database className={`w-5 h-5 ${isDatabaseEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <Label htmlFor="db-toggle-bot" className={`text-sm font-bold cursor-pointer flex-1 ${
                isDatabaseEnabled 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {isDatabaseEnabled ? 'БД включена' : 'БД выключена'}
              </Label>
              <Switch
                id="db-toggle-bot"
                data-testid="switch-database-toggle-bot"
                checked={isDatabaseEnabled}
                onCheckedChange={onToggleDatabase}
                disabled={isTogglingDatabase}
                className="scale-110"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function BotControl({ projectId, projectName }: BotControlProps) {
  const [showAddBot, setShowAddBot] = useState(false);
  const [newBotToken, setNewBotToken] = useState('');
  const [isParsingBot, setIsParsingBot] = useState(false);
  const [editingToken, setEditingToken] = useState<BotToken | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Inline editing states
  const [editingField, setEditingField] = useState<{tokenId: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Timer states for running bot
  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState(0);
  
  // Logger state - read from localStorage
  const [generatorLogsEnabled, setGeneratorLogsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('botcraft-generator-logs') === 'true';
    }
    return false;
  });

  const handleToggleGeneratorLogs = (enabled: boolean) => {
    setGeneratorLogsEnabled(enabled);
    localStorage.setItem('botcraft-generator-logs', String(enabled));
    toast({
      title: enabled ? 'Логи генератора включены' : 'Логи генератора отключены',
      description: enabled ? 'Теперь вы видите логи генерации кода в консоли' : 'Логи генерации скрыты',
    });
  };
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating bot information via Telegram API
  const updateBotInfoMutation = useMutation({
    mutationFn: async ({ tokenId, field, value }: { tokenId: number, field: string, value: string }) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}/bot-info`, { field, value });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      setEditingField(null);
      toast({ title: 'Информация о боте обновлена', variant: 'default' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка обновления', description: error.message || 'Не удалось обновить информацию о боте', variant: 'destructive' });
    }
  });

  // Handle inline editing
  const handleStartEdit = (tokenId: number, field: string, currentValue: string) => {
    setEditingField({ tokenId, field });
    setEditValue(currentValue || '');
  };

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

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Получаем статус бота
  const { data: botStatus, isLoading: isLoadingStatus, refetch: refetchBotStatus } = useQuery<BotStatusResponse>({
    queryKey: [`/api/projects/${projectId}/bot`],
    refetchInterval: 10000, // Уменьшили с 1 секунды до 10 секунд
    refetchIntervalInBackground: false, // Не опрашиваем в фоне
    staleTime: 5000, // Считаем данные свежими 5 секунд
  });

  // Timer effect - обновляем таймер каждую секунду если бот запущен
  useEffect(() => {
    if (botStatus?.status !== 'running' || !botStatus.instance?.startedAt) {
      setCurrentElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(botStatus.instance!.startedAt).getTime();
      const now = Date.now();
      const elapsedMs = now - startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      setCurrentElapsedSeconds(elapsedSeconds);
    }, 1000); // Обновляем каждую секунду

    return () => clearInterval(interval);
  }, [botStatus?.status, botStatus?.instance?.startedAt]);

  // Получаем все токены проекта (боты)
  const { data: tokens = [], isLoading, refetch } = useQuery<BotToken[]>({
    queryKey: [`/api/projects/${projectId}/tokens`],
  });

  // Получаем токен по умолчанию
  const { data: defaultTokenData } = useQuery<DefaultTokenResponse>({
    queryKey: [`/api/projects/${projectId}/tokens/default`],
  });

  // Получаем информацию о боте (getMe)
  const { data: botInfo, refetch: refetchBotInfo } = useQuery<BotInfo>({
    queryKey: [`/api/projects/${projectId}/bot/info`],
    enabled: defaultTokenData?.hasDefault || tokens.length > 0,
    refetchInterval: botStatus?.status === 'running' ? 60000 : false, // Увеличили с 30 секунд до 1 минуты
    refetchIntervalInBackground: false, // Не опрашиваем в фоне
    staleTime: 30000, // Считаем данные свежими 30 секунд
  });

  // Получаем информацию о проекте
  const { data: project } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });

  const isDatabaseEnabled = (project as any)?.userDatabaseEnabled;

  // Toggle user database enabled mutation
  const toggleDatabaseMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (data, enabled) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: enabled ? "База данных включена" : "База данных выключена",
        description: enabled 
          ? "Функции работы с базой данных пользователей будут генерироваться в коде бота." 
          : "Функции работы с базой данных НЕ будут генерироваться в коде бота.",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить настройку базы данных",
        variant: "destructive",
      });
    }
  });

  const isRunning = botStatus?.status === 'running';
  const isError = botStatus?.status === 'error';
  const isStopped = botStatus?.status === 'stopped' || !botStatus?.instance;

  // Парсинг информации о боте по токену
  const parseBotInfoMutation = useMutation({
    mutationFn: async (token: string) => {
      setIsParsingBot(true);
      try {
        return await apiRequest('POST', `/api/projects/${projectId}/tokens/parse`, { token });
      } finally {
        setIsParsingBot(false);
      }
    },
    onSuccess: (botInfo) => {
      // Автоматически создаем токен с полученной информацией
      createBotMutation.mutate({
        name: botInfo.botFirstName ? `${botInfo.botFirstName}${botInfo.botUsername ? ` (@${botInfo.botUsername})` : ''}` : `@${botInfo.botUsername}`,
        token: newBotToken.trim(),
        description: botInfo.botShortDescription,
        isDefault: tokens.length === 0 ? 1 : 0, // Первый токен становится по умолчанию
        isActive: 1,
        // Добавляем всю спарсенную информацию о боте
        ...botInfo
      });
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
    }) => {
      return apiRequest('POST', `/api/projects/${projectId}/tokens`, { 
        ...botData, 
        projectId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      // Инвалидируем bot/info cache чтобы загрузить свежие данные нового токена
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      toast({ 
        title: 'Бот успешно добавлен',
        description: 'Информация о боте автоматически получена из Telegram'
      });
      setShowAddBot(false);
      setNewBotToken('');
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при добавлении бота', description: error.message, variant: 'destructive' });
    }
  });

  // Удаление бота/токена
  const deleteBotMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      return apiRequest('DELETE', `/api/projects/${projectId}/tokens/${tokenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      // Инвалидируем bot/info cache т.к. может измениться токен по умолчанию
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      toast({ title: 'Бот удален' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при удалении бота', description: error.message, variant: 'destructive' });
    }
  });

  // Обновление информации о токене
  const updateTokenMutation = useMutation({
    mutationFn: async ({ tokenId, data }: { tokenId: number; data: { name?: string; description?: string; trackExecutionTime?: number } }) => {
      return apiRequest('PUT', `/api/projects/${projectId}/tokens/${tokenId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Информация о боте обновлена' });
      setEditingToken(null);
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при обновлении', description: error.message, variant: 'destructive' });
    }
  });

  // Запуск бота
  const startBotMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/start`, { tokenId });
    },
    onSuccess: () => {
      toast({ title: "Бот запущен", description: "Бот успешно запущен и готов к работе." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
      // Сразу обновляем статус на фронтенде
      refetchBotStatus();
      // Обновляем информацию о боте (имя, описание)
      refetchBotInfo();
      // Обновляем список токенов чтобы показать актуальное имя бота
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Ошибка запуска", description: error.message || "Не удалось запустить бота.", variant: "destructive" });
    },
  });

  // Остановка бота
  const stopBotMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/stop`, { tokenId });
    },
    onSuccess: () => {
      toast({ title: "Бот остановлен", description: "Бот успешно остановлен." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot`] });
      // Сразу обновляем статус на фронтенде
      refetchBotStatus();
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

    // Сначала получаем информацию о боте, затем создаем токен
    parseBotInfoMutation.mutate(newBotToken.trim());
  };

  const getStatusBadge = (token: BotToken) => {
    // Проверяем, что именно этот токен запущен
    const isActiveBot = botStatus?.instance && 
                       isRunning && 
                       botStatus.instance.tokenId === token.id;
    
    if (isActiveBot) {
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
    <div className="space-y-4 sm:space-y-6">
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
            Управление ботами проекта <span className="font-semibold text-foreground">{projectName}</span>
          </p>
        </div>
        <Button 
          onClick={() => setShowAddBot(true)} 
          className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 h-10 sm:h-auto px-3 sm:px-4 py-2 sm:py-2 text-sm sm:text-base"
          data-testid="button-connect-bot"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Подключить бот</span>
        </Button>
      </div>

      {isLoading ? (
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
      ) : tokens.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 dark:from-slate-800/30 dark:to-slate-900/20">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center mb-4 sm:mb-6">
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">Нет подключенных ботов</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 max-w-md">
              Подключите первого бота, чтобы начать создание и управление Telegram-ботами прямо из визуального редактора
            </p>
            <Button 
              onClick={() => setShowAddBot(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
              size="lg"
              data-testid="button-connect-first-bot"
            >
              <Plus className="w-5 h-5" />
              Подключить первого бота
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens.map((token) => {
            const isThisTokenRunning = botStatus?.instance && 
                                      isRunning && 
                                      botStatus.instance.tokenId === token.id;
            
            return (
            <Card key={token.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <BotAvatar 
                      botName={token.botFirstName || token.name} 
                      photoUrl={token.botPhotoUrl}
                      size={48}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {editingField?.tokenId === token.id && editingField?.field === 'name' ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="font-semibold text-lg leading-tight h-auto px-2 py-1"
                            data-testid="input-bot-name-edit"
                          />
                        ) : (
                          <h3 
                            className="font-semibold text-lg leading-tight cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                            onDoubleClick={() => handleStartEdit(token.id, 'name', token.botFirstName || token.name)}
                            title="Двойной клик для редактирования"
                            data-testid="text-bot-name"
                          >
                            {token.botFirstName || token.name}
                          </h3>
                        )}
                        {token.botUsername && (
                          <span className="text-sm text-muted-foreground">@{token.botUsername}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
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
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="text-sm resize-none min-h-[40px]"
                            rows={2}
                            data-testid="textarea-bot-description-edit"
                          />
                        ) : (
                          <p 
                            className="text-sm text-muted-foreground mb-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                            onDoubleClick={() => handleStartEdit(token.id, 'description', token.botDescription || token.description || '')}
                            title="Двойной клик для редактирования"
                            data-testid="text-bot-description"
                          >
                            {token.botDescription || token.description}
                          </p>
                        )
                      )}
                      {token.botShortDescription && token.botShortDescription !== token.botDescription && (
                        editingField?.tokenId === token.id && editingField?.field === 'shortDescription' ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="text-xs h-auto px-2 py-1 mb-1"
                            data-testid="input-bot-short-description-edit"
                          />
                        ) : (
                          <p 
                            className="text-xs text-muted-foreground mb-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                            onDoubleClick={() => handleStartEdit(token.id, 'shortDescription', token.botShortDescription || '')}
                            title="Двойной клик для редактирования"
                            data-testid="text-bot-short-description"
                          >
                            {token.botShortDescription}
                          </p>
                        )
                      )}
                      <p className="text-xs text-muted-foreground">
                        Добавлен: {new Date(token.createdAt!).toLocaleDateString('ru-RU')}
                        {token.lastUsedAt && (
                          <> • Последний запуск: {new Date(token.lastUsedAt).toLocaleDateString('ru-RU')}</>
                        )}
                        {token.trackExecutionTime === 1 && (
                          <> • ⏱️ Времени работы: {formatExecutionTime(token.totalExecutionSeconds || 0)}</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Кнопка редактирования профиля бота - показываем всегда */}
                    <BotProfileEditor 
                      projectId={projectId} 
                      botInfo={botInfo} 
                      onProfileUpdated={refetchBotInfo} 
                    />
                    
                    {/* Проверяем статус конкретного токена */}
                    {(() => {
                      const isThisTokenRunning = botStatus?.instance && 
                                                isRunning && 
                                                botStatus.instance.tokenId === token.id;
                      
                      if (!isThisTokenRunning) {
                        return (
                          <Button
                            size="sm"
                            onClick={() => startBotMutation.mutate(token.id)}
                            disabled={startBotMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            {startBotMutation.isPending ? 'Запуск...' : 'Запустить'}
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => stopBotMutation.mutate(token.id)}
                            disabled={stopBotMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Square className="w-4 h-4" />
                            {stopBotMutation.isPending ? 'Остановка...' : 'Остановить'}
                          </Button>
                        );
                      }
                    })()}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-bot-menu">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => deleteBotMutation.mutate(token.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Database Toggle and Timer Display */}
                <div className="space-y-3">
                  {/* Database Toggle */}
                  <div className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    isDatabaseEnabled 
                      ? 'bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-600' 
                      : 'bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600'
                  }`} data-testid="database-toggle-container-bot-card">
                    <Database className={`w-4 h-4 ${isDatabaseEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    <Label htmlFor={`db-toggle-bot-${token.id}`} className={`text-sm font-bold cursor-pointer flex-1 ${
                      isDatabaseEnabled 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {isDatabaseEnabled ? 'БД включена' : 'БД выключена'}
                    </Label>
                    <Switch
                      id={`db-toggle-bot-${token.id}`}
                      data-testid="switch-database-toggle-bot-card"
                      checked={isDatabaseEnabled}
                      onCheckedChange={(checked) => toggleDatabaseMutation.mutate(checked)}
                      disabled={toggleDatabaseMutation.isPending}
                      className="scale-100"
                    />
                  </div>

                  {/* Generator Logs Toggle */}
                  <div className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    generatorLogsEnabled
                      ? 'bg-purple-50 dark:bg-purple-950 border-purple-500 dark:border-purple-600' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                  }`} data-testid="generator-logs-toggle-container-bot-card">
                    <Terminal className={`w-4 h-4 ${generatorLogsEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    <Label htmlFor="generator-logs-toggle" className={`text-sm font-bold cursor-pointer flex-1 ${
                      generatorLogsEnabled
                        ? 'text-purple-700 dark:text-purple-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      📋 Логи генератора
                    </Label>
                    <Switch
                      id="generator-logs-toggle"
                      data-testid="switch-generator-logs-toggle"
                      checked={generatorLogsEnabled}
                      onCheckedChange={handleToggleGeneratorLogs}
                      className="scale-100"
                    />
                  </div>

                  {/* Execution Timer - Shows when bot is running */}
                  {isThisTokenRunning && (
                    <div className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-500 dark:border-amber-600`} data-testid="timer-display-bot-card">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          Бот запущен
                        </p>
                        <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-300 mt-1">
                          ⏱️ {formatExecutionTime(currentElapsedSeconds)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Add Bot Dialog */}
      <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подключить бота</DialogTitle>
            <DialogDescription>
              Добавьте нового бота, используя токен от @BotFather
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-token">Токен бота</Label>
              <Input
                id="bot-token"
                type="password"
                placeholder="Вставьте токен от @BotFather"
                value={newBotToken}
                onChange={(e) => setNewBotToken(e.target.value)}
                disabled={isParsingBot || createBotMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Получите токен у @BotFather в Telegram: /newbot
              </p>
              {isParsingBot && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Получаем информацию о боте...
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddBot(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleAddBot}
              disabled={isParsingBot || createBotMutation.isPending || !newBotToken.trim()}
            >
              {isParsingBot ? 'Проверка токена...' : createBotMutation.isPending ? 'Добавление...' : 'Добавить бота'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bot Token Dialog */}
      <Dialog open={!!editingToken} onOpenChange={() => setEditingToken(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать токен</DialogTitle>
            <DialogDescription>
              Изменить настройки токена бота
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-bot-name">Имя токена</Label>
              <Input
                id="edit-bot-name"
                placeholder="Имя для токена (например: Основной бот)"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateTokenMutation.isPending}
                data-testid="input-edit-bot-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bot-description">Описание</Label>
              <Textarea
                id="edit-bot-description"
                placeholder="Описание бота (необязательно)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={updateTokenMutation.isPending}
                rows={3}
                data-testid="textarea-edit-bot-description"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setEditingToken(null)}
              disabled={updateTokenMutation.isPending}
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
                      description: editDescription.trim() || undefined
                    }
                  });
                }
              }}
              disabled={updateTokenMutation.isPending || !editName.trim()}
              data-testid="button-save-edit"
            >
              {updateTokenMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}