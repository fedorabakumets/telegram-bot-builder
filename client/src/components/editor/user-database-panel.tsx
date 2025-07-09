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
import { UserBotData } from '@shared/schema';

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users`],
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: [`/api/projects/${projectId}/users/stats`],
    staleTime: 0,
    cacheTime: 0,
  });

  // Search users
  const { data: searchResults = [], isFetching: searchLoading } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users/search`, searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/users/search?q=${encodeURIComponent(searchQuery)}`),
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      toast({
        title: "Пользователь удален",
        description: "Данные пользователя успешно удалены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
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
    mutationFn: () => apiRequest('DELETE', `/api/projects/${projectId}/users`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users/stats`] });
      toast({
        title: "Все данные удалены",
        description: "Все пользовательские данные удалены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить данные",
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

  const handleUserStatusToggle = (user: any, field: 'isActive' | 'isBlocked' | 'isPremium') => {
    const currentValue = user[field] || user[`is_${field.slice(2).toLowerCase()}`];
    const newValue = !currentValue;
    const userId = user.id || user.user_id;
    
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUserName = (user: any) => {
    // Поддерживаем как camelCase так и snake_case форматы
    const firstName = user.firstName || user.first_name;
    const lastName = user.lastName || user.last_name;
    const userName = user.userName || user.username;
    const userId = user.userId || user.user_id;
    
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

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                База данных пользователей
              </h2>
              <p className="text-sm text-muted-foreground">
                Управление пользователями бота "{projectName}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Обновить
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Очистить базу
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
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-4">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, username или ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterActive?.toString() || 'all'} onValueChange={(value) => setFilterActive(value === 'all' ? null : value === 'true')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Активные</SelectItem>
                  <SelectItem value="false">Неактивные</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPremium?.toString() || 'all'} onValueChange={(value) => setFilterPremium(value === 'all' ? null : value === 'true')}>
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-40">
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
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сообщения</TableHead>
                <TableHead>Ответы</TableHead>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {((user.userData || user.user_data) && Object.keys(user.userData || user.user_data).length > 0) ? 
                            Object.keys(user.userData || user.user_data).filter(key => key.startsWith('response_')).length : 0}
                        </span>
                        {((user.userData || user.user_data) && Object.keys(user.userData || user.user_data).filter(key => key.startsWith('response_')).length > 0) && (
                          <Badge variant="outline" className="text-xs">
                            Есть ответы
                          </Badge>
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
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Детали пользователя</DialogTitle>
            <DialogDescription>
              Подробная информация о пользователе
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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

              {(selectedUser.userData && Object.keys(selectedUser.userData).length > 0) && (
                <div>
                  <Label className="text-sm font-medium">Ответы пользователя</Label>
                  <div className="mt-2 space-y-3">
                    {Object.entries(selectedUser.userData).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{key}</span>
                          <span className="text-xs text-muted-foreground">
                            {typeof value === 'object' && value !== null && 'timestamp' in value 
                              ? formatDate(value.timestamp) 
                              : 'Недавно'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {typeof value === 'object' && value !== null ? (
                            <div>
                              {value.value && (
                                <div className="mb-1">
                                  <span className="font-medium">Ответ:</span> {value.value}
                                </div>
                              )}
                              {value.type && (
                                <div className="mb-1">
                                  <span className="font-medium">Тип:</span> {value.type}
                                </div>
                              )}
                              {value.nodeId && (
                                <div className="mb-1">
                                  <span className="font-medium">ID узла:</span> {value.nodeId}
                                </div>
                              )}
                              {value.prompt && (
                                <div className="mb-1">
                                  <span className="font-medium">Вопрос:</span> {value.prompt}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>{String(value)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Исходные данные (JSON)</Label>
                    <div className="mt-2">
                      <Textarea
                        value={JSON.stringify(selectedUser.userData, null, 2)}
                        readOnly
                        rows={4}
                        className="text-xs font-mono"
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