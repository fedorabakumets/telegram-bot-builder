import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Settings, 
  Shield, 
  MessageSquare, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Bell, 
  Image,
  Edit3,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Upload,
  Download,
  RefreshCw,
  Plus,
  Mic,
  Camera,
  Link,
  Ban,
  Zap,
  Target
} from 'lucide-react';

interface GroupsPanelProps {
  projectId: number;
  projectName: string;
}

interface GroupData {
  id: string;
  title: string;
  username?: string;
  type: 'group' | 'supergroup' | 'channel';
  member_count: number;
  description?: string;
  invite_link?: string;
  photo?: string;
  permissions: {
    can_send_messages: boolean;
    can_send_media: boolean;
    can_send_polls: boolean;
    can_send_links: boolean;
    can_change_info: boolean;
    can_invite_users: boolean;
    can_pin_messages: boolean;
  };
  restrictions: {
    slow_mode_delay: number;
    auto_delete_timer: number;
  };
  stats: {
    total_messages: number;
    active_members: number;
    new_members_today: number;
    messages_today: number;
  };
  admins: Array<{
    user_id: string;
    username?: string;
    first_name: string;
    permissions: string[];
  }>;
}

export function GroupsPanel({ projectId, projectName }: GroupsPanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - в реальности будет загружаться с API
  const mockGroups: GroupData[] = [
    {
      id: 'group_1',
      title: 'Сообщество ВПрогулке СПб',
      username: 'vprogulke_spb',
      type: 'supergroup',
      member_count: 1247,
      description: 'Знакомства и общение в Санкт-Петербурге',
      invite_link: 'https://t.me/+agkIVgCzHtY2ZTA6',
      permissions: {
        can_send_messages: true,
        can_send_media: true,
        can_send_polls: true,
        can_send_links: false,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      },
      restrictions: {
        slow_mode_delay: 30,
        auto_delete_timer: 0,
      },
      stats: {
        total_messages: 15642,
        active_members: 892,
        new_members_today: 23,
        messages_today: 147,
      },
      admins: [
        {
          user_id: '123456789',
          username: 'admin_user',
          first_name: 'Администратор',
          permissions: ['can_delete_messages', 'can_ban_users', 'can_invite_users']
        }
      ]
    }
  ];

  const { data: groups = mockGroups, isLoading, refetch } = useQuery<GroupData[]>({
    queryKey: [`/api/projects/${projectId}/groups`],
    staleTime: 30000,
    refetchInterval: 60000,
    initialData: mockGroups,
  });

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(group => 
      group.title.toLowerCase().includes(query) ||
      group.username?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="w-4 h-4" />;
      case 'supergroup': return <Users className="w-4 h-4 text-blue-500" />;
      case 'channel': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case 'group': return 'Группа';
      case 'supergroup': return 'Супергруппа';
      case 'channel': return 'Канал';
      default: return 'Неизвестно';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Загрузка групп...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Заголовок */}
      <div className="border-b bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Управление группами
              </h2>
              <p className="text-sm text-muted-foreground">
                Администрирование Telegram групп для проекта "{projectName}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Обновить
              </Button>
              <Button onClick={() => setShowAddGroup(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Добавить группу
              </Button>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Всего групп</p>
                  <p className="text-sm font-semibold">{groups.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Участников</p>
                  <p className="text-sm font-semibold">
                    {formatNumber(groups.reduce((sum, group) => sum + group.member_count, 0))}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Сообщений</p>
                  <p className="text-sm font-semibold">
                    {formatNumber(groups.reduce((sum, group) => sum + group.stats.total_messages, 0))}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Активных</p>
                  <p className="text-sm font-semibold">
                    {formatNumber(groups.reduce((sum, group) => sum + group.stats.active_members, 0))}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск групп по названию, username или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Список групп */}
          <div className="border-r">
            <ScrollArea className="h-full">
              <div className="p-4">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery ? 'Группы не найдены' : 'Нет подключенных групп'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery 
                        ? 'Попробуйте изменить критерии поиска' 
                        : 'Добавьте первую группу для управления'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowAddGroup(true)} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Добавить группу
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGroups.map((group) => (
                      <Card 
                        key={group.id} 
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {getGroupTypeIcon(group.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">{group.title}</CardTitle>
                                <CardDescription className="text-sm">
                                  {group.username ? `@${group.username}` : getGroupTypeLabel(group.type)}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {formatNumber(group.member_count)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {group.stats.messages_today} сегодня
                            </span>
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              +{group.stats.new_members_today}
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Детали группы */}
          <div className="col-span-2">
            {selectedGroup ? (
              <div className="h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {getGroupTypeIcon(selectedGroup.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedGroup.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedGroup.username ? `@${selectedGroup.username}` : getGroupTypeLabel(selectedGroup.type)} • {formatNumber(selectedGroup.member_count)} участников
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Настройки
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100%-100px)]">
                  <div className="p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Обзор</TabsTrigger>
                        <TabsTrigger value="moderation">Модерация</TabsTrigger>
                        <TabsTrigger value="members">Участники</TabsTrigger>
                        <TabsTrigger value="settings">Настройки</TabsTrigger>
                        <TabsTrigger value="analytics">Аналитика</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        {/* Информация о группе */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5" />
                              Информация о группе
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Название</label>
                                <p className="text-sm text-muted-foreground">{selectedGroup.title}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Тип</label>
                                <p className="text-sm text-muted-foreground">{getGroupTypeLabel(selectedGroup.type)}</p>
                              </div>
                              {selectedGroup.username && (
                                <div>
                                  <label className="text-sm font-medium">Username</label>
                                  <p className="text-sm text-muted-foreground">@{selectedGroup.username}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium">Участники</label>
                                <p className="text-sm text-muted-foreground">{formatNumber(selectedGroup.member_count)}</p>
                              </div>
                            </div>
                            {selectedGroup.description && (
                              <div>
                                <label className="text-sm font-medium">Описание</label>
                                <p className="text-sm text-muted-foreground">{selectedGroup.description}</p>
                              </div>
                            )}
                            {selectedGroup.invite_link && (
                              <div>
                                <label className="text-sm font-medium">Ссылка-приглашение</label>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    value={selectedGroup.invite_link} 
                                    readOnly 
                                    className="text-sm"
                                  />
                                  <Button variant="outline" size="sm">
                                    <Link className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Быстрая статистика */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="p-4">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">Сообщений</p>
                                <p className="text-2xl font-bold">{formatNumber(selectedGroup.stats.total_messages)}</p>
                                <p className="text-xs text-muted-foreground">+{selectedGroup.stats.messages_today} сегодня</p>
                              </div>
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="text-sm font-medium">Активных</p>
                                <p className="text-2xl font-bold">{formatNumber(selectedGroup.stats.active_members)}</p>
                                <p className="text-xs text-muted-foreground">из {formatNumber(selectedGroup.member_count)}</p>
                              </div>
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-5 h-5 text-purple-500" />
                              <div>
                                <p className="text-sm font-medium">Новых</p>
                                <p className="text-2xl font-bold">{selectedGroup.stats.new_members_today}</p>
                                <p className="text-xs text-muted-foreground">сегодня</p>
                              </div>
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="flex items-center gap-2">
                              <Crown className="w-5 h-5 text-orange-500" />
                              <div>
                                <p className="text-sm font-medium">Админов</p>
                                <p className="text-2xl font-bold">{selectedGroup.admins.length}</p>
                                <p className="text-xs text-muted-foreground">активных</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="moderation" className="space-y-4">
                        {/* Инструменты модерации */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              Инструменты модерации
                            </CardTitle>
                            <CardDescription>
                              Управление контентом и поведением участников
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Button variant="outline" className="h-20 flex-col">
                                <Trash2 className="w-6 h-6 mb-2 text-red-500" />
                                <span className="text-sm">Удалить сообщения</span>
                              </Button>
                              <Button variant="outline" className="h-20 flex-col">
                                <Ban className="w-6 h-6 mb-2 text-red-500" />
                                <span className="text-sm">Заблокировать пользователя</span>
                              </Button>
                              <Button variant="outline" className="h-20 flex-col">
                                <AlertTriangle className="w-6 h-6 mb-2 text-yellow-500" />
                                <span className="text-sm">Выдать предупреждение</span>
                              </Button>
                              <Button variant="outline" className="h-20 flex-col">
                                <Mic className="w-6 h-6 mb-2 text-blue-500" />
                                <span className="text-sm">Ограничить права</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Фильтры и автомодерация */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="w-5 h-5" />
                              Автомодерация
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Антиспам фильтр</p>
                                <p className="text-sm text-muted-foreground">Автоматическое удаление спама</p>
                              </div>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Фильтр ссылок</p>
                                <p className="text-sm text-muted-foreground">Блокировка внешних ссылок</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Slow mode</p>
                                <p className="text-sm text-muted-foreground">Ограничение частоты сообщений</p>
                              </div>
                              <Select defaultValue="30">
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Выкл</SelectItem>
                                  <SelectItem value="10">10с</SelectItem>
                                  <SelectItem value="30">30с</SelectItem>
                                  <SelectItem value="60">1м</SelectItem>
                                  <SelectItem value="300">5м</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="members" className="space-y-4">
                        {/* Управление участниками */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Администраторы
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedGroup.admins.map((admin, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Crown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{admin.first_name}</p>
                                      {admin.username && (
                                        <p className="text-sm text-muted-foreground">@{admin.username}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Админ</Badge>
                                    <Button variant="outline" size="sm">
                                      <Edit3 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button className="w-full mt-4" variant="outline">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Добавить администратора
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Действия с участниками */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Массовые действия</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                              <Download className="w-4 h-4 mr-2" />
                              Экспорт списка участников
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Upload className="w-4 h-4 mr-2" />
                              Массовое приглашение
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Отправить всем сообщение
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-4">
                        {/* Настройки группы */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Settings className="w-5 h-5" />
                              Основные настройки
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Название группы</label>
                              <Input defaultValue={selectedGroup.title} />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Описание</label>
                              <Textarea 
                                defaultValue={selectedGroup.description} 
                                placeholder="Описание группы..."
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Аватар группы</label>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  <Image className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <Button variant="outline" size="sm">
                                  <Upload className="w-4 h-4 mr-1" />
                                  Загрузить фото
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Права участников */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Права участников</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Отправка сообщений</p>
                                <p className="text-sm text-muted-foreground">Могут ли участники писать сообщения</p>
                              </div>
                              <Switch defaultChecked={selectedGroup.permissions.can_send_messages} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Отправка медиа</p>
                                <p className="text-sm text-muted-foreground">Фото, видео, файлы</p>
                              </div>
                              <Switch defaultChecked={selectedGroup.permissions.can_send_media} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Отправка ссылок</p>
                                <p className="text-sm text-muted-foreground">Внешние ссылки и превью</p>
                              </div>
                              <Switch defaultChecked={selectedGroup.permissions.can_send_links} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Приглашение пользователей</p>
                                <p className="text-sm text-muted-foreground">Могут ли участники приглашать других</p>
                              </div>
                              <Switch defaultChecked={selectedGroup.permissions.can_invite_users} />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="analytics" className="space-y-4">
                        {/* Аналитика */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Статистика активности
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64 bg-muted/50 rounded flex items-center justify-center">
                              <div className="text-center">
                                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">График активности будет здесь</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Топ участников */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Самые активные участники</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-medium">{i}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium">Участник {i}</p>
                                      <p className="text-sm text-muted-foreground">@user{i}</p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">{Math.floor(Math.random() * 100)} сообщений</Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Выберите группу
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Выберите группу из списка слева для просмотра деталей и управления
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модал добавления группы */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить группу</DialogTitle>
            <DialogDescription>
              Подключите Telegram группу для управления через бота
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ссылка на группу или @username</label>
              <Input placeholder="https://t.me/group или @groupname" />
            </div>
            <div>
              <label className="text-sm font-medium">Название для отображения</label>
              <Input placeholder="Введите название группы" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="admin-rights" />
              <label htmlFor="admin-rights" className="text-sm">
                Бот будет добавлен как администратор
              </label>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddGroup(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={() => setShowAddGroup(false)} className="flex-1">
              Добавить группу
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}