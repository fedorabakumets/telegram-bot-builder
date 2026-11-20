/** @fileoverview Подтверждаемое удаление карточек без личных сообщений и нажатий. */
import type { BotToken } from '@shared/schema';
import { CheckBotScopeSelect } from '../components/check-history/check-bot-scope-select';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
/** Точные количества области, показанные перед подтверждением. */
interface Counts {
  /** Люди без личных обращений. */ people: number;
  /** Отдельные карточки ботов. */ botRecords: number;
}
/** Показывает предварительный подсчёт и удаляет карточки только после явного подтверждения. @param props - Область пользователей. @returns Кнопка и окно подтверждения. */
export function DeleteWithoutPrivateButton({ projectId, tokenId, kind = 'without-private' }: {
  /** Удалять аккаунты с подтверждённым удалением либо пользователей без личной переписки. */ kind?: 'without-private' | 'deleted';
  /** Текущий проект. */ projectId: number;
  /** Выбранный бот либо все боты проекта. */ tokenId: number | null;
}) {
  const deleted = kind === 'deleted';
  const title = deleted ? 'Удалить удалённые аккаунты' : 'Удалить тех, кто без сообщений';
  const [open,setOpen] = useState(false);
  const [selectedTokenId,setSelectedTokenId] = useState(tokenId);
  const client = useQueryClient();
  const { toast } = useToast();
  const url = `/api/projects/${projectId}/users/${deleted?'deleted-accounts':'without-private-messages'}${selectedTokenId===null ? '' : `?tokenId=${selectedTokenId}`}`;
  const tokens = useQuery<BotToken[]>({queryKey:[`/api/projects/${projectId}/tokens`],queryFn:()=>apiRequest('GET',`/api/projects/${projectId}/tokens`),enabled:open});
  const preview = useQuery<Counts>({ queryKey:[url],queryFn:()=>apiRequest('GET',url),enabled:open,staleTime:0 });
  useEffect(()=>{setOpen(false);setSelectedTokenId(tokenId);},[projectId,tokenId,kind]);
  const remove = useMutation({
    mutationFn:()=>apiRequest('DELETE',url,preview.data),
    onSuccess:(result:Counts)=>{
      setOpen(false);
      toast({title:`Удалено пользователей: ${result.people.toLocaleString('ru-RU')}`});
      void client.invalidateQueries({predicate:query=>query.queryKey[1]===projectId
        || typeof query.queryKey[0]==='string' && query.queryKey[0].startsWith(`/api/projects/${projectId}/`)});
    },
  });
  return <Dialog open={open} onOpenChange={value=>{if (!remove.isPending) setOpen(value);}}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="users-cleanup-trigger h-8 gap-2 text-xs text-muted-foreground"
      onClick={()=>{remove.reset();setSelectedTokenId(tokenId);}}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />{title}</Button></DialogTrigger>
    {/** Обычный диалог закрывается снаружи и по Escape; активное удаление нельзя прервать закрытием. */}
    <DialogContent hideClose className="users-portal gap-3 p-5 sm:max-w-md"
      onEscapeKeyDown={event=>{if(remove.isPending) event.preventDefault();}}
      onInteractOutside={event=>{if(remove.isPending) event.preventDefault();}}>
      <DialogClose asChild><button type="button" aria-label="Закрыть" disabled={remove.isPending}
        className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><X className="h-4 w-4" aria-hidden="true" /></button></DialogClose>
      <DialogHeader><DialogTitle className="pr-6">{title}?</DialogTitle>
        <DialogDescription>{deleted ? 'Удалим пользователей со статусом «Аккаунт удалён» вместе с их переменными. История сообщений сохранится.'
          : 'Удалим пользователей без входящих личных сообщений и нажатий вместе с их переменными. История сообщений в группах сохранится.'}</DialogDescription>
      </DialogHeader>
      <CheckBotScopeSelect tokens={tokens.data??[]} value={selectedTokenId??'all'} label="Бот для удаления" disabled={remove.isPending||tokens.isPending}
        onChange={value=>{remove.reset();setSelectedTokenId(value==='all'?null:value);}} />
      {tokens.isError && <p role="alert" className="text-sm text-destructive">Не удалось загрузить ботов. Обновите окно.</p>}
      {preview.isFetching ? <p className="text-sm text-muted-foreground">Подсчитываем пользователей…</p> : preview.isError
        ? <p role="alert" className="text-sm text-destructive">Не удалось получить количество.</p>
        : <p className="text-sm tabular-nums">Пользователей к удалению: <strong>{preview.data?.people.toLocaleString('ru-RU') ?? '—'}</strong></p>}
      <p className="text-xs text-muted-foreground">{!deleted && 'При новом событии пользователь может появиться снова. '}Удаление нельзя отменить.</p>
      {selectedTokenId===null && <p className="text-xs text-muted-foreground">{deleted ? 'Удалятся только пользователи с удалённым аккаунтом во всех ботах проекта. Другие статусы сохранятся.' : 'Пользователи с личным обращением хотя бы к одному боту проекта сохранятся.'}</p>}
      <p className="text-xs text-muted-foreground">Остальные фильтры таблицы не учитываются.</p>
      {remove.isError && <p role="alert" className="text-sm text-destructive">{remove.error.message}</p>}
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline" disabled={remove.isPending}>Отмена</Button></DialogClose>
        <Button type="button" variant="outline" disabled={remove.isPending || preview.isFetching} onClick={()=>{remove.reset();void preview.refetch();}}>Обновить</Button>
        <Button type="button" variant="outline" className="text-destructive" disabled={remove.isPending || preview.isFetching || preview.isError || !preview.data?.people}
          onClick={()=>remove.mutate()}>{remove.isPending ? 'Удаление…' : 'Удалить'}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
