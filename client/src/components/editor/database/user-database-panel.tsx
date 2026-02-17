// @ts-nocheck
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotMessage, BotProject, UserBotData } from '@shared/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpDown,
  BarChart3,
  Bot,
  Calendar,
  Crown,
  Database,
  Edit,
  Eye,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  User,
  UserCheck,
  Users,
  UserX
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleSheetsExportButton } from '../google-sheets/GoogleSheetsExportButton';

type BotMessageWithMedia = BotMessage & {
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
};

interface UserDatabasePanelProps {
  projectId: number;
  projectName: string;
  onOpenDialogPanel?: (user: UserBotData) => void;
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}

/**
 * Возможные поля для сортировки пользователей
 */
type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName';

/**
 * Направления сортировки
 */
type SortDirection = 'asc' | 'desc';

/**
 * @function UserDatabasePanel
 * @description Компонент панели базы данных пользователей, позволяющий просматривать, фильтровать и управлять пользователями бота
 * @param {UserDatabasePanelProps} props - Свойства компонента
 * @param {number} props.projectId - Идентификатор проекта
 * @param {string} props.projectName - Название проекта
 * @param {Function} props.onOpenDialogPanel - Функция для открытия панели диалога с пользователем
 * @param {Function} props.onOpenUserDetailsPanel - Функция для открытия панели с деталями пользователя
 * @returns {JSX.Element} Компонент панели базы данных пользователей
 */
