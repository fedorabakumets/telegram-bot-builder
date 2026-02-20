/**
 * @fileoverview Страница управления базой ID пользователей
 * Основная страница для работы с базой рассылок
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserIdStats } from './user-id-stats';
import { UserIdList, type UserIdRecord } from './user-id-list';
import { UserIdActions } from './user-id-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Компонент страницы управления базой ID
 */
export interface UserIdsDatabaseProps {
  /** ID проекта */
  projectId: number;
}

export function UserIdsDatabase({ projectId }: UserIdsDatabaseProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');

  // Загрузка списка ID
  const { data: items = [], isLoading } = useQuery<UserIdRecord[]>({
    queryKey: ['/api/projects', projectId, 'user-ids'],
    queryFn: () =>
      apiRequest('GET', `/api/projects/${projectId}/user-ids`),
  });

  // Загрузка статистики
  const { data: stats = { total: 0, addedToday: 0, addedThisWeek: 0 } } =
    useQuery({
      queryKey: ['/api/projects', projectId, 'user-ids', 'stats'],
      queryFn: () =>
        apiRequest('GET', `/api/projects/${projectId}/user-ids/stats`),
    });

  // Мутация добавления
  const addMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('POST', `/api/projects/${projectId}/user-ids`, {
        userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/projects', projectId, 'user-ids'],
      });
      toast({ 
        title: 'ID добавлен', 
        description: 'Пользователь добавлен в базу' 
      });
      setIsAddDialogOpen(false);
      setNewUserId('');
    },
    onError: (error: any) => {
      const message = error?.response?.status === 409 
        ? 'Этот ID уже есть в базе' 
        : 'Не удалось добавить ID';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Мутация удаления
  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      Promise.all(
        ids.map((id) =>
          apiRequest('DELETE', `/api/projects/${projectId}/user-ids/${id}`)
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/projects', projectId, 'user-ids'],
      });
      toast({ title: 'Удалено', description: 'ID удалены из базы' });
    },
  });

  const handleAdd = () => {
    if (newUserId.trim()) {
      addMutation.mutate(newUserId.trim());
    }
  };

  const handleDelete = (ids: number[]) => {
    if (confirm(`Удалить ${ids.length} ID?`)) {
      deleteMutation.mutate(ids);
    }
  };

  const handleExport = (ids: number[]) => {
    // TODO: Реализовать экспорт
    toast({ title: 'Экспорт', description: 'Функция в разработке' });
  };

  const handleImport = () => {
    // TODO: Реализовать импорт
    toast({ title: 'Импорт', description: 'Функция в разработке' });
  };

  const handleClearAll = () => {
    if (confirm('Удалить ВСЮ базу пользователей?')) {
      deleteMutation.mutate(items.map((item) => item.id));
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold">📊 База пользователей</h1>
        </div>
        <UserIdActions
          onAdd={() => setIsAddDialogOpen(true)}
          onImport={handleImport}
          onExportAll={() => handleExport(items.map((i) => i.id))}
          onClearAll={handleClearAll}
          totalCount={items.length}
        />
      </div>

      {/* Статистика */}
      <UserIdStats stats={stats} />

      {/* Список ID */}
      <UserIdList
        items={items}
        isLoading={isLoading}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      {/* Диалог добавления */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ID пользователя</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Добавьте ID пользователя Telegram в базу рассылки
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">Telegram ID</Label>
              <Input
                id="userId"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="123456789"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID можно узнать через бота @userinfobot
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
