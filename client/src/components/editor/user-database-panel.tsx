import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Plus, 
  BarChart3, 
  Activity, 
  Shield, 
  Crown, 
  MessageSquare,
  Calendar,
  Settings,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Edit,
  Send,
  Bot,
  User,
  Database
} from 'lucide-react';
import { UserBotData, BotProject, BotMessage } from '@shared/schema';
import { DatabaseBackupPanel } from './database-backup-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
}

type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName';
type SortDirection = 'asc' | 'desc';

export function UserDatabasePanel({ projectId, projectName }: UserDatabasePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastInteraction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);
  const [filterBlocked, setFilterBlocked] = useState<boolean | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUserForDialog, setSelectedUserForDialog] = useState<UserBotData | null>(null);
  const [messageText, setMessageText] = useState('');

  const { toast } = useToast();
  const qClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch project data to get userDatabaseEnabled setting
  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

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
  const { data: searchResults = [], isFetching: searchLoading } = useQuery<UserBotData[]>({
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
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<UserBotData> }) => 
      apiRequest('PUT', `/api/users/${userId}`, data),
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
    onSuccess: (data, enabled) => {
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

  // Send message mutation
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

  // Filter and sort users
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

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Никогда';
    return new Date(date).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <div className="h-full flex flex-col bg-background min-h-0">
      <div className="border-b border-border/50 bg-card flex-none">
        <div className="p-2.5 xs:p-3 sm:p-4 space-y-2.5 xs:space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3">
            <div className="w-7 xs:w-8 h-7 xs:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40">
              <Users className="w-4 xs:w-4.5 h-4 xs:h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm xs:text-base sm:text-lg font-bold text-foreground leading-tight">База данных пользователей</h2>
              <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 break-words">Управление пользователями "{projectName}"</p>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-2.5">
            {/* Database Toggle */}
            <div className={`flex items-center gap-2 xs:gap-2.5 px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg border transition-all flex-1 xs:flex-none ${
              isDatabaseEnabled 
                ? 'bg-green-50/50 dark:bg-green-950/30 border-green-300/40 dark:border-green-700/40' 
                : 'bg-red-50/50 dark:bg-red-950/30 border-red-300/40 dark:border-red-700/40'
            }`} data-testid="database-toggle-container">
              <Database className={`w-3.5 xs:w-4 h-3.5 xs:h-4 flex-shrink-0 ${isDatabaseEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <Label htmlFor="db-toggle" className={`text-xs xs:text-sm font-semibold cursor-pointer flex-1 whitespace-nowrap ${
                isDatabaseEnabled 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {isDatabaseEnabled ? 'Включена' : 'Выключена'}
              </Label>
              <Switch
                id="db-toggle"
                data-testid="switch-database-toggle"
                checked={isDatabaseEnabled}
                onCheckedChange={(checked) => toggleDatabaseMutation.mutate(checked)}
                disabled={toggleDatabaseMutation.isPending}
                className="scale-75 xs:scale-90"
              />
            </div>
            
            {isDatabaseEnabled && (
              <div className="flex gap-1.5 xs:gap-2">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8 xs:h-9 px-2 xs:px-3 text-xs xs:text-sm flex-1 xs:flex-none">
                  <RefreshCw className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0" />
                  <span className="hidden xs:inline ml-1">Обновить</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-8 xs:h-9 px-2 xs:px-3 text-xs xs:text-sm flex-1 xs:flex-none">
                      <Trash2 className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0" />
                      <span className="hidden xs:inline ml-1">Очистить</span>
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

          {/* Stats Grid */}
          {isDatabaseEnabled && stats && (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 xs:gap-2 sm:gap-2.5">
              {[
                { icon: Users, label: 'Всего', value: stats.totalUsers, color: 'blue' },
                { icon: Activity, label: 'Активны', value: stats.activeUsers, color: 'green' },
                { icon: Shield, label: 'Блокиров.', value: stats.blockedUsers, color: 'red' },
                { icon: Crown, label: 'Premium', value: stats.premiumUsers, color: 'yellow' },
                { icon: MessageSquare, label: 'Сообщ.', value: stats.totalInteractions, color: 'purple' },
                { icon: BarChart3, label: 'Среднее', value: stats.avgInteractionsPerUser, color: 'indigo' },
                { icon: Edit, label: 'Ответы', value: stats.usersWithResponses || 0, color: 'orange' },
              ].map((stat, idx) => {
                const colorClasses = {
                  blue: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400',
                  green: 'bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50 text-green-600 dark:text-green-400',
                  red: 'bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400',
                  yellow: 'bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-800/50 text-yellow-600 dark:text-yellow-400',
                  purple: 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-800/50 text-purple-600 dark:text-purple-400',
                  indigo: 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400',
                  orange: 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/50 text-orange-600 dark:text-orange-400',
                };
                const Icon = stat.icon;
                const colorClass = colorClasses[stat.color as keyof typeof colorClasses];
                return (
                  <div key={idx} className={`${colorClass} border rounded-lg p-1.5 xs:p-2 sm:p-2.5 flex flex-col items-center gap-1 xs:gap-1.5 text-center`}>
                    <Icon className="w-3 xs:w-3.5 h-3 xs:h-3.5 flex-shrink-0" />
                    <p className="text-xs xs:text-xs sm:text-sm font-bold text-foreground leading-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight hidden xs:block">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search & Filters */}
          {isDatabaseEnabled && (
            <div className="flex flex-col gap-2 xs:gap-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 xs:w-4 h-3.5 xs:h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 xs:pl-9 h-8 xs:h-9 text-xs xs:text-sm"
                />
              </div>
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-2.5">
                <Select value={filterActive?.toString() || 'all'} onValueChange={(value) => setFilterActive(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className="h-8 xs:h-9 text-xs xs:text-sm flex-1 xs:flex-none xs:w-28">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="true">Активные</SelectItem>
                    <SelectItem value="false">Неактивные</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPremium?.toString() || 'all'} onValueChange={(value) => setFilterPremium(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className="h-8 xs:h-9 text-xs xs:text-sm flex-1 xs:flex-none xs:w-28">
                    <SelectValue placeholder="Premium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="true">Premium</SelectItem>
                    <SelectItem value="false">Обычные</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                  const [field, direction] = value.split('-') as [SortField, SortDirection];
                  setSortField(field);
                  setSortDirection(direction);
                }}>
                  <SelectTrigger className="h-8 xs:h-9 text-xs xs:text-sm flex-1 xs:flex-none xs:w-auto">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastInteraction-desc">Последняя активность ↓</SelectItem>
                    <SelectItem value="lastInteraction-asc">Последняя активность ↑</SelectItem>
                    <SelectItem value="interactionCount-desc">Больше сообщений</SelectItem>
                    <SelectItem value="interactionCount-asc">Меньше сообщений</SelectItem>
                    <SelectItem value="createdAt-desc">Новые</SelectItem>
                    <SelectItem value="createdAt-asc">Старые</SelectItem>
                    <SelectItem value="firstName-asc">По имени A-Z</SelectItem>
                    <SelectItem value="firstName-desc">По имени Z-A</SelectItem>
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
        <div className="w-full">
          <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="backup">Резервные копии</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="w-full">
            {isMobile ? (
              // Mobile card layout with simple scrolling  
              <div 
                className="overflow-y-scroll" 
                style={{ 
                  height: '350px', 
                  overflowY: 'scroll', 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                <div className="p-4 space-y-4">
                  {/* Debug info */}
                  <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded mb-2" data-testid="debug-mobile-info">
                    DEBUG: isMobile={isMobile.toString()}, users={users.length}, filteredUsers={filteredAndSortedUsers.length}
                  </div>
                  {filteredAndSortedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'Пользователи не найдены' : 'Пользователи еще не взаимодействовали с ботом'}
                      </div>
                    </div>
                  ) : (
                    filteredAndSortedUsers.map((user, index) => (
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
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-show-dialog-${index}`}
                                onClick={() => {
                                  setSelectedUserForDialog(user);
                                  setShowDialog(true);
                                }}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-toggle-active-${index}`}
                                onClick={() => handleUserStatusToggle(user, 'isActive')}
                                className={user.isActive ? "text-red-600" : "text-green-600"}
                              >
                                {user.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Активен" : "Неактивен"}
                            </Badge>
                            {user.isPremium && <Badge variant="outline" className="text-yellow-600"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                            {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
                            {user.isBot && <Badge variant="outline">Бот</Badge>}
                          </div>

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
                                      <div className="text-muted-foreground mb-1">{key}:</div>
                                      <div className="font-medium">
                                        {(responseData as any)?.value ? 
                                          ((responseData as any).value.length > 50 ? `${(responseData as any).value.substring(0, 50)}...` : (responseData as any).value) :
                                          (typeof value === 'string' ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : JSON.stringify(value))
                                        }
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
                </div>
              </div>
            ) : (
              // Desktop table layout
              <ScrollArea className="h-full">
                <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сообщения</TableHead>
                <TableHead>Вопросы и ответы</TableHead>
                <TableHead>Последняя активность</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery ? 'Пользователи не найдены' : 'Пользователи еще не взаимодействовали с ботом'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedUsers.map((user, index) => (
                  <TableRow key={user.id || index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{formatUserName(user)}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Активен" : "Неактивен"}
                        </Badge>
                        {user.isPremium && <Badge variant="outline" className="text-yellow-600"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                        {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
                        {user.isBot && <Badge variant="outline">Бот</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{user.interactionCount || 0}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {(user.userData && Object.keys(user.userData).length > 0) ? (
                          <div className="space-y-1">
                            {Object.entries(user.userData).slice(0, 2).map(([key, value]) => {
                              // Parse value if it's a string (from PostgreSQL)
                              let responseData = value;
                              if (typeof value === 'string') {
                                try {
                                  responseData = JSON.parse(value);
                                } catch {
                                  responseData = { value: value, type: 'text' };
                                }
                              }
                              
                              // Format the question text
                              const formatQuestionText = (key: string, responseData: any) => {
                                if (responseData?.prompt && responseData.prompt.trim()) {
                                  return responseData.prompt;
                                }
                                
                                // Generate a question based on the key
                                if (key.includes('feedback')) return 'Расскажите подробнее о своих впечатлениях. Что вам понравилось или что можно улучшить?';
                                if (key.includes('name')) return 'Как вас зовут?';
                                if (key.includes('age')) return 'Сколько вам лет?';
                                if (key.includes('city')) return 'Из какого вы города?';
                                if (key.includes('contact')) return 'Поделитесь контактом';
                                if (key.includes('email')) return 'Укажите ваш email';
                                if (key.includes('phone')) return 'Укажите ваш телефон';
                                if (key.includes('rating')) return 'Оцените нашу работу';
                                if (key.includes('review')) return 'Оставьте отзыв';
                                if (key.includes('suggestion')) return 'Поделитесь предложением';
                                if (key.startsWith('response_')) return `Вопрос ${key.replace('response_', '')}`;
                                if (key.startsWith('user_')) return `Пользовательский ввод: ${key.replace('user_', '').replace('_', ' ')}`;
                                return `Вопрос: ${key}`;
                              };
                              
                              return (
                                <div key={key} className="text-xs bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 mb-2">
                                  <div className="mb-2">
                                    <div className="flex items-start gap-2 mb-1">
                                      <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                      <div className="font-medium text-blue-700 dark:text-blue-300 text-xs">
                                        Вопрос:
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-700 dark:text-gray-300 ml-5 leading-relaxed">
                                      {formatQuestionText(key, responseData)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-start gap-2 mb-1">
                                      <Edit className="w-3 h-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                      <div className="font-medium text-green-700 dark:text-green-300 text-xs">
                                        Ответ:
                                      </div>
                                    </div>
                                    <div className="text-xs text-foreground font-medium ml-5 leading-relaxed">
                                      {responseData?.value ? 
                                        (responseData.value.length > 50 ? `${responseData.value.substring(0, 50)}...` : responseData.value) :
                                        (typeof value === 'string' ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : JSON.stringify(value))
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {Object.keys(user.userData).length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{Object.keys(user.userData).length - 2} еще...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Нет ответов</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(user.lastInteraction)}</TableCell>
                    <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-user-${index}`}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-show-dialog-${index}`}
                          onClick={() => {
                            setSelectedUserForDialog(user);
                            setShowDialog(true);
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-toggle-active-${index}`}
                          onClick={() => handleUserStatusToggle(user, 'isActive')}
                          className={user.isActive ? "text-red-600" : "text-green-600"}
                        >
                          {user.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              data-testid={`button-delete-user-${index}`}
                            >
                              <Trash2 className="w-3 h-3" />
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
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="backup" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <DatabaseBackupPanel />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
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
                    <div><span className="text-sm text-muted-foreground">Имя:</span> {selectedUser.firstName || 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Фамилия:</span> {selectedUser.lastName || 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Username:</span> {selectedUser.userName ? `@${selectedUser.userName}` : 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Telegram ID:</span> {selectedUser.userId}</div>
                    <div><span className="text-sm text-muted-foreground">Язык:</span> {selectedUser.languageCode || 'Не указано'}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Статистика</Label>
                  <div className="mt-2 space-y-2">
                    <div><span className="text-sm text-muted-foreground">Сообщений:</span> {selectedUser.interactionCount || 0}</div>
                    <div><span className="text-sm text-muted-foreground">Сессий:</span> {selectedUser.sessionsCount || 0}</div>
                    <div><span className="text-sm text-muted-foreground">Отправлено:</span> {selectedUser.totalMessagesSent || 0}</div>
                    <div><span className="text-sm text-muted-foreground">Получено:</span> {selectedUser.totalMessagesReceived || 0}</div>
                    <div><span className="text-sm text-muted-foreground">Состояние:</span> {selectedUser.currentState || 'Не установлено'}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Статус пользователя</Label>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={Boolean(selectedUser.isActive)}
                      onCheckedChange={(checked) => handleUserStatusToggle(selectedUser, 'isActive')}
                    />
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
                  <div><span className="text-sm text-muted-foreground">Регистрация:</span> {formatDate(selectedUser.createdAt)}</div>
                  <div><span className="text-sm text-muted-foreground">Последнее обновление:</span> {formatDate(selectedUser.updatedAt)}</div>
                  <div><span className="text-sm text-muted-foreground">Последняя активность:</span> {formatDate(selectedUser.lastInteraction)}</div>
                </div>
              </div>

              {selectedUser.tags && selectedUser.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Теги</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedUser.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced user responses section */}
              {(selectedUser.userData && Object.keys(selectedUser.userData).length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">Ответы пользователя</Label>
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(selectedUser.userData).length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(selectedUser.userData).map(([key, value]) => {
                      // Parse value if it's a string (from PostgreSQL)
                      let responseData = value;
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
                                  {key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key}
                                </span>
                              </div>
                              {responseData?.type && (
                                <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                                  {responseData.type === 'text' ? '📝 Текст' : 
                                   responseData.type === 'number' ? '🔢 Число' :
                                   responseData.type === 'email' ? '📧 Email' :
                                   responseData.type === 'phone' ? '📞 Телефон' :
                                   responseData.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-medium">
                                {responseData?.timestamp 
                                  ? formatDate(responseData.timestamp) 
                                  : 'Недавно'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            {responseData?.value ? (
                              <div className="bg-background rounded-lg p-4 border border-border shadow-sm">
                                {/* Показываем вопрос если есть */}
                                {responseData.prompt ? (
                                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <span className="font-medium text-blue-900 dark:text-blue-100">Вопрос:</span>
                                    </div>
                                    <div className="text-blue-800 dark:text-blue-200 leading-relaxed">
                                      {responseData.prompt}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                      <span className="font-medium text-gray-900 dark:text-gray-100">Вопрос:</span>
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                      {key.startsWith('response_') 
                                        ? `Ответ на вопрос ${key.replace('response_', '')}`
                                        : 'Информация о вопросе отсутствует'}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Показываем ответ */}
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="font-medium text-green-900 dark:text-green-100">Ответ:</span>
                                  </div>
                                  <div className="text-green-800 dark:text-green-200 leading-relaxed font-medium">
                                    {responseData.value}
                                  </div>
                                </div>
                                
                                {/* Дополнительная информация */}
                                {responseData.nodeId && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full"></span>
                                      ID узла: {responseData.nodeId}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : typeof value === 'object' && value !== null ? (
                              <div className="bg-background rounded-lg p-4 border border-border shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                  <span className="font-medium text-orange-900 dark:text-orange-100">Системные данные:</span>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-3">
                                  <pre className="text-xs text-orange-800 dark:text-orange-200 overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-background rounded-lg p-4 border border-border shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span className="font-medium text-purple-900 dark:text-purple-100">Значение:</span>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
                                  <div className="text-purple-800 dark:text-purple-200 leading-relaxed">{String(value)}</div>
                                </div>
                              </div>
                            )}
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
                        placeholder="Нет данных для отображения"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
            <ScrollArea className="h-[400px] pr-4" data-testid="messages-scroll-area">
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
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                          }`}>
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
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            
                            <div className={`rounded-lg px-4 py-2 ${
                              isBot 
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' 
                                : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.messageText}
                              </p>
                            </div>
                            
                            {/* Кнопки для сообщений бота */}
                            {isBot && message.messageData && typeof message.messageData === 'object' && 'buttons' in message.messageData && Array.isArray(message.messageData.buttons) && message.messageData.buttons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {message.messageData.buttons.map((button: any, btnIndex: number) => (
                                  <div
                                    key={btnIndex}
                                    className="inline-flex items-center px-3 py-1 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                    data-testid={`button-preview-${index}-${btnIndex}`}
                                  >
                                    {button.text}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Информация о нажатой кнопке для сообщений пользователя */}
                            {isUser && message.messageData && typeof message.messageData === 'object' && 'button_clicked' in message.messageData && message.messageData.button_clicked && (
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
                            )}
                            
                            {/* Timestamp */}
                            {message.createdAt && (
                              <span 
                                className={`text-xs text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}
                                data-testid={`timestamp-${index}`}
                              >
                                {format(new Date(message.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                              </span>
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
                  className="flex-1 resize-none"
                />
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
      </Dialog>
    </div>
  );
}