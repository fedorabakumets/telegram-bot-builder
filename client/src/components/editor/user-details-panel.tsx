import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  User,
  X,
  Calendar,
  MessageSquare,
  Edit,
  Activity,
  Tag,
  Clock,
  Hash,
  AtSign,
  UserCheck,
  UserX
} from 'lucide-react';
import { UserBotData, BotMessage, BotProject } from '@shared/schema';
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

interface UserDetailsPanelProps {
  projectId: number;
  user: UserBotData | null;
  onClose: () => void;
  onOpenDialog?: (user: UserBotData) => void;
}

export function UserDetailsPanel({ projectId, user, onClose, onOpenDialog }: UserDetailsPanelProps) {
  const { toast } = useToast();
  const qClient = useQueryClient();

  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

  const { data: messages = [] } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${user?.userId}/messages`],
    enabled: !!user?.userId,
    staleTime: 0,
  });

  const userMessageCounts = useMemo(() => {
    const userSent = messages.filter(m => m.messageType === 'user').length;
    const botSent = messages.filter(m => m.messageType === 'bot').length;
    return {
      total: messages.length,
      userSent,
      botSent
    };
  }, [messages]);

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

  const getPhotoUrlFromMessages = (fileId: string): string | null => {
    for (const msg of messages) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.url) {
            return m.url;
          }
        }
      }
    }
    return null;
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Не указано';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPp', { locale: ru });
    } catch {
      return 'Не указано';
    }
  };

  const formatUserName = (userData: UserBotData | null): string => {
    if (!userData) return '';
    const parts = [];
    if (userData.firstName) parts.push(userData.firstName);
    if (userData.lastName) parts.push(userData.lastName);
    if (userData.userName) parts.push(`@${userData.userName}`);
    return parts.length > 0 ? parts.join(' ') : `ID: ${userData.userId}`;
  };

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<UserBotData>) => {
      if (!user) throw new Error('No user selected');
      return apiRequest('PATCH', `/api/projects/${projectId}/users/${user.userId}`, updates);
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/users`] });
      toast({
        title: "Сохранено",
        description: "Данные пользователя обновлены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    }
  });

  const handleUserStatusToggle = (field: 'isActive') => {
    if (!user) return;
    const currentValue = Boolean(user[field]);
    updateUserMutation.mutate({ [field]: !currentValue ? 1 : 0 });
  };

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
        <User className="w-12 h-12 mb-4" />
        <p className="text-center">Выберите пользователя для просмотра деталей</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">Детали пользователя</h3>
            <p className="text-xs text-muted-foreground truncate">{formatUserName(user)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-user-details-panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Основная информация</Label>
            </div>
            <div className="grid gap-3 pl-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Имя:</span>
                <span className="text-sm font-medium">{user.firstName || 'Не указано'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Username:</span>
                <span className="text-sm font-medium">
                  {user.userName ? (
                    <span className="flex items-center gap-1">
                      <AtSign className="w-3 h-3" />
                      {user.userName}
                    </span>
                  ) : 'Не указано'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Telegram ID:</span>
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{user.userId}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Статистика</Label>
            </div>
            <div className="grid grid-cols-3 gap-2 pl-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {userMessageCounts.total}
                </div>
                <div className="text-xs text-muted-foreground">Всего</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {userMessageCounts.userSent}
                </div>
                <div className="text-xs text-muted-foreground">От юзера</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {userMessageCounts.botSent}
                </div>
                <div className="text-xs text-muted-foreground">От бота</div>
              </div>
            </div>
            {onOpenDialog && (
              <div className="pl-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onOpenDialog(user)}
                  className="w-full"
                  data-testid="button-open-dialog-from-details"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Открыть историю диалога
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {user.isActive ? (
                <UserCheck className="w-4 h-4 text-green-500" />
              ) : (
                <UserX className="w-4 h-4 text-red-500" />
              )}
              <Label className="text-sm font-semibold">Статус пользователя</Label>
            </div>
            <div className="pl-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Активен</Label>
                  <p className="text-xs text-muted-foreground">
                    Пользователь может взаимодействовать с ботом
                  </p>
                </div>
                <Switch
                  checked={Boolean(user.isActive)}
                  onCheckedChange={() => handleUserStatusToggle('isActive')}
                  data-testid="switch-user-active"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Даты</Label>
            </div>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Регистрация:</span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Обновление:</span>
                <span className="font-medium">{formatDate(user.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Активность:</span>
                <span className="font-medium">{formatDate(user.lastInteraction)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {user.tags && Array.isArray(user.tags) && user.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">Теги</Label>
                </div>
                <div className="flex flex-wrap gap-1 pl-6">
                  {user.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {String(tag)}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* User Responses */}
          {user.userData && typeof user.userData === 'object' && Object.keys(user.userData as Record<string, unknown>).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">Ответы пользователя</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(user.userData as Record<string, unknown>).length}
                  </Badge>
                </div>
                <div className="space-y-3 pl-6">
                  {Object.entries(user.userData as Record<string, unknown>).map(([key, value]: [string, unknown]) => {
                    let responseData: any = value;
                    if (typeof value === 'string') {
                      try {
                        responseData = JSON.parse(value);
                      } catch {
                        responseData = { value: value, type: 'text' };
                      }
                    }

                    const getQuestionText = (questionKey: string, data: any) => {
                      if (variableToQuestionMap[questionKey]) {
                        return variableToQuestionMap[questionKey];
                      }
                      if (data?.prompt && data.prompt.trim()) {
                        return data.prompt;
                      }
                      return questionKey;
                    };

                    const questionText = getQuestionText(key, responseData);
                    const answerValue = responseData?.value !== undefined ? responseData.value : 
                                        (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

                    return (
                      <div key={key} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key}
                          </span>
                          {responseData?.type && (
                            <Badge variant="outline" className="text-xs">
                              {responseData.type === 'text' ? 'Текст' : 
                               responseData.type === 'number' ? 'Число' :
                               responseData.type === 'email' ? 'Email' :
                               responseData.type === 'phone' ? 'Телефон' :
                               responseData.type}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Question */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>Вопрос:</span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">{String(questionText)}</p>
                        </div>
                        
                        {/* Answer */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                            <Edit className="w-3 h-3" />
                            <span>Ответ:</span>
                          </div>
                          {(() => {
                            if (responseData?.photoUrl) {
                              return (
                                <div className="rounded-lg overflow-hidden max-w-[150px]">
                                  <img 
                                    src={responseData.photoUrl}
                                    alt="Фото ответ"
                                    className="w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              );
                            }
                            
                            if (responseData?.media && Array.isArray(responseData.media) && responseData.media.length > 0) {
                              return (
                                <div className="rounded-lg overflow-hidden max-w-[150px] space-y-1">
                                  {responseData.media.map((m: any, idx: number) => (
                                    <img 
                                      key={idx}
                                      src={m.url || m} 
                                      alt="Ответ фото" 
                                      className="w-full h-auto rounded-lg"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ))}
                                </div>
                              );
                            }
                            
                            const valueStr = String(answerValue);
                            const isImageUrl = valueStr.startsWith('http://') || valueStr.startsWith('https://') || valueStr.startsWith('/uploads/');
                            
                            if (isImageUrl) {
                              return (
                                <div className="rounded-lg overflow-hidden max-w-[150px]">
                                  <img 
                                    src={valueStr}
                                    alt="Ответ"
                                    className="w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              );
                            }
                            
                            return (
                              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                {valueStr}
                              </p>
                            );
                          })()}
                        </div>
                        
                        {responseData?.timestamp && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(responseData.timestamp)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Raw JSON */}
          {user.userData && typeof user.userData === 'object' && Object.keys(user.userData as Record<string, unknown>).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">Все данные (JSON)</Label>
                </div>
                <div className="pl-6">
                  <Textarea
                    value={JSON.stringify(user.userData, null, 2)}
                    readOnly
                    rows={6}
                    className="text-xs font-mono bg-muted resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
