/**
 * @fileoverview Подтверждение перезапуска ботов со старой группировкой.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger } from '@/components/ui/alert-dialog';

/** Итог пакетного перезапуска. */
interface RestartResult {
  /** Успешно перезапущенные боты */
  restarted: number;
  /** Неудачные попытки */
  failed: number;
  /** Сообщения об ошибках */
  errors: string[];
}

/** Показывает подтверждение и отправляет команду только после согласия администратора. */
export function RestartPendingWorkersButton({ count }: { count: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const restart = useMutation<RestartResult>({
    mutationFn: () => apiRequest('POST', '/admin/api/runtime-settings/workers/restart-pending'),
    onSuccess: (result) => {
      toast({ title: `Перезапущено: ${result.restarted}`, description: result.failed
        ? `Ошибок: ${result.failed}. ${result.errors.join(' ')}` : undefined,
        variant: result.failed ? 'destructive' : 'default' });
      void queryClient.invalidateQueries({ queryKey: ['/admin/api/runtime-settings/workers/status'] });
    },
    onError: (error: Error) => toast({ title: 'Перезапуск не выполнен', description: error.message, variant: 'destructive' }),
  });
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button size="sm" variant="outline" disabled={restart.isPending}>Перезапустить ожидающих</Button></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Перезапустить {count} {count === 1 ? 'бота' : 'ботов'}?</AlertDialogTitle>
        <AlertDialogDescription>Боты кратковременно остановятся. Сервер ещё раз проверит, какие из них работают в прежней группировке, и перезапустит только их.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel>
        <AlertDialogAction onClick={() => restart.mutate()}>Перезапустить</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
