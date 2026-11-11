/**
 * @fileoverview Настройка хранения истории версий и запуск переноса в S3.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArchiveRestore, Database, HardDrive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/** Ответ настройки и счётчиков версий. */
interface VersionStorageView {
  /** Выбранное место записи новых версий. */
  mode: 'postgres' | 's3';
  /** ID выделенного бакета. */
  storageId: string | null;
  /** Приватные S3 хранилища без секретов. */
  stores: { id: string; name: string }[];
  /** Счётчики истории по состояниям. */
  counts: { postgres: number; pending: number; s3: number; retries: number };
  /** Продолжается ли постановка старых версий в очередь. */
  migrating: boolean;
}

/**
 * Показывает выбор хранилища и перенос старых снимков.
 * @returns JSX страницы администратора
 */
export function AdminVersionStoragePage() {
  const { toast } = useToast();
  const client = useQueryClient();
  const query = useQuery<VersionStorageView>({ queryKey: ['/admin/api/version-storage'],
    queryFn: () => apiRequest('GET', '/admin/api/version-storage'),
    refetchInterval: current => current.state.data?.migrating || current.state.data?.counts.pending ? 5000 : 30000 });
  const [mode, setMode] = useState<'postgres' | 's3'>('postgres');
  const [storageId, setStorageId] = useState('');
  useEffect(() => { if (query.data) { setMode(query.data.mode); setStorageId(query.data.storageId || ''); } },
    [query.data?.mode, query.data?.storageId]);
  const save = useMutation({ mutationFn: () => apiRequest('PUT', '/admin/api/version-storage', { mode, storageId }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['/admin/api/version-storage'] }); toast({ title: 'Место хранения сохранено' }); },
    onError: (error: Error) => toast({ title: 'Не удалось сохранить', description: error.message, variant: 'destructive' }) });
  const migrate = useMutation({ mutationFn: () => apiRequest('POST', '/admin/api/version-storage/migrate'),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['/admin/api/version-storage'] }); toast({ title: 'Перенос запущен' }); },
    onError: (error: Error) => toast({ title: 'Не удалось начать перенос', description: error.message, variant: 'destructive' }) });

  if (!query.data) return <div className="flex items-center gap-2 text-muted-foreground">
    {query.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}{query.error ? 'Не удалось загрузить настройки версий' : 'Загрузка…'}
  </div>;
  const data = query.data;
  const savedS3 = data.mode === 's3' && mode === 's3' && storageId === data.storageId;
  const working = data.migrating || data.counts.pending > 0;
  return <div className="max-w-3xl space-y-6">
    <div><h1 className="text-2xl font-bold">История версий</h1>
      <p className="mt-1 text-muted-foreground">Выберите, где сохранять новые снимки проектов.</p></div>
    <Card><CardHeader><CardTitle>Место хранения</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" aria-pressed={mode === 'postgres'} onClick={() => setMode('postgres')}
          className={`rounded-lg border p-4 text-left transition-colors ${mode === 'postgres' ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}>
          <Database className="mb-3 h-5 w-5" /><strong className="block">PostgreSQL</strong>
          <span className="text-sm text-muted-foreground">Полный снимок остаётся в базе данных.</span></button>
        <button type="button" aria-pressed={mode === 's3'} onClick={() => setMode('s3')}
          className={`rounded-lg border p-4 text-left transition-colors ${mode === 's3' ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}>
          <HardDrive className="mb-3 h-5 w-5" /><strong className="block">S3</strong>
          <span className="text-sm text-muted-foreground">Новые снимки сразу записываются в бакет. При сбое S3 они временно остаются в PostgreSQL.</span></button>
      </div>
      {mode === 's3' && <label className="block space-y-2 text-sm font-medium">Приватное S3-хранилище
        <select className="w-full rounded-md border bg-background px-3 py-2" value={storageId}
          onChange={event => setStorageId(event.target.value)}>
          <option value="">Выберите хранилище</option>
          {data.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select></label>}
      <Button disabled={save.isPending || (mode === 's3' && !storageId)} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Сохранить выбор</Button>
      <p className="text-sm text-muted-foreground">Ранее сохранённые версии остаются доступными в прежнем хранилище.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Перенос существующих версий</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([['В PostgreSQL', data.counts.postgres], ['В очереди', data.counts.pending],
          ['В S3', data.counts.s3], ['Повторные попытки', data.counts.retries]] as const).map(([label, count]) =>
          <div className="rounded-lg border p-3" key={label}><div className="text-2xl font-semibold">{count}</div>
            <div className="text-sm text-muted-foreground">{label}</div></div>)}</div>
      <p className="text-sm text-muted-foreground">Перенос старых снимков выполняется в фоне. До проверки объекта они остаются в базе данных.</p>
      {mode === 's3' && <Button variant="outline" disabled={!savedS3 || migrate.isPending || working || data.counts.postgres === 0}
        onClick={() => migrate.mutate()}><ArchiveRestore className="mr-2 h-4 w-4" />
        {working ? 'Перенос выполняется' : 'Мигрировать версии в S3'}</Button>}
    </CardContent></Card>
  </div>;
}
