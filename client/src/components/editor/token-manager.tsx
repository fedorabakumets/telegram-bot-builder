import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
import { useTokens, useCreateToken, useUpdateToken, useDeleteToken } from '@/hooks/use-user-data';
import { apiRequest } from '@/lib/queryClient';
import { Plus, MoreVertical, Star, StarOff, Edit, Trash2, Copy, Eye, EyeOff, Database, HardDrive } from 'lucide-react';

interface BotToken {
  id: number;
  projectId: number;
  name: string;
  token: string; // Partially hidden
  isDefault: number;
  isActive: number;
  description?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TokenManagerProps {
  projectId: number;
  onTokenSelect?: (tokenId: number) => void;
  selectedTokenId?: number | null;
}

export function TokenManager({ projectId, onTokenSelect, selectedTokenId }: TokenManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<BotToken | null>(null);
  const [newTokenData, setNewTokenData] = useState({
    name: '',
    token: '',
    description: '',
    isDefault: false
  });
  const [showTokenValues, setShowTokenValues] = useState<Record<number, boolean>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();
  const isAuthenticated = user !== null;

  // Получаем все токены проекта (с автоматическим переключением между localStorage и сервером)
  const { data: tokens = [], isLoading } = useTokens({
    isAuthenticated,
    userId: user?.id
  }, projectId);

  // Создание токена
  const createTokenMutation = useMutation({
    mutationFn: async (tokenData: typeof newTokenData) => {
      return apiRequest('POST', `/api/projects/${projectId}/tokens`, {
        ...tokenData,
        isDefault: tokenData.isDefault ? 1 : 0
      });
    },
    onSuccess: () => {
      toast({
        title: "Токен создан",
        description: "Новый токен успешно добавлен.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      setIsAddDialogOpen(false);
      setNewTokenData({ name: '', token: '', description: '', isDefault: false });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания",
        description: error.message || "Не удалось создать токен.",
        variant: "destructive",
      });
    },
  });

  // Обновление токена
  const updateTokenMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BotToken> }) => {
      return apiRequest('PUT', `/api/tokens/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Токен обновлен",
        description: "Токен успешно обновлен.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      setIsEditDialogOpen(false);
      setEditingToken(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка обновления",
        description: error.message || "Не удалось обновить токен.",
        variant: "destructive",
      });
    },
  });

  // Удаление токена
  const deleteTokenMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tokens/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Токен удален",
        description: "Токен успешно удален.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить токен.",
        variant: "destructive",
      });
    },
  });

  // Установка токена по умолчанию
  const setDefaultMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      return apiRequest('POST', `/api/projects/${projectId}/tokens/${tokenId}/set-default`);
    },
    onSuccess: () => {
      toast({
        title: "Токен по умолчанию",
        description: "Токен установлен по умолчанию.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось установить токен по умолчанию.",
        variant: "destructive",
      });
    },
  });

  const handleCreateToken = () => {
    createTokenMutation.mutate(newTokenData);
  };

  const handleEditToken = (token: BotToken) => {
    setEditingToken(token);
    setIsEditDialogOpen(true);
  };

  const handleUpdateToken = () => {
    if (!editingToken) return;
    
    updateTokenMutation.mutate({
      id: editingToken.id,
      data: {
        name: editingToken.name,
        description: editingToken.description,
        isActive: editingToken.isActive
      }
    });
  };

  const handleDeleteToken = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот токен?')) {
      deleteTokenMutation.mutate(id);
    }
  };

  const handleSetDefault = (tokenId: number) => {
    setDefaultMutation.mutate(tokenId);
  };

  const toggleTokenVisibility = (tokenId: number) => {
    setShowTokenValues(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Токен скопирован в буфер обмена.",
    });
  };

  if (isLoading) {
    return <div className="p-4">Загрузка токенов...</div>;
  }

  const dataSource = isAuthenticated ? 'server' : 'local';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Управление токенами</h3>
          <p className="text-sm text-muted-foreground">
            Управляйте токенами Telegram ботов для этого проекта
          </p>
          <div className="mt-2 flex items-center gap-2">
            {dataSource === 'local' ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Локальное хранилище
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Облачное хранилище
              </Badge>
            )}
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить токен
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новый токен</DialogTitle>
              <DialogDescription>
                Добавьте новый токен бота от @BotFather
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="token-name">Название токена</Label>
                <Input
                  id="token-name"
                  placeholder="Например: Основной бот"
                  value={newTokenData.name}
                  onChange={(e) => setNewTokenData({ ...newTokenData, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="token-value">Токен бота</Label>
                <Input
                  id="token-value"
                  type="password"
                  placeholder="Введите токен от @BotFather"
                  value={newTokenData.token}
                  onChange={(e) => setNewTokenData({ ...newTokenData, token: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="token-description">Описание (опционально)</Label>
                <Textarea
                  id="token-description"
                  placeholder="Описание назначения токена"
                  value={newTokenData.description}
                  onChange={(e) => setNewTokenData({ ...newTokenData, description: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={newTokenData.isDefault}
                  onCheckedChange={(checked) => setNewTokenData({ ...newTokenData, isDefault: checked })}
                />
                <Label htmlFor="is-default">Использовать по умолчанию</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={handleCreateToken}
                disabled={!newTokenData.name || !newTokenData.token || createTokenMutation.isPending}
              >
                {createTokenMutation.isPending ? 'Создание...' : 'Создать токен'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tokens.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Токены не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте токен для запуска бота
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <Card 
              key={token.id} 
              className={`cursor-pointer transition-colors ${
                selectedTokenId === token.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onTokenSelect?.(token.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{token.name}</h4>
                      {token.isDefault === 1 && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          По умолчанию
                        </Badge>
                      )}
                      {token.isActive === 0 && (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">
                        {showTokenValues[token.id] ? '••••••••••' : token.token}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTokenVisibility(token.id);
                        }}
                      >
                        {showTokenValues[token.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(token.token);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {token.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {token.description}
                      </p>
                    )}
                    
                    {token.lastUsedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Последнее использование: {new Date(token.lastUsedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                      </p>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditToken(token)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      
                      {token.isDefault !== 1 && (
                        <DropdownMenuItem onClick={() => handleSetDefault(token.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          Сделать по умолчанию
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteToken(token.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Token Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать токен</DialogTitle>
            <DialogDescription>
              Измените настройки токена
            </DialogDescription>
          </DialogHeader>
          
          {editingToken && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-token-name">Название токена</Label>
                <Input
                  id="edit-token-name"
                  value={editingToken.name}
                  onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-token-description">Описание</Label>
                <Textarea
                  id="edit-token-description"
                  value={editingToken.description || ''}
                  onChange={(e) => setEditingToken({ ...editingToken, description: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-active"
                  checked={editingToken.isActive === 1}
                  onCheckedChange={(checked) => setEditingToken({ 
                    ...editingToken, 
                    isActive: checked ? 1 : 0 
                  })}
                />
                <Label htmlFor="edit-is-active">Активный токен</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateToken}
              disabled={updateTokenMutation.isPending}
            >
              {updateTokenMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}