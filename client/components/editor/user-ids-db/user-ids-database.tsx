/**
 * @fileoverview Страница управления базой ID пользователей
 * Общая база на все проекты
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
import { UserIdCount } from './user-id-count';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseCSV } from './import-csv';
import { parseTextIds } from './import-text';
import { downloadCSV, copyToClipboard } from './export-csv';
import { Upload, ClipboardPaste } from 'lucide-react';

/**
 * Компонент страницы управления базой ID
 */
export function UserIdsDatabase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [textIds, setTextIds] = useState('');

  // Загрузка списка ID (общая база)
  const { data: items = [], isLoading } = useQuery<UserIdRecord[]>({
    queryKey: ['/api/user-ids'],
    queryFn: () => apiRequest('GET', '/api/user-ids'),
  });

  // Мутация добавления
  const addMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('POST', '/api/user-ids', { userId, source: 'manual' as const }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/user-ids'],
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
          apiRequest('DELETE', `/api/user-ids/${id}`)
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/user-ids'],
      });
      toast({ title: 'Удалено', description: 'ID удалены из базы' });
    },
  });

  const handleAdd = () => {
    if (newUserId.trim()) {
      addMutation.mutate(newUserId.trim());
    }
  };

  const importMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map((userId) =>
          apiRequest('POST', '/api/user-ids', { userId, source: 'import' as const }).catch(() => null)
        )
      );
      return results.filter(Boolean).length;
    },
    onSuccess: (added) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-ids'] });
      toast({
        title: 'Импорт завершён',
        description: `Добавлено ${added} ID`
      });
      setIsImportDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Ошибка', description: 'Не удалось импортировать данные', variant: 'destructive' });
    },
  });

  const handleImport = async (file: File) => {
    setIsImporting(true);
    const { validIds, errors } = await parseCSV(file);

    if (validIds.length === 0) {
      toast({
        title: 'Ошибка',
        description: errors.length > 0 ? `Невалидные данные: ${errors.slice(0, 3).join(', ')}` : 'Пустой файл',
        variant: 'destructive',
      });
      setIsImporting(false);
      return;
    }

    if (errors.length > 0) {
      toast({
        title: 'Предупреждение',
        description: `Пропущено ${errors.length} строк с ошибками`,
      });
    }

    importMutation.mutate(validIds);
  };

  const handleDelete = (ids: number[]) => {
    if (confirm(`Удалить ${ids.length} ID?`)) {
      deleteMutation.mutate(ids);
    }
  };

  const handleExport = (ids: number[]) => {
    const idsToExport = items
      .filter(item => ids.includes(item.id))
      .map(item => item.userId);
    
    downloadCSV(idsToExport, 'user-ids.csv');
    toast({
      title: 'Экспорт',
      description: `Скачано ${idsToExport.length} ID`
    });
  };

  const handleExportAll = () => {
    const allIds = items.map(item => item.userId);
    downloadCSV(allIds, 'user-ids.csv');
    toast({
      title: 'Экспорт',
      description: `Скачано ${allIds.length} ID`
    });
  };

  const handleCopyToClipboard = async () => {
    const allIds = items.map(item => item.userId);
    const success = await copyToClipboard(allIds);
    toast({
      title: success ? 'Скопировано' : 'Ошибка',
      description: success 
        ? `${allIds.length} ID скопировано в буфер` 
        : 'Не удалось скопировать',
      variant: success ? 'default' : 'destructive'
    });
  };

  const handleImportClick = () => {
    setImportMode('file');
    setTextIds('');
    setIsImportDialogOpen(true);
  };

  const handleTextImport = () => {
    if (!textIds.trim()) {
      toast({ title: 'Ошибка', description: 'Введите ID', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    const { validIds, errors } = parseTextIds(textIds);

    if (validIds.length === 0) {
      toast({
        title: 'Ошибка',
        description: errors.length > 0 ? `Невалидные данные: ${errors.slice(0, 3).join(', ')}` : 'Пустой список',
        variant: 'destructive',
      });
      setIsImporting(false);
      return;
    }

    if (errors.length > 0) {
      toast({
        title: 'Предупреждение',
        description: `Пропущено ${errors.length} строк с ошибками`,
      });
    }

    importMutation.mutate(validIds);
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
          onImport={handleImportClick}
          onExportAll={handleExportAll}
          onCopyToClipboard={handleCopyToClipboard}
          onClearAll={handleClearAll}
          totalCount={items.length}
        />
      </div>

      {/* Счётчик ID */}
      <UserIdCount count={items.length} />

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

      {/* Диалог импорта */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Импорт ID</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Добавьте Telegram ID из файла или вставьте списком
          </DialogDescription>
          <div className="space-y-4">
            {/* Переключатель вкладок */}
            <div className="flex gap-2">
              <Button
                variant={importMode === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMode('file')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Файл
              </Button>
              <Button
                variant={importMode === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMode('text')}
                className="flex-1"
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Текст
              </Button>
            </div>

            {importMode === 'file' ? (
              /* Режим файла */
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv,.txt"
                  disabled={isImporting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="csvFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {isImporting ? 'Обработка...' : 'Выберите файл или перетащите'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    CSV или TXT (один ID в строке)
                  </span>
                </label>
              </div>
            ) : (
              /* Режим текста */
              <div className="space-y-2">
                <Label htmlFor="textIds">Список ID</Label>
                <textarea
                  id="textIds"
                  value={textIds}
                  onChange={(e) => setTextIds(e.target.value)}
                  placeholder="123456789&#10;987654321&#10;555666777"
                  disabled={isImporting}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Вставьте список ID, по одному в строке
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
                disabled={isImporting}
              >
                Отмена
              </Button>
              {importMode === 'text' && (
                <Button
                  onClick={handleTextImport}
                  disabled={isImporting || !textIds.trim()}
                >
                  {isImporting ? 'Импорт...' : 'Импортировать'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