export function UserDatabasePanel({ projectId, projectName, onOpenDialogPanel, onOpenUserDetailsPanel }: UserDatabasePanelProps): React.JSX.Element {
  /**
   * @type {string}
   * @description Поисковый запрос для фильтрации пользователей
   */
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * @type {UserBotData | null}
   * @description Выбранный пользователь для просмотра деталей
   */
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);

  /**
   * @type {boolean}
   * @description Флаг отображения панели с деталями пользователя
   */
  const [showUserDetails, setShowUserDetails] = useState(false);

  /**
   * @type {boolean}
   * @description Флаг загрузки данных
   */
  const [] = useState(false);

  /**
   * @type {SortField}
   * @description Поле, по которому производится сортировка пользователей
   */
  const [sortField, setSortField] = useState<SortField>('lastInteraction');

  /**
   * @type {SortDirection}
   * @description Направление сортировки (по возрастанию или убыванию)
   */
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  /**
   * @type {boolean | null}
   * @description Фильтр по статусу активности пользователя (true - активен, false - неактивен, null - все)
   */
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  /**
   * @type {boolean | null}
   * @description Фильтр по статусу премиум пользователя (true - премиум, false - обычный, null - все)
   */
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);

  /**
   * @type {boolean | null}
   * @description Фильтр по статусу блокировки пользователя
   */
  const [filterBlocked] = useState<boolean | null>(null);

  /**
   * @type {'all' | 'today' | 'week' | 'month'}
   * @description Фильтр по периоду активности пользователя
   */
  const [] = useState<'all' | 'today' | 'week' | 'month'>('all');

  /**
   * @type {number[]}
   * @description Массив идентификаторов выбранных пользователей
   */
  const [] = useState<number[]>([]);

  /**
   * @type {boolean}
   * @description Флаг отображения модального окна
   */
  const [] = useState(false);

  /**
   * @type {boolean}
   * @description Флаг отображения диалогового окна отправки сообщения
   */
  const [showDialog, setShowDialog] = useState(false);

  /**
   * @type {UserBotData | null}
   * @description Пользователь, которому будет отправлено сообщение
   */
  const [selectedUserForDialog, setSelectedUserForDialog] = useState<UserBotData | null>(null);

  /**
   * @type {string}
   * @description Текст сообщения для отправки пользователю
   */
  const [messageText, setMessageText] = useState('');

  /**
   * @type {React.RefObject<HTMLDivElement>}
   * @description Ссылка на элемент прокрутки сообщений в диалоге
   */
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  /**
   * @type {Object}
   * @description Хук для отображения уведомлений
   */
  const { toast } = useToast();

  /**
   * @type {Object}
   * @description Клиент для управления кэшем запросов
   */
  const qClient = useQueryClient();

  /**
   * @type {boolean}
   * @description Флаг мобильного режима
   */
  const isMobile = useIsMobile();

  // Fetch project data to get userDatabaseEnabled setting and flowData
  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

  /**
   * @constant {Record<string, string>} variableToQuestionMap
   * @description Карта соответствия переменных ввода пользователя вопросам из проекта
   * @description Создает соответствие между переменными ввода из узлов проекта и текстами вопросов для отображения контекста ответов пользователя
   */
  const variableToQuestionMap = useMemo(() => {
    const mapping: Record<string, string> = {};
    if (!project?.data) return mapping;

    try {
      const flowData = typeof project.data === 'string'
        ? JSON.parse(project.data as string)
        : project.data as any;

      // Iterate through all sheets and nodes
      const sheets = flowData?.sheets || [];
      for (const sheet of sheets) {
        const nodes = sheet?.nodes || [];
        for (const node of nodes) {
          const data = node?.data;
          if (!data) continue;

          // Get the question text (messageText)
          const questionText = data.messageText;
          if (!questionText) continue;

          // Map inputVariable to questionText
          if (data.inputVariable) {
            mapping[data.inputVariable] = questionText;
          }
          // Map photoInputVariable to questionText
          if (data.photoInputVariable) {
            mapping[data.photoInputVariable] = questionText;
          }
          // Map videoInputVariable to questionText
          if (data.videoInputVariable) {
            mapping[data.videoInputVariable] = questionText;
          }
          // Map audioInputVariable to questionText
          if (data.audioInputVariable) {
            mapping[data.audioInputVariable] = questionText;
          }
          // Map documentInputVariable to questionText
          if (data.documentInputVariable) {
            mapping[data.documentInputVariable] = questionText;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing project data for variable mapping:', e);
    }

    return mapping;
  }, [project?.data]);

  // Fetch user data
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users`],
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch user stats  
  const { data: stats = {}, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalUsers?: number;
    activeUsers?: number;
    blockedUsers?: number;
    premiumUsers?: number;
    totalInteractions?: number;
    avgInteractionsPerUser?: number;
    usersWithResponses?: number;
  }>({
    queryKey: [`/api/projects/${projectId}/users/stats`],
    staleTime: 0,
    gcTime: 0,
  });

  // Search users
  /**
   * @constant {UserBotData[]} searchResults
   * @description Результаты поиска пользователей по поисковому запросу
   * @description Выполняет поиск пользователей через API при наличии поискового запроса
   */
  const { data: searchResults = [] } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users/search`, searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/users/search?q=${encodeURIComponent(searchQuery)}`),
  });

  // Fetch messages for dialog
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${selectedUserForDialog?.userId}/messages`],
    enabled: showDialog && !!selectedUserForDialog?.userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  /**
   * @function scrollToBottom
   * @description Прокручивает область сообщений в самый низ
   * @description Используется для автоматической прокрутки к последнему сообщению в диалоге
   */
  const scrollToBottom = () => {
    if (messagesScrollRef.current) {
      setTimeout(() => {
        const scrollElement = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 100);
    }
  };

  // Auto-scroll to bottom when messages finish loading or user changes
  useEffect(() => {
    if (showDialog && !messagesLoading) {
      scrollToBottom();
    }
  }, [showDialog, messagesLoading, selectedUserForDialog?.userId]);

  // Fetch messages for user details modal (to get photo URLs)
  const { data: userDetailsMessages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${selectedUser?.userId}/messages`],
    enabled: showUserDetails && !!selectedUser?.userId,
    staleTime: 0,
  });

  // Helper function to find photo URL from messages by file_id
  const getPhotoUrlFromMessages = (fileId: string): string | null => {
    if (!fileId || !userDetailsMessages.length) return null;

    for (const msg of userDetailsMessages) {
      // Check if message has media with matching URL pattern or file_id reference
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.url) {
            return m.url;
          }
        }
      }
      // Check messageData for photo with matching file_id
      const msgData = msg.messageData as Record<string, any> | null;
      if (msgData?.photo?.file_id === fileId && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
      // Also check if this is a photo answer message
      if (msgData?.is_photo_answer && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
    }

    // Find any user message with photo media
    const photoMessages = userDetailsMessages.filter(
      m => m.messageType === 'user' && m.media && m.media.length > 0
    );
    if (photoMessages.length > 0) {
      return photoMessages[photoMessages.length - 1].media![0].url;
    }

    return null;
  };

  // Calculate real message counts from loaded messages
  const userMessageCounts = useMemo(() => {
    if (!userDetailsMessages.length) {
      return { userSent: 0, botSent: 0, total: 0 };
    }
    const userSent = userDetailsMessages.filter(m => m.messageType === 'user').length;
    const botSent = userDetailsMessages.filter(m => m.messageType === 'bot').length;
    return { userSent, botSent, total: userDetailsMessages.length };
  }, [userDetailsMessages]);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log(`Attempting to delete user with ID: ${userId}`);
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: (data) => {
      console.log("User deletion successful:", data);
      // Force clear cache and refetch
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      // Delay refetch to ensure cache is cleared
      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: "Пользователь удален",
        description: "Данные пользователя успешно удалены",
      });
    },
    onError: (error) => {
      console.error("User deletion failed:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить пользователя. Проверьте консоль для подробностей.",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  /**
   * @constant {Object} updateUserMutation
   * @description Мутация для обновления данных пользователя
   * @description Обновляет данные пользователя через API, нормализуя булевы значения в 0/1 для базы данных
   */
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<UserBotData> }) => {
      // Convert boolean values to 0/1 for database
      const normalizedData = {
        ...data,
        ...(data.isActive !== undefined && { isActive: data.isActive ? 1 : 0 }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked ? 1 : 0 }),
        ...(data.isPremium !== undefined && { isPremium: data.isPremium ? 1 : 0 }),
      };
      return apiRequest('PUT', `/api/users/${userId}`, normalizedData);
    },
    onSuccess: () => {
      // Принудительно очищаем кэш и обновляем данные
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      // Принудительно обновляем данные
      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      toast({
        title: "Статус изменен",
        description: "Статус пользователя успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    }
  });

  // Delete all users mutation
  const deleteAllUsersMutation = useMutation({
    mutationFn: () => {
      console.log(`Attempting to delete all users for project: ${projectId}`);
      return apiRequest('DELETE', `/api/projects/${projectId}/users`);
    },
    onSuccess: (data) => {
      console.log("Bulk deletion successful:", data);
      // Force clear cache and refetch
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      qClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });

      // Delay refetch to ensure cache is cleared
      setTimeout(() => {
        refetchUsers();
        refetchStats();
      }, 100);

      const deletedCount = data?.deletedCount || 0;
      toast({
        title: "База данных очищена",
        description: `Удалено записей: ${deletedCount}. Все пользовательские данные удалены.`,
      });
    },
    onError: (error) => {
      console.error("Bulk deletion failed:", error);
      toast({
        title: "Ошибка очистки базы",
        description: "Не удалось очистить базу данных. Проверьте консоль для подробностей.",
        variant: "destructive",
      });
    }
  });

  // Toggle user database enabled mutation
  const toggleDatabaseMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (_data, enabled) => {
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
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

  /**
   * @constant {Object} sendMessageMutation
   * @description Мутация для отправки сообщения пользователю
   * @description Отправляет сообщение выбранному пользователю через API и обновляет кэш сообщений
   */
  const sendMessageMutation = useMutation({
    mutationFn: (data: { messageText: string }) => {
      console.log('selectedUserForDialog:', selectedUserForDialog);
      console.log('userId field:', selectedUserForDialog?.userId);

      const userId = selectedUserForDialog?.userId;
      if (!userId) {
        throw new Error('User ID is required');
      }
      return apiRequest('POST', `/api/projects/${projectId}/users/${userId}/send-message`, data);
    },
    onSuccess: () => {
      qClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/users/${selectedUserForDialog?.userId}/messages`]
      });
      setMessageText('');
      toast({
        title: "Сообщение отправлено",
        description: "Сообщение успешно отправлено пользователю",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отправки",
        description: error?.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
  });

  // Refetch messages when dialog opens
  useEffect(() => {
    if (showDialog && selectedUserForDialog?.userId) {
      refetchMessages();
    }
  }, [showDialog, selectedUserForDialog?.userId, refetchMessages]);

  /**
   * @constant {UserBotData[]} filteredAndSortedUsers
   * @description Отфильтрованный и отсортированный список пользователей
   * @description Применяет фильтры и сортировку к списку пользователей в зависимости от поискового запроса, фильтров и параметров сортировки
   */
  const filteredAndSortedUsers = useMemo(() => {
    let result = searchQuery.length > 0 ? searchResults : users;

    // Apply filters
    if (filterActive !== null) {
      result = result.filter(user => Boolean(user.isActive) === filterActive);
    }
    if (filterPremium !== null) {
      result = result.filter(user => Boolean(user.isPremium) === filterPremium);
    }
    if (filterBlocked !== null) {
      result = result.filter(user => Boolean(user.isBlocked) === filterBlocked);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aValue: any, bValue: any;

      // Get field values
      if (sortField === 'lastInteraction') {
        aValue = a.lastInteraction;
        bValue = b.lastInteraction;
      } else if (sortField === 'createdAt') {
        aValue = a.createdAt;
        bValue = b.createdAt;
      } else if (sortField === 'interactionCount') {
        aValue = a.interactionCount;
        bValue = b.interactionCount;
      } else if (sortField === 'firstName') {
        aValue = a.firstName;
        bValue = b.firstName;
      } else if (sortField === 'userName') {
        aValue = a.userName;
        bValue = b.userName;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (sortField === 'lastInteraction' || sortField === 'createdAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [users, searchResults, searchQuery, filterActive, filterPremium, filterBlocked, sortField, sortDirection]);

  const handleRefresh = () => {
    refetchUsers();
    refetchStats();
  };

  /**
   * @function handleUserStatusToggle
   * @description Переключает статус пользователя (активен/заблокирован/премиум)
   * @param {UserBotData} user - Данные пользователя
   * @param {'isActive' | 'isBlocked' | 'isPremium'} field - Поле статуса для переключения
   */
  const handleUserStatusToggle = (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => {
    const currentValue = user[field];
    const newValue = currentValue === 1 ? 0 : 1;
    const userId = user.id;

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    // Только isActive работает в базе данных
    if (field === 'isActive') {
      updateUserMutation.mutate({
        userId: userId,
        data: { [field]: newValue }
      });
    } else {
      toast({
        title: "Функция недоступна",
        description: `Изменение статуса "${field}" пока не поддерживается`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: unknown) => {
    if (!date) return 'Никогда';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) :
        date instanceof Date ? date :
          typeof date === 'number' ? new Date(date) :
            null;

      if (!dateObj) return 'Никогда';

      return dateObj.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Никогда';
    }
  };

  /**
   * @function formatUserName
   * @description Форматирует имя пользователя для отображения
   * @param {UserBotData} user - Данные пользователя
   * @returns {string} Отформатированное имя пользователя (имя + фамилия, или username, или ID)
   */
  const formatUserName = (user: UserBotData) => {
    const firstName = user.firstName;
    const lastName = user.lastName;
    const userName = user.userName;
    const userId = user.userId;

    const parts = [firstName, lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (userName) return `@${userName}`;
    return `ID: ${userId}`;
  };

  if (usersLoading || statsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Загрузка базы данных...</p>
        </div>
      </div>
    );
  }

  const isDatabaseEnabled = project?.userDatabaseEnabled === 1;

  return (
    <>
      {newFunction_2(projectId, projectName, isDatabaseEnabled, toggleDatabaseMutation, handleRefresh, deleteAllUsersMutation, stats, searchQuery, setSearchQuery, filterActive, setFilterActive, filterPremium, setFilterPremium, sortField, sortDirection, setSortField, setSortDirection, isMobile, filteredAndSortedUsers, formatUserName, onOpenUserDetailsPanel, setSelectedUser, setShowUserDetails, onOpenDialogPanel, setSelectedUserForDialog, setShowDialog, scrollToBottom, handleUserStatusToggle, formatDate, deleteUserMutation, project)}
      {newFunction(showUserDetails, setShowUserDetails, isMobile, selectedUser, userMessageCounts, handleUserStatusToggle, formatDate, variableToQuestionMap, getPhotoUrlFromMessages)}
      {newFunction_1(showDialog, setShowDialog, isMobile, selectedUserForDialog, formatUserName, messagesScrollRef, messagesLoading, messages, formatDate, messageText, setMessageText, sendMessageMutation)}
    </>
  );
}

function newFunction_2(projectId: number, projectName: string, isDatabaseEnabled: boolean, toggleDatabaseMutation, handleRefresh: () => void, deleteAllUsersMutation, stats: { totalUsers?: number; activeUsers?: number; blockedUsers?: number; premiumUsers?: number; totalInteractions?: number; avgInteractionsPerUser?: number; usersWithResponses?: number; }, searchQuery: string, setSearchQuery: React.Dispatch<React.SetStateAction<string>>, filterActive: boolean | null, setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>, filterPremium: boolean | null, setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>, sortField: string, sortDirection: string, setSortField: React.Dispatch<React.SetStateAction<SortField>>, setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>, isMobile: boolean, filteredAndSortedUsers: { projectId: number; id: number; firstName: string | null; lastName: string | null; createdAt: Date | null; updatedAt: Date | null; userId: string; userName: string | null; languageCode: string | null; isBot: number | null; isPremium: number | null; lastInteraction: Date | null; interactionCount: number | null; userData: unknown; currentState: string | null; preferences: unknown; commandsUsed: unknown; sessionsCount: number | null; totalMessagesSent: number | null; totalMessagesReceived: number | null; deviceInfo: string | null; locationData: unknown; contactData: unknown; isBlocked: number | null; isActive: number | null; tags: string[] | null; notes: string | null; }[], formatUserName: (user: UserBotData) => string, onOpenUserDetailsPanel: ((user: UserBotData) => void) | undefined, setSelectedUser: React.Dispatch<React.SetStateAction<{ projectId: number; id: number; firstName: string | null; lastName: string | null; createdAt: Date | null; updatedAt: Date | null; userId: string; userName: string | null; languageCode: string | null; isBot: number | null; isPremium: number | null; lastInteraction: Date | null; interactionCount: number | null; userData: unknown; currentState: string | null; preferences: unknown; commandsUsed: unknown; sessionsCount: number | null; totalMessagesSent: number | null; totalMessagesReceived: number | null; deviceInfo: string | null; locationData: unknown; contactData: unknown; isBlocked: number | null; isActive: number | null; tags: string[] | null; notes: string | null; } | null>>, setShowUserDetails: React.Dispatch<React.SetStateAction<boolean>>, onOpenDialogPanel: ((user: UserBotData) => void) | undefined, setSelectedUserForDialog: React.Dispatch<React.SetStateAction<{ projectId: number; id: number; firstName: string | null; lastName: string | null; createdAt: Date | null; updatedAt: Date | null; userId: string; userName: string | null; languageCode: string | null; isBot: number | null; isPremium: number | null; lastInteraction: Date | null; interactionCount: number | null; userData: unknown; currentState: string | null; preferences: unknown; commandsUsed: unknown; sessionsCount: number | null; totalMessagesSent: number | null; totalMessagesReceived: number | null; deviceInfo: string | null; locationData: unknown; contactData: unknown; isBlocked: number | null; isActive: number | null; tags: string[] | null; notes: string | null; } | null>>, setShowDialog: React.Dispatch<React.SetStateAction<boolean>>, scrollToBottom: () => void, handleUserStatusToggle: (user: UserBotData, field: "isActive" | "isBlocked" | "isPremium") => void, formatDate: (date: unknown) => string, deleteUserMutation, project?: BotProject) {
  return <ScrollArea className="h-full w-full">
    <div className="flex flex-col bg-background">
      <div className="border-b border-border/50 bg-card">
        <div className="p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
          {/* Modern Header with Glassmorphism */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 dark:from-blue-500/20 dark:via-cyan-500/10 dark:to-purple-500/20 p-4 sm:p-5 lg:p-6">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon and Title */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
                    База данных пользователей
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-0.5 truncate">
                    {projectName}
                  </p>
                </div>
              </div>

              {/* Status Badge & Controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Database Status Toggle */}
                <div
                  className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${isDatabaseEnabled
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 shadow-emerald-500/10 shadow-lg'
                    : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 shadow-rose-500/10 shadow-lg'}`}
                  data-testid="database-toggle-container"
                >
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDatabaseEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <Label
                    htmlFor="db-toggle"
                    className={`text-sm font-semibold cursor-pointer whitespace-nowrap ${isDatabaseEnabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
                  >
                    {isDatabaseEnabled ? 'Активна' : 'Отключена'}
                  </Label>
                  <Switch
                    id="db-toggle"
                    data-testid="switch-database-toggle"
                    checked={isDatabaseEnabled}
                    onCheckedChange={(checked) => toggleDatabaseMutation.mutate(checked)}
                    disabled={toggleDatabaseMutation.isPending} />
                </div>

                {/* Action Buttons */}
                {isDatabaseEnabled && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-2 hover:bg-background/80 backdrop-blur-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">Обновить</span>
                    </Button>
                    {projectId && projectName ? (
                      <GoogleSheetsExportButton projectId={projectId} projectName={projectName} />
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Очистить</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить все данные пользователей?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Все данные пользователей для этого бота будут удалены навсегда.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAllUsersMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить все
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Последняя экспортированная Google Таблица */}
          {project?.lastExportedGoogleSheetUrl && (
            <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-green-600 dark:text-green-400">📊</span>
              <span className="text-muted-foreground">Последний экспорт:</span>
              <a
                href={project.lastExportedGoogleSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                Открыть Google Таблицу
              </a>
              {project.lastExportedAt && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(project.lastExportedAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          )}

          {/* Stats Grid - Modern Responsive Design */}
          {isDatabaseEnabled && stats && (
            <div className="space-y-3">
              {/* Mobile: Horizontal scroll with snap */}
              <div className="block sm:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
                  {[
                    { icon: Users, label: 'Всего', value: stats.totalUsers, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
                    { icon: Activity, label: 'Активны', value: stats.activeUsers, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                    { icon: Shield, label: 'Заблок.', value: stats.blockedUsers, gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                    { icon: Crown, label: 'Premium', value: stats.premiumUsers, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                    { icon: MessageSquare, label: 'Сообщ.', value: stats.totalInteractions, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' },
                    { icon: BarChart3, label: 'Среднее', value: stats.avgInteractionsPerUser, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
                    { icon: Edit, label: 'Ответы', value: stats.usersWithResponses || 0, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/40' },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className={`${stat.bg} flex-shrink-0 snap-start w-[100px] rounded-xl p-3 flex flex-col items-center gap-2 transition-transform duration-200 active:scale-95`}
                        data-testid={`stat-card-mobile-${idx}`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground tabular-nums">{stat.value ?? 0}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Scroll indicator dots */}
                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  ))}
                </div>
              </div>

              {/* Tablet: 2 rows grid */}
              <div className="hidden sm:grid md:hidden grid-cols-4 gap-2">
                {[
                  { icon: Users, label: 'Всего пользователей', value: stats.totalUsers, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-600 dark:text-blue-400' },
                  { icon: Activity, label: 'Активных', value: stats.activeUsers, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: Shield, label: 'Заблокировано', value: stats.blockedUsers, gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40', textColor: 'text-rose-600 dark:text-rose-400' },
                  { icon: Crown, label: 'Premium', value: stats.premiumUsers, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-600 dark:text-amber-400' },
                  { icon: MessageSquare, label: 'Сообщений', value: stats.totalInteractions, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40', textColor: 'text-violet-600 dark:text-violet-400' },
                  { icon: BarChart3, label: 'Среднее/юзер', value: stats.avgInteractionsPerUser, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40', textColor: 'text-indigo-600 dark:text-indigo-400' },
                  { icon: Edit, label: 'С ответами', value: stats.usersWithResponses || 0, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/40', textColor: 'text-orange-600 dark:text-orange-400' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className={`${stat.bg} rounded-xl p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${idx === 6 ? 'col-span-4 sm:col-span-1' : ''}`}
                      data-testid={`stat-card-tablet-${idx}`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-bold text-foreground tabular-nums">{stat.value ?? 0}</p>
                        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Single row with all stats */}
              <div className="hidden md:flex gap-2 justify-between">
                {[
                  { icon: Users, label: 'Всего', fullLabel: 'Всего пользователей', value: stats.totalUsers, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50/80 dark:bg-blue-950/40', ring: 'ring-blue-200 dark:ring-blue-800' },
                  { icon: Activity, label: 'Активны', fullLabel: 'Активных пользователей', value: stats.activeUsers, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40', ring: 'ring-emerald-200 dark:ring-emerald-800' },
                  { icon: Shield, label: 'Заблок.', fullLabel: 'Заблокировано', value: stats.blockedUsers, gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-50/80 dark:bg-rose-950/40', ring: 'ring-rose-200 dark:ring-rose-800' },
                  { icon: Crown, label: 'Premium', fullLabel: 'Premium пользователей', value: stats.premiumUsers, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50/80 dark:bg-amber-950/40', ring: 'ring-amber-200 dark:ring-amber-800' },
                  { icon: MessageSquare, label: 'Сообщ.', fullLabel: 'Всего сообщений', value: stats.totalInteractions, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50/80 dark:bg-violet-950/40', ring: 'ring-violet-200 dark:ring-violet-800' },
                  { icon: BarChart3, label: 'Среднее', fullLabel: 'Сообщений на пользователя', value: stats.avgInteractionsPerUser, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50/80 dark:bg-indigo-950/40', ring: 'ring-indigo-200 dark:ring-indigo-800' },
                  { icon: Edit, label: 'Ответы', fullLabel: 'Пользователей с ответами', value: stats.usersWithResponses || 0, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50/80 dark:bg-orange-950/40', ring: 'ring-orange-200 dark:ring-orange-800' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={idx}
                      className={`${stat.bg} group flex-1 rounded-xl p-3 lg:p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] cursor-default ring-1 ${stat.ring} ring-opacity-50`}
                      title={stat.fullLabel}
                      data-testid={`stat-card-desktop-${idx}`}
                    >
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums leading-none">{stat.value ?? 0}</p>
                        <p className="text-[10px] lg:text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wide">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modern Search & Filters */}
          {isDatabaseEnabled && (
            <div className="bg-muted/30 dark:bg-muted/10 rounded-xl p-3 sm:p-4 space-y-3">
              {/* Search Input with modern styling */}
              <div className="relative group">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-focus-within:bg-primary/20">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <Input
                  placeholder="Поиск по имени, username или ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 sm:pl-16 pr-4 h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 focus:border-primary/40 focus:ring-0 transition-all"
                  data-testid="input-search-users" />
              </div>

              {/* Filters Row - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {/* Status Filter */}
                <Select value={filterActive?.toString() || 'all'} onValueChange={(value) => setFilterActive(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 transition-all" data-testid="select-status-filter">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <SelectValue placeholder="Статус" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="true">Активные</SelectItem>
                    <SelectItem value="false">Неактивные</SelectItem>
                  </SelectContent>
                </Select>

                {/* Premium Filter */}
                <Select value={filterPremium?.toString() || 'all'} onValueChange={(value) => setFilterPremium(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 transition-all" data-testid="select-premium-filter">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <SelectValue placeholder="Premium" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все пользователи</SelectItem>
                    <SelectItem value="true">Только Premium</SelectItem>
                    <SelectItem value="false">Обычные</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Filter */}
                {/* Селектор сортировки пользователей по различным полям и направлениям */}
                <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                  // Разделяем значение на поле сортировки и направление
                  const [field, direction] = value.split('-') as [SortField, SortDirection];
                  setSortField(field);
                  setSortDirection(direction);
                }}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 transition-all" data-testid="select-sort-filter">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center">
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <SelectValue placeholder="Сортировка" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastInteraction-desc">Последняя активность</SelectItem>
                    <SelectItem value="lastInteraction-asc">Давняя активность</SelectItem>
                    <SelectItem value="interactionCount-desc">Больше сообщений</SelectItem>
                    <SelectItem value="interactionCount-asc">Меньше сообщений</SelectItem>
                    <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
                    <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
                    <SelectItem value="firstName-asc">Имя А-Я</SelectItem>
                    <SelectItem value="firstName-desc">Имя Я-А</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Database Disabled Warning */}
      {!isDatabaseEnabled && (
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50">
            <div className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-4">
                  <Database className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                  База данных выключена
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Включите базу данных с помощью переключателя выше, чтобы начать сохранять данные пользователей и просматривать статистику.
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  Пока база данных выключена, бот продолжает работать, но данные пользователей не сохраняются.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {isDatabaseEnabled && (
        <div>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 m-3 sm:m-4">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="responses">Ответы пользователей</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-2">
              {isMobile ? (
                // Mobile card layout
                (<div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {filteredAndSortedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'Пользователи не найдены' : 'Пользователи еще не взаимодействовали с ботом'}
                      </div>
                    </div>
                  ) : (
                    filteredAndSortedUsers.map((user, index): React.JSX.Element => (
                      <Card key={user.id || index} className="p-4" data-testid={`user-card-mobile-${index}`}>
                        <div className="space-y-3">
                          {/* User Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-base">{formatUserName(user)}</div>
                              <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-view-user-${index}`}
                                onClick={() => {
                                  if (onOpenUserDetailsPanel) {
                                    onOpenUserDetailsPanel(user);
                                  } else {
                                    setSelectedUser(user);
                                    setShowUserDetails(true);
                                  }
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-show-dialog-${index}`}
                                onClick={() => {
                                  // Если предоставлена внешняя функция открытия диалога, используем её
                                  if (onOpenDialogPanel) {
                                    onOpenDialogPanel(user);
                                  } else {
                                    // Иначе открываем встроенный диалог
                                    setSelectedUserForDialog(user);
                                    setShowDialog(true);
                                    setTimeout(() => scrollToBottom(), 200);
                                  }
                                }}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-toggle-active-${index}`}
                                onClick={() => handleUserStatusToggle(user, 'isActive')}
                                className={user.isActive === 1 ? "text-red-600" : "text-green-600"}
                              >
                                {user.isActive === 1 ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>

                          {/* Status Badges */}
                          {(() => (
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={Number(user.isActive) === 1 ? "default" : "secondary"}>
                                {Number(user.isActive) === 1 ? "Активен" : "Неактивен"}
                              </Badge>
                              {Number(user.isPremium) === 1 ? (
                                <Badge variant="outline" className="text-yellow-600">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              ) : null}
                              {Number(user.isBlocked) === 1 ? (
                                <Badge variant="destructive">Заблокирован</Badge>
                              ) : null}
                              {Number(user.isBot) === 1 ? (
                                <Badge variant="outline">Бот</Badge>
                              ) : null}
                            </div>
                          ))()}

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Сообщений</div>
                              <div className="font-medium">{user.interactionCount || 0}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Последняя активность</div>
                              <div className="font-medium text-xs">{formatDate(user.lastInteraction)}</div>
                            </div>
                          </div>

                          {/* Recent Responses */}
                          {(user.userData && Object.keys(user.userData).length > 0) && (
                            <div className="border-t pt-3">
                              <div className="text-sm font-medium mb-2">Последние ответы:</div>
                              <div className="space-y-2">
                                {Object.entries(user.userData || {}).slice(0, 1).map(([key, value]) => {
                                  let responseData = value;
                                  if (typeof value === 'string') {
                                    try {
                                      responseData = JSON.parse(value);
                                    } catch {
                                      responseData = { value: value, type: 'text' };
                                    }
                                  }

                                  return (
                                    <div key={key} className="text-xs bg-muted/50 rounded-lg p-2">
                                      <div className="text-muted-foreground mb-1">{String(key)}:</div>
                                      <div className="font-medium">
                                        {(() => {
                                          const responseValue = (responseData as any)?.value;
                                          if (responseValue) {
                                            return responseValue.length > 50 ? `${responseValue.substring(0, 50)}...` : responseValue;
                                          }
                                          if (typeof value === 'string') {
                                            return value.length > 50 ? `${value.substring(0, 50)}...` : value;
                                          }
                                          return JSON.stringify(value) || 'N/A';
                                        })()}
                                      </div>
                                    </div>
                                  );
                                })}
                                {Object.keys(user.userData || {}).length > 1 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{Object.keys(user.userData || {}).length - 1} еще...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>)
              ) : (
                // Desktop table layout - modern & compact
                (<div className="p-2 sm:p-3">
                  <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40 hover:bg-muted/50">
                        <TableRow className="border-b border-border/50 hover:bg-transparent">
                          <TableHead className="font-semibold h-10">Пользователь</TableHead>
                          <TableHead className="font-semibold h-10">Статус</TableHead>
                          <TableHead className="text-center font-semibold h-10">Сообщения</TableHead>
                          <TableHead className="font-semibold h-10">Ответы</TableHead>
                          <TableHead className="text-sm font-semibold h-10">Активность</TableHead>
                          <TableHead className="text-sm font-semibold h-10">Регистрация</TableHead>
                          <TableHead className="text-right font-semibold h-10">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="w-8 h-8 opacity-30" />
                                <span>{searchQuery ? 'П��льзователи не найдены' : 'Нет пользователей'}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAndSortedUsers.map((user, index) => (
                            <TableRow
                              key={user.id || index}
                              className="border-b border-border/30 hover:bg-muted/30 transition-colors h-14 cursor-pointer"
                              onClick={() => {
                                // Если доступны обе функции открытия панелей, открываем обе
                                if (onOpenUserDetailsPanel && onOpenDialogPanel) {
                                  onOpenUserDetailsPanel(user);
                                  onOpenDialogPanel(user);
                                }
                              }}
                            >
                              <TableCell className="py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
                                    <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex flex-wrap gap-1">
                                  <Badge
                                    variant={Boolean(user.isActive) ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {Boolean(user.isActive) ? "Активен" : "Неактивен"}
                                  </Badge>
                                  {Boolean(user.isPremium) && <Badge variant="outline" className="text-xs h-5"><Crown className="w-2.5 h-2.5 mr-0.5" /></Badge>}
                                  {Boolean(user.isBlocked) && <Badge variant="destructive" className="text-xs">X</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-center">
                                <span className="text-sm font-medium">{user.interactionCount || 0}</span>
                              </TableCell>
                              <TableCell className="py-2 max-w-sm">
                                {(user.userData && Object.keys(user.userData).length > 0) ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      {Object.entries(user.userData).slice(0, 1).map(([key, value]) => {
                                        let responseData = value;
                                        if (typeof value === 'string') {
                                          try {
                                            responseData = JSON.parse(value);
                                          } catch {
                                            responseData = { value: value, type: 'text' };
                                          }
                                        }
                                        const answer = responseData?.value ?
                                          (responseData.value.length > 30 ? `${responseData.value.substring(0, 30)}...` : String(responseData.value)) :
                                          (typeof value === 'string' ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : '');
                                        return (
                                          <div key={key} className="text-xs text-muted-foreground truncate">
                                            <span className="inline-block truncate max-w-full">{answer}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                                      {Object.keys(user.userData).length}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-2 text-xs text-muted-foreground">
                                {formatDate(user.lastInteraction) || '-'}
                              </TableCell>
                              <TableCell className="py-2 text-xs text-muted-foreground">
                                {formatDate(user.createdAt) || '-'}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    data-testid={`button-view-user-${index}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenUserDetailsPanel) {
                                        onOpenUserDetailsPanel(user);
                                      } else {
                                        setSelectedUser(user);
                                        setShowUserDetails(true);
                                      }
                                    }}
                                    title="Подробно"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    data-testid={`button-show-dialog-${index}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenDialogPanel) {
                                        onOpenDialogPanel(user);
                                      } else {
                                        setSelectedUserForDialog(user);
                                        setShowDialog(true);
                                        setTimeout(() => scrollToBottom(), 200);
                                      }
                                    }}
                                    title="Чат"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    data-testid={`button-toggle-active-${index}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUserStatusToggle(user, 'isActive');
                                    }}
                                    title={user.isActive === 1 ? "Деактивировать" : "Активировать"}
                                  >
                                    {user.isActive === 1 ?
                                      <UserX className="w-3.5 h-3.5 text-destructive" /> :
                                      <UserCheck className="w-3.5 h-3.5 text-green-600" />}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        data-testid={`button-delete-user-${index}`}
                                        title="Удалить"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Все данные пользователя "{formatUserName(user)}" будут удалены.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)}>
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>)
              )}
            </TabsContent>

            <TabsContent value="responses" className="mt-2">
              <div className="p-2 sm:p-3">
                <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40 hover:bg-muted/50">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <TableHead className="font-semibold h-10">Пользователь</TableHead>
                        <TableHead className="font-semibold h-10">Переменная</TableHead>
                        <TableHead className="font-semibold h-10">Ответ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <MessageSquare className="w-8 h-8 opacity-30" />
                              <span>Нет пользователей или ответов</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedUsers.flatMap((user, userIndex) => {
                          if (!user.userData || typeof user.userData !== 'object' || Object.keys(user.userData).length === 0) {
                            return [];
                          }

                          return Object.entries(user.userData).map(([key, value], responseIndex) => {
                            let responseData: any = value;
                            if (typeof value === 'string') {
                              try {
                                responseData = JSON.parse(value);
                              } catch {
                                responseData = { value: value, type: 'text' };
                              }
                            } else if (typeof value === 'object' && value !== null) {
                              responseData = value;
                            } else {
                              responseData = { value: String(value), type: 'text' };
                            }

                            const answerValue: string = String(responseData?.value !== undefined ? responseData.value :
                              (typeof value === 'object' && value !== null ? JSON.stringify(value as object) : String(value as string)));

                            return (
                              <TableRow key={`${user.id || userIndex}-${key}-${responseIndex}`} className="border-b border-border/30 hover:bg-muted/30 transition-colors h-14">
                                <TableCell className="py-2">
                                  <div className="font-medium text-sm truncate">{formatUserName(user)}</div>
                                  <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="font-medium text-sm">
                                    {key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 max-w-sm">
                                  {(() => {
                                    if (responseData?.photoUrl) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-[150px]">
                                          <img
                                            src={responseData.photoUrl}
                                            alt="Фото ответ"
                                            className="w-full h-auto rounded-lg"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        </div>
                                      );
                                    }

                                    if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-[150px] space-y-1">
                                          {responseData.media.map((m: any, idx: number) => (
                                            <img
                                              key={idx}
                                              src={m.url || m}
                                              alt="Ответ фото"
                                              className="w-full h-auto rounded-lg"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }} />
                                          ))}
                                        </div>
                                      );
                                    }

                                    const valueStr = String(answerValue);
                                    const isImageUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');

                                    if (isImageUrl) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-[150px]">
                                          <img
                                            src={valueStr}
                                            alt="Ответ"
                                            className="w-full h-auto rounded-lg"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        </div>
                                      );
                                    }

                                    return (
                                      <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                        {valueStr}
                                      </p>
                                    );
                                  })()}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      )}
    </div>
  </ScrollArea>;
}

function newFunction_1(showDialog: boolean, setShowDialog: React.Dispatch<React.SetStateAction<boolean>>, isMobile: boolean, selectedUserForDialog: { projectId: number; id: number; firstName: string | null; lastName: string | null; createdAt: Date | null; updatedAt: Date | null; userId: string; userName: string | null; languageCode: string | null; isBot: number | null; isPremium: number | null; lastInteraction: Date | null; interactionCount: number | null; userData: unknown; currentState: string | null; preferences: unknown; commandsUsed: unknown; sessionsCount: number | null; totalMessagesSent: number | null; totalMessagesReceived: number | null; deviceInfo: string | null; locationData: unknown; contactData: unknown; isBlocked: number | null; isActive: number | null; tags: string[] | null; notes: string | null; } | null, formatUserName: (user: UserBotData) => string, messagesScrollRef: React.RefObject<HTMLDivElement>, messagesLoading: boolean, messages: BotMessageWithMedia[], formatDate: (date: unknown) => string, messageText: string, setMessageText: React.Dispatch<React.SetStateAction<string>>, sendMessageMutation) {
  return <Dialog open={showDialog} onOpenChange={setShowDialog}>
    <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} flex flex-col`}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Диалог с пользователем
        </DialogTitle>
        <DialogDescription>
          {selectedUserForDialog && formatUserName(selectedUserForDialog)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <ScrollArea ref={messagesScrollRef} className="h-[400px] pr-4" data-testid="messages-scroll-area">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Загрузка сообщений...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-messages-state">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет сообщений</p>
              <p className="text-sm text-muted-foreground mt-1">
                Начните диалог, отправив первое сообщение
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message, index) => {
                const isBot = message.messageType === 'bot';
                const isUser = message.messageType === 'user';

                return (
                  <div
                    key={message.id || index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.messageType}-${index}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                        {isBot ? (
                          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex flex-col gap-1">
                        {/* Медиа-файлы если есть */}
                        {message.media && Array.isArray(message.media) && message.media.length > 0 && (
                          <div className="rounded-lg overflow-hidden max-w-xs space-y-2">
                            {message.media.map((m: any, idx: number) => (
                              <img
                                key={idx}
                                src={m.url}
                                alt="Photo"
                                className="w-full h-auto rounded-lg"
                                data-testid={`photo-${message.id}-${idx}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }} />
                            ))}
                          </div>
                        )}

                        <div className={`rounded-lg px-4 py-2 ${isBot
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                          : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message?.messageText ? String(message.messageText) : ''}
                          </p>
                        </div>

                        {/* Кнопки для сообщений бота */}
                        {isBot && message.messageData && typeof message.messageData === 'object' && 'buttons' in message.messageData && Array.isArray((message.messageData as Record<string, any>).buttons) && ((message.messageData as Record<string, any>).buttons as Array<any>).length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray((message.messageData as any)?.buttons) ? (message.messageData as any).buttons : []).map((button: any, btnIndex: number) => (
                              <div
                                key={btnIndex}
                                className="inline-flex items-center px-3 py-1 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                data-testid={`button-preview-${index}-${btnIndex}`}
                              >
                                {String(button?.text ?? '')}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {/* Информация о нажатой кнопке для сообщений пользователя */}
                        {isUser && message.messageData && typeof message.messageData === 'object' && 'button_clicked' in message.messageData && message.messageData.button_clicked ? (
                          <div className="mt-1">
                            <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                              <span>✓</span>
                              <span>
                                {'button_text' in message.messageData && message.messageData.button_text
                                  ? `Нажата: ${message.messageData.button_text}`
                                  : 'Нажата кнопка'}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Timestamp */}
                        {message.createdAt && (
                          <span className="text-xs text-muted-foreground">{String(formatDate(message.createdAt))}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        {/* Message Input Form */}
        <div className="space-y-3">
          <Label htmlFor="message-input" className="text-sm font-medium">
            Отправить сообщение
          </Label>
          <div className="flex gap-2">
            <Textarea
              id="message-input"
              data-testid="textarea-message-input"
              placeholder="Введите сообщение..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageText.trim() && !sendMessageMutation.isPending) {
                    sendMessageMutation.mutate({ messageText: messageText.trim() });
                  }
                }
              }}
              rows={3}
              disabled={sendMessageMutation.isPending}
              className="flex-1 resize-none" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
            <Button
              data-testid="button-send-message"
              onClick={() => {
                if (messageText.trim() && !sendMessageMutation.isPending) {
                  sendMessageMutation.mutate({ messageText: messageText.trim() });
                }
              }}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}

function newFunction(showUserDetails: boolean, setShowUserDetails: React.Dispatch<React.SetStateAction<boolean>>, isMobile: boolean, selectedUser: { id: number; firstName: string | null; lastName: string | null; createdAt: Date | null; updatedAt: Date | null; projectId: number; userId: string; userName: string | null; languageCode: string | null; isBot: number | null; isPremium: number | null; lastInteraction: Date | null; interactionCount: number | null; userData: unknown; currentState: string | null; preferences: unknown; commandsUsed: unknown; sessionsCount: number | null; totalMessagesSent: number | null; totalMessagesReceived: number | null; deviceInfo: string | null; locationData: unknown; contactData: unknown; isBlocked: number | null; isActive: number | null; tags: string[] | null; notes: string | null; } | null, userMessageCounts: { userSent: number; botSent: number; total: number; }, handleUserStatusToggle: (user: UserBotData, field: "isActive" | "isBlocked" | "isPremium") => void, formatDate: (date: unknown) => string, variableToQuestionMap: Record<string, string>, getPhotoUrlFromMessages: (fileId: string) => string | null) {
  return <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
    <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-3xl max-h-[80vh]'} overflow-auto`}>
      <DialogHeader>
        <DialogTitle>Детали пользователя</DialogTitle>
        <DialogDescription>
          Подробная информация о пользователе
        </DialogDescription>
      </DialogHeader>

      {selectedUser && (
        <div className="space-y-6">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <Label className="text-sm font-medium">Основная информация</Label>
              <div className="mt-2 space-y-2">
                <div><span className="text-sm text-muted-foreground">Имя:</span> {selectedUser!.firstName || 'Не указано'}</div>
                <div><span className="text-sm text-muted-foreground">Username:</span> {selectedUser!.userName ? `@${selectedUser!.userName}` : 'Не указано'}</div>
                <div><span className="text-sm text-muted-foreground">Telegram ID:</span> {selectedUser!.userId}</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Статистика</Label>
              <div className="mt-2 space-y-2">
                <div><span className="text-sm text-muted-foreground">Всего сообщений:</span> {userMessageCounts.total || selectedUser?.interactionCount || 0}</div>
                <div><span className="text-sm text-muted-foreground">От пользователя:</span> {userMessageCounts.userSent}</div>
                <div><span className="text-sm text-muted-foreground">От бота:</span> {userMessageCounts.botSent}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                На основе истории диалога между пользователем и ботом
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Статус пользователя</Label>
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={Boolean(selectedUser?.isActive)}
                  onCheckedChange={() => selectedUser && handleUserStatusToggle(selectedUser, 'isActive')} />
                <Label>Активен</Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (пользователь может взаимодействовать с ботом)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Вы можете деактивировать пользователя, если нужно временно ограничить его доступ к боту.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Даты</Label>
            <div className="mt-2 space-y-2">
              <div><span className="text-sm text-muted-foreground">Регистрация:</span> {String(formatDate(selectedUser?.createdAt ?? null))}</div>
              <div><span className="text-sm text-muted-foreground">Последнее обновление:</span> {String(formatDate(selectedUser?.updatedAt ?? null))}</div>
              <div><span className="text-sm text-muted-foreground">Последняя активность:</span> {String(formatDate(selectedUser?.lastInteraction ?? null))}</div>
            </div>
          </div>

          {selectedUser?.tags && selectedUser!.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Теги</Label>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedUser!.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{String(tag)}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced user responses section */}
          {Boolean(selectedUser?.userData && Object.keys((selectedUser.userData as Record<string, unknown>) || {}).length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Ответы пользователя</Label>
                <Badge variant="secondary" className="text-xs">
                  {String(Object.keys((selectedUser!.userData as Record<string, unknown>) || {}).length)}
                </Badge>
              </div>
              <div className="space-y-4">
                {Object.entries((selectedUser!.userData as Record<string, unknown>) || {}).map(([key, value]) => {
                  // Parse value if it's a string (from PostgreSQL)
                  let responseData: any = value;
                  if (typeof value === 'string') {
                    try {
                      responseData = JSON.parse(value);
                    } catch {
                      responseData = { value: value, type: 'text' };
                    }
                  }

                  return (
                    <div key={key} className="border rounded-lg p-4 bg-gradient-to-br from-muted/30 to-muted/60 hover:from-muted/50 hover:to-muted/80 transition-all duration-200 shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
                            <span className="text-sm font-medium text-foreground">
                              {String(key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key)}
                            </span>
                          </div>
                          {responseData?.type && (
                            <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                              {String(responseData.type === 'text' ? 'Текст' :
                                responseData.type === 'number' ? 'Число' :
                                  responseData.type === 'email' ? 'Email' :
                                    responseData.type === 'phone' ? 'Телефон' :
                                      responseData.type)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {String(responseData?.timestamp
                              ? formatDate(responseData.timestamp)
                              : 'Недавно')}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm">
                        {(() => {
                          // Определяем значение ответа - из объекта или напрямую
                          const answerValue = responseData?.value !== undefined ? responseData.value :
                            (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

                          // Функция для определения текста вопроса - берём из flowData
                          const getQuestionText = (questionKey: string, data: any) => {
                            // First check if we have the question in flowData mapping
                            if (variableToQuestionMap[questionKey]) {
                              return variableToQuestionMap[questionKey];
                            }

                            // Then check if prompt is saved with response
                            if (data?.prompt && data.prompt.trim()) {
                              return data.prompt;
                            }

                            // Fallback to variable name
                            return questionKey;
                          };

                          const questionText = getQuestionText(key, responseData);

                          return (
                            <div className="bg-background rounded-lg p-4 border border-border shadow-sm">
                              {/* Показываем вопрос */}
                              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="font-medium text-blue-900 dark:text-blue-100">Вопрос:</span>
                                </div>
                                <div className="text-blue-800 dark:text-blue-200 leading-relaxed">
                                  {String(questionText)}
                                </div>
                              </div>
                              {/* Показываем ответ */}
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="font-medium text-green-900 dark:text-green-100">Ответ:</span>
                                </div>
                                {(() => {
                                  // Проверяем если это медиа массив
                                  if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
                                    return (
                                      <div className="rounded-lg overflow-hidden max-w-md space-y-2">
                                        {responseData.media.map((m: any, idx: number) => (
                                          <img
                                            key={idx}
                                            src={m.url || m}
                                            alt="Ответ фото"
                                            className="w-full h-auto rounded-lg"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        ))}
                                      </div>
                                    );
                                  }

                                  // Проверяем наличие photoUrl - это фото ответ с загруженным URL
                                  if (responseData?.photoUrl) {
                                    return (
                                      <div className="rounded-lg overflow-hidden max-w-md">
                                        <img
                                          src={responseData.photoUrl}
                                          alt="Фото ответ"
                                          className="w-full h-auto rounded-lg border border-border"
                                          data-testid={`photo-response-${key}`}
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            const fallback = document.createElement('div');
                                            fallback.className = 'inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800';
                                            fallback.innerHTML = '<span class="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Фото (не удалось загрузить)</span>';
                                            img.parentNode?.appendChild(fallback);
                                          }} />
                                      </div>
                                    );
                                  }

                                  // Проверяем тип photo и пытаемся найти URL
                                  if (responseData?.type === 'photo' || responseData?.type === 'image') {
                                    const valueStr = String(answerValue || '');
                                    // Если есть URL в value
                                    if (valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/')) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-md">
                                          <img
                                            src={valueStr}
                                            alt="Фото ответ"
                                            className="w-full h-auto rounded-lg border border-border"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        </div>
                                      );
                                    }
                                    // Если это file_id - ищем URL в сообщениях
                                    const photoUrlFromMessages = getPhotoUrlFromMessages(valueStr);
                                    if (photoUrlFromMessages) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-md">
                                          <img
                                            src={photoUrlFromMessages}
                                            alt="Фото ответ"
                                            className="w-full h-auto rounded-lg border border-border"
                                            data-testid={`photo-from-messages-${key}`}
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        </div>
                                      );
                                    }
                                    // Если URL нет - показываем индикатор
                                    return (
                                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Фото (загрузка...)</span>
                                      </div>
                                    );
                                  }

                                  const valueStr = String(answerValue);

                                  // Проверяем, похоже ли значение на file_id (длинная строка с определенным форматом)
                                  const isLikelyFileId = valueStr.length > 40 && /^[A-Za-z0-9_\-]+$/.test(valueStr);
                                  if (isLikelyFileId) {
                                    // Пробуем найти URL в сообщениях
                                    const photoUrlFromMessages = getPhotoUrlFromMessages(valueStr);
                                    if (photoUrlFromMessages) {
                                      return (
                                        <div className="rounded-lg overflow-hidden max-w-md">
                                          <img
                                            src={photoUrlFromMessages}
                                            alt="Фото ответ"
                                            className="w-full h-auto rounded-lg border border-border"
                                            data-testid={`photo-fileid-${key}`}
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }} />
                                        </div>
                                      );
                                    }
                                  }

                                  const isImageUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');

                                  // Если это URL - загружаем как изображение
                                  if (isImageUrl) {
                                    return (
                                      <div className="rounded-lg overflow-hidden max-w-md">
                                        <img
                                          src={valueStr}
                                          alt="Ответ"
                                          className="w-full h-auto rounded-lg"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }} />
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="text-green-800 dark:text-green-200 leading-relaxed font-medium">
                                      {valueStr}
                                    </div>
                                  );
                                })()}
                              </div>
                              {/* Дополнительная информация */}
                              {responseData?.nodeId && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full"></span>
                                    ID узла: {String(responseData.nodeId)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium">Все данные пользователя (JSON)</Label>
                <div className="mt-2">
                  <Textarea
                    value={JSON.stringify(selectedUser.userData, null, 2)}
                    readOnly
                    rows={6}
                    className="text-xs font-mono bg-muted"
                    placeholder="Нет данных для отображения" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>;
}
