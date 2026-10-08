/**
 * @fileoverview Кнопка проверки сохранённых настроек доставки бэкапов в Telegram.
 */
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/** Свойства кнопки проверки */
interface Props {
  /** Настройки ещё не сохранены или сохраняются */
  disabled: boolean;
}

/**
 * Проверяет доставку небольшим файлом без содержимого базы.
 * @param props - Состояние формы настроек
 * @returns Кнопка проверки Telegram
 */
export function BackupTelegramTestButton({ disabled }: Props) {
  const { toast } = useToast();
  const test = useMutation({
    mutationFn: () => apiRequest('POST', '/admin/api/runtime-settings/backups/telegram/test'),
    onSuccess: () => toast({ title: 'Проверочный файл отправлен в Telegram' }),
    onError: (error: Error) => toast({ title: 'Отправка не выполнена', description: error.message, variant: 'destructive' }),
  });
  return <Button type="button" variant="outline" disabled={disabled || test.isPending}
    title="Используются сохранённые настройки. Сначала сохраните изменения."
    onClick={() => test.mutate()}>
    {test.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
    Проверить Telegram
  </Button>;
}
