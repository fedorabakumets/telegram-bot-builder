import { useState, useMemo } from 'react';
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
import { apiRequest } from '@/lib/queryClient';
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
  Edit
} from 'lucide-react';
import { UserBotData, BotProject } from '@shared/schema';
import { DatabaseBackupPanel } from './database-backup-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Database } from 'lucide-react';

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

  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log(`Attempting to delete user with ID: ${userId}`);
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: (data) => {
      console.log("User deletion successful:", data);
      // Force clear cache and refetch
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      
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
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      
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
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      
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
      
      // Map camelCase field names to snake_case if needed
      if (sortField === 'lastInteraction') {
        aValue = a.lastInteraction || a.last_interaction;
        bValue = b.lastInteraction || b.last_interaction;
      } else if (sortField === 'createdAt') {
        aValue = a.createdAt || a.registered_at;
        bValue = b.createdAt || b.registered_at;
      } else if (sortField === 'interactionCount') {
        aValue = a.interactionCount || a.interaction_count;
        bValue = b.interactionCount || b.interaction_count;
      } else if (sortField === 'firstName') {
        aValue = a.firstName || a.first_name;
        bValue = b.firstName || b.first_name;
      } else if (sortField === 'userName') {
        aValue = a.userName || a.username;
        bValue = b.userName || b.username;
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
      <div className="border-b bg-card flex-none">
        <div className="p-4">
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-4`}>
            <div>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold flex items-center gap-2`}>
                <Users className="w-5 h-5" />
                База данных пользователей
              </h2>
              <p className="text-sm text-muted-foreground">
                Управление пользователями бота "{projectName}"
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'self-stretch flex-wrap' : ''}`}>
              {/* Database Toggle */}
              <div className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                isDatabaseEnabled 
                  ? 'bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-600' 
                  : 'bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600'
              } ${isMobile ? 'flex-1 min-w-full' : ''}`} data-testid="database-toggle-container">
                <Database className={`w-5 h-5 ${isDatabaseEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                <Label htmlFor="db-toggle" className={`text-base font-bold cursor-pointer flex-1 ${
                  isDatabaseEnabled 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {isDatabaseEnabled ? 'БД включена' : 'БД выключена'}
                </Label>
                <Switch
                  id="db-toggle"
                  data-testid="switch-database-toggle"
                  checked={isDatabaseEnabled}
                  onCheckedChange={(checked) => toggleDatabaseMutation.mutate(checked)}
                  disabled={toggleDatabaseMutation.isPending}
                  className="scale-110"
                />
              </div>
              {isDatabaseEnabled && (
                <>
                  <Button onClick={handleRefresh} variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'flex-1' : ''}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {isMobile ? 'Обновить' : 'Обновить'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size={isMobile ? "sm" : "sm"} className={isMobile ? 'flex-1' : ''}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        {isMobile ? 'Очистить' : 'Очистить базу'}
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
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {isDatabaseEnabled && stats && (
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-7'} gap-3 mb-4`}>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Всего</p>
                    <p className="text-sm font-semibold">{stats.totalUsers}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Активных</p>
                    <p className="text-sm font-semibold">{stats.activeUsers}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Заблокировано</p>
                    <p className="text-sm font-semibold">{stats.blockedUsers}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Premium</p>
                    <p className="text-sm font-semibold">{stats.premiumUsers}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Сообщений</p>
                    <p className="text-sm font-semibold">{stats.totalInteractions}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Среднее</p>
                    <p className="text-sm font-semibold">{stats.avgInteractionsPerUser}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">С ответами</p>
                    <p className="text-sm font-semibold">{stats.usersWithResponses || 0}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          {isDatabaseEnabled && (
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-3`}>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isMobile ? "Поиск..." : "Поиск по имени, username или ID..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className={`flex gap-2 ${isMobile ? 'grid grid-cols-2' : 'flex'}`}>
                <Select value={filterActive?.toString() || 'all'} onValueChange={(value) => setFilterActive(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className={isMobile ? 'w-full' : 'w-32'}>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="true">Активные</SelectItem>
                    <SelectItem value="false">Неактивные</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPremium?.toString() || 'all'} onValueChange={(value) => setFilterPremium(value === 'all' ? null : value === 'true')}>
                  <SelectTrigger className={isMobile ? 'w-full' : 'w-32'}>
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
                  <SelectTrigger className={isMobile ? 'w-full col-span-2' : 'w-40'}>
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
                      <Card key={user.id || user.user_id || index} className="p-4" data-testid={`user-card-mobile-${index}`}>
                        <div className="space-y-3">
                          {/* User Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-base">{formatUserName(user)}</div>
                              <div className="text-sm text-muted-foreground">ID: {user.userId || user.user_id}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
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
                                onClick={() => handleUserStatusToggle(user, 'isActive')}
                                className={(user.isActive || user.is_active) ? "text-red-600" : "text-green-600"}
                              >
                                {(user.isActive || user.is_active) ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={(user.isActive || user.is_active) ? "default" : "secondary"}>
                              {(user.isActive || user.is_active) ? "Активен" : "Неактивен"}
                            </Badge>
                            {(user.isPremium || user.is_premium) && <Badge variant="outline" className="text-yellow-600"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                            {(user.isBlocked || user.is_blocked) && <Badge variant="destructive">Заблокирован</Badge>}
                            {(user.isBot || user.is_bot) && <Badge variant="outline">Бот</Badge>}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Сообщений</div>
                              <div className="font-medium">{user.interactionCount || user.interaction_count || 0}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Последняя активность</div>
                              <div className="font-medium text-xs">{formatDate(user.lastInteraction || user.last_interaction)}</div>
                            </div>
                          </div>

                          {/* Recent Responses */}
                          {((user.userData || user.user_data) && Object.keys(user.userData || user.user_data).length > 0) && (
                            <div className="border-t pt-3">
                              <div className="text-sm font-medium mb-2">Последние ответы:</div>
                              <div className="space-y-2">
                                {Object.entries(user.userData || user.user_data || {}).slice(0, 1).map(([key, value]) => {
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
                                {Object.keys(user.userData || user.user_data || {}).length > 1 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{Object.keys(user.userData || user.user_data || {}).length - 1} еще...
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
                  <TableRow key={user.id || user.user_id || index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{formatUserName(user)}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.userId || user.user_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={(user.isActive || user.is_active) ? "default" : "secondary"}>
                          {(user.isActive || user.is_active) ? "Активен" : "Неактивен"}
                        </Badge>
                        {(user.isPremium || user.is_premium) && <Badge variant="outline" className="text-yellow-600"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                        {(user.isBlocked || user.is_blocked) && <Badge variant="destructive">Заблокирован</Badge>}
                        {(user.isBot || user.is_bot) && <Badge variant="outline">Бот</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{user.interactionCount || user.interaction_count || 0}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {((user.userData || user.user_data) && Object.keys(user.userData || user.user_data).length > 0) ? (
                          <div className="space-y-1">
                            {Object.entries(user.userData || user.user_data).slice(0, 2).map(([key, value]) => {
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
                              const formatQuestionText = (key, responseData) => {
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
                            {Object.keys(user.userData || user.user_data).length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{Object.keys(user.userData || user.user_data).length - 2} еще...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Нет ответов</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(user.lastInteraction || user.last_interaction)}</TableCell>
                    <TableCell className="text-sm">{formatDate(user.createdAt || user.registered_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
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
                          onClick={() => handleUserStatusToggle(user, 'isActive')}
                          className={(user.isActive || user.is_active) ? "text-red-600" : "text-green-600"}
                        >
                          {(user.isActive || user.is_active) ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600">
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
                              <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id || user.user_id)}>
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
                    <div><span className="text-sm text-muted-foreground">Имя:</span> {selectedUser.firstName || selectedUser.first_name || 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Фамилия:</span> {selectedUser.lastName || selectedUser.last_name || 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Username:</span> {(selectedUser.userName || selectedUser.username) ? `@${selectedUser.userName || selectedUser.username}` : 'Не указано'}</div>
                    <div><span className="text-sm text-muted-foreground">Telegram ID:</span> {selectedUser.userId || selectedUser.user_id}</div>
                    <div><span className="text-sm text-muted-foreground">Язык:</span> {selectedUser.languageCode || 'Не указано'}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Статистика</Label>
                  <div className="mt-2 space-y-2">
                    <div><span className="text-sm text-muted-foreground">Сообщений:</span> {selectedUser.interactionCount || selectedUser.interaction_count || 0}</div>
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
                      checked={Boolean(selectedUser.isActive || selectedUser.is_active)}
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
                  <div><span className="text-sm text-muted-foreground">Регистрация:</span> {formatDate(selectedUser.createdAt || selectedUser.registered_at)}</div>
                  <div><span className="text-sm text-muted-foreground">Последнее обновление:</span> {formatDate(selectedUser.updatedAt)}</div>
                  <div><span className="text-sm text-muted-foreground">Последняя активность:</span> {formatDate(selectedUser.lastInteraction || selectedUser.last_interaction)}</div>
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
              {((selectedUser.userData || selectedUser.user_data) && Object.keys(selectedUser.userData || selectedUser.user_data).length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">Ответы пользователя</Label>
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(selectedUser.userData || selectedUser.user_data).length}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(selectedUser.userData || selectedUser.user_data).map(([key, value]) => {
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
                        value={JSON.stringify(selectedUser.userData || selectedUser.user_data, null, 2)}
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
    </div>
  );
}