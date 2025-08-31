import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, UserPlus, X, Settings, Upload, Shield, UserCheck, MessageSquare, Globe, Clock, Tag, Search, Filter, Send, BarChart3, TrendingUp, Edit, Pin, PinOff, Trash, Crown, Bot, Ban, Volume2, VolumeX, UserMinus, MoreHorizontal } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TelegramAuth } from '@/components/telegram-auth';
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
  const [groupId, setGroupId] = useState('');
  const [isParsingGroup, setIsParsingGroup] = useState(false);
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
  const { data: groups = [], isLoading, error, refetch } = useQuery({
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

  // Auto-parse group info mutation
  const parseGroupInfoMutation = useMutation({
    mutationFn: async (groupIdentifier: string) => {
      setIsParsingGroup(true);
      try {
        // Get both group info and admin status
        const [groupInfo, adminStatus] = await Promise.all([
          apiRequest('GET', `/api/projects/${projectId}/bot/group-info/${groupIdentifier}`),
          apiRequest('GET', `/api/projects/${projectId}/bot/admin-status/${groupIdentifier}`)
        ]);
        return { ...groupInfo, isAdmin: adminStatus.isAdmin };
      } finally {
        setIsParsingGroup(false);
      }
    },
    onSuccess: (data) => {
      // Автоматически заполняем название группы
      if (data.title && !groupName) {
        setGroupName(data.title);
      }
      // Генерируем ссылку автоматически
      if (data.username) {
        setGroupUrl(`https://t.me/${data.username}`);
      } else if (data.invite_link) {
        setGroupUrl(data.invite_link);
      } else {
        // Для числовых ID не создаем публичную ссылку
        setGroupUrl('');
      }
      // Устанавливаем статус администратора
      setMakeAdmin(data.isAdmin || false);
      toast({ 
        title: 'Обновлено', 
        description: `${data.title} • ${data.username ? '@' + data.username : 'ID: ' + data.id} • ${data.isAdmin ? 'Админ' : 'Участник'}`
      });
    },
    onError: (error: any) => {
      setIsParsingGroup(false);
      // Не показываем ошибку, так как это автоматический парсинг
    }
  });

  // Auto-parse when groupId changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const identifier = groupId.trim();
      if (identifier && (identifier.startsWith('-') || identifier.startsWith('@') || identifier.includes('t.me'))) {
        let groupIdentifier = identifier;
        
        // Извлекаем ID из разных форматов ссылок
        if (identifier.includes('t.me/')) {
          const match = identifier.match(/t.me\/([^?\/]+)/);
          if (match) {
            groupIdentifier = match[1].startsWith('+') ? match[1] : '@' + match[1];
          }
        }
        
        parseGroupInfoMutation.mutate(groupIdentifier);
      }
    }, 1500); // Задержка 1.5 секунды после ввода

    return () => clearTimeout(timeoutId);
  }, [groupId, projectId]);

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
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [clientApiMembers, setClientApiMembers] = React.useState<any[]>([]);
  const [showTelegramAuth, setShowTelegramAuth] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [memberPermissions, setMemberPermissions] = useState({
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false
  });
  
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
      setClientApiMembers(data.members || []);
      toast({ 
        title: data.isPartialList ? `Показаны администраторы: ${data.totalCount || 0}` : `Все участники: ${data.totalCount || 0}`,
        description: data.message || data.explanation || (data.isPartialList ? "Telegram API не предоставляет полный список" : "Полный список участников")
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

  // Mute member mutation
  const muteMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, untilDate }: { groupId: string | null; userId: string; untilDate?: number }) => {
      try {
        // Сначала пробуем Bot API
        return await apiRequest('POST', `/api/projects/${projectId}/bot/restrict-member`, {
          groupId,
          userId,
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          },
          untilDate
        });
      } catch (botApiError: any) {
        console.log('Bot API failed, trying Client API:', botApiError);
        // Если Bot API не работает, пробуем Client API
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/restrict-member`, {
          groupId,
          userId,
          untilDate: untilDate || Math.floor(Date.now() / 1000) + 3600
        });
      }
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Пользователь замучен',
        description: data.message || 'Операция выполнена успешно'
      });
      setUserIdToBan('');
      // Обновляем список участников
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup?.groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/group-admins/${selectedGroup?.groupId}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при муте', 
        description: error.error || 'Не удалось замутить участника',
        variant: 'destructive' 
      });
    }
  });

  // Kick member mutation - пробуем сначала Bot API, потом Client API
  const kickMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string | null; userId: string }) => {
      try {
        // Сначала пробуем Bot API
        return await apiRequest('POST', `/api/projects/${projectId}/bot/kick-member`, {
          groupId,
          userId
        });
      } catch (botApiError: any) {
        console.log('Bot API failed, trying Client API:', botApiError);
        // Если Bot API не работает, пробуем Client API
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/kick-member`, {
          groupId,
          userId
        });
      }
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Пользователь исключен из группы',
        description: data.message || 'Операция выполнена успешно'
      });
      // Обновляем список участников
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup?.groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/group-admins/${selectedGroup?.groupId}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при исключении', 
        description: error.error || 'Не удалось исключить участника',
        variant: 'destructive' 
      });
    }
  });

  // Update member permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ groupId, userId, permissions }: { groupId: string | null; userId: string; permissions: any }) => {
      try {
        // Сначала пробуем Bot API
        return await apiRequest('POST', `/api/projects/${projectId}/bot/restrict-member`, {
          groupId,
          userId,
          permissions
        });
      } catch (botApiError: any) {
        console.log('Bot API failed, trying Client API:', botApiError);
        // Если Bot API не работает, пробуем Client API
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/restrict-member`, {
          groupId,
          userId,
          untilDate: Math.floor(Date.now() / 1000) + 3600 // 1 час по умолчанию
        });
      }
    },
    onSuccess: () => {
      toast({ title: 'Разрешения участника обновлены' });
      setShowPermissionsDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при обновлении разрешений', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Автоматически загружаем администраторов при выборе группы
  React.useEffect(() => {
    if (selectedGroup && showGroupSettings) {
      setAdministrators([]); // Сбрасываем старые данные
      setClientApiMembers([]); // Сбрасываем старые данные
      getAdminsMutation.mutate(selectedGroup.groupId);
    }
  }, [selectedGroup, showGroupSettings]);

  // Ban member mutation
  const [userIdToBan, setUserIdToBan] = React.useState('');
  const [userIdToUnban, setUserIdToUnban] = React.useState('');
  const banMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, untilDate }: { groupId: string | null; userId: string; untilDate?: number }) => {
      try {
        // Сначала пробуем Bot API
        return await apiRequest('POST', `/api/projects/${projectId}/bot/ban-member`, {
          groupId,
          userId,
          untilDate
        });
      } catch (botApiError: any) {
        console.log('Bot API failed, trying Client API:', botApiError);
        // Если Bot API не работает, пробуем Client API
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/ban-member`, {
          groupId,
          userId,
          untilDate
        });
      }
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Пользователь заблокирован',
        description: data.message || 'Операция выполнена успешно'
      });
      setUserIdToBan('');
      // Обновляем список участников
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup?.groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/group-admins/${selectedGroup?.groupId}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при блокировке', 
        description: error.error || 'Не удалось заблокировать участника',
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

  // Group settings mutations
  const [newGroupTitle, setNewGroupTitle] = React.useState('');
  const [newGroupDescription, setNewGroupDescription] = React.useState('');
  const [messageIdToPin, setMessageIdToPin] = React.useState('');
  const [messageIdToUnpin, setMessageIdToUnpin] = React.useState('');
  const [messageIdToDelete, setMessageIdToDelete] = React.useState('');
  const [inviteLinkName, setInviteLinkName] = React.useState('');
  const [inviteLinkLimit, setInviteLinkLimit] = React.useState('');

  const setGroupTitleMutation = useMutation({
    mutationFn: async ({ groupId, title }: { groupId: string | null; title: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/set-group-title`, {
        groupId,
        title
      });
    },
    onSuccess: () => {
      toast({ title: 'Название группы изменено' });
      setNewGroupTitle('');
      // Refresh group data
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при изменении названия', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  const setGroupDescriptionMutation = useMutation({
    mutationFn: async ({ groupId, description }: { groupId: string | null; description: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/set-group-description`, {
        groupId,
        description
      });
    },
    onSuccess: () => {
      toast({ title: 'Описание группы изменено' });
      setNewGroupDescription('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при изменении описания', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  const pinMessageMutation = useMutation({
    mutationFn: async ({ groupId, messageId }: { groupId: string | null; messageId: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/pin-message`, {
        groupId,
        messageId,
        disableNotification: false
      });
    },
    onSuccess: () => {
      toast({ title: 'Сообщение закреплено' });
      setMessageIdToPin('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при закреплении сообщения', 
        description: error.error || 'Проверьте права бота и ID сообщения',
        variant: 'destructive' 
      });
    }
  });

  const unpinMessageMutation = useMutation({
    mutationFn: async ({ groupId, messageId }: { groupId: string | null; messageId?: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/unpin-message`, {
        groupId,
        messageId
      });
    },
    onSuccess: (_, variables) => {
      toast({ title: variables.messageId ? 'Сообщение откреплено' : 'Все сообщения откреплены' });
      setMessageIdToUnpin('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при откреплении сообщения', 
        description: error.error || 'Проверьте права бота',
        variant: 'destructive' 
      });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async ({ groupId, messageId }: { groupId: string | null; messageId: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/delete-message`, {
        groupId,
        messageId
      });
    },
    onSuccess: () => {
      toast({ title: 'Сообщение удалено' });
      setMessageIdToDelete('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при удалении сообщения', 
        description: error.error || 'Проверьте права бота и ID сообщения',
        variant: 'destructive' 
      });
    }
  });

  const createInviteLinkMutation = useMutation({
    mutationFn: async ({ groupId, name, memberLimit, createsJoinRequest }: { 
      groupId: string | null; 
      name?: string; 
      memberLimit?: number; 
      createsJoinRequest: boolean 
    }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/create-invite-link`, {
        groupId,
        name,
        memberLimit,
        createsJoinRequest
      });
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Ссылка-приглашение создана',
        description: `Новая ссылка: ${data.inviteLink.invite_link}`
      });
      setInviteLinkName('');
      setInviteLinkLimit('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при создании ссылки', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  // Restrict member mutation (mute)
  const [userIdToMute, setUserIdToMute] = React.useState('');
  const [muteMinutes, setMuteMinutes] = React.useState('');
  
  const restrictMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, untilDate }: { groupId: string | null; userId: string; untilDate?: number }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/restrict-member`, {
        groupId,
        userId,
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
          can_manage_topics: false
        },
        untilDate
      });
    },
    onSuccess: () => {
      toast({ title: 'Пользователь заглушен' });
      setUserIdToMute('');
      setMuteMinutes('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при заглушении пользователя', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  const handleAddGroup = () => {
    const identifier = groupId.trim();
    if (!identifier) {
      toast({ title: 'Пожалуйста, укажите ID группы или @username', variant: 'destructive' });
      return;
    }
    
    // Используем автоматически полученное название или ID по умолчанию
    const finalGroupName = groupName.trim() || identifier.replace('@', '').replace('https://t.me/', '') || 'New Group';
    
    // Генерируем ссылку только для username или используем автоматически полученную
    let finalGroupUrl = groupUrl.trim();
    if (!finalGroupUrl) {
      if (identifier.startsWith('@') || (!identifier.startsWith('-') && !identifier.includes('t.me'))) {
        // Для username создаем ссылку
        finalGroupUrl = `https://t.me/${identifier.replace('@', '')}`;
      } else {
        // Для числовых ID оставляем пустым - ссылка будет получена из API
        finalGroupUrl = '';
      }
    }

    createGroupMutation.mutate({
      groupId: groupId.trim() || (groupUrl.includes('joinchat') ? null : groupUrl.replace('@', '')),
      name: finalGroupName,
      url: finalGroupUrl,
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
    setGroupId('');
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
                <Label htmlFor="group-id">ID группы или @username</Label>
                <div className="relative">
                  <Input
                    id="group-id"
                    placeholder="-1002726444678 или @groupname или https://t.me/group"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    disabled={isParsingGroup}
                  />
                  {isParsingGroup && (
                    <div className="absolute right-2 top-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Информация о группе и ссылка получатся автоматически
                </p>
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
                      
                      {/* Список администраторов */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">Участники группы</h5>
                          <div className="flex items-center gap-2">
                            {isLoadingMembers && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                Загрузка...
                              </div>
                            )}
                            <Badge variant="outline">
                              {(() => {
                                if (clientApiMembers.length > 0) {
                                  return `${clientApiMembers.length} участников`;
                                } else if (administrators.length > 0) {
                                  return `${administrators.length} админов`;
                                } else if (selectedGroup.memberCount) {
                                  return `${selectedGroup.memberCount} участников`;
                                } else {
                                  return 'Загрузка...';
                                }
                              })()}
                            </Badge>
                            {clientApiMembers.length === 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowTelegramAuth(true)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Загрузить всех участников
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {(() => {
                          // Показываем Client API данные если они есть (приоритет)
                          if (clientApiMembers.length > 0) {
                            return (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {clientApiMembers.map((member, index) => (
                                  <div key={`client-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        member.status === 'creator' ? 'bg-yellow-100 dark:bg-yellow-900' :
                                        member.status === 'administrator' ? 'bg-blue-100 dark:bg-blue-900' :
                                        member.isBot ? 'bg-gray-100 dark:bg-gray-900' :
                                        'bg-green-100 dark:bg-green-900'
                                      }`}>
                                        {member.status === 'creator' ? (
                                          <Crown className={`h-4 w-4 text-yellow-600 dark:text-yellow-400`} />
                                        ) : member.status === 'administrator' ? (
                                          <Shield className={`h-4 w-4 text-blue-600 dark:text-blue-400`} />
                                        ) : member.isBot ? (
                                          <Bot className={`h-4 w-4 text-gray-600 dark:text-gray-400`} />
                                        ) : (
                                          <Users className={`h-4 w-4 text-green-600 dark:text-green-400`} />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-sm">
                                            {member?.firstName || member?.user?.first_name || member?.first_name || 'Неизвестно'} {member?.lastName || member?.user?.last_name || member?.last_name || ''}
                                          </p>
                                          {member?.isBot && <Badge variant="outline" className="text-xs">Бот</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          @{member?.username || member?.user?.username || 'Без username'} • ID: {member?.id || member?.user?.id || 'Неизвестно'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={
                                        member.status === 'creator' ? 'default' : 
                                        member.status === 'administrator' ? 'secondary' : 
                                        'outline'
                                      }>
                                        {member.status === 'creator' ? 'Создатель' : 
                                         member.status === 'administrator' ? 'Админ' : 
                                         member.isBot ? 'Бот' :
                                         'Участник'}
                                      </Badge>
                                      
                                      {/* Кнопки управления участником - показываем для всех кроме создателя */}
                                      {member.status !== 'creator' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {/* Показываем разрешения только для обычных пользователей */}
                                            {!member.isBot && (
                                              <>
                                                <DropdownMenuItem 
                                                  onClick={() => {
                                                    setSelectedMember(member);
                                                    setMemberPermissions({
                                                      can_send_messages: true,
                                                      can_send_media_messages: true,
                                                      can_send_polls: true,
                                                      can_send_other_messages: true,
                                                      can_add_web_page_previews: true,
                                                      can_change_info: false,
                                                      can_invite_users: false,
                                                      can_pin_messages: false
                                                    });
                                                    setShowPermissionsDialog(true);
                                                  }}
                                                >
                                                  <Settings className="h-4 w-4 mr-2" />
                                                  Разрешения
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                              </>
                                            )}
                                            
                                            {/* Основные действия - для всех кроме создателя */}
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                const userId = member.id?.toString() || member.user?.id?.toString() || member.userId?.toString();
                                                if (!userId) {
                                                  toast({
                                                    title: 'Ошибка',
                                                    description: 'Не удалось получить ID пользователя',
                                                    variant: 'destructive'
                                                  });
                                                  return;
                                                }
                                                muteMemberMutation.mutate({ 
                                                  groupId: selectedGroup.groupId, 
                                                  userId 
                                                });
                                              }}
                                            >
                                              <VolumeX className="h-4 w-4 mr-2" />
                                              {member.isBot ? 'Отключить бота' : 'Замутить'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                const userId = member.id?.toString() || member.user?.id?.toString() || member.userId?.toString();
                                                if (!userId) {
                                                  toast({
                                                    title: 'Ошибка',
                                                    description: 'Не удалось получить ID пользователя',
                                                    variant: 'destructive'
                                                  });
                                                  return;
                                                }
                                                kickMemberMutation.mutate({ 
                                                  groupId: selectedGroup.groupId, 
                                                  userId 
                                                });
                                              }}
                                            >
                                              <UserMinus className="h-4 w-4 mr-2" />
                                              {member.isBot ? 'Удалить бота' : 'Исключить'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => banMemberMutation.mutate({ 
                                                groupId: selectedGroup.groupId, 
                                                userId: member.id?.toString() || member.user?.id?.toString() 
                                              })}
                                              className="text-destructive"
                                            >
                                              <Ban className="h-4 w-4 mr-2" />
                                              {member.isBot ? 'Заблокировать бота' : 'Заблокировать'}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          // Если нет Client API данных, показываем администраторов от Bot API
                          if (administrators.length > 0) {
                            return (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {administrators.map((admin, index) => (
                                  <div key={`bot-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {admin?.user?.first_name || admin?.first_name || admin?.firstName || 'Неизвестно'} {admin?.user?.last_name || admin?.last_name || admin?.lastName || ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          @{admin?.user?.username || admin?.username || 'Без username'} • ID: {admin?.user?.id || admin?.id || 'Неизвестно'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={admin.status === 'creator' ? 'default' : 'secondary'}>
                                        {admin.status === 'creator' ? 'Создатель' : 'Админ'}
                                      </Badge>
                                      
                                      {/* Кнопки управления участником - показываем для всех кроме создателя */}
                                      {admin.status !== 'creator' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {/* Показываем разрешения только для обычных пользователей */}
                                            {!admin.user?.is_bot && !admin.is_bot && (
                                              <>
                                                <DropdownMenuItem 
                                                  onClick={() => {
                                                    setSelectedMember(admin);
                                                    setMemberPermissions({
                                                      can_send_messages: true,
                                                      can_send_media_messages: true,
                                                      can_send_polls: true,
                                                      can_send_other_messages: true,
                                                      can_add_web_page_previews: true,
                                                      can_change_info: false,
                                                      can_invite_users: false,
                                                      can_pin_messages: false
                                                    });
                                                    setShowPermissionsDialog(true);
                                                  }}
                                                >
                                                  <Settings className="h-4 w-4 mr-2" />
                                                  Разрешения
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                              </>
                                            )}
                                            
                                            {/* Основные действия - для всех кроме создателя */}
                                            <DropdownMenuItem 
                                              onClick={() => muteMemberMutation.mutate({ 
                                                groupId: selectedGroup.groupId, 
                                                userId: admin?.user?.id?.toString() || admin?.id?.toString() 
                                              })}
                                            >
                                              <VolumeX className="h-4 w-4 mr-2" />
                                              {admin.user?.is_bot || admin.is_bot ? 'Отключить бота' : 'Замутить'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => kickMemberMutation.mutate({ 
                                                groupId: selectedGroup.groupId, 
                                                userId: admin?.user?.id?.toString() || admin?.id?.toString() 
                                              })}
                                            >
                                              <UserMinus className="h-4 w-4 mr-2" />
                                              {admin.user?.is_bot || admin.is_bot ? 'Удалить бота' : 'Исключить'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => banMemberMutation.mutate({ 
                                                groupId: selectedGroup.groupId, 
                                                userId: admin?.user?.id?.toString() || admin?.id?.toString() 
                                              })}
                                              className="text-destructive"
                                            >
                                              <Ban className="h-4 w-4 mr-2" />
                                              {admin.user?.is_bot || admin.is_bot ? 'Заблокировать бота' : 'Заблокировать'}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          // Если ничего нет, показываем подсказку
                          return (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Нажмите "Загрузить всех участников" для просмотра полного списка
                            </p>
                          );
                        })()}
                      </div>



                      <div className="border-t my-4" />

                      {/* Настройки группы */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Настройки группы</h5>
                        
                        {/* Изменение названия */}
                        <div className="space-y-2">
                          <Label htmlFor="new-title" className="text-xs">Новое название группы</Label>
                          <div className="flex gap-2">
                            <Input
                              id="new-title"
                              value={newGroupTitle}
                              onChange={(e) => setNewGroupTitle(e.target.value)}
                              placeholder="Введите новое название..."
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => setGroupTitleMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                title: newGroupTitle 
                              })}
                              disabled={!newGroupTitle.trim() || setGroupTitleMutation.isPending}
                              size="sm"
                            >
                              {setGroupTitleMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Изменение описания */}
                        <div className="space-y-2">
                          <Label htmlFor="new-description" className="text-xs">Новое описание группы</Label>
                          <div className="flex gap-2">
                            <Input
                              id="new-description"
                              value={newGroupDescription}
                              onChange={(e) => setNewGroupDescription(e.target.value)}
                              placeholder="Введите новое описание..."
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => setGroupDescriptionMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                description: newGroupDescription 
                              })}
                              disabled={!newGroupDescription.trim() || setGroupDescriptionMutation.isPending}
                              size="sm"
                            >
                              {setGroupDescriptionMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t my-4" />

                      {/* Управление сообщениями */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Управление сообщениями</h5>
                        
                        {/* Закрепление сообщения */}
                        <div className="space-y-2">
                          <Label htmlFor="pin-message" className="text-xs">Закрепить сообщение (ID)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="pin-message"
                              value={messageIdToPin}
                              onChange={(e) => setMessageIdToPin(e.target.value)}
                              placeholder="ID сообщения для закрепления..."
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => pinMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToPin 
                              })}
                              disabled={!messageIdToPin.trim() || pinMessageMutation.isPending}
                              size="sm"
                            >
                              {pinMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Открепление сообщения */}
                        <div className="space-y-2">
                          <Label htmlFor="unpin-message" className="text-xs">Открепить сообщение (ID)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="unpin-message"
                              value={messageIdToUnpin}
                              onChange={(e) => setMessageIdToUnpin(e.target.value)}
                              placeholder="ID сообщения или оставьте пустым для всех..."
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => unpinMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToUnpin || undefined 
                              })}
                              disabled={unpinMessageMutation.isPending}
                              size="sm"
                            >
                              {unpinMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <PinOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Удаление сообщения */}
                        <div className="space-y-2">
                          <Label htmlFor="delete-message" className="text-xs">Удалить сообщение (ID)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="delete-message"
                              value={messageIdToDelete}
                              onChange={(e) => setMessageIdToDelete(e.target.value)}
                              placeholder="ID сообщения для удаления..."
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => deleteMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToDelete 
                              })}
                              disabled={!messageIdToDelete.trim() || deleteMessageMutation.isPending}
                              size="sm"
                              variant="destructive"
                            >
                              {deleteMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t my-4" />

                      {/* Создание ссылок-приглашений */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Ссылки-приглашения</h5>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Создать новую ссылку-приглашение</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Название ссылки (опционально)"
                              value={inviteLinkName}
                              onChange={(e) => setInviteLinkName(e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Лимит участников"
                              value={inviteLinkLimit}
                              onChange={(e) => setInviteLinkLimit(e.target.value)}
                            />
                          </div>
                          
                          <Button 
                            onClick={() => createInviteLinkMutation.mutate({ 
                              groupId: selectedGroup.groupId,
                              name: inviteLinkName || undefined,
                              memberLimit: inviteLinkLimit ? parseInt(inviteLinkLimit) : undefined,
                              createsJoinRequest: false
                            })}
                            disabled={createInviteLinkMutation.isPending}
                            size="sm"
                            className="w-full"
                          >
                            {createInviteLinkMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Создать ссылку-приглашение
                          </Button>
                        </div>
                      </div>

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
                            onClick={() => {
                              if (!userIdToBan || !selectedGroup?.groupId) {
                                toast({
                                  title: 'Ошибка',
                                  description: 'Укажите ID пользователя',
                                  variant: 'destructive'
                                });
                                return;
                              }
                              banMemberMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                userId: userIdToBan 
                              });
                            }}
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
                            onClick={() => {
                              if (!userIdToUnban || !selectedGroup?.groupId) {
                                toast({
                                  title: 'Ошибка',
                                  description: 'Укажите ID пользователя',
                                  variant: 'destructive'
                                });
                                return;
                              }
                              unbanMemberMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                userId: userIdToUnban 
                              });
                            }}
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

        {/* Telegram Auth Dialog */}
        <TelegramAuth
          open={showTelegramAuth}
          onOpenChange={setShowTelegramAuth}
          onSuccess={async () => {
            // После успешной авторизации попробуем получить участников
            if (selectedGroup) {
              setIsLoadingMembers(true);
              try {
                const response = await fetch(`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup.groupId}`);
                const data = await response.json();
                
                if (response.ok && data.success) {
                  setClientApiMembers(data.members || []);
                  toast({
                    title: data.message,
                    description: `Получено ${data.memberCount} участников через Client API`,
                  });
                } else {
                  toast({
                    title: data.message || "Ошибка",
                    description: data.explanation || "Не удалось получить данные",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                toast({
                  title: "Ошибка подключения",
                  description: "Не удалось подключиться к Client API",
                  variant: "destructive"
                });
              } finally {
                setIsLoadingMembers(false);
              }
            }
          }}
        />

        {/* Диалог управления разрешениями участника */}
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Управление разрешениями участника</DialogTitle>
              <DialogDescription>
                {selectedMember && (
                  <span>
                    Настройте разрешения для {selectedMember.firstName || selectedMember.user?.first_name || 'пользователя'} 
                    (@{selectedMember.username || selectedMember.user?.username || 'без username'})
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Основные разрешения */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Основные разрешения</h4>
                  {Object.entries({
                    can_send_messages: 'Отправка сообщений',
                    can_send_media_messages: 'Отправка медиа',
                    can_send_polls: 'Создание опросов',
                    can_send_other_messages: 'Стикеры и GIF',
                    can_add_web_page_previews: 'Предварительный просмотр ссылок'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={memberPermissions[key as keyof typeof memberPermissions]}
                        onCheckedChange={(checked) => 
                          setMemberPermissions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>

                {/* Административные разрешения */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Административные разрешения</h4>
                  {Object.entries({
                    can_change_info: 'Изменение информации группы',
                    can_invite_users: 'Приглашение пользователей',
                    can_pin_messages: 'Закрепление сообщений'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={memberPermissions[key as keyof typeof memberPermissions]}
                        onCheckedChange={(checked) => 
                          setMemberPermissions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedMember && selectedGroup) {
                      // Расширенная логика извлечения userId для разных форматов API
                      const userId = 
                        selectedMember.id?.toString() || 
                        selectedMember.user?.id?.toString() || 
                        selectedMember.userId?.toString() ||
                        selectedMember.from?.id?.toString() ||
                        selectedMember.from_user?.id?.toString() ||
                        (selectedMember as any).user_id?.toString();
                      
                      const groupId = selectedGroup.groupId;
                      
                      // Добавляем отладочную информацию
                      console.log('Debugging permission update:', {
                        selectedMember,
                        extractedUserId: userId,
                        groupId,
                        availableKeys: Object.keys(selectedMember)
                      });
                      
                      if (!userId || !groupId) {
                        toast({
                          title: 'Ошибка',
                          description: `Не удалось получить ID пользователя (${userId}) или группы (${groupId}). Проверьте консоль для отладки.`,
                          variant: 'destructive'
                        });
                        return;
                      }
                      
                      updatePermissionsMutation.mutate({
                        groupId,
                        userId,
                        permissions: memberPermissions
                      });
                    }
                  }}
                  disabled={updatePermissionsMutation.isPending}
                >
                  {updatePermissionsMutation.isPending ? 'Сохранение...' : 'Сохранить разрешения'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}