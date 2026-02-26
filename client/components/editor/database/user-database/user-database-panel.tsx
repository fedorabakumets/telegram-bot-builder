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
import { DatabaseHeader, DatabaseToggle, HeaderActions, ExportInfo, DatabaseDisabled } from './components/header';
import { FiltersContainer } from './components/filters';

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
      <DatabaseContent
        projectId={projectId}
        projectName={projectName}
        isDatabaseEnabled={isDatabaseEnabled}
        toggleDatabaseMutation={toggleDatabaseMutation}
        handleRefresh={handleRefresh}
        deleteAllUsersMutation={deleteAllUsersMutation}
        stats={stats}
        searchQuery={searchQuery}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        filterPremium={filterPremium}
        setFilterPremium={setFilterPremium}
        sortField={sortField}
        sortDirection={sortDirection}
        setSortField={setSortField}
        setSortDirection={setSortDirection}
        isMobile={isMobile}
        filteredAndSortedUsers={filteredAndSortedUsers}
        formatUserName={formatUserName}
        onOpenUserDetailsPanel={onOpenUserDetailsPanel}
        setSelectedUser={setSelectedUser}
        setShowUserDetails={setShowUserDetails}
        onOpenDialogPanel={onOpenDialogPanel}
        setSelectedUserForDialog={setSelectedUserForDialog}
        setShowDialog={setShowDialog}
        scrollToBottom={scrollToBottom}
        handleUserStatusToggle={handleUserStatusToggle}
        deleteUserMutation={deleteUserMutation}
        project={project}
      />
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

function DatabaseContent(props: DatabaseContentProps): React.JSX.Element {
  const {
    projectId,
    projectName,
    isDatabaseEnabled,
    toggleDatabaseMutation,
    handleRefresh,
    deleteAllUsersMutation,
    stats,
    searchQuery,
    filterActive,
    setFilterActive,
    filterPremium,
    setFilterPremium,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    isMobile,
    filteredAndSortedUsers,
    formatUserName,
    onOpenUserDetailsPanel,
    setSelectedUser,
    setShowUserDetails,
    onOpenDialogPanel,
    setSelectedUserForDialog,
    setShowDialog,
    scrollToBottom,
    handleUserStatusToggle,
    deleteUserMutation,
    project,
  } = props;

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col bg-background">
        <div className="border-b border-border/50 bg-card">
          <div className="p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
            <DatabaseHeader projectName={projectName} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <DatabaseToggle
                isDatabaseEnabled={isDatabaseEnabled}
                onToggle={(checked) => toggleDatabaseMutation.mutate(checked)}
                isPending={toggleDatabaseMutation.isPending}
              />

              {isDatabaseEnabled && (
                <HeaderActions
                  projectId={projectId}
                  projectName={projectName}
                  onRefresh={handleRefresh}
                  onDeleteAll={() => deleteAllUsersMutation.mutate()}
                />
              )}
            </div>

            <ExportInfo project={project} />

            {isDatabaseEnabled && stats && <StatsCards stats={stats} />}

            {isDatabaseEnabled && (
              <FiltersContainer
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterActive={filterActive?.toString() || 'all'}
                setFilterActive={setFilterActive}
                filterPremium={filterPremium?.toString() || 'all'}
                setFilterPremium={setFilterPremium}
                sortField={sortField}
                sortDirection={sortDirection}
                setSort={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
            )}
          </div>
        </div>

        {!isDatabaseEnabled && <DatabaseDisabled />}

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
    </ScrollArea>
  );
}

interface DatabaseContentProps {
  projectId: number;
  projectName: string;
  isDatabaseEnabled: boolean;
  toggleDatabaseMutation: any;
  handleRefresh: () => void;
  deleteAllUsersMutation: any;
  stats: { totalUsers?: number; activeUsers?: number; blockedUsers?: number; premiumUsers?: number; totalInteractions?: number; avgInteractionsPerUser?: number; usersWithResponses?: number };
  searchQuery: string;
  filterActive: boolean | null;
  setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>;
  filterPremium: boolean | null;
  setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>;
  sortField: string;
  sortDirection: string;
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
  isMobile: boolean;
  filteredAndSortedUsers: UserBotData[];
  formatUserName: (user: UserBotData) => string;
  onOpenUserDetailsPanel: ((user: UserBotData) => void) | undefined;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  setShowUserDetails: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenDialogPanel: ((user: UserBotData) => void) | undefined;
  setSelectedUserForDialog: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  scrollToBottom: () => void;
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  deleteUserMutation: any;
  project?: BotProject;
}
