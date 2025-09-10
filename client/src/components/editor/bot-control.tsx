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
import { Play, Square, AlertCircle, CheckCircle, Clock, Trash2, Edit2, Settings, Bot, RefreshCw, Check, X, Plus, MoreHorizontal, Camera, Upload, ExternalLink } from 'lucide-react';

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

// Компонент для загрузки аватарки бота
function BotAvatarUploader({
  botInfo,
  onAvatarSelected
}: {
  botInfo: BotInfo;
  onAvatarSelected: (file: File) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    onAvatarSelected(file);
    setShowInstructions(true);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <>
      <div className="space-y-3">
        <Label>Аватар бота</Label>
        <div className="flex items-center gap-4">
          {/* Текущий аватар */}
          <BotAvatar
            photoUrl={botInfo.photoUrl}
            botName={botInfo.first_name}
            size={64}
          />
          
          {/* Превью нового аватара */}
          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Предпросмотр"
                className="w-16 h-16 rounded-lg object-cover border-2 border-green-500"
              />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✓
              </div>
            </div>
          )}
        </div>

        {/* Зона загрузки */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef[0]?.click()}
          data-testid="avatar-upload-zone"
        >
          <input
            type="file"
            ref={(el) => (fileInputRef[0] = el)}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            data-testid="avatar-file-input"
          />
          <div className="flex flex-col items-center gap-2">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Загрузить новый аватар</p>
            <p className="text-xs text-muted-foreground">
              Перетащите изображение или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground">
              Поддерживаются JPG, PNG (до 5MB)
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Upload className="h-4 w-4" />
              <p className="text-sm font-medium">
                Файл выбран: {selectedFile.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Диалог с инструкциями */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Установка аватара бота
            </DialogTitle>
            <DialogDescription>
              Для установки аватара необходимо использовать BotFather в Telegram
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Предпросмотр аватара"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Инструкция по установке:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Сохраните выбранное изображение на устройство</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Откройте @BotFather в Telegram</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>Отправьте команду <code className="bg-muted px-1 rounded">/setuserpic</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <span>Выберите вашего бота: <strong>@{botInfo.username}</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">5</span>
                  <span>Загрузите изображение как <strong>фото</strong> (не файл)</span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Важно:</strong> Загружайте изображение как фото, а не как файл. 
                Квадратные изображения работают лучше всего.
              </p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowInstructions(false)}
                data-testid="button-close-instructions"
              >
                Понятно
              </Button>
              <Button
                onClick={() => {
                  window.open('https://t.me/botfather', '_blank');
                }}
                className="flex items-center gap-2"
                data-testid="button-open-botfather"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть BotFather
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

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
      
      // Принудительно обновляем данные бота с задержкой
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      
      // Ждем, чтобы изменения применились в Telegram API и бот перезапустился
      setTimeout(async () => {
        // Принудительно запрашиваем свежие данные, обходя кэш
        try {
          const freshBotInfo = await apiRequest('GET', `/api/projects/${projectId}/bot/info?_t=${Date.now()}`);
          // Обновляем кэш вручную с новыми данными
          queryClient.setQueryData([`/api/projects/${projectId}/bot/info`], freshBotInfo);
        } catch (error) {
          console.warn('Не удалось получить свежие данные бота:', error);
        }
        
        queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
        onProfileUpdated();
      }, 3000);
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
      // Принудительно обновляем данные бота
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
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
      // Принудительно обновляем данные бота
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
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
          {/* Компонент загрузки аватара */}
          {botInfo && (
            <BotAvatarUploader
              botInfo={botInfo}
              onAvatarSelected={setSelectedAvatarFile}
            />
          )}
          
          <Separator />
          
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
  fallbackName = 'Бот'
}: { 
  projectId: number;
  botInfo?: BotInfo | null; 
  onRefresh: () => void; 
  isRefreshing: boolean; 
  fallbackName?: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем статус бота
  const { data: botStatus, isLoading: isLoadingStatus } = useQuery<BotStatusResponse>({
    queryKey: [`/api/projects/${projectId}/bot`],
    refetchInterval: 1000,
  });

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
    refetchInterval: botStatus?.status === 'running' ? 30000 : false,
  });

  const isRunning = botStatus?.status === 'running';
  const isError = botStatus?.status === 'error';
  const isStopped = botStatus?.status === 'stopped' || !botStatus?.instance;

  // Парсинг информации о боте по токену
  const parseBotInfoMutation = useMutation({
    mutationFn: async (token: string) => {
      setIsParsingBot(true);
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.description || 'Неверный токен');
        }
        return result.result;
      } finally {
        setIsParsingBot(false);
      }
    },
    onSuccess: (botInfo) => {
      // Автоматически создаем токен с полученной информацией
      createBotMutation.mutate({
        name: `@${botInfo.username}`,
        token: newBotToken.trim(),
        isDefault: tokens.length === 0 ? 1 : 0, // Первый токен становится по умолчанию
        isActive: 1
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
    mutationFn: async (botData: { name: string; token: string; isDefault: number; isActive: number }) => {
      return apiRequest('POST', `/api/projects/${projectId}/tokens`, { 
        ...botData, 
        projectId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Бот успешно добавлен' });
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
      toast({ title: 'Бот удален' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка при удалении бота', description: error.message, variant: 'destructive' });
    }
  });

  // Обновление информации о токене
  const updateTokenMutation = useMutation({
    mutationFn: async ({ tokenId, data }: { tokenId: number; data: { name?: string; description?: string } }) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Боты
          </h2>
          <p className="text-muted-foreground">
            Управление ботами проекта {projectName}
          </p>
        </div>
        <Button onClick={() => setShowAddBot(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Подключить бот
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет подключенных ботов</h3>
            <p className="text-muted-foreground text-center mb-4">
              Подключите первого бота, чтобы начать создание Telegram-ботов
            </p>
            <Button onClick={() => setShowAddBot(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Подключить бота
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens.map((token) => (
            <Card key={token.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <BotAvatar 
                      botName={token.name} 
                      size={48}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg leading-tight mb-1">{token.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(token)}
                      </div>
                      {token.description && (
                        <p className="text-sm text-muted-foreground">{token.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Добавлен: {new Date(token.createdAt).toLocaleDateString('ru-RU')}
                        {token.lastUsedAt && (
                          <> • Последний запуск: {new Date(token.lastUsedAt).toLocaleDateString('ru-RU')}</>
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
              </CardContent>
            </Card>
          ))}
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