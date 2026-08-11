/**
 * @fileoverview Боковая панель редактирования профиля бота (token-scoped)
 * @module BotProfileSheet
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { X, Check } from 'lucide-react';
import type { BotInfo } from '../bot-types';

/**
 * Редактирует name / description / shortDescription через
 * PUT …/tokens/{tokenId}/bot-info.
 * @param props - projectId, tokenId, botInfo, open/close
 * @returns JSX
 */
export function BotProfileSheet({
  projectId,
  tokenId,
  botInfo,
  onProfileUpdated,
  isOpen,
  onClose,
}: {
  projectId: number;
  tokenId: number | null;
  botInfo?: BotInfo | null;
  onProfileUpdated: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (botInfo) {
      setName(botInfo.first_name || '');
      setDescription(botInfo.description || '');
      setShortDescription(botInfo.short_description || '');
    }
  }, [botInfo, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tokenId) throw new Error('Не выбран токен бота');
      if (!botInfo) throw new Error('Информация о боте не загружена');
      const base = `/api/projects/${projectId}/tokens/${tokenId}/bot-info`;
      if (name !== botInfo.first_name) {
        await apiRequest('PUT', base, { field: 'name', value: name });
      }
      if (description !== (botInfo.description || '')) {
        await apiRequest('PUT', base, { field: 'description', value: description });
      }
      if (shortDescription !== (botInfo.short_description || '')) {
        await apiRequest('PUT', base, { field: 'shortDescription', value: shortDescription });
      }
    },
    onSuccess: async () => {
      toast({ title: 'Успешно', description: 'Профиль бота обновлён' });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
      onProfileUpdated();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить профиль',
        variant: 'destructive',
      });
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать профиль бота</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Имя бота</Label>
            <Input id="bot-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-short-description">Краткое описание</Label>
            <Input
              id="bot-short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-description">Полное описание</Label>
            <Textarea
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={512}
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !tokenId}>
              <Check className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
