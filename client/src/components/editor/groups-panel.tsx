import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, UserPlus, X, Settings, Upload, Shield, UserCheck, MessageSquare, Globe, Clock, Tag, Search, Filter, Send, BarChart3, TrendingUp, Edit, Pin, PinOff, Trash, Crown, Bot, Ban, Volume2, VolumeX, UserMinus, MoreHorizontal, Hash, Link2, Sparkles, Check } from 'lucide-react';
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
  
  // Состояние для поиска пользователя
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedGroupForPromotion, setSelectedGroupForPromotion] = useState<BotGroup | null>(null);
  const [userToFind, setUserToFind] = useState(''); // Для универсального поиска участников
  const [showAdminSearch, setShowAdminSearch] = useState(false); // Для поиска с назначением админом
  
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
    // Основные разрешения участника
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    
    // Административные разрешения
    can_change_info: false,
    can_delete_messages: false,
    can_restrict_members: false,
    can_invite_users: false,
    can_pin_messages: false,
    can_manage_video_chats: false,
    can_be_anonymous: false,
    can_promote_members: false
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

  // Get saved members from database
  const [savedMembers, setSavedMembers] = React.useState<any[]>([]);
  
  const getSavedMembersMutation = useMutation({
    mutationFn: async (groupId: string | null) => {
      return apiRequest('GET', `/api/projects/${projectId}/groups/${groupId}/saved-members`);
    },
    onSuccess: (data) => {
      setSavedMembers(data.members || []);
      console.log(`✅ Загружено ${data.members?.length || 0} сохраненных участников из базы данных`);
    },
    onError: (error: any) => {
      console.error('Ошибка загрузки сохраненных участников:', error);
      // Не показываем toast для этой ошибки, так как это фоновая операция
    }
  });

  // Автоматически загружаем сохраненных участников когда выбрана группа
  useEffect(() => {
    if (selectedGroup?.groupId) {
      getSavedMembersMutation.mutate(selectedGroup.groupId);
    }
  }, [selectedGroup?.groupId]);

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

  // Load member permissions when dialog opens
  const loadMemberPermissionsMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      console.log('🔍 Loading member permissions for:', { groupId, userId });
      return await apiRequest('GET', `/api/projects/${projectId}/bot/check-member/${groupId}/${userId}`);
    },
    onSuccess: (data: any) => {
      console.log('✅ loadMemberPermissionsMutation success:', data);
      const member = data?.member;
      if (member) {
        // Устанавливаем текущие разрешения участника
        setMemberPermissions({
          // Основные разрешения участника (по умолчанию true для обычных участников)
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          
          // Административные разрешения (берем из текущих прав)
          can_change_info: member.can_change_info || false,
          can_delete_messages: member.can_delete_messages || false,
          can_restrict_members: member.can_restrict_members || false,
          can_invite_users: member.can_invite_users || false,
          can_pin_messages: member.can_pin_messages || false,
          can_manage_video_chats: member.can_manage_video_chats || false,
          can_be_anonymous: member.is_anonymous || member.can_be_anonymous || false,
          can_promote_members: member.can_promote_members || false
        });
        
        console.log('Loaded member permissions from API:', {
          member,
          mappedPermissions: {
            can_change_info: member.can_change_info,
            can_delete_messages: member.can_delete_messages,
            can_restrict_members: member.can_restrict_members,
            can_invite_users: member.can_invite_users,
            can_pin_messages: member.can_pin_messages,
            can_manage_video_chats: member.can_manage_video_chats,
            can_be_anonymous: member.is_anonymous || member.can_be_anonymous,
            can_promote_members: member.can_promote_members
          }
        });
      }
    },
    onError: (error: any) => {
      console.log('Failed to load member permissions:', error);
      // Оставляем разрешения по умолчанию
    }
  });

  // Update member permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ groupId, userId, permissions }: { groupId: string | null; userId: string; permissions: any }) => {
      // Проверяем, есть ли административные права
      const hasAdminRights = permissions.can_delete_messages || permissions.can_restrict_members || 
                            permissions.can_promote_members || permissions.can_manage_video_chats ||
                            permissions.can_be_anonymous || permissions.can_change_info || 
                            permissions.can_pin_messages || permissions.can_invite_users;
      
      console.log('💾 Сохраняем разрешения:', {
        selectedMember: selectedMember,
        userId: userId,
        groupId: groupId,
        currentPermissions: memberPermissions,
        newPermissions: permissions,
        hasAdminRights: hasAdminRights
      });
      
      if (hasAdminRights) {
        // Если есть административные права, используем promote-member
        try {
          return await apiRequest('POST', `/api/projects/${projectId}/bot/promote-member`, {
            groupId,
            userId,
            can_change_info: permissions.can_change_info,
            can_delete_messages: permissions.can_delete_messages,
            can_invite_users: permissions.can_invite_users,
            can_restrict_members: permissions.can_restrict_members,
            can_pin_messages: permissions.can_pin_messages,
            can_promote_members: permissions.can_promote_members,
            can_manage_video_chats: permissions.can_manage_video_chats,
            can_be_anonymous: permissions.can_be_anonymous,
            can_manage_topics: false
          });
        } catch (botApiError: any) {
          console.log('Bot API failed for promotion, trying Client API:', botApiError);
          // Если Bot API не работает, пробуем Client API
          return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/promote-member`, {
            groupId,
            userId,
            adminRights: {
              can_change_info: permissions.can_change_info,
              can_delete_messages: permissions.can_delete_messages,
              can_invite_users: permissions.can_invite_users,
              can_restrict_members: permissions.can_restrict_members,
              can_pin_messages: permissions.can_pin_messages,
              can_promote_members: permissions.can_promote_members,
              can_manage_video_chats: permissions.can_manage_video_chats,
              can_be_anonymous: permissions.can_be_anonymous,
              can_manage_topics: false
            }
          });
        }
      } else if (selectedMember?.status === 'administrator' || selectedMember?.friendlyStatus === 'Администратор') {
        // Если пользователь является администратором, но у него нет административных прав, демотируем его
        try {
          return await apiRequest('POST', `/api/projects/${projectId}/bot/demote-member`, {
            groupId,
            userId
          });
        } catch (botApiError: any) {
          console.log('Bot API failed for demotion, trying Client API:', botApiError);
          // Если Bot API не работает, пробуем Client API
          return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/demote-member`, {
            groupId,
            userId
          });
        }
      } else {
        // Если только обычные права, используем restrict-member
        try {
          return await apiRequest('POST', `/api/projects/${projectId}/bot/restrict-member`, {
            groupId,
            userId,
            permissions: {
              can_send_messages: permissions.can_send_messages,
              can_send_media_messages: permissions.can_send_media_messages,
              can_send_polls: permissions.can_send_polls,
              can_send_other_messages: permissions.can_send_other_messages,
              can_add_web_page_previews: permissions.can_add_web_page_previews
            }
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

  // Отслеживаем смену группы для сброса данных
  const [lastSelectedGroupId, setLastSelectedGroupId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (selectedGroup) {
      // Если сменилась группа, сбрасываем все данные
      if (lastSelectedGroupId !== selectedGroup.groupId) {
        setAdministrators([]);
        setClientApiMembers([]);
        setLastSelectedGroupId(selectedGroup.groupId);
      }
    }
  }, [selectedGroup]);

  // Автоматически загружаем администраторов при выборе группы
  React.useEffect(() => {
    if (selectedGroup && showGroupSettings) {
      // Загружаем данные только если список пуст
      if (administrators.length === 0) {
        getAdminsMutation.mutate(selectedGroup.groupId);
      }
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

  // Promote member mutation - используем только Bot API
  const promoteMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, adminRights }: { groupId: string | null; userId: string; adminRights: any }) => {
      return await apiRequest('POST', `/api/projects/${projectId}/bot/promote-member`, {
        groupId,
        userId,
        ...adminRights  // Передаем права напрямую, без вложенности в permissions
      });
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Участник назначен администратором',
        description: data.message || 'Операция выполнена успешно'
      });
      // Обновляем список участников
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup?.groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/group-admins/${selectedGroup?.groupId}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при назначении администратора', 
        description: error.error || 'Не удалось назначить администратора',
        variant: 'destructive' 
      });
    }
  });

  // Demote member mutation - сначала Bot API, потом Client API
  const demoteMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string | null; userId: string }) => {
      try {
        // Сначала пробуем Bot API
        return await apiRequest('POST', `/api/projects/${projectId}/bot/demote-member`, {
          groupId,
          userId
        });
      } catch (botApiError: any) {
        console.log('Bot API failed, trying Client API:', botApiError);
        // Если Bot API не работает, пробуем Client API
        return await apiRequest('POST', `/api/projects/${projectId}/telegram-client/demote-member`, {
          groupId,
          userId
        });
      }
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Администраторские права сняты',
        description: data.message || 'Операция выполнена успешно'
      });
      // Обновляем список участников
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/telegram-client/group-members/${selectedGroup?.groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/group-admins/${selectedGroup?.groupId}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Ошибка при снятии прав администратора', 
        description: error.error || 'Не удалось снять права администратора',
        variant: 'destructive' 
      });
    }
  });

  // Check member status mutation
  const checkMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      return await apiRequest('GET', `/api/projects/${projectId}/bot/check-member/${groupId}/${userId}`);
    },
    onSuccess: (data: any) => {
      console.log('checkMemberMutation success:', data);
      const member = data?.member;
      if (member) {
        // Показываем уведомление
        toast({ 
          title: '✅ Статус участника найден', 
          description: `${member.user?.first_name || 'Пользователь'} (@${member.user?.username || 'без username'}) - ${member.friendlyStatus}`,
          duration: 5000
        });

        // Добавляем участника в список, если его там еще нет
        setAdministrators(prevAdmins => {
          const existingMember = prevAdmins.find(admin => admin.user?.id === member.user?.id);
          if (!existingMember) {
            // Добавляем найденного участника с пометкой
            const newMember = {
              ...member,
              foundViaSearch: true, // Пометка что найден через поиск
              can_be_edited: false,
              can_manage_chat: false,
              can_change_info: false,
              can_delete_messages: false,
              can_invite_users: false,
              can_restrict_members: false,
              can_pin_messages: false,
              can_promote_members: false,
              can_manage_video_chats: false,
              can_manage_voice_chats: false,
              can_post_stories: false,
              can_edit_stories: false,
              can_delete_stories: false,
              is_anonymous: false
            };
            return [...prevAdmins, newMember];
          }
          return prevAdmins;
        });

        // Очищаем поле поиска после успешного нахождения
        setUserToFind('');
        
        // Обновляем список сохраненных участников после добавления нового
        if (selectedGroup?.groupId) {
          getSavedMembersMutation.mutate(selectedGroup.groupId);
        }
      } else {
        toast({ 
          title: '❌ Участник не найден', 
          description: 'Пользователь не является участником этой группы',
          variant: 'destructive',
          duration: 5000
        });
      }
    },
    onError: (error: any) => {
      console.error('checkMemberMutation error:', error);
      toast({ 
        title: 'Ошибка проверки статуса', 
        description: error.message || 'Не удалось проверить статус участника',
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  // Simple search user mutation - только для поиска и добавления в список  
  const simpleSearchUserMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest('GET', `/api/projects/${projectId}/bot/search-user/${encodeURIComponent(query)}`);
    },
    onSuccess: (data: any) => {
      if (data.user && selectedGroup && selectedGroup.groupId) {
        // Используем checkMemberMutation для добавления найденного пользователя в список
        checkMemberMutation.mutate({
          groupId: selectedGroup.groupId,
          userId: data.userId
        });
      }
      setShowUserSearch(false);
      setUserSearchQuery('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Пользователь не найден', 
        description: error.error || 'Не удалось найти пользователя по указанному username или ID',
        variant: 'destructive' 
      });
    }
  });

  // Search user mutation (старая версия для назначения админом)
  const searchUserMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest('GET', `/api/projects/${projectId}/bot/search-user/${encodeURIComponent(query)}`);
    },
    onSuccess: (data: any) => {
      if (data.user && selectedGroupForPromotion) {
        // Показываем диалог с подтверждением назначения
        const user = data.user;
        const confirmMessage = `Назначить ${user.first_name || user.username || 'пользователя'} (@${user.username || 'без username'}) администратором группы "${selectedGroupForPromotion.name}"?`;
        
        if (confirm(confirmMessage)) {
          promoteMemberMutation.mutate({
            groupId: selectedGroupForPromotion.groupId,
            userId: data.userId,
            adminRights: {
              can_manage_chat: true,
              can_change_info: true,
              can_delete_messages: true,
              can_invite_users: true,
              can_restrict_members: true,
              can_pin_messages: true,
              can_promote_members: true,
              can_manage_video_chats: true
            }
          });
        }
      }
      setShowUserSearch(false);
      setUserSearchQuery('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Пользователь не найден', 
        description: error.error || 'Не удалось найти пользователя по указанному username или ID',
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
    <div className="h-full w-full bg-background">
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6 max-w-7xl mx-auto">
        {/* Modern Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10 dark:from-purple-500/20 dark:via-blue-500/10 dark:to-cyan-500/20 p-4 sm:p-5 lg:p-6 mb-6">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
                  Управление группами
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5 truncate">
                  {projectName}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Загружаем группы...</p>
          </div>
        ) : safeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">
              Нет подключенных групп
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 text-center max-w-sm">
              Добавьте первую группу для управления участниками и контентом
            </p>
            <Button 
              onClick={() => setShowAddGroup(true)} 
              size="lg"
              className="gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Подключить первую группу
            </Button>
          </div>
        ) : (
          <div>
            {/* Groups List Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 bg-muted/20 rounded-xl p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Подключенные группы</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">{safeGroups.length}</span> {safeGroups.length === 1 ? 'группа' : 'групп'}
                </p>
              </div>
              <Button 
                onClick={() => setShowAddGroup(true)}
                size="sm"
                className="gap-2 sm:gap-2 w-full sm:w-auto flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Добавить</span>
                <span className="sm:hidden">Добавить группу</span>
              </Button>
            </div>

            {/* Groups Grid - Ultra Modern Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {safeGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="group/card relative flex flex-col bg-gradient-to-b from-card to-card/95 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-300"
                >
                  {/* Animated Gradient Border Top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 group-hover/card:opacity-100 transition-opacity" />
                  
                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    {/* Header Section */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Avatar with Status Ring */}
                      <div className="relative flex-shrink-0">
                        <GroupAvatar 
                          avatarUrl={group.avatarUrl}
                          groupName={group.name}
                          size={52}
                          className="ring-[3px] ring-background shadow-md"
                        />
                        {/* Online/Admin indicator */}
                        {group.isAdmin === 1 && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-background">
                            <Shield className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Title & Badges */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 
                            className="font-semibold text-[15px] sm:text-base text-foreground leading-snug line-clamp-2 tracking-tight" 
                            data-testid={`text-group-name-${group.id}`}
                          >
                            {group.name}
                          </h3>
                          
                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 -mt-0.5 -mr-1 rounded-full opacity-0 group-hover/card:opacity-100 focus:opacity-100 transition-all duration-200"
                                data-testid={`button-menu-${group.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg">
                              <DropdownMenuItem 
                                onClick={() => getGroupInfoMutation.mutate(group.groupId)}
                                disabled={getGroupInfoMutation.isPending}
                                className="gap-2 py-2.5"
                                data-testid={`button-info-${group.id}`}
                              >
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                                <span>Информация о группе</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => getMembersCountMutation.mutate(group.groupId)}
                                disabled={getMembersCountMutation.isPending}
                                className="gap-2 py-2.5"
                                data-testid={`button-members-${group.id}`}
                              >
                                <Users className="w-4 h-4 text-green-500" />
                                <span>Обновить участников</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => getAdminStatusMutation.mutate(group.groupId)}
                                disabled={getAdminStatusMutation.isPending}
                                className="gap-2 py-2.5"
                                data-testid={`button-status-${group.id}`}
                              >
                                <Shield className="w-4 h-4 text-purple-500" />
                                <span>Проверить права бота</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteGroupMutation.mutate(group.id)}
                                disabled={deleteGroupMutation.isPending}
                                className="gap-2 py-2.5 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                data-testid={`button-delete-${group.id}`}
                              >
                                <X className="w-4 h-4" />
                                <span>Удалить группу</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Status Badges - Improved Responsive Layout */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge 
                            variant={group.isAdmin ? "default" : "secondary"}
                            className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 gap-1.5 whitespace-nowrap"
                            data-testid={`badge-admin-${group.id}`}
                          >
                            {group.isAdmin ? (
                              <>
                                <Crown className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="hidden xs:inline">Администратор</span>
                                <span className="xs:hidden">Админ</span>
                              </>
                            ) : (
                              <>
                                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Участник</span>
                              </>
                            )}
                          </Badge>
                          {group.chatType && (
                            <Badge variant="outline" className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 gap-1.5 border-border/60 whitespace-nowrap">
                              {group.chatType === 'supergroup' ? (
                                <>
                                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="hidden sm:inline">Супергруппа</span>
                                  <span className="sm:hidden">Супер</span>
                                </>
                              ) : group.chatType === 'channel' ? (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Канал</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Группа</span>
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description - Expandable feel */}
                    {group.description && (
                      <p className="text-[13px] sm:text-sm text-muted-foreground line-clamp-2 mt-3 leading-relaxed">
                        {group.description}
                      </p>
                    )}

                    {/* Stats Grid - Modern Glass Style with Better Responsiveness */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-3.5 mt-5 mb-4">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800/40 p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-blue-600/80 dark:text-blue-400/80 font-semibold uppercase tracking-wide">Участники</p>
                            <p className="text-base sm:text-lg font-bold text-foreground truncate mt-1">
                              {group.memberCount ? group.memberCount.toLocaleString('ru-RU') : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-25 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-100 dark:border-amber-800/40 p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-400/80 font-semibold uppercase tracking-wide">Добавлена</p>
                            <p className="text-base sm:text-lg font-bold text-foreground truncate mt-1">
                              {group.createdAt ? new Date(group.createdAt).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spacer to push buttons to bottom */}
                    <div className="flex-1" />

                    {/* Action Buttons - Premium Feel with Better Touch Targets */}
                    <div className="flex gap-2.5 sm:gap-3 pt-2 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-4 sm:pb-5 -mb-4 sm:-mb-5 mt-4 bg-gradient-to-t from-card/80 to-transparent">
                      <Button 
                        variant="default" 
                        className="flex-1 h-12 sm:h-13 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
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
                          if (group.isPublic && group.url && !group.url.includes('+')) {
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
                          if (group.isAdmin === 1 && group.groupId) {
                            fetch(`/api/projects/${projectId}/bot/group-admins/${group.groupId}`)
                              .then(res => res.json())
                              .then(data => {
                                const baseRights = {can_manage_chat: false,can_change_info: false,can_delete_messages: false,can_invite_users: false,can_restrict_members: false,can_pin_messages: false,can_promote_members: false,can_manage_video_chats: false,can_be_anonymous: false,can_manage_stories: false};
                                const finalRights = {...baseRights,...((group.adminRights as any) || {}),...(data.botAdminRights || {})};
                                setAdminRights(finalRights);
                              })
                              .catch(() => {
                                const baseRights = {can_manage_chat: false,can_change_info: false,can_delete_messages: false,can_invite_users: false,can_restrict_members: false,can_pin_messages: false,can_promote_members: false,can_manage_video_chats: false,can_be_anonymous: false,can_manage_stories: false};
                                const finalRights = {...baseRights,...((group.adminRights as any) || {})};
                                setAdminRights(finalRights);
                              });
                          } else {
                            setAdminRights({can_manage_chat: false,can_change_info: false,can_delete_messages: false,can_invite_users: false,can_restrict_members: false,can_pin_messages: false,can_promote_members: false,can_manage_video_chats: false,can_be_anonymous: false,can_manage_stories: false});
                          }
                          setShowGroupSettings(true);
                        }}
                        data-testid={`button-settings-${group.id}`}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Настройки
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 sm:h-13 text-sm sm:text-base font-semibold hover:bg-muted/60 transition-all"
                        onClick={() => {
                          setSelectedGroupForMessage(group);
                          setShowSendMessage(true);
                        }}
                        data-testid={`button-message-${group.id}`}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Написать
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Модальное окно подключения группы */}
        <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
          <DialogContent className="sm:max-w-lg">
            {/* Modern Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/10 dark:to-pink-500/20 p-5 mb-6 -mx-6 -mt-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Подключить группу</h2>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                  Добавьте вашу Telegram группу для управления ботом
                </p>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Input Field */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="group-id" className="text-base font-semibold">ID группы или ссылка</Label>
                  {isParsingGroup && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                      Загрузка...
                    </div>
                  )}
                </div>
                
                <div className="relative group">
                  <Input
                    id="group-id"
                    placeholder="@groupname, -1002726444678 или https://t.me/group"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    disabled={isParsingGroup}
                    className="text-base pl-4 pr-11"
                  />
                  {isParsingGroup && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
                
                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-foreground">@username</p>
                      <p className="text-muted-foreground">@mygroup</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
                    <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-foreground">Chat ID</p>
                      <p className="text-muted-foreground">-1002726444</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
                    <Link2 className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-foreground">Ссылка</p>
                      <p className="text-muted-foreground">t.me/group</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddGroup(false)}
                className="flex-1 h-10"
              >
                Отмена
              </Button>
              <Button 
                onClick={handleAddGroup}
                disabled={!groupId.trim() || isParsingGroup}
                className="flex-1 h-10 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Подключить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно настроек группы */}
        <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
          <DialogContent className="w-full max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-xl">
            {/* Modern Header - Premium Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500/8 via-emerald-500/5 to-transparent dark:from-green-500/15 dark:via-emerald-500/8 dark:to-transparent px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0 border-b border-border/50">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/15 to-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute -bottom-10 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
              
              <div className="relative flex items-center justify-between gap-4 min-h-12">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                    <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <GroupAvatar 
                        avatarUrl={selectedGroup?.avatarUrl}
                        groupName={selectedGroup?.name || 'Группа'}
                        size={24}
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-sm sm:text-base text-foreground truncate leading-tight">{selectedGroup?.name}</h2>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Параметры и управление</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedGroup && (
              <Tabs defaultValue="general" className="w-full flex flex-col flex-1 min-h-0">
                {/* Modern Minimalist Tabs */}
                <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border/40">
                  <TabsList className="flex h-auto p-0 gap-1 sm:gap-2 bg-transparent w-full overflow-x-auto">
                    <TabsTrigger 
                      value="general" 
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex-shrink-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-primary/20"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span>Общие</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin" 
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex-shrink-0 data-[state=active]:bg-purple/10 data-[state=active]:text-purple data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-purple/20"
                    >
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Права</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="members" 
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex-shrink-0 data-[state=active]:bg-blue/10 data-[state=active]:text-blue data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-blue/20"
                    >
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>Участники</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex-shrink-0 data-[state=active]:bg-green/10 data-[state=active]:text-green data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent data-[state=active]:border-green/20"
                    >
                      <BarChart3 className="h-4 w-4 flex-shrink-0" />
                      <span>Статистика</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 lg:px-7 py-5 sm:py-6">
                  <TabsContent value="general" className="space-y-6 mt-0">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Edit className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">Основная информация</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Данные о группе</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-muted/20 rounded-xl p-4 sm:p-5 border border-border/30">
                        <div className="space-y-2.5">
                          <Label htmlFor="edit-group-name" className="text-xs sm:text-sm font-semibold text-foreground">Название</Label>
                          <Input
                            id="edit-group-name"
                            placeholder="Введите название"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="h-10 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2.5">
                          <Label htmlFor="edit-group-url" className="text-xs sm:text-sm font-semibold text-foreground">Ссылка на группу</Label>
                          <Input
                            id="edit-group-url"
                            placeholder="https://t.me/group"
                            value={groupUrl}
                            onChange={(e) => setGroupUrl(e.target.value)}
                            className="h-10 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-lg p-3.5 sm:p-4 border border-blue-200/40 dark:border-blue-800/30">
                        <Label htmlFor="edit-group-chat-id" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                          Chat ID
                          <Badge variant="secondary" className="text-[9px] font-semibold">Приватные</Badge>
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
                          className="h-10 font-mono text-xs sm:text-sm"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5 leading-relaxed">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          Отправьте сообщение в группу, переслайте в @userinfobot
                        </p>
                      </div>
                      
                      <div className="space-y-2.5">
                        <Label htmlFor="edit-group-desc" className="text-xs sm:text-sm font-semibold text-foreground">Описание</Label>
                        <Textarea
                          id="edit-group-desc"
                          placeholder="Описание группы..."
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          rows={3}
                          className="resize-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Type & Avatar Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">Оформление</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Тип и внешний вид</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-muted/20 rounded-xl p-4 sm:p-5 border border-border/30">
                        <div className="space-y-2.5">
                          <Label htmlFor="chat-type" className="text-xs sm:text-sm font-semibold text-foreground">Тип чата</Label>
                          <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-background border border-border/50 hover:border-border/80 transition-colors">
                            {selectedGroup?.chatType === 'supergroup' ? (
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                            ) : selectedGroup?.chatType === 'channel' ? (
                              <Volume2 className="h-4 w-4 text-purple-500" />
                            ) : (
                              <Users className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs sm:text-sm font-medium flex-1">
                              {selectedGroup?.chatType === 'group' ? 'Группа' : selectedGroup?.chatType === 'supergroup' ? 'Супергруппа' : selectedGroup?.chatType === 'channel' ? 'Канал' : 'Неизвестно'}
                            </span>
                            <Badge variant="secondary" className="text-[8px] font-bold flex-shrink-0">Авто</Badge>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor="group-avatar" className="text-xs sm:text-sm font-semibold text-foreground">Аватарка</Label>
                          <div className="flex gap-2">
                            <Input
                              id="group-avatar"
                              placeholder="https://example.com/avatar.jpg"
                              value={groupAvatarUrl}
                              onChange={(e) => setGroupAvatarUrl(e.target.value)}
                              className="h-10 text-xs sm:text-sm"
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
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    const response = await fetch(`/api/media/upload/${projectId}`, {
                                      method: 'POST',
                                      body: formData
                                    });
                                    
                                    if (response.ok) {
                                      const result = await response.json();
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
                              className="h-10 w-10 flex-shrink-0"
                              onClick={() => {
                                document.getElementById('avatar-upload')?.click();
                              }}
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {groupAvatarUrl && (
                            <div className="mt-2 flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border/50 shadow-sm">
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
                              <span className="text-xs text-muted-foreground">Предпросмотр</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Access Settings Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                          <Globe className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">Доступ</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Видимость группы</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-200/40 dark:border-green-800/30">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPublicGroup ? 'bg-green-500/15' : 'bg-muted/50'}`}>
                            {isPublicGroup ? (
                              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Shield className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-tight">Публичная</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isPublicGroup ? 'По ссылке' : 'По приглашению'}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="public-group"
                          checked={isPublicGroup}
                          onCheckedChange={(checked) => {
                            setIsPublicGroup(checked);
                            if (!checked) {
                              setPublicUsername('');
                            }
                          }}
                        />
                      </div>
                      
                      {isPublicGroup && (
                        <div className="space-y-2.5 p-3.5 sm:p-4 rounded-lg bg-green-50/40 dark:bg-green-950/20 border border-green-200/40 dark:border-green-800/30">
                          <Label htmlFor="public-username" className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                            <Link2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            Ссылка
                          </Label>
                          <Input
                            id="public-username"
                            placeholder="@username или t.me/username"
                            value={publicUsername}
                            onChange={(e) => setPublicUsername(e.target.value)}
                            className="h-10 text-sm"
                          />
                          <p className="text-xs text-green-700 dark:text-green-300">
                            @username или полная ссылка
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-amber-500" />
                        </div>
                        <h4 className="font-medium text-sm sm:text-base">Заметки</h4>
                      </div>
                      
                      <div className="space-y-2.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg p-3.5 sm:p-4 border border-amber-200/40 dark:border-amber-800/30">
                        <Label htmlFor="group-notes" className="text-xs sm:text-sm font-semibold text-foreground">Заметки</Label>
                        <Textarea
                          id="group-notes"
                          placeholder="Внутренние заметки..."
                          value={groupNotes}
                          onChange={(e) => setGroupNotes(e.target.value)}
                          rows={3}
                          className="resize-none text-sm"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Видны только вам
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-6 mt-0">
                    {/* Admin Status Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                          <Crown className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground">Статус бота</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Права администратора</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-200/40 dark:border-purple-800/30">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${makeAdmin ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-muted/50'}`}>
                            {makeAdmin ? (
                              <Crown className="h-5.5 w-5.5 text-white" />
                            ) : (
                              <Bot className="h-5.5 w-5.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-tight">{makeAdmin ? 'Администратор' : 'Участник'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {makeAdmin ? 'Имеет права админа' : 'Обычный участник'}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={makeAdmin}
                          onCheckedChange={setMakeAdmin}
                          className="scale-110"
                        />
                      </div>
                    </div>
                    
                    {makeAdmin && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                              <Shield className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-foreground">Разрешения</h5>
                              <p className="text-xs text-muted-foreground mt-0.5">Выберите права</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold flex-shrink-0">
                            {Object.values(adminRights).filter(Boolean).length}/{Object.keys(adminRights).length}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                          {Object.entries(adminRights).map(([key, value]) => {
                            const rightInfo = {
                              can_manage_chat: { label: 'Управление чатом', icon: Settings, color: 'blue' },
                              can_change_info: { label: 'Изменение информации', icon: Edit, color: 'green' },
                              can_delete_messages: { label: 'Удаление сообщений', icon: Trash, color: 'red' },
                              can_invite_users: { label: 'Приглашение пользователей', icon: UserPlus, color: 'purple' },
                              can_restrict_members: { label: 'Ограничение участников', icon: Ban, color: 'orange' },
                              can_pin_messages: { label: 'Закрепление сообщений', icon: Pin, color: 'amber' },
                              can_promote_members: { label: 'Назначение админов', icon: Crown, color: 'yellow' },
                              can_manage_video_chats: { label: 'Видеочаты', icon: Volume2, color: 'cyan' },
                              can_be_anonymous: { label: 'Анонимность', icon: Shield, color: 'gray' },
                              can_manage_stories: { label: 'Управление историями', icon: Sparkles, color: 'pink' }
                            }[key] || { label: key, icon: Settings, color: 'gray' };
                            const IconComponent = rightInfo.icon;
                            
                            return (
                              <div 
                                key={key} 
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                  value 
                                    ? 'bg-primary/5 border-primary/30' 
                                    : 'bg-muted/30 border-border/40 hover:border-border/60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                    value ? 'bg-primary/10' : 'bg-muted/50'
                                  }`}>
                                    <IconComponent className={`h-4 w-4 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
                                  </div>
                                  <span className={`text-sm font-medium ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {rightInfo.label}
                                  </span>
                                </div>
                                <Switch
                                  checked={value}
                                  onCheckedChange={(checked) => 
                                    setAdminRights(prev => ({ ...prev, [key]: checked }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex gap-2 pt-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setAdminRights(Object.fromEntries(Object.keys(adminRights).map(k => [k, true])) as typeof adminRights)}
                          >
                            Все вкл
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setAdminRights(Object.fromEntries(Object.keys(adminRights).map(k => [k, false])) as typeof adminRights)}
                          >
                            Все выкл
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="members" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      
                      {/* Список членов */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h5 className="font-semibold text-sm">Члены группы</h5>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isLoadingMembers && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                                <div className="animate-spin h-3 w-3 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Загрузка...</span>
                              </div>
                            )}
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {(() => {
                                const totalSavedMembers = savedMembers.length;
                                const totalApiMembers = clientApiMembers.length || administrators.length;
                                const totalMembers = totalSavedMembers + totalApiMembers;
                                
                                if (totalMembers > 0) {
                                  return totalMembers;
                                } else if (selectedGroup.memberCount) {
                                  return selectedGroup.memberCount;
                                } else {
                                  return '?';
                                }
                              })()}
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button 
                            variant="outline"
                            className="gap-2 h-10 text-sm"
                            onClick={() => {
                              setShowUserSearch(true);
                            }}
                          >
                            <Search className="h-4 w-4 flex-shrink-0" />
                            <span>Найти</span>
                          </Button>
                          <Button 
                            variant="outline"
                            className="gap-2 h-10 text-sm"
                            onClick={() => {
                              setSelectedGroupForPromotion(selectedGroup);
                              setShowAdminSearch(true);
                            }}
                          >
                            <Crown className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Админ</span>
                            <span className="sm:hidden">Назначить</span>
                          </Button>
                          {(clientApiMembers.length === 0 && savedMembers.length === 0 || savedMembers.length > 0 && clientApiMembers.length === 0) && (
                            <Button 
                              variant="default"
                              className="gap-2 h-10 text-sm"
                              onClick={() => setShowTelegramAuth(true)}
                            >
                              <Shield className="h-4 w-4 flex-shrink-0" />
                              <span>Загрузить</span>
                            </Button>
                          )}
                        </div>
                        
                        {(() => {
                          // Создаем объединенный список: сначала сохраненные участники, затем API участники
                          const allMembers = [];
                          
                          // Добавляем сохраненных участников из базы данных
                          if (savedMembers.length > 0) {
                            allMembers.push(...savedMembers.map(member => ({ ...member, sourceType: 'database' })));
                          }
                          
                          // Добавляем участников из Client API (если нет дубликатов)
                          if (clientApiMembers.length > 0) {
                            const uniqueApiMembers = clientApiMembers.filter(apiMember => {
                              const apiUserId = apiMember.id?.toString() || apiMember.user?.id?.toString() || apiMember.userId?.toString();
                              return !savedMembers.some(savedMember => 
                                savedMember.user?.id?.toString() === apiUserId
                              );
                            });
                            allMembers.push(...uniqueApiMembers.map(member => ({ ...member, sourceType: 'api' })));
                          }
                          
                          // Добавляем найденных через поиск администраторов (если нет Client API данных и нет дубликатов)
                          if (clientApiMembers.length === 0 && administrators.length > 0) {
                            const uniqueAdmins = administrators.filter(admin => {
                              const adminUserId = admin.id?.toString() || admin.user?.id?.toString() || admin.userId?.toString();
                              return !savedMembers.some(savedMember => 
                                savedMember.user?.id?.toString() === adminUserId
                              );
                            });
                            allMembers.push(...uniqueAdmins.map(admin => ({ ...admin, sourceType: 'admin_api' })));
                          }
                          
                          // Показываем объединенный список если есть участники
                          if (allMembers.length > 0) {
                            return (
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {allMembers.map((member, index) => (
                                  <div key={`${member.sourceType}-${index}`} className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md ${
                                    member.sourceType === 'database' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40' :
                                    member.foundViaSearch ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40' : 'border-border/50 bg-muted/30'
                                  }`}>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        member.status === 'creator' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                                        member.status === 'administrator' ? 'bg-blue-100 dark:bg-blue-900/40' :
                                        member.isBot ? 'bg-slate-100 dark:bg-slate-900/40' :
                                        'bg-green-100 dark:bg-green-900/40'
                                      }`}>
                                        {member.status === 'creator' ? (
                                          <Crown className={`h-4.5 w-4.5 text-yellow-600 dark:text-yellow-400`} />
                                        ) : member.status === 'administrator' ? (
                                          <Shield className={`h-4.5 w-4.5 text-blue-600 dark:text-blue-400`} />
                                        ) : member.isBot ? (
                                          <Bot className={`h-4.5 w-4.5 text-slate-600 dark:text-slate-400`} />
                                        ) : (
                                          <Users className={`h-4.5 w-4.5 text-green-600 dark:text-green-400`} />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-medium text-sm leading-tight">
                                            {member?.firstName || member?.user?.first_name || member?.first_name || 'Неизвестно'} {member?.lastName || member?.user?.last_name || member?.last_name || ''}
                                          </p>
                                          {member?.isBot && <Badge variant="secondary" className="text-[10px] font-semibold">Бот</Badge>}
                                          {member.sourceType === 'database' && <Badge variant="secondary" className="text-[10px] font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Сохранен</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          @{member?.username || member?.user?.username || '—'} • {member?.id || member?.user?.id || '—'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Badge variant={
                                        member.status === 'creator' ? 'default' : 
                                        member.status === 'administrator' ? 'secondary' : 
                                        'outline'
                                      } className="text-[10px] font-semibold whitespace-nowrap">
                                        {member.status === 'creator' ? 'Создатель' : 
                                         member.status === 'administrator' ? 'Админ' : 
                                         member.isBot ? 'Бот' :
                                         'Участник'}
                                      </Badge>
                                      
                                      {/* Кнопки управления участником - показываем для всех кроме создателя */}
                                      {member.status !== 'creator' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted/60">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {/* Показываем разрешения и назначение администратором для всех участников */}
                                            <>
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  setSelectedMember(member);
                                                  const userId = member.id?.toString() || member.user?.id?.toString() || member.userId?.toString();
                                                  if (userId && selectedGroup?.groupId) {
                                                    // Загружаем текущие разрешения участника
                                                    loadMemberPermissionsMutation.mutate({ 
                                                      groupId: selectedGroup.groupId, 
                                                      userId 
                                                    });
                                                  } else {
                                                    // Если не удалось получить ID, используем разрешения по умолчанию
                                                    setMemberPermissions({
                                                      // Основные разрешения участника
                                                      can_send_messages: true,
                                                      can_send_media_messages: true,
                                                      can_send_polls: true,
                                                      can_send_other_messages: true,
                                                      can_add_web_page_previews: true,
                                                      
                                                      // Административные разрешения
                                                      can_change_info: false,
                                                      can_delete_messages: false,
                                                      can_restrict_members: false,
                                                      can_invite_users: false,
                                                      can_pin_messages: false,
                                                      can_manage_video_chats: false,
                                                      can_be_anonymous: false,
                                                      can_promote_members: false
                                                    });
                                                  }
                                                  setShowPermissionsDialog(true);
                                                }}
                                              >
                                                <Settings className="h-4 w-4 mr-2" />
                                                Разрешения
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
                                                  // Назначаем с базовыми правами администратора
                                                  promoteMemberMutation.mutate({ 
                                                    groupId: selectedGroup.groupId, 
                                                    userId,
                                                    adminRights: {
                                                      can_change_info: false,
                                                      can_delete_messages: true,
                                                      can_invite_users: true,
                                                      can_restrict_members: true,
                                                      can_pin_messages: true,
                                                      can_promote_members: false,
                                                      can_manage_video_chats: false,
                                                      can_be_anonymous: false,
                                                      can_manage_topics: false
                                                    }
                                                  });
                                                }}
                                              >
                                                <Crown className="h-4 w-4 mr-2" />
                                                Назначить администратором
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                            </>
                                            
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
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {administrators.map((admin, index) => (
                                  <div key={`bot-${index}`} className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md ${admin.foundViaSearch ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40' : 'border-border/50 bg-muted/30'}`}>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        admin.foundViaSearch ? 'bg-purple-100 dark:bg-purple-900/40' :
                                        admin.status === 'creator' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                                        'bg-blue-100 dark:bg-blue-900/40'
                                      }`}>
                                        {admin.foundViaSearch ? (
                                          <Search className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                                        ) : admin.status === 'creator' ? (
                                          <Crown className="h-4.5 w-4.5 text-yellow-600 dark:text-yellow-400" />
                                        ) : (
                                          <Shield className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-medium text-sm leading-tight">
                                            {admin?.user?.first_name || admin?.first_name || admin?.firstName || 'Неизвестно'} {admin?.user?.last_name || admin?.last_name || admin?.lastName || ''}
                                          </p>
                                          {admin.foundViaSearch && <Badge variant="secondary" className="text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Найден</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          @{admin?.user?.username || admin?.username || '—'} • {admin?.user?.id || admin?.id || '—'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Badge variant={
                                        admin.status === 'creator' ? 'default' : 
                                        admin.foundViaSearch ? 'outline' : 
                                        'secondary'
                                      } className="text-[10px] font-semibold whitespace-nowrap">
                                        {admin.status === 'creator' ? 'Создатель' : 
                                         admin.foundViaSearch ? admin.friendlyStatus || 'Участник' : 
                                         'Админ'}
                                      </Badge>
                                      
                                      {/* Кнопки управления участником - показываем для всех кроме создателя */}
                                      {admin.status !== 'creator' && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted/60">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {/* Показываем разрешения для всех участников */}
                                            <>
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  setSelectedMember(admin);
                                                  const userId = admin?.user?.id?.toString() || admin?.id?.toString();
                                                  if (userId && selectedGroup?.groupId) {
                                                    // Загружаем актуальные разрешения через API
                                                    console.log('🔍 Загружаем права через API для:', { userId, groupId: selectedGroup.groupId });
                                                    loadMemberPermissionsMutation.mutate({ 
                                                      groupId: selectedGroup.groupId, 
                                                      userId 
                                                    });
                                                  } else {
                                                    // Fallback - используем данные по умолчанию
                                                    setMemberPermissions({
                                                      can_send_messages: true,
                                                      can_send_media_messages: true,
                                                      can_send_polls: true,
                                                      can_send_other_messages: true,
                                                      can_add_web_page_previews: true,
                                                      can_change_info: false,
                                                      can_delete_messages: false,
                                                      can_restrict_members: false,
                                                      can_invite_users: false,
                                                      can_pin_messages: false,
                                                      can_manage_video_chats: false,
                                                      can_be_anonymous: false,
                                                      can_promote_members: false
                                                    });
                                                  }
                                                  setShowPermissionsDialog(true);
                                                }}
                                              >
                                                <Settings className="h-4 w-4 mr-2" />
                                                Разрешения
                                              </DropdownMenuItem>
                                              
                                              {/* Кнопка назначения администратором для найденных через поиск участников */}
                                              {admin.foundViaSearch && admin.status !== 'administrator' && (
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
                                                    // Назначаем с базовыми правами администратора
                                                    promoteMemberMutation.mutate({ 
                                                      groupId: selectedGroup.groupId, 
                                                      userId,
                                                      adminRights: {
                                                        can_change_info: false,
                                                        can_delete_messages: true,
                                                        can_invite_users: true,
                                                        can_restrict_members: true,
                                                        can_pin_messages: true,
                                                        can_promote_members: false,
                                                        can_manage_video_chats: false,
                                                        can_be_anonymous: false,
                                                        can_manage_topics: false
                                                      }
                                                    });
                                                  }}
                                                >
                                                  <Crown className="h-4 w-4 mr-2" />
                                                  Назначить администратором
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuSeparator />
                                            </>
                                            
                                            {/* Основные действия - для всех кроме создателя */}
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
                                                demoteMemberMutation.mutate({ 
                                                  groupId: selectedGroup.groupId, 
                                                  userId 
                                                });
                                              }}
                                              className="text-orange-600"
                                            >
                                              <Crown className="h-4 w-4 mr-2" />
                                              Снять права администратора
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
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
                          
                          // Если ничего нет, показываем улучшенную подсказку
                          return (
                            <div className="space-y-4 py-6">
                              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-25 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 p-4 sm:p-5">
                                <div className="flex gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">Видны только администраторы</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed mb-2">
                                      Обычные участники не видны в списке из-за ограничений Telegram Bot API. Это ограничение установлено самим Telegram для безопасности.
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400/80 font-medium flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                                      Решение: Используйте поиск участника ниже для проверки членства
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex gap-2.5">
                                  <Input
                                    placeholder="@username или ID пользователя"
                                    value={userToFind}
                                    onChange={(e) => setUserToFind(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && userToFind.trim() && selectedGroup?.groupId) {
                                        let userId = userToFind.trim().replace('@', '');
                                        checkMemberMutation.mutate({
                                          groupId: selectedGroup.groupId,
                                          userId: userId
                                        });
                                      }
                                    }}
                                    className="flex-1 h-10"
                                  />
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      if (userToFind.trim() && selectedGroup?.groupId) {
                                        let userId = userToFind.trim().replace('@', '');
                                        checkMemberMutation.mutate({
                                          groupId: selectedGroup.groupId,
                                          userId: userId
                                        });
                                      }
                                    }}
                                    disabled={checkMemberMutation.isPending || !userToFind.trim()}
                                    className="gap-2"
                                  >
                                    {checkMemberMutation.isPending ? (
                                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                    ) : (
                                      <Search className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Найти</span>
                                  </Button>
                                </div>
                                
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    <span className="font-semibold">Поиск участника:</span> Введите @username или Telegram ID для проверки членства в группе. Получить ID можно через @userinfobot
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>




                      <div className="border-t border-border/40 my-6" />

                      {/* Управление сообщениями */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h5 className="font-semibold text-sm">Управление сообщениями</h5>
                        </div>
                        
                        {/* Закрепление сообщения */}
                        <div className="space-y-2.5 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                          <Label htmlFor="pin-message" className="text-xs font-semibold flex items-center gap-1.5">
                            <Pin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            Закрепить сообщение
                          </Label>
                          <div className="flex gap-2.5">
                            <Input
                              id="pin-message"
                              value={messageIdToPin}
                              onChange={(e) => setMessageIdToPin(e.target.value)}
                              placeholder="ID сообщения"
                              className="flex-1 h-10"
                            />
                            <Button 
                              onClick={() => pinMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToPin 
                              })}
                              disabled={!messageIdToPin.trim() || pinMessageMutation.isPending}
                              size="sm"
                              className="gap-2"
                            >
                              {pinMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Закрепить</span>
                            </Button>
                          </div>
                        </div>

                        {/* Открепление сообщения */}
                        <div className="space-y-2.5 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                          <Label htmlFor="unpin-message" className="text-xs font-semibold flex items-center gap-1.5">
                            <PinOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Открепить сообщение
                          </Label>
                          <div className="flex gap-2.5">
                            <Input
                              id="unpin-message"
                              value={messageIdToUnpin}
                              onChange={(e) => setMessageIdToUnpin(e.target.value)}
                              placeholder="ID или оставьте пустым"
                              className="flex-1 h-10"
                            />
                            <Button 
                              onClick={() => unpinMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToUnpin || undefined 
                              })}
                              disabled={unpinMessageMutation.isPending}
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              {unpinMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <PinOff className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Открепить</span>
                            </Button>
                          </div>
                        </div>

                        {/* Удаление сообщения */}
                        <div className="space-y-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800/40">
                          <Label htmlFor="delete-message" className="text-xs font-semibold flex items-center gap-1.5 text-red-700 dark:text-red-300">
                            <Trash className="h-3.5 w-3.5" />
                            Удалить сообщение
                          </Label>
                          <div className="flex gap-2.5">
                            <Input
                              id="delete-message"
                              value={messageIdToDelete}
                              onChange={(e) => setMessageIdToDelete(e.target.value)}
                              placeholder="ID сообщения"
                              className="flex-1 h-10"
                            />
                            <Button 
                              onClick={() => deleteMessageMutation.mutate({ 
                                groupId: selectedGroup.groupId, 
                                messageId: messageIdToDelete 
                              })}
                              disabled={!messageIdToDelete.trim() || deleteMessageMutation.isPending}
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                            >
                              {deleteMessageMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Удалить</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/40 my-6" />

                      {/* Создание ссылок-приглашений */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <h5 className="font-semibold text-sm">Ссылки-приглашения</h5>
                        </div>
                        
                        <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-25 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800/40">
                          <Label className="text-xs font-semibold text-green-700 dark:text-green-300">Создать новую ссылку-приглашение</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <Input
                              placeholder="Название ссылки"
                              value={inviteLinkName}
                              onChange={(e) => setInviteLinkName(e.target.value)}
                              className="h-10"
                            />
                            <Input
                              type="number"
                              placeholder="Лимит участников"
                              value={inviteLinkLimit}
                              onChange={(e) => setInviteLinkLimit(e.target.value)}
                              className="h-10"
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
                            className="w-full gap-2 h-10"
                          >
                            {createInviteLinkMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Создать приглашение
                          </Button>
                        </div>
                      </div>


                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800/40">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Получение User ID</p>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                              Попросите пользователя отправить /start боту <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-[11px] font-mono">@userinfobot</code> или найти ID в настройках Telegram.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-4 sm:p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-lg bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Сообщений</p>
                            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{selectedGroup.messagesCount || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-25 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800/40 p-4 sm:p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-lg bg-green-500/15 dark:bg-green-500/25 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Активные</p>
                            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{selectedGroup.activeUsers || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">Последняя активность</p>
                          <p className="text-sm text-purple-600 dark:text-purple-300">
                            {selectedGroup.lastActivity 
                              ? new Date(selectedGroup.lastActivity).toLocaleString('ru-RU')
                              : 'Нет данных'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <Label className="font-semibold text-sm">Теги группы</Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1.5 px-2.5 text-xs font-medium">
                            <span>{tag}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-0.5 hover:bg-destructive/20"
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
                          className="gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Добавить</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
            
            <div className="flex gap-2.5 pt-6 border-t border-border/40">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowGroupSettings(false);
                  setSelectedGroup(null);
                }} 
                className="flex-1 h-12"
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
                className="flex-1 h-11 sm:h-12 gap-2 text-sm"
              >
                {updateGroupMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <DialogTitle className="text-base font-bold">Отправить</DialogTitle>
              </div>
              <DialogDescription className="text-xs sm:text-sm">
                {selectedGroupForMessage?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2.5">
                <Label htmlFor="message-text" className="text-sm font-semibold">Сообщение</Label>
                <Textarea
                  id="message-text"
                  placeholder="Введите текст..."
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2.5 pt-4 border-t border-border/40">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSendMessage(false);
                  setMessageToSend('');
                  setSelectedGroupForMessage(null);
                }} 
                className="flex-1 h-10"
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
                className="flex-1 h-10 gap-2"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span className="hidden sm:inline">Отправляется</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Отправить</span>
                  </>
                )}
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
                    {loadMemberPermissionsMutation.isPending && (
                      <span className="text-blue-600 ml-2">• Загружаем текущие права...</span>
                    )}
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
                    can_change_info: 'Изменение профиля группы',
                    can_delete_messages: 'Удаление сообщений',
                    can_restrict_members: 'Блокировка пользователей',
                    can_invite_users: 'Пригласительные ссылки',
                    can_pin_messages: 'Закрепление сообщений',
                    can_manage_video_chats: 'Управление видеочатами',
                    can_be_anonymous: 'Анонимность',
                    can_promote_members: 'Добавление администраторов'
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
                      console.log('💾 Сохраняем разрешения:', {
                        selectedMember,
                        extractedUserId: userId,
                        groupId,
                        currentPermissions: memberPermissions,
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

        {/* Диалог поиска пользователя для добавления в список */}
        <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Найти пользователя</DialogTitle>
              <DialogDescription>
                Введите username (без @) или ID пользователя для добавления в список участников
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-search">Username или ID</Label>
                <Input
                  id="user-search"
                  placeholder="Sonofbog2 или 123456789"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userSearchQuery.trim()) {
                      simpleSearchUserMutation.mutate(userSearchQuery.trim());
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Например: <code>Sonofbog2</code> или <code>@Sonofbog2</code> или <code>123456789</code>
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUserSearch(false);
                    setUserSearchQuery('');
                  }}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={() => {
                    if (userSearchQuery.trim()) {
                      simpleSearchUserMutation.mutate(userSearchQuery.trim());
                    }
                  }}
                  disabled={simpleSearchUserMutation.isPending || !userSearchQuery.trim()}
                >
                  {simpleSearchUserMutation.isPending ? 'Поиск...' : 'Найти и добавить'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Диалог для назначения администратором */}
        <Dialog open={showAdminSearch} onOpenChange={setShowAdminSearch}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Назначить администратором</DialogTitle>
              <DialogDescription>
                Введите username (без @) или ID пользователя для назначения администратором
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-search">Username или ID</Label>
                <Input
                  id="admin-search"
                  placeholder="Sonofbog2 или 123456789"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userSearchQuery.trim()) {
                      searchUserMutation.mutate(userSearchQuery.trim());
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Например: <code>Sonofbog2</code> или <code>@Sonofbog2</code> или <code>123456789</code>
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAdminSearch(false);
                    setUserSearchQuery('');
                  }}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={() => {
                    if (userSearchQuery.trim()) {
                      searchUserMutation.mutate(userSearchQuery.trim());
                    }
                  }}
                  disabled={searchUserMutation.isPending || !userSearchQuery.trim()}
                >
                  {searchUserMutation.isPending ? 'Поиск...' : 'Найти и назначить админом'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}