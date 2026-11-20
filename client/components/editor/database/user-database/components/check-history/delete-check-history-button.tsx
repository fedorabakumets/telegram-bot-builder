/** @fileoverview Подтверждаемая очистка завершённых проверок выбранного вида и области. */
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckHistoryKind } from '@shared/check-history';
import { apiRequest } from '@/queryClient';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
/** Показывает очистку истории без воздействия на текущую проверку. @param props - Область и обновление списка. @returns Кнопка и подтверждение поверх окна проверки. */
export function DeleteCheckHistoryButton({ projectId, tokenId, kind, onDeleted }: {
  /** Разрешённый проект. */ projectId: number;
  /** Участник проверок либо все боты. */ tokenId: number | null;
  /** Вид удаляемых проверок. */ kind: CheckHistoryKind;
  /** Возврат к обновлённому списку. */ onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const client = useQueryClient();
  useEffect(() => { setConfirm(false); }, [projectId, tokenId, kind]);
  const remove = useMutation({
    mutationFn: () => {
      const query = new URLSearchParams({ kind });
      if (tokenId !== null) query.set('tokenId', String(tokenId));
      return apiRequest('DELETE', `/api/projects/${projectId}/check-history?${query}`);
    },
    onSuccess: () => {
      setConfirm(false); onDeleted();
      void client.invalidateQueries({ queryKey: ['check-history', projectId] });
      client.removeQueries({ queryKey: ['check-history-detail', projectId] });
    },
  });
  return <AlertDialog open={confirm} onOpenChange={open => { if (!remove.isPending) setConfirm(open); }}>
    <Button type="button" variant="outline" size="sm" className="h-8 gap-2 text-muted-foreground" onClick={() => { remove.reset(); setConfirm(true); }}><Trash2 className="h-4 w-4" />Удалить историю</Button>
    {/** Портал располагает подтверждение выше окна проверки, сохраняя его открытым на заднем плане. */}
    <AlertDialogContent className="users-portal z-[60] gap-3 p-5 sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>Удалить историю проверок?</AlertDialogTitle>
        <AlertDialogDescription>Удалится завершённая история {kind === 'private-chats' ? 'проверок личных чатов' : 'проверок ботов'} {tokenId === null ? 'всего проекта' : `с участием бота #${tokenId}`}. Это действие нельзя отменить. Текущие проверки и данные пользователей сохранятся.</AlertDialogDescription>
      </AlertDialogHeader>
      {tokenId !== null && <p className="text-xs text-muted-foreground">Общие проверки с участием этого бота удалятся целиком.</p>}
      {remove.isError && <p role="alert" className="text-sm text-destructive">Не удалось удалить историю. Повторите попытку.</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={remove.isPending}>Отмена</AlertDialogCancel>
        <Button type="button" variant="outline" className="text-destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? 'Удаление…' : 'Удалить'}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
