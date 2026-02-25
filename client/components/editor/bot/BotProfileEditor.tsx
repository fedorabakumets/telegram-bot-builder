/**
 * @fileoverview Компонент для редактирования профиля бота
 *
 * Этот компонент предоставляет интерфейс для редактирования
 * имени, описания и краткого описания бота.
 *
 * @module BotProfileEditor
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Edit2, X, Check } from 'lucide-react';

// Типы, определенные в основном файле bot-control.tsx
export type BotInfo = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
  description?: string;
  short_description?: string;
  photoUrl?: string;
  photo?: {
    small_file_id: string;
    small_file_unique_id: string;
    big_file_id: string;
    big_file_unique_id: string;
  };
};

/**
 * Компонент для редактирования профиля бота
 * @param projectId - Идентификатор проекта
 * @param botInfo - Информация о боте
 * @param onProfileUpdated - Колбэк при обновлении профиля
 */
export function BotProfileEditor({
  projectId,
  botInfo,
  onProfileUpdated
}: {
  projectId: number;
  botInfo?: BotInfo | null;
  onProfileUpdated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  // Обновляем состояние когда botInfo загружается
  useEffect(() => {
    if (botInfo) {
      setName(botInfo.first_name || '');
      setDescription(botInfo.description || '');
      setShortDescription(botInfo.short_description || '');
    }
  }, [botInfo]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Мутация для обновления имени бота
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/name`, { name: newName });
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Успешно",
        description: "Имя бота обновлено. Перезапускаем бота для применения изменений...",
      });

      try {
        // Перезапускаем бота для применения нового имени
        await apiRequest('POST', `/api/projects/${projectId}/bot/restart`);

        toast({
          title: "Готово!",
          description: "Бот перезапущен с новым именем",
        });
      } catch (error) {
        // Если перезапуск не удался, просто обновляем данные
        console.warn('Не удалось перезапустить бота:', error);
      }

      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить имя бота",
        variant: "destructive",
      });
    }
  });

  // Мутация для обновления описания бота
  const updateDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/description`, { description: newDescription });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Описание бота обновлено",
      });
      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить описание бота",
        variant: "destructive",
      });
    }
  });

  // Мутация для обновления краткого описания бота
  const updateShortDescriptionMutation = useMutation({
    mutationFn: async (newShortDescription: string) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}/bot/short-description`, { short_description: newShortDescription });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Краткое описание бота обновлено",
      });
      // Инвалидируем кэш и сразу перезагружаем данные
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить краткое описание бота",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    if (!botInfo) {
      toast({
        title: "Ошибка",
        description: "Информация о боте не загружена",
        variant: "destructive",
      });
      return;
    }

    try {
      // Обновляем только те поля, которые изменились
      if (name !== botInfo.first_name) {
        await updateNameMutation.mutateAsync(name);
      }
      if (description !== (botInfo.description || '')) {
        await updateDescriptionMutation.mutateAsync(description);
      }
      if (shortDescription !== (botInfo.short_description || '')) {
        await updateShortDescriptionMutation.mutateAsync(shortDescription);
      }

      setIsOpen(false);
      // Принудительно обновляем данные после сохранения всех изменений
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
    } catch (error) {
      // Ошибки уже обработаны в мутациях
    }
  };

  const handleCancel = () => {
    // Сбрасываем значения к исходным
    setName(botInfo?.first_name || '');
    setDescription(botInfo?.description || '');
    setShortDescription(botInfo?.short_description || '');
    setIsOpen(false);
  };

  const isLoading = updateNameMutation.isPending || updateDescriptionMutation.isPending || updateShortDescriptionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-testid="button-edit-bot-profile"
          disabled={!botInfo}
          title={!botInfo ? "Загрузка информации о боте..." : "Редактировать профиль бота"}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать профиль бота</DialogTitle>
          <DialogDescription className="sr-only">
            Измените имя, описание и аватар бота
          </DialogDescription>
        </DialogHeader>

        {/* Предупреждение о тестовом режиме */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
          <i className="fas fa-flask text-amber-600 dark:text-amber-400 text-sm mt-0.5 flex-shrink-0"></i>
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
              Функция находится в тестовом режиме
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
              Редактирование профиля может временно не работать
            </p>
          </div>
        </div>

        <div className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="bot-name">Имя бота</Label>
            <Input
              id="bot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя бота"
              maxLength={64}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 64 символа. Это имя будет отображаться в Telegram.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-short-description">Краткое описание</Label>
            <Input
              id="bot-short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Краткое описание бота"
              maxLength={120}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 120 символов. Отображается в профиле и предпросмотрах ссылок.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-description">Полное описание</Label>
            <Textarea
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Полное описание бота"
              maxLength={512}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Максимум 512 символов. Отображается в пустых чатах с ботом.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}