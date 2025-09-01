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

// Компонент аватарки группы с fallback
function GroupAvatar({ 
  avatarUrl, 
  groupName, 
  size = 40, 
  className = "" 
}: { 
  avatarUrl?: string | null; 
  groupName: string; 
  size?: number; 
  className?: string; 
}) {
  const [imageError, setImageError] = useState(false);
  
  // Получаем первые буквы названия группы для fallback
  const initials = groupName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Если есть аватарка и она не содержит <TOKEN>, показываем её
  const showImage = avatarUrl && !imageError && !avatarUrl.includes('<TOKEN>');
  
  if (showImage) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={avatarUrl}
          alt={`${groupName} avatar`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }
  
  // Fallback: показываем инициалы или иконку
  return (
    <div 
      className={`bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
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
        <Users 
          className="text-white" 
          size={size * 0.5} 
        />
      )}
    </div>
  );
}

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
  const [publicUsername, setPublicUsername] = useState('');
  const [adminRights, setAdminRights] = useState({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false,
    can_be_anonymous: false,
    can_manage_stories: false
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
  
  // Auto-update existing groups with missing info
  useEffect(() => {
    if (safeGroups.length > 0) {
      safeGroups.forEach(group => {
        // Обновляем группы где название = ID (значит не спарсилось)
        if (group.name === group.groupId && group.groupId) {
          console.log('Auto-updating group info for:', group.groupId);
          // Задержка для избежания слишком частых запросов
          setTimeout(() => {
            parseGroupInfoMutation.mutate(group.groupId!);
          }, Math.random() * 2000 + 1000); // Случайная задержка 1-3 секунды
        }
      });
    }
  }, [safeGroups.length]); // Запускаем при изменении количества групп

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
    mutationFn: async ({ groupId, data, showSuccessMessage = true }: { groupId: number, data: Partial<InsertBotGroup>, showSuccessMessage?: boolean }) => {
      return apiRequest('PUT', `/api/projects/${projectId}/groups/${groupId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'groups'] });
      if (variables.showSuccessMessage) {
        toast({ title: 'Настройки группы обновлены' });
      }
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
        // Get group info, admin status, and member count
        const [groupInfo, adminStatus, memberCountData] = await Promise.all([
          apiRequest('GET', `/api/projects/${projectId}/bot/group-info/${groupIdentifier}`),
          apiRequest('GET', `/api/projects/${projectId}/bot/admin-status/${groupIdentifier}`),
          apiRequest('GET', `/api/projects/${projectId}/bot/group-members-count/${groupIdentifier}`).catch(() => ({ count: null }))
        ]);
        return { 
          ...groupInfo, 
          isAdmin: adminStatus.isAdmin,
          memberCount: memberCountData?.count || null
        };
      } finally {
        setIsParsingGroup(false);
      }
    },
    onSuccess: (data) => {
      // Отладочная информация - что пришло от Telegram API
      console.log('TELEGRAM API RESPONSE:', JSON.stringify(data, null, 2));
      console.log('Available fields:', Object.keys(data));
      console.log('Description field:', data.description);
      console.log('Bio field:', data.bio);
      console.log('About field:', data.about);
      
      // Автоматически заполняем название группы
      if (data.title && !groupName) {
        setGroupName(data.title);
      }
      
      // Генерируем ссылку автоматически и определяем публичность
      let generatedUrl = '';
      let isGroupPublic = false;
      
      if (data.username) {
        // Группа публичная, есть username
        generatedUrl = `https://t.me/${data.username}`;
        isGroupPublic = true;
        setGroupUrl(generatedUrl);
        setIsPublicGroup(true);
        setPublicUsername(`@${data.username}`);
      } else if (data.invite_link) {
        // Группа приватная, есть только invite link
        generatedUrl = data.invite_link;
        isGroupPublic = false;
        setGroupUrl(generatedUrl);
        setIsPublicGroup(false);
        setPublicUsername('');
      } else {
        // Для числовых ID не создаем публичную ссылку
        setGroupUrl('');
        setIsPublicGroup(false);
        setPublicUsername('');
      }
      
      // Устанавливаем статус администратора
      setMakeAdmin(data.isAdmin || false);
      
      // Обновляем уже существующую группу в базе данных
      const existingGroup = safeGroups.find(g => g.groupId === data.id?.toString());
      if (existingGroup && data.title) {
        // Подготавливаем данные для обновления
        const updateData: any = {
          name: data.title,
          url: generatedUrl,
          isAdmin: data.isAdmin ? 1 : 0,
          isPublic: isGroupPublic ? 1 : 0,
          chatType: data.type || 'group'
        };
        
        // Добавляем описание если есть
        if (data.description) {
          updateData.description = data.description;
        }
        
        // Добавляем аватарку если есть
        if (data.avatarUrl) {
          updateData.avatarUrl = data.avatarUrl;
        }
        
        // Добавляем количество участников если есть
        if (data.memberCount !== null && data.memberCount !== undefined) {
          updateData.memberCount = data.memberCount;
        }
        
        updateGroupMutation.mutate({
          groupId: existingGroup.id,
          data: updateData
        });
      }
      
      // Создаем информативное уведомление
      const infoLines = [
        `${data.title || data.id}`,
        `${data.username ? '@' + data.username : 'ID: ' + data.id}`,
        `${data.isAdmin ? 'Админ' : 'Участник'}`,
      ];
      
      if (data.memberCount) {
        infoLines.push(`${data.memberCount} участников`);
      }
      
      if (data.description && data.description.length > 0) {
        const shortDescription = data.description.length > 50 
          ? data.description.substring(0, 50) + '...' 
          : data.description;
        infoLines.push(`Описание: ${shortDescription}`);
      }
      
      toast({ 
        title: 'Информация о группе обновлена', 
        description: infoLines.join(' • ')
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

  const setGroupUsernameMutation = useMutation({
    mutationFn: async ({ groupId, username }: { groupId: string | null; username: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/set-group-username`, {
        groupId,
        username
      });
    }
  });

  const setGroupPhotoMutation = useMutation({
    mutationFn: async ({ groupId, photoPath }: { groupId: string | null; photoPath: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/bot/set-group-photo`, {
        groupId,
        photoPath
      });
    },
    onSuccess: () => {
      toast({ title: 'Аватарка группы обновлена' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при обновлении аватарки', 
        description: error.error || 'Проверьте права бота в группе',
        variant: 'destructive' 
      });
    }
  });

  const updateBotAdminRightsMutation = useMutation({
    mutationFn: async ({ groupId, adminRights }: { groupId: string | null; adminRights: any }) => {
      // Сначала пробуем Bot API, но он не сработает для изменения собственных прав
      try {
        return await apiRequest('POST', `/api/projects/${projectId}/bot/update-admin-rights`, {
          groupId,
          adminRights
        });
      } catch (botApiError: any) {
        console.log('Bot API не может изменить собственные права, используем Client API:', botApiError);
        // Используем Client API который работает от имени пользователя
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/update-bot-admin-rights`, {
          groupId,
          adminRights
        });
      }
    },
    onSuccess: () => {
      toast({ title: 'Права администратора обновлены в Telegram' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при обновлении прав в Telegram', 
        description: error.error || 'Для изменения прав бота нужны права владельца группы или администратора с правом назначения администраторов',
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
      groupId: identifier,
      name: finalGroupName,
      url: finalGroupUrl || '',
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
        can_manage_video_chats: false,
        can_be_anonymous: false,
        can_manage_stories: false
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {safeGroups.map((group) => (
                <Card key={group.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <GroupAvatar 
                        avatarUrl={group.avatarUrl}
                        groupName={group.name}
                        size={56}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight mb-1">{group.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={group.isAdmin ? "default" : "secondary"} className="text-xs">
                            {group.isAdmin ? 'Администратор' : 'Участник'}
                          </Badge>
                          {group.chatType && (
                            <Badge variant="outline" className="text-xs">
                              {group.chatType === 'supergroup' ? 'Супергруппа' : 
                               group.chatType === 'channel' ? 'Канал' : 'Группа'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔄 Принудительное обновление информации о группе:', group.groupId);
                        parseGroupInfoMutation.mutate(group.groupId!);
                      }}
                      disabled={parseGroupInfoMutation.isPending}
                      title="Обновить информацию о группе"
                    >
                      {parseGroupInfoMutation.isPending ? '⏳' : '🔄'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {/* Описание группы */}
                    {group.description && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {group.description.length > 140 ? group.description.substring(0, 140) + '...' : group.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Основная информация */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {group.memberCount || 'N/A'} участников
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <a 
                              href={group.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all font-mono"
                              title={group.url}
                            >
                              {group.url.length > 35 ? group.url.substring(0, 35) + '...' : group.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-3">
                    {/* Основные действия */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-10"
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
                          
                          // Инициализируем публичный username если группа публичная
                          if (group.isPublic && group.url && !group.url.includes('+')) {
                            // Извлекаем username из публичной ссылки
                            if (group.url.includes('t.me/')) {
                              const username = group.url.replace('https://t.me/', '').replace('http://t.me/', '');
                              setPublicUsername(username.startsWith('@') ? username : `@${username}`);
                            } else if (group.url.startsWith('@')) {
                              setPublicUsername(group.url);
                            } else {
                              setPublicUsername('');
                            }
                          } else {
                            setPublicUsername('');
                          }
                          
                          // Получаем актуальные права администратора из Telegram API
                          if (group.isAdmin === 1 && group.groupId) {
                            fetch(`/api/projects/${projectId}/bot/group-admins/${group.groupId}`)
                              .then(res => res.json())
                              .then(data => {
                                // Создаем базовую структуру с полным набором прав
                                const baseRights = {
                                  can_manage_chat: false,
                                  can_change_info: false,
                                  can_delete_messages: false,
                                  can_invite_users: false,
                                  can_restrict_members: false,
                                  can_pin_messages: false,
                                  can_promote_members: false,
                                  can_manage_video_chats: false,
                                  can_be_anonymous: false,
                                  can_manage_stories: false
                                };
                                
                                // Объединяем с данными из API и базы данных
                                const finalRights = {
                                  ...baseRights,
                                  ...((group.adminRights as any) || {}),
                                  ...(data.botAdminRights || {})
                                };
                                
                                setAdminRights(finalRights);
                              })
                              .catch(() => {
                                // Fallback при ошибке - также используем базовую структуру
                                const baseRights = {
                                  can_manage_chat: false,
                                  can_change_info: false,
                                  can_delete_messages: false,
                                  can_invite_users: false,
                                  can_restrict_members: false,
                                  can_pin_messages: false,
                                  can_promote_members: false,
                                  can_manage_video_chats: false,
                                  can_be_anonymous: false,
                                  can_manage_stories: false
                                };
                                
                                const finalRights = {
                                  ...baseRights,
                                  ...((group.adminRights as any) || {})
                                };
                                
                                setAdminRights(finalRights);
                              });
                          } else {
                            // Если не админ, используем базовые права
                            setAdminRights({
                              can_manage_chat: false,
                              can_change_info: false,
                              can_delete_messages: false,
                              can_invite_users: false,
                              can_restrict_members: false,
                              can_pin_messages: false,
                              can_promote_members: false,
                              can_manage_video_chats: false,
                              can_be_anonymous: false,
                              can_manage_stories: false
                            });
                          }
                          
                          setShowGroupSettings(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Настройки
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10"
                        onClick={() => {
                          setSelectedGroupForMessage(group);
                          setShowSendMessage(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Сообщение
                      </Button>
                    </div>
                    
                    {/* Информационные действия */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 text-xs"
                        onClick={() => getGroupInfoMutation.mutate(group.groupId)}
                        disabled={getGroupInfoMutation.isPending}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Инфо
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 text-xs"
                        onClick={() => getMembersCountMutation.mutate(group.groupId)}
                        disabled={getMembersCountMutation.isPending}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Участники
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 text-xs"
                        onClick={() => getAdminStatusMutation.mutate(group.groupId)}
                        disabled={getAdminStatusMutation.isPending}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Статус
                      </Button>
                    </div>
                    
                    {/* Опасное действие */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 text-xs"
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
              <DialogTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <div className="flex items-center gap-2">
                  <GroupAvatar 
                    avatarUrl={selectedGroup?.avatarUrl}
                    groupName={selectedGroup?.name || 'Группа'}
                    size={32}
                  />
                  <span>Настройки группы: {selectedGroup?.name}</span>
                </div>
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
                        <Input
                          id="chat-type"
                          value={selectedGroup?.chatType === 'group' ? 'Группа' : selectedGroup?.chatType === 'supergroup' ? 'Супергруппа' : selectedGroup?.chatType === 'channel' ? 'Канал' : 'Неизвестно'}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Тип чата определяется Telegram автоматически и не может быть изменен
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-avatar">Аватарка группы</Label>
                        <div className="flex gap-2">
                          <Input
                            id="group-avatar"
                            placeholder="https://example.com/avatar.jpg"
                            value={groupAvatarUrl}
                            onChange={(e) => setGroupAvatarUrl(e.target.value)}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="avatar-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Загружаем файл на сервер
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  const response = await fetch(`/api/media/upload/${projectId}`, {
                                    method: 'POST',
                                    body: formData
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    // Устанавливаем путь к загруженному файлу
                                    const serverUrl = result.url || `/uploads/${result.filename}`;
                                    setGroupAvatarUrl(serverUrl);
                                    toast({
                                      title: "Изображение загружено",
                                      description: "Аватарка готова к установке"
                                    });
                                  } else {
                                    throw new Error('Ошибка загрузки файла');
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error);
                                  toast({
                                    title: "Ошибка загрузки",
                                    description: "Не удалось загрузить изображение",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              document.getElementById('avatar-upload')?.click();
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        {groupAvatarUrl && (
                          <div className="mt-2">
                            <div className="w-16 h-16 border rounded-lg overflow-hidden">
                              <img 
                                src={groupAvatarUrl} 
                                alt="Предпросмотр аватарки" 
                                className="w-full h-full object-cover"
                                onError={() => {
                                  toast({
                                    title: "Ошибка загрузки изображения",
                                    description: "Проверьте правильность URL",
                                    variant: "destructive"
                                  });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="public-group"
                          checked={isPublicGroup}
                          onCheckedChange={(checked) => {
                            setIsPublicGroup(checked);
                            // Если переключаем на приватную, очищаем публичный username
                            if (!checked) {
                              setPublicUsername('');
                            }
                          }}
                        />
                        <Label htmlFor="public-group">
                          Публичная группа
                        </Label>
                      </div>
                      
                      {isPublicGroup && (
                        <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                          <Label htmlFor="public-username" className="text-sm font-medium">
                            Публичная ссылка
                            <span className="text-xs text-muted-foreground ml-2">
                              (обязательно для публичных групп)
                            </span>
                          </Label>
                          <div className="space-y-2">
                            <Input
                              id="public-username"
                              placeholder="@username или t.me/username"
                              value={publicUsername}
                              onChange={(e) => setPublicUsername(e.target.value)}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Введите @username группы или полную ссылку t.me/username. 
                              Это заменит приватную ссылку-приглашение на публичную.
                            </p>
                          </div>
                        </div>
                      )}
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
                                  {key === 'can_be_anonymous' && 'Анонимность администратора'}
                                  {key === 'can_manage_stories' && 'Управление историями'}
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
                                                unbanMemberMutation.mutate({ 
                                                  groupId: selectedGroup.groupId, 
                                                  userId 
                                                });
                                              }}
                                            >
                                              <UserPlus className="h-4 w-4 mr-2" />
                                              {member.isBot ? 'Разблокировать бота' : 'Разблокировать'}
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
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                const userId = admin?.user?.id?.toString() || admin?.id?.toString();
                                                if (!userId) {
                                                  toast({
                                                    title: 'Ошибка',
                                                    description: 'Не удалось получить ID пользователя',
                                                    variant: 'destructive'
                                                  });
                                                  return;
                                                }
                                                unbanMemberMutation.mutate({ 
                                                  groupId: selectedGroup.groupId, 
                                                  userId 
                                                });
                                              }}
                                            >
                                              <UserPlus className="h-4 w-4 mr-2" />
                                              {admin.user?.is_bot || admin.is_bot ? 'Разблокировать бота' : 'Разблокировать'}
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
                    // Валидация для публичных групп
                    if (isPublicGroup) {
                      if (!publicUsername.trim()) {
                        toast({
                          title: "Ошибка валидации",
                          description: "Для публичной группы необходимо указать публичную ссылку (@username)",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Проверяем формат username
                      const cleanUsername = publicUsername.trim();
                      if (!cleanUsername.startsWith('@') && !cleanUsername.includes('t.me/')) {
                        toast({
                          title: "Неверный формат",
                          description: "Публичная ссылка должна быть в формате @username или t.me/username",
                          variant: "destructive"
                        });
                        return;
                      }
                    }
                    
                    // Определяем итоговую ссылку на основе типа группы
                    let finalUrl = groupUrl || selectedGroup.url;
                    if (isPublicGroup && publicUsername.trim()) {
                      const cleanUsername = publicUsername.trim();
                      if (cleanUsername.startsWith('@')) {
                        finalUrl = `https://t.me/${cleanUsername.substring(1)}`;
                      } else if (cleanUsername.includes('t.me/')) {
                        finalUrl = cleanUsername.startsWith('http') ? cleanUsername : `https://${cleanUsername}`;
                      }
                    } else if (!isPublicGroup && selectedGroup.inviteLink) {
                      // Для приватных групп используем приватную ссылку-приглашение
                      finalUrl = selectedGroup.inviteLink;
                    }
                    
                    // Функция для сохранения настроек в базе данных
                    const saveToDatabase = (showSuccess = true) => {
                      // Используем текущий тип чата из группы (не изменяем его)
                      const finalChatType = selectedGroup.chatType || 'group';

                      // Проверяем, изменились ли название, описание и аватарка группы
                      const nameChanged = (groupName || selectedGroup.name) !== selectedGroup.name;
                      const descriptionChanged = groupDescription !== selectedGroup.description;
                      const avatarChanged = groupAvatarUrl !== selectedGroup.avatarUrl;
                      
                      if ((nameChanged || descriptionChanged || avatarChanged) && (groupName?.trim() || groupDescription.trim() || groupAvatarUrl?.trim())) {
                        // Функция для сохранения в базу данных после успешных обновлений в Telegram
                        const saveToDBAfterTelegram = () => {
                          updateGroupMutation.mutate({
                            groupId: selectedGroup.id,
                            data: {
                              name: groupName || selectedGroup.name,
                              url: finalUrl,
                              groupId: selectedGroup.groupId,
                              description: groupDescription,
                              avatarUrl: groupAvatarUrl,
                              language: groupLanguage as 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko',
                              timezone: groupTimezone,
                              tags: groupTags,
                              notes: groupNotes,
                              isAdmin: makeAdmin ? 1 : 0,
                              isPublic: isPublicGroup ? 1 : 0,
                              chatType: finalChatType as 'group' | 'supergroup' | 'channel',
                              adminRights
                            },
                            showSuccessMessage: showSuccess
                          });
                        };

                        // Функция для последовательного обновления в Telegram
                        const updateTelegramSequentially = () => {
                          // Сначала обновляем название
                          if (nameChanged && groupName?.trim()) {
                            setGroupTitleMutation.mutate({
                              groupId: selectedGroup.groupId,
                              title: groupName
                            }, {
                              onSuccess: () => updateDescriptionOrAvatar(),
                              onError: updateDescriptionOrAvatar
                            });
                          } else {
                            updateDescriptionOrAvatar();
                          }
                        };

                        // Функция для обновления описания или аватарки
                        const updateDescriptionOrAvatar = () => {
                          if (descriptionChanged && groupDescription.trim()) {
                            setGroupDescriptionMutation.mutate({
                              groupId: selectedGroup.groupId,
                              description: groupDescription
                            }, {
                              onSuccess: () => updateAvatarIfNeeded(),
                              onError: updateAvatarIfNeeded
                            });
                          } else {
                            updateAvatarIfNeeded();
                          }
                        };

                        // Функция для обновления аватарки если нужно
                        const updateAvatarIfNeeded = () => {
                          if (avatarChanged && groupAvatarUrl?.trim() && groupAvatarUrl.startsWith('/uploads/')) {
                            // Преобразуем относительный путь в абсолютный путь файла
                            const photoPath = groupAvatarUrl.replace('/uploads/', 'uploads/');
                            setGroupPhotoMutation.mutate({
                              groupId: selectedGroup.groupId,
                              photoPath: photoPath
                            }, {
                              onSuccess: () => updateAdminRightsIfNeeded(),
                              onError: () => updateAdminRightsIfNeeded()
                            });
                          } else {
                            updateAdminRightsIfNeeded();
                          }
                        };

                        // Функция для обновления прав администратора в Telegram если они изменились
                        const updateAdminRightsIfNeeded = () => {
                          // Проверяем, изменились ли права администратора
                          const currentRights = selectedGroup.adminRights || {};
                          const rightsChanged = Object.keys(adminRights).some(key => 
                            adminRights[key as keyof typeof adminRights] !== currentRights[key as keyof typeof currentRights]
                          );
                          
                          if (rightsChanged && selectedGroup.isAdmin === 1) {
                            updateBotAdminRightsMutation.mutate({
                              groupId: selectedGroup.groupId,
                              adminRights: adminRights
                            }, {
                              onSuccess: saveToDBAfterTelegram,
                              onError: saveToDBAfterTelegram // Сохраняем в БД даже если обновление в Telegram не удалось
                            });
                          } else {
                            saveToDBAfterTelegram();
                          }
                        };

                        // Запускаем последовательное обновление
                        updateTelegramSequentially();
                      } else {
                        // Если ничего не изменилось, просто сохраняем в базе данных
                        updateGroupMutation.mutate({
                          groupId: selectedGroup.id,
                          data: {
                            name: groupName || selectedGroup.name,
                            url: finalUrl,
                            groupId: selectedGroup.groupId,
                            description: groupDescription,
                            avatarUrl: groupAvatarUrl,
                            language: groupLanguage as 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko',
                            timezone: groupTimezone,
                            tags: groupTags,
                            notes: groupNotes,
                            isAdmin: makeAdmin ? 1 : 0,
                            isPublic: isPublicGroup ? 1 : 0,
                            chatType: finalChatType as 'group' | 'supergroup' | 'channel',
                            adminRights
                          },
                          showSuccessMessage: showSuccess
                        });
                      }
                    };

                    // Если изменяется публичность группы, сначала изменяем в Telegram
                    const wasPublic = Boolean(selectedGroup.isPublic);
                    const willBePublic = isPublicGroup;
                    
                    if (wasPublic !== willBePublic) {
                      // Изменяем username в Telegram перед сохранением в базе
                      let usernameToSet = '';
                      if (willBePublic && publicUsername.trim()) {
                        const cleanUsername = publicUsername.trim().replace('@', '').replace('t.me/', '').replace('https://', '').replace('http://', '');
                        usernameToSet = cleanUsername;
                      }
                      
                      // Сначала пытаемся изменить в Telegram, потом сохраняем в базе
                      setGroupUsernameMutation.mutate({
                        groupId: selectedGroup.groupId,
                        username: usernameToSet
                      }, {
                        onSuccess: () => {
                          // Только если изменение в Telegram удалось - сохраняем в базе с успешным сообщением
                          saveToDatabase(true);
                          toast({
                            title: "Настройки группы обновлены",
                            description: "Публичность группы успешно изменена",
                          });
                        },
                        onError: (error: any) => {
                          // Показываем ошибку и НЕ сохраняем в базе
                          toast({
                            title: "Не удалось изменить публичность группы",
                            description: error.requiresClientApi 
                              ? "Требуется авторизация через Telegram Client API для изменения публичных настроек группы"
                              : error.error || error.message || "Проверьте права бота в группе",
                            variant: "destructive"
                          });
                        }
                      });
                    } else {
                      // Если публичность не изменяется - сразу сохраняем с обычным сообщением
                      saveToDatabase(true);
                    }
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