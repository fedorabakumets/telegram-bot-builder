// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  User,
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
import { UserBotData, BotProject } from '@shared/schema';
import { formatDate } from './utils/formatDate';
import { formatUserName } from './utils/formatUserName';
import { useUserMessages } from './hooks/useUserMessages';
import { useVariableMapping } from './hooks/useVariableMapping';
import { useUpdateUser } from './hooks/useUpdateUser';
import { UserDetailsPanelProps, BotMessageWithMedia } from './types';
import { EmptyState } from './components/EmptyState';
import { PanelHeader } from './components/PanelHeader';

/**
 * @function UserDetailsPanel
 * @description Компонент панели с детальной информацией о пользователе
 * @param {UserDetailsPanelProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент интерфейса с информацией о пользователе
 */
export function UserDetailsPanel({ projectId, user, onClose, onOpenDialog }: UserDetailsPanelProps): React.JSX.Element {

  /**
   * @constant {BotProject} project - Данные проекта
   */
  const { data: project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
  });

  const { messages, total, userSent, botSent } = useUserMessages(projectId, user?.userId);

  const variableToQuestionMap = useVariableMapping(project);

  const updateUserMutation = useUpdateUser(projectId, user);

  /**
   * Переключает статус активности пользователя
   * @param {'isActive'} field - Поле статуса для переключения
   */
  const handleUserStatusToggle = (field: 'isActive') => {
    if (!user) return;
    const currentValue = Boolean(user[field as keyof UserBotData]);
    updateUserMutation.mutate({ [field]: !currentValue ? 1 : 0 } as Partial<UserBotData>);
  };

  if (!user) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <PanelHeader user={user} onClose={onClose} formatUserName={formatUserName} />

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
                <span className="text-sm font-medium">{user.firstName && typeof user.firstName === 'string' ? user.firstName : 'Не указано'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Username:</span>
                <span className="text-sm font-medium">
                  {user.userName && typeof user.userName === 'string' ? (
                    <span className="flex items-center gap-1">
                      <AtSign className="w-3 h-3" />
                      {user.userName}
                    </span>
                  ) : 'Не указано'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Telegram ID:</span>
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{String(user.userId)}</span>
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
                  {total}
                </div>
                <div className="text-xs text-muted-foreground">Всего</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {userSent}
                </div>
                <div className="text-xs text-muted-foreground">От юзера</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {botSent}
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
              {user.isActive && Number(user.isActive) !== 0 ? (
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

          {(() => (
            <>
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
                    <span className="font-medium">{formatDate(user.createdAt) as string}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Обновление:</span>
                    <span className="font-medium">{formatDate(user.updatedAt) as string}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Активность:</span>
                    <span className="font-medium">{formatDate(user.lastInteraction) as string}</span>
                  </div>
                </div>
              </div>
            </>
          ))()}

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
                <div className="pl-6">
                  {Object.keys(user.userData as Record<string, unknown>).length > 48 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Отображены первые 48 ответов из {Object.keys(user.userData as Record<string, unknown>).length}
                    </div>
                  )}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-1/3 font-semibold">Переменная</TableHead>
                          <TableHead className="w-1/3 font-semibold">Ответ</TableHead>
                          <TableHead className="w-1/3 font-semibold">Тип</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(user.userData as Record<string, unknown>).slice(0, 48).map(([key, value]: [string, unknown]) => {
                          let responseData: any = value;
                          if (typeof value === 'string') {
                            try {
                              responseData = JSON.parse(value);
                            } catch {
                              responseData = { value: value, type: 'text' };
                            }
                          } else if (typeof value === 'object' && value !== null) {
                            responseData = value;
                          } else {
                            responseData = { value: String(value), type: 'text' };
                          }

                          const answerValue: string = String(responseData?.value !== undefined ? responseData.value :
                            (typeof value === 'object' && value !== null ? JSON.stringify(value as object) : String(value as string)));

                          return (
                            <TableRow key={key}>
                              <TableCell className="align-top">
                                <div className="font-medium text-sm">
                                  {key.startsWith('response_') ? key.replace('response_', 'Ответ ') : key}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
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
                              </TableCell>
                              <TableCell className="align-top">
                                {responseData?.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {responseData.type === 'text' ? 'Текст' :
                                      responseData.type === 'number' ? 'Число' :
                                        responseData.type === 'email' ? 'Email' :
                                          responseData.type === 'phone' ? 'Телефон' :
                                            String(responseData.type)}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
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
