import React, { useState } from 'react';
import { Users, Plus, UserPlus, X, Settings, Upload, Shield, UserCheck, MessageSquare, Globe, Clock, Tag, Search, Filter, Send, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotGroup, InsertBotGroup } from '@shared/schema';

interface GroupsPanelProps {
  projectId: number;
  projectName: string;
}

// Using BotGroup type from schema instead of local interface

export function GroupsPanel({ projectId, projectName }: GroupsPanelProps) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BotGroup | null>(null);
  const [groupUrl, setGroupUrl] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('');
  const [groupLanguage, setGroupLanguage] = useState('ru');
  const [groupTimezone, setGroupTimezone] = useState('');
  const [groupTags, setGroupTags] = useState<string[]>([]);
  const [groupNotes, setGroupNotes] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [isPublicGroup, setIsPublicGroup] = useState(false);
  const [chatType, setChatType] = useState<'group' | 'supergroup' | 'channel'>('group');
  const [adminRights, setAdminRights] = useState({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'member'>('all');
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [messageToSend, setMessageToSend] = useState('');
  const [selectedGroupForMessage, setSelectedGroupForMessage] = useState<BotGroup | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load groups from database
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['/api/projects', projectId, 'groups'],
    queryFn: () => fetch(`/api/projects/${projectId}/groups`).then(res => res.json()) as Promise<BotGroup[]>
  });

  // Ensure groups is always an array
  const safeGroups = Array.isArray(groups) ? groups : [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: Omit<InsertBotGroup, 'projectId'>) => {
      return apiRequest('POST', `/api/projects/${projectId}/groups`, groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'groups'] });
      toast({ title: 'Группа успешно добавлена' });
    },
    onError: () => {
      toast({ title: 'Ошибка при добавлении группы', variant: 'destructive' });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest('DELETE', `/api/projects/${projectId}/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'groups'] });
      toast({ title: 'Группа удалена' });
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении группы', variant: 'destructive' });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: number, data: Partial<InsertBotGroup> }) => {
      return apiRequest('PUT', `/api/projects/${projectId}/groups/${groupId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'groups'] });
      toast({ title: 'Настройки группы обновлены' });
      setShowGroupSettings(false);
      setSelectedGroup(null);
    },
    onError: () => {
      toast({ title: 'Ошибка при обновлении настроек', variant: 'destructive' });
    }
  });

  // Send message to group mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, message }: { groupId: string | null; message: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/send-group-message`, {
        groupId,
        message
      });
    },
    onSuccess: () => {
      toast({ title: 'Сообщение отправлено в группу' });
      setShowSendMessage(false);
      setMessageToSend('');
      setSelectedGroupForMessage(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при отправке сообщения', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Get group info mutation
  const getGroupInfoMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      // Get both group info and member count
      const [groupInfo, memberCount] = await Promise.all([
        apiRequest('GET', `/api/projects/${projectId}/bot/group-info/${groupId}`),
        apiRequest('GET', `/api/projects/${projectId}/bot/group-members-count/${groupId}`)
      ]);
      return { ...groupInfo, memberCount: memberCount.count };
    },
    onSuccess: (data) => {
      // Обновляем информацию о группе в базе данных
      const groupToUpdate = safeGroups.find(g => g.groupId === data.id?.toString());
      if (groupToUpdate) {
        updateGroupMutation.mutate({
          groupId: groupToUpdate.id,
          data: { 
            memberCount: data.memberCount,
            chatType: data.type,
            name: data.title || groupToUpdate.name
          }
        });
      }
      toast({ 
        title: `Информация о группе получена`, 
        description: `Название: ${data.title}, Участников: ${data.memberCount}, Тип: ${data.type === 'supergroup' ? 'Супергруппа' : data.type === 'group' ? 'Группа' : 'Канал'}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при получении информации', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Get group members count mutation
  const getMembersCountMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      return apiRequest('GET', `/api/projects/${projectId}/bot/group-members-count/${groupId}`);
    },
    onSuccess: (data) => {
      // Обновляем количество участников в базе данных
      const groupToUpdate = safeGroups.find(g => g.groupId === data.groupId);
      if (groupToUpdate) {
        updateGroupMutation.mutate({
          groupId: groupToUpdate.id,
          data: { memberCount: data.count }
        });
      }
      toast({ title: `Участников в группе: ${data.count}` });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при получении количества участников', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Get admin status mutation
  const getAdminStatusMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      return apiRequest('GET', `/api/projects/${projectId}/bot/admin-status/${groupId}`);
    },
    onSuccess: (data) => {
      toast({ 
        title: `Статус бота в группе: ${data.isAdmin ? 'Администратор' : 'Участник'}`, 
        description: `Права: ${data.status}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при проверке статуса', 
        description: error.error || 'Бот не найден в группе',
        variant: 'destructive' 
      });
    }
  });

  // Get group administrators mutation
  const [administrators, setAdministrators] = React.useState<any[]>([]);
  const [allMembers, setAllMembers] = React.useState<any[]>([]);
  const [showAllMembers, setShowAllMembers] = React.useState(false);
  
  const getAdminsMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      return apiRequest('GET', `/api/projects/${projectId}/bot/group-admins/${groupId}`);
    },
    onSuccess: (data) => {
      setAdministrators(data.administrators || []);
      toast({ title: `Получено администраторов: ${data.administrators?.length || 0}` });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при получении администраторов', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Get all group members mutation
  const getAllMembersMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      return apiRequest('GET', `/api/projects/${projectId}/bot/group-members/${groupId}`);
    },
    onSuccess: (data) => {
      setAllMembers(data.members || []);
      setShowAllMembers(true);
      toast({ 
        title: `Получено участников: ${data.totalCount || data.members?.length || 0}`,
        description: data.isPartialList ? "Показаны только администраторы для больших групп" : "Полный список участников"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при получении участников', 
        description: error.error || 'Список участников доступен только для небольших групп',
        variant: 'destructive' 
      });
    }
  });

  // Автоматически загружаем администраторов при выборе группы
  React.useEffect(() => {
    if (selectedGroup && showGroupSettings) {
      getAdminsMutation.mutate(selectedGroup.groupId);
    }
  }, [selectedGroup, showGroupSettings]);

  // Ban member mutation
  const [userIdToBan, setUserIdToBan] = React.useState('');
  const [userIdToUnban, setUserIdToUnban] = React.useState('');
  const banMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, untilDate }: { groupId: string | null; userId: string; untilDate?: number }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/ban-member`, {
        groupId,
        userId,
        untilDate
      });
    },
    onSuccess: () => {
      toast({ title: 'Пользователь заблокирован' });
      setUserIdToBan('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при блокировке', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Unban member mutation
  const unbanMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string | null; userId: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/unban-member`, {
        groupId,
        userId
      });
    },
    onSuccess: () => {
      toast({ title: 'Пользователь разблокирован' });
      setUserIdToUnban('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при разблокировке', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  const handleAddGroup = () => {
    if (!groupUrl.trim() || !groupName.trim()) {
      toast({ title: 'Пожалуйста, заполните все поля', variant: 'destructive' });
      return;
    }

    createGroupMutation.mutate({
      groupId: groupUrl.includes('joinchat') ? null : groupUrl.replace('@', ''),
      name: groupName,
      url: groupUrl,
      isAdmin: makeAdmin ? 1 : 0,
      memberCount: null,
      isActive: 1,
      description: null,
      settings: {},
      chatType: 'group' as const,
      adminRights: {
        can_manage_chat: false,
        can_change_info: false,
        can_delete_messages: false,
        can_invite_users: false,
        can_restrict_members: false,
        can_pin_messages: false,
        can_promote_members: false,
        can_manage_video_chats: false
      },
      messagesCount: 0,
      activeUsers: 0,
      isPublic: 0,
      language: 'ru' as const,
      tags: []
    });
    
    // Закрываем модалка и очищаем форму
    setShowAddGroup(false);
    setGroupUrl('');
    setGroupName('');
    setMakeAdmin(false);
  };

  return (
    <div className="h-full w-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Управление группами</h1>
          <p className="text-muted-foreground">
            Администрирование Telegram групп для проекта "{projectName}"
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загружаем группы...</p>
          </div>
        ) : safeGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Нет подключенных групп
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Добавьте первую группу для управления участниками и контентом
            </p>
            <Button onClick={() => setShowAddGroup(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Подключить группу
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">Подключенные группы ({safeGroups.length})</h2>
                <p className="text-sm text-muted-foreground">Управление вашими Telegram группами</p>
              </div>
              <Button onClick={() => setShowAddGroup(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить группу
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeGroups.map((group) => (
                <Card key={group.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {group.isAdmin ? 'Администратор' : 'Участник'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ссылка:</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {group.url.length > 20 ? group.url.substring(0, 20) + '...' : group.url}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Добавлено:</span>
                      <span>{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedGroup(group);
                          setGroupName(group.name);
                          setGroupUrl(group.url);
                          setGroupDescription(group.description || '');
                          setGroupAvatarUrl(group.avatarUrl || '');
                          setGroupLanguage(group.language || 'ru');
                          setGroupTimezone(group.timezone || '');
                          setGroupTags(group.tags || []);
                          setGroupNotes(group.notes || '');
                          setMakeAdmin(group.isAdmin === 1);
                          setIsPublicGroup(Boolean(group.isPublic));
                          setChatType((group.chatType as 'group' | 'supergroup' | 'channel') || 'group');
                          setAdminRights((group.adminRights as any) || {
                            can_manage_chat: false,
                            can_change_info: false,
                            can_delete_messages: false,
                            can_invite_users: false,
                            can_restrict_members: false,
                            can_pin_messages: false,
                            can_promote_members: false,
                            can_manage_video_chats: false
                          });
                          setShowGroupSettings(true);
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Настройки
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedGroupForMessage(group);
                          setShowSendMessage(true);
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Сообщение
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => getGroupInfoMutation.mutate(group.groupId)}
                        disabled={getGroupInfoMutation.isPending}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Инфо
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => getMembersCountMutation.mutate(group.groupId)}
                        disabled={getMembersCountMutation.isPending}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Участники
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => getAdminStatusMutation.mutate(group.groupId)}
                        disabled={getAdminStatusMutation.isPending}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Статус
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => deleteGroupMutation.mutate(group.id)}
                      disabled={deleteGroupMutation.isPending}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Удалить группу
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Модальное окно подключения группы */}
        <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Подключить группу</DialogTitle>
              <DialogDescription>
                Введите данные Telegram группы для подключения к боту
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-url">Ссылка на группу или @username</Label>
                <Input
                  id="group-url"
                  placeholder="https://t.me/group или @groupname"
                  value={groupUrl}
                  onChange={(e) => setGroupUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-name">Название для отображения</Label>
                <Input
                  id="group-name"
                  placeholder="Введите название группы"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="admin-rights"
                  checked={makeAdmin}
                  onCheckedChange={setMakeAdmin}
                />
                <Label htmlFor="admin-rights">
                  Бот будет добавлен как администратор
                </Label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddGroup(false)} 
                className="flex-1"
              >
                Отмена
              </Button>
              <Button onClick={handleAddGroup} className="flex-1">
                Подключить группу
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно настроек группы */}
        <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Настройки группы: {selectedGroup?.name}
              </DialogTitle>
              <DialogDescription>
                Комплексное управление группой и её участниками
              </DialogDescription>
            </DialogHeader>
            
            {selectedGroup && (
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Общие
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Права
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Участники
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Аналитика
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                  <TabsContent value="general" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-group-name">Название группы</Label>
                        <Input
                          id="edit-group-name"
                          placeholder="Введите название группы"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-group-url">Ссылка на группу</Label>
                        <Input
                          id="edit-group-url"
                          placeholder="https://t.me/group"
                          value={groupUrl}
                          onChange={(e) => setGroupUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-chat-id">
                        Chat ID группы
                        <span className="text-xs text-muted-foreground ml-2">
                          (для приватных групп обязательно)
                        </span>
                      </Label>
                      <Input
                        id="edit-group-chat-id"
                        placeholder="-1001234567890"
                        value={selectedGroup?.groupId || ''}
                        onChange={(e) => {
                          if (selectedGroup) {
                            setSelectedGroup({
                              ...selectedGroup,
                              groupId: e.target.value
                            });
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Для получения chat_id: отправьте любое сообщение в группу, затем переслайте его в @userinfobot
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-desc">Описание группы</Label>
                      <Textarea
                        id="edit-group-desc"
                        placeholder="Краткое описание группы..."
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chat-type">Тип чата</Label>
                        <Select value={chatType} onValueChange={(value: 'group' | 'supergroup' | 'channel') => setChatType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="group">Группа</SelectItem>
                            <SelectItem value="supergroup">Супергруппа</SelectItem>
                            <SelectItem value="channel">Канал</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-language">Язык группы</Label>
                        <Select value={groupLanguage} onValueChange={setGroupLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите язык" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ru">Русский</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="it">Italiano</SelectItem>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                            <SelectItem value="ja">日本語</SelectItem>
                            <SelectItem value="ko">한국어</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-avatar">URL аватарки</Label>
                        <div className="flex gap-2">
                          <Input
                            id="group-avatar"
                            placeholder="https://example.com/avatar.jpg"
                            value={groupAvatarUrl}
                            onChange={(e) => setGroupAvatarUrl(e.target.value)}
                          />
                          <Button variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-timezone">Часовой пояс</Label>
                        <Input
                          id="group-timezone"
                          placeholder="Europe/Moscow"
                          value={groupTimezone}
                          onChange={(e) => setGroupTimezone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="public-group"
                        checked={isPublicGroup}
                        onCheckedChange={setIsPublicGroup}
                      />
                      <Label htmlFor="public-group">
                        Публичная группа
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-notes">Заметки администратора</Label>
                      <Textarea
                        id="group-notes"
                        placeholder="Внутренние заметки о группе..."
                        value={groupNotes}
                        onChange={(e) => setGroupNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Статус администратора</h4>
                          <p className="text-sm text-muted-foreground">
                            Является ли бот администратором группы
                          </p>
                        </div>
                        <Switch 
                          checked={makeAdmin}
                          onCheckedChange={setMakeAdmin}
                        />
                      </div>
                      
                      {makeAdmin && (
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm">Права администратора</h5>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(adminRights).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <Switch
                                  checked={value}
                                  onCheckedChange={(checked) => 
                                    setAdminRights(prev => ({ ...prev, [key]: checked }))
                                  }
                                />
                                <Label className="text-xs">
                                  {key === 'can_manage_chat' && 'Управление чатом'}
                                  {key === 'can_change_info' && 'Изменение информации'}
                                  {key === 'can_delete_messages' && 'Удаление сообщений'}
                                  {key === 'can_invite_users' && 'Приглашение пользователей'}
                                  {key === 'can_restrict_members' && 'Ограничение участников'}
                                  {key === 'can_pin_messages' && 'Закрепление сообщений'}
                                  {key === 'can_promote_members' && 'Назначение администраторов'}
                                  {key === 'can_manage_video_chats' && 'Управление видеочатами'}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Управление участниками</h4>
                        <Badge variant="secondary">{selectedGroup.memberCount || 0} участников</Badge>
                      </div>
                      
                      {/* Список администраторов */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">Администраторы</h5>
                          <div className="flex items-center gap-2">
                            {getAdminsMutation.isPending && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                Загрузка...
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => getAllMembersMutation.mutate(selectedGroup.groupId)}
                              disabled={getAllMembersMutation.isPending}
                            >
                              {getAllMembersMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                              ) : (
                                <Users className="h-4 w-4 mr-2" />
                              )}
                              Все участники
                            </Button>
                          </div>
                        </div>
                        
                        {administrators.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {administrators.map((admin, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {admin.user.first_name} {admin.user.last_name || ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{admin.user.username || 'Без username'} • ID: {admin.user.id}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={admin.status === 'creator' ? 'default' : 'secondary'}>
                                  {admin.status === 'creator' ? 'Создатель' : 'Админ'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : !getAdminsMutation.isPending ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Администраторы не найдены
                          </p>
                        ) : null}
                      </div>

                      {/* Список всех участников */}
                      {showAllMembers && allMembers.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">Все участники</h5>
                            <Badge variant="outline">{allMembers.length} человек</Badge>
                          </div>
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {allMembers.map((member, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {member.user.first_name} {member.user.last_name || ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{member.user.username || 'Без username'} • ID: {member.user.id}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={
                                  member.status === 'creator' ? 'default' : 
                                  member.status === 'administrator' ? 'secondary' : 
                                  'outline'
                                }>
                                  {member.status === 'creator' ? 'Создатель' : 
                                   member.status === 'administrator' ? 'Админ' : 
                                   'Участник'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t my-4" />

                      {/* Блокировка пользователей */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Блокировка пользователей</h5>
                        <div className="space-y-2">
                          <Input
                            placeholder="User ID для блокировки (например: 123456789)"
                            value={userIdToBan}
                            onChange={(e) => setUserIdToBan(e.target.value)}
                          />
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => banMemberMutation.mutate({ 
                              groupId: selectedGroup.groupId, 
                              userId: userIdToBan 
                            })}
                            disabled={!userIdToBan || banMemberMutation.isPending}
                            className="w-full"
                          >
                            {banMemberMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Заблокировать пользователя
                          </Button>
                        </div>
                      </div>

                      {/* Разблокировка пользователей */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Разблокировка пользователей</h5>
                        <div className="space-y-2">
                          <Input
                            placeholder="User ID для разблокировки (например: 123456789)"
                            value={userIdToUnban}
                            onChange={(e) => setUserIdToUnban(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => unbanMemberMutation.mutate({ 
                              groupId: selectedGroup.groupId, 
                              userId: userIdToUnban 
                            })}
                            disabled={!userIdToUnban || unbanMemberMutation.isPending}
                            className="w-full"
                          >
                            {unbanMemberMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Разблокировать пользователя
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          💡 <strong>Как получить User ID:</strong> Попросите пользователя написать /start боту @userinfobot или найти ID в настройках Telegram.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Сообщений</p>
                            <p className="text-2xl font-bold">{selectedGroup.messagesCount || 0}</p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">Активные пользователи</p>
                            <p className="text-2xl font-bold">{selectedGroup.activeUsers || 0}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <Label>Последняя активность</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedGroup.lastActivity 
                          ? new Date(selectedGroup.lastActivity).toLocaleString('ru-RU')
                          : 'Нет данных'
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Теги группы</Label>
                      <div className="flex flex-wrap gap-2">
                        {groupTags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => setGroupTags(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTag = prompt('Введите новый тег:');
                            if (newTag) setGroupTags(prev => [...prev, newTag]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Добавить тег
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowGroupSettings(false);
                  setSelectedGroup(null);
                }} 
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                onClick={() => {
                  if (selectedGroup) {
                    updateGroupMutation.mutate({
                      groupId: selectedGroup.id,
                      data: {
                        name: groupName || selectedGroup.name,
                        url: groupUrl || selectedGroup.url,
                        groupId: selectedGroup.groupId, // Include the updated chat_id
                        description: groupDescription,
                        avatarUrl: groupAvatarUrl,
                        language: groupLanguage as 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko',
                        timezone: groupTimezone,
                        tags: groupTags,
                        notes: groupNotes,
                        isAdmin: makeAdmin ? 1 : 0,
                        isPublic: isPublicGroup ? 1 : 0,
                        chatType,
                        adminRights
                      }
                    });
                  }
                }}
                disabled={updateGroupMutation.isPending}
                className="flex-1"
              >
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно отправки сообщения в группу */}
        <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Отправить сообщение в группу</DialogTitle>
              <DialogDescription>
                Отправка сообщения в группу "{selectedGroupForMessage?.name}" через Telegram Bot API
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-text">Текст сообщения</Label>
                <Textarea
                  id="message-text"
                  placeholder="Введите текст сообщения..."
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSendMessage(false);
                  setMessageToSend('');
                  setSelectedGroupForMessage(null);
                }} 
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                onClick={() => {
                  if (selectedGroupForMessage && messageToSend.trim()) {
                    sendMessageMutation.mutate({
                      groupId: selectedGroupForMessage.groupId,
                      message: messageToSend.trim()
                    });
                  }
                }}
                disabled={sendMessageMutation.isPending || !messageToSend.trim()}
                className="flex-1"
              >
                {sendMessageMutation.isPending ? 'Отправляется...' : 'Отправить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}