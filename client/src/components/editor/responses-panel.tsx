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
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  RefreshCw,
  User,
  FileText,
  Clock,
  Hash,
  MessageCircle
} from 'lucide-react';

interface ResponsesData {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  registered_at: string;
  last_interaction: string;
  responses: Array<{
    key: string;
    value: string;
    type: string;
    timestamp: string;
    nodeId?: string;
    prompt?: string;
    variable?: string;
  }>;
  responseCount: number;
}

interface ResponsesPanelProps {
  projectId: number;
  projectName: string;
}

type SortField = 'last_interaction' | 'responseCount' | 'registered_at' | 'first_name';
type SortDirection = 'asc' | 'desc';

export function ResponsesPanel({ projectId, projectName }: ResponsesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ResponsesData | null>(null);
  const [showResponseDetails, setShowResponseDetails] = useState(false);
  const [sortField, setSortField] = useState<SortField>('last_interaction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterResponseType, setFilterResponseType] = useState<string>('all');

  // Fetch responses data
  const { data: responsesData = [], isLoading, refetch } = useQuery<ResponsesData[]>({
    queryKey: [`/api/projects/${projectId}/responses`],
    staleTime: 0, // Always fresh data
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Responses data updated:', responsesData);
  }, [responsesData]);

  // Filter and sort responses
  const filteredAndSortedResponses = useMemo(() => {
    let result = responsesData;

    // Apply search filter
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.first_name?.toLowerCase().includes(query)) ||
        (user.last_name?.toLowerCase().includes(query)) ||
        (user.username?.toLowerCase().includes(query)) ||
        (user.user_id?.includes(query)) ||
        user.responses.some(response => response.value?.toLowerCase().includes(query))
      );
    }

    // Apply response type filter
    if (filterResponseType !== 'all') {
      result = result.filter(user => 
        user.responses.some(response => response.type === filterResponseType)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'last_interaction':
          aValue = new Date(a.last_interaction || 0).getTime();
          bValue = new Date(b.last_interaction || 0).getTime();
          break;
        case 'registered_at':
          aValue = new Date(a.registered_at || 0).getTime();
          bValue = new Date(b.registered_at || 0).getTime();
          break;
        case 'responseCount':
          aValue = a.responseCount;
          bValue = b.responseCount;
          break;
        case 'first_name':
          aValue = (a.first_name || '').toLowerCase();
          bValue = (b.first_name || '').toLowerCase();
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [responsesData, searchQuery, filterResponseType, sortField, sortDirection]);

  const formatDate = (date: string | null) => {
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

  const formatUserName = (user: ResponsesData) => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (user.username) return `@${user.username}`;
    return `ID: ${user.user_id}`;
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'button': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'number': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'phone': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'inline_button': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'reply_button': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'button_choice': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatResponseKey = (key: string, type?: string) => {
    if (key === 'button_click') return 'Нажатие кнопки';
    if (key.startsWith('response_')) return key.replace('response_', 'Ответ ');
    if (type === 'inline_button') return 'Источник';
    return key;
  };

  // Get unique response types for filter
  const responseTypes = useMemo(() => {
    const types = new Set<string>();
    responsesData.forEach(user => {
      user.responses.forEach(response => {
        if (response.type) types.add(response.type);
      });
    });
    return Array.from(types);
  }, [responsesData]);

  const exportResponses = () => {
    const csvContent = [
      ['User ID', 'Name', 'Username', 'Response Key', 'Response', 'Type', 'Timestamp', 'Node ID'].join(','),
      ...filteredAndSortedResponses.flatMap(user =>
        user.responses.map(response => [
          user.user_id,
          `"${formatUserName(user)}"`,
          user.username || '',
          formatResponseKey(response.key, response.type),
          `"${response.value}"`,
          response.type,
          response.timestamp || '',
          response.nodeId || ''
        ].join(','))
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `responses_${projectName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Загрузка ответов...</p>
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
                <MessageSquare className="w-5 h-5" />
                Ответы пользователей
              </h2>
              <p className="text-sm text-muted-foreground">
                Просмотр всех ответов пользователей для бота "{projectName}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Обновить
              </Button>
              <Button onClick={exportResponses} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Экспорт CSV
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Пользователей</p>
                  <p className="text-sm font-semibold">{responsesData.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Всего ответов</p>
                  <p className="text-sm font-semibold">
                    {responsesData.reduce((sum, user) => sum + user.responseCount, 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Типов ответов</p>
                  <p className="text-sm font-semibold">{responseTypes.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Сред. ответов</p>
                  <p className="text-sm font-semibold">
                    {responsesData.length > 0 
                      ? Math.round(responsesData.reduce((sum, user) => sum + user.responseCount, 0) / responsesData.length)
                      : 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, username, ID или тексту ответа..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterResponseType} onValueChange={setFilterResponseType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Тип ответа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {responseTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'text' ? 'Текст' : 
                       type === 'button' ? 'Кнопка' :
                       type === 'number' ? 'Число' :
                       type === 'email' ? 'Email' :
                       type === 'phone' ? 'Телефон' :
                       type === 'inline_button' ? 'Инлайн кнопка' :
                       type === 'reply_button' ? 'Reply кнопка' :
                       type === 'button_choice' ? 'Выбор кнопки' :
                       type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                const [field, direction] = value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_interaction-desc">Последняя активность ↓</SelectItem>
                  <SelectItem value="last_interaction-asc">Последняя активность ↑</SelectItem>
                  <SelectItem value="responseCount-desc">Больше ответов ↓</SelectItem>
                  <SelectItem value="responseCount-asc">Меньше ответов ↑</SelectItem>
                  <SelectItem value="registered_at-desc">Дата регистрации ↓</SelectItem>
                  <SelectItem value="registered_at-asc">Дата регистрации ↑</SelectItem>
                  <SelectItem value="first_name-asc">По имени ↑</SelectItem>
                  <SelectItem value="first_name-desc">По имени ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredAndSortedResponses.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchQuery ? 'Ответы не найдены' : 'Пока нет ответов'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'Попробуйте изменить критерии поиска' 
                    : 'Ответы пользователей появятся здесь, когда они начнут взаимодействовать с ботом'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedResponses.map((user) => (
                  <Card key={user.user_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{formatUserName(user)}</CardTitle>
                            <CardDescription className="text-sm">
                              ID: {user.user_id} • {user.responseCount} ответов
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(user.last_interaction)}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Детали
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Ответы пользователя {formatUserName(user)}</DialogTitle>
                                <DialogDescription>
                                  Подробный просмотр всех ответов пользователя
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                {user.responses.map((response, index) => (
                                  <Card key={index} className="border-l-4 border-l-primary">
                                    <CardHeader className="pb-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {formatResponseKey(response.key, response.type)}
                                          </span>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs ${getResponseTypeColor(response.type)}`}
                                          >
                                            {response.type === 'text' ? 'Текст' : 
                                             response.type === 'button' ? 'Кнопка' :
                                             response.type === 'number' ? 'Число' :
                                             response.type === 'email' ? 'Email' :
                                             response.type === 'phone' ? 'Телефон' :
                                             response.type === 'inline_button' ? 'Инлайн кнопка' :
                                             response.type === 'reply_button' ? 'Reply кнопка' :
                                             response.type === 'button_choice' ? 'Выбор кнопки' :
                                             response.type}
                                          </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(response.timestamp)}
                                        </span>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-muted/50 rounded p-3 mb-2">
                                        <p className="text-sm font-medium mb-1">Ответ:</p>
                                        <p className="text-foreground">{response.value}</p>
                                      </div>
                                      {response.prompt && (
                                        <div className="text-xs text-muted-foreground">
                                          <strong>Вопрос:</strong> {response.prompt}
                                        </div>
                                      )}
                                      {response.nodeId && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <strong>ID узла:</strong> {response.nodeId}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {user.responses.slice(0, 2).map((response, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatResponseKey(response.key, response.type)}:
                              </span>
                              <span className="text-sm text-muted-foreground truncate max-w-xs">
                                {response.value}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getResponseTypeColor(response.type)}`}
                            >
                              {response.type}
                            </Badge>
                          </div>
                        ))}
                        {user.responses.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            И еще {user.responses.length - 2} ответов...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}