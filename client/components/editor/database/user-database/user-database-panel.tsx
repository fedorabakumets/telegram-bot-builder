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
import { BotProject, UserBotData } from '@shared/schema';
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
import { GoogleSheetsExportButton } from '../../google-sheets/GoogleSheetsExportButton';
import { BotMessageWithMedia, UserDatabasePanelProps, SortField, SortDirection, UserStats, ResponseData, VariableToQuestionMap, UserMessageCounts } from './types';
import { formatDate } from './utils/format-date';
import { formatUserName } from './utils/format-user-name';
import { useUserDatabase, useUserMutations } from './hooks';
import { StatsCards } from './components/stats';
import { ResponsesTabTable } from './components/responses';
import { MobileUserList } from './components/mobile';
import { DesktopTable } from './components/desktop';
import { MessageDialog } from './components/dialog';
import { UserDetailsDialog } from './components/details';

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
   * @type {boolean}
   * @description Флаг мобильного режима
   */
  const isMobile = useIsMobile();

  // Хук для загрузки данных
  const {
    project,
    users,
    stats,
    searchResults,
    messages,
    userDetailsMessages,
    isLoading,
    isMessagesLoading,
    refetchUsers,
    refetchStats,
    refetchMessages,
  } = useUserDatabase({
    projectId,
    searchQuery,
    showDialog,
    showUserDetails,
    selectedUserForDialogUserId: selectedUserForDialog?.userId,
    selectedUserId: selectedUser?.userId,
  });

  // Хук для мутаций
  const {
    deleteUserMutation,
    updateUserMutation,
    deleteAllUsersMutation,
    toggleDatabaseMutation,
    sendMessageMutation,
  } = useUserMutations({
    projectId,
    refetchUsers,
    refetchStats,
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

      const sheets = flowData?.sheets || [];
      for (const sheet of sheets) {
        const nodes = sheet?.nodes || [];
        for (const node of nodes) {
          const data = node?.data;
          if (!data) continue;

          const questionText = data.messageText;
          if (!questionText) continue;

          if (data.inputVariable) {
            mapping[data.inputVariable] = questionText;
          }
          if (data.photoInputVariable) {
            mapping[data.photoInputVariable] = questionText;
          }
          if (data.videoInputVariable) {
            mapping[data.videoInputVariable] = questionText;
          }
          if (data.audioInputVariable) {
            mapping[data.audioInputVariable] = questionText;
          }
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

  /**
   * @function scrollToBottom
   * @description Прокручивает область сообщений в самый низ
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
    if (showDialog && !isMessagesLoading) {
      scrollToBottom();
    }
  }, [showDialog, isMessagesLoading, selectedUserForDialog?.userId]);

  /**
   * @function getPhotoUrlFromMessages
   * @description Ищет URL фотографии в сообщениях по file_id
   */
  const getPhotoUrlFromMessages = (fileId: string): string | null => {
    if (!fileId || !userDetailsMessages.length) return null;

    for (const msg of userDetailsMessages) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.url) return m.url;
        }
      }
      const msgData = msg.messageData as Record<string, any> | null;
      if (msgData?.photo?.file_id === fileId && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
      if (msgData?.is_photo_answer && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
    }

    const photoMessages = userDetailsMessages.filter(
      m => m.messageType === 'user' && m.media && m.media.length > 0
    );
    if (photoMessages.length > 0) {
      return photoMessages[photoMessages.length - 1].media![0].url;
    }

    return null;
  };

  /**
   * @constant {UserMessageCounts} userMessageCounts
   * @description Подсчёт сообщений пользователя из истории диалога
   */
  const userMessageCounts = useMemo(() => {
    if (!userDetailsMessages.length) {
      return { userSent: 0, botSent: 0, total: 0 };
    }
    const userSent = userDetailsMessages.filter(m => m.messageType === 'user').length;
    const botSent = userDetailsMessages.filter(m => m.messageType === 'bot').length;
    return { userSent, botSent, total: userDetailsMessages.length };
  }, [userDetailsMessages]);

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

  if (isLoading) {
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
      <UserDetailsDialog
        open={showUserDetails}
        onOpenChange={setShowUserDetails}
        selectedUser={selectedUser}
        userMessageCounts={userMessageCounts}
        handleUserStatusToggle={handleUserStatusToggle}
        variableToQuestionMap={variableToQuestionMap}
        getPhotoUrlFromMessages={getPhotoUrlFromMessages}
      />
      <MessageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedUser={selectedUserForDialog}
        formatUserName={formatUserName}
        messagesScrollRef={messagesScrollRef}
        isMessagesLoading={isMessagesLoading}
        messages={messages}
        messageText={messageText}
        setMessageText={setMessageText}
        isSending={sendMessageMutation.isPending}
        sendMessage={(text) => {
          if (selectedUserForDialog?.userId) {
            sendMessageMutation.mutate({ messageText: text, userId: selectedUserForDialog.userId });
          }
        }}
      />
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
            <StatsCards stats={stats} />
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
                <MobileUserList
                  users={filteredAndSortedUsers}
                  searchQuery={searchQuery}
                  formatUserName={formatUserName}
                  onOpenUserDetailsPanel={onOpenUserDetailsPanel}
                  onOpenDialogPanel={onOpenDialogPanel}
                  handleUserStatusToggle={handleUserStatusToggle}
                  setSelectedUser={setSelectedUser}
                  setShowUserDetails={setShowUserDetails}
                  setSelectedUserForDialog={setSelectedUserForDialog}
                  setShowDialog={setShowDialog}
                  scrollToBottom={scrollToBottom}
                />
              ) : (
                <DesktopTable
                  users={filteredAndSortedUsers}
                  searchQuery={searchQuery}
                  formatUserName={formatUserName}
                  onOpenUserDetailsPanel={onOpenUserDetailsPanel}
                  onOpenDialogPanel={onOpenDialogPanel}
                  handleUserStatusToggle={handleUserStatusToggle}
                  setSelectedUser={setSelectedUser}
                  setShowUserDetails={setShowUserDetails}
                  setSelectedUserForDialog={setSelectedUserForDialog}
                  setShowDialog={setShowDialog}
                  scrollToBottom={scrollToBottom}
                  deleteUserMutation={deleteUserMutation}
                />
              )}
            </TabsContent>

            <TabsContent value="responses" className="mt-2">
              <div className="p-2 sm:p-3">
                <ResponsesTabTable users={filteredAndSortedUsers} />
              </div>
            </TabsContent>

          </Tabs>
        </div>
      )}
    </div>
  </ScrollArea>;
}
