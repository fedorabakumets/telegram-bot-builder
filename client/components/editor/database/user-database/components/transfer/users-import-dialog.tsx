/** @fileoverview Импорт JSON с выбором ботов и серверным предпросмотром безопасного объединения. */
import { useState } from 'react';
import type { BotToken } from '@shared/schema';
import { parseUserTransfer, type UserTransferDocument } from '@shared/user-transfer';
import { apiRequest } from '@/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UsersImportPreview } from './users-import-preview';
import { IMPORT_FIELDS, UsersImportFields, selectImportFields, type ImportField } from './users-import-fields';
/** Серверные итоги проверки либо записи. */
export interface UserImportResult {
  /** Число строк. */ total: number;
  /** Новые пользователи. */ created: number;
  /** Пользователи с дополнениями. */ updated: number;
  /** Пользователи без изменений. */ unchanged: number;
  /** Выполнена ли запись. */ applied: boolean;
}
/** Параметры импорта текущего проекта. */
interface UsersImportDialogProps {
  /** Проект назначения. */ projectId: number;
  /** Выбранный бот назначения. */ tokenId: number | null;
  /** Доступные боты проекта. */ tokens: BotToken[];
  /** Закрытие формы. */ onClose: () => void;
  /** Обновление таблицы после записи. */ onRefresh: () => void;
}
/** Проверяет файл до записи в явно выбранного бота. @param props - Назначение и действия. @returns Диалог импорта. */
export function UsersImportDialog({ projectId, tokenId, tokens, onClose, onRefresh }: UsersImportDialogProps) {
  const [fields, setFields] = useState<ImportField[]>(IMPORT_FIELDS.map(field => field.id));
  const [target, setTarget] = useState(tokenId ? String(tokenId) : '');
  const [source, setSource] = useState('');
  const [document, setDocument] = useState<UserTransferDocument | null>(null);
  const [name, setName] = useState(''), [error, setError] = useState('');
  const [result, setResult] = useState<UserImportResult | null>(null), [pending, setPending] = useState(false);
  const sourceBots = new Map<number, string>();
  document?.users.forEach(user => {
    if (user.tokenId) sourceBots.set(user.tokenId, `Бот #${user.tokenId}`);
    user.memberships?.forEach(bot => sourceBots.set(bot.tokenId, `${bot.name || bot.username || 'Бот'} #${bot.tokenId}`));
  });
  /** Читает только поддерживаемый JSON и сбрасывает прежнее подтверждение. */
  async function read(file: File) {
    setDocument(null); setResult(null); setError(''); setSource(''); setName(file.name);
    try {
      if (!/\.json$/i.test(file.name)) throw new Error('Для импорта выберите JSON, скачанный через экспорт пользователей');
      if (file.size > 5 * 1024 * 1024) throw new Error('Файл превышает 5 МБ. Разделите выгрузку на части');
      const data = parseUserTransfer(await file.text());
      if (!data.users.length) throw new Error('В файле нет пользователей');
      if (data.users.length > 10_000) throw new Error('За один импорт можно загрузить до 10 000 пользователей');
      const ids = new Set(data.users.flatMap(user => user.memberships?.length ? user.memberships.map(bot => bot.tokenId) : user.tokenId ? [user.tokenId] : []));
      setSource(ids.size === 1 ? String([...ids][0]) : ''); setDocument(data);
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'Файл содержит некорректный JSON'
        : cause instanceof Error && cause.name !== 'ZodError' ? cause.message : 'Структура файла не соответствует экспорту пользователей');
    }
  }
  /** Запрашивает расчёт изменений либо применяет уже просмотренный импорт. */
  async function submit(apply: boolean) {
    if (!document || !target || (sourceBots.size > 0 && !source)) return;
    setPending(true); setError('');
    try {
      const response: UserImportResult = await apiRequest('POST', `/api/projects/${projectId}/users/import`, {
        tokenId: Number(target), sourceTokenId: source ? Number(source) : undefined, users: selectImportFields(document, fields), apply,
      });
      setResult(response); if (response.applied) onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Импорт не выполнен'); }
    finally { setPending(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="users-portal max-h-[85vh] gap-3 overflow-y-auto p-5 sm:max-w-xl">
    <DialogHeader><DialogTitle>Импорт пользователей</DialogTitle><DialogDescription>JSON до 5 МБ и 10 000 пользователей. Выбранные данные дополнят существующие; статистика и статусы сохранятся.</DialogDescription></DialogHeader>
    <label className="min-w-0 space-y-1 text-sm"><span>Файл пользователей</span><input type="file" accept=".json,application/json" aria-label="Файл пользователей" disabled={pending || result?.applied} className="block w-full rounded-lg border border-border p-2 text-sm" onChange={event => { const file = event.target.files?.[0]; if (file) void read(file); }} /></label>
    {/** Исходный и целевой боты расположены рядом, как выборка и формат экспорта. */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="min-w-0 space-y-1 text-sm"><span>Бот назначения</span><Select value={target} disabled={pending || result?.applied} onValueChange={value => { setTarget(value); setResult(null); }}>
      <SelectTrigger className="h-9 [&>span]:truncate" aria-label="Бот назначения импорта"><SelectValue placeholder="Выберите бота" /></SelectTrigger><SelectContent className="users-portal">{tokens.map(bot => <SelectItem key={bot.id} value={String(bot.id)}>{bot.botFirstName || bot.botUsername || bot.name} #{bot.id}</SelectItem>)}</SelectContent>
    </Select></label>
    {document && sourceBots.size > 0 && <label className="min-w-0 space-y-1 text-sm"><span>Бот из файла</span><Select value={source} disabled={pending || result?.applied} onValueChange={value => { setSource(value); setResult(null); }}>
      <SelectTrigger className="h-9 [&>span]:truncate" aria-label="Исходный бот из файла"><SelectValue placeholder="Выберите исходного бота" /></SelectTrigger><SelectContent className="users-portal">{[...sourceBots].map(([id, label]) => <SelectItem key={id} value={String(id)}>{label}</SelectItem>)}</SelectContent>
    </Select></label>}
    </div>
    <UsersImportFields fields={fields} disabled={pending || !!result?.applied} onChange={value => { setFields(value); setResult(null); }} />
    {document && <UsersImportPreview document={{ ...document, users: selectImportFields(document, fields) }} sourceTokenId={source ? Number(source) : undefined} name={name} result={result} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3"><Button variant="ghost" disabled={pending} onClick={onClose}>{result?.applied ? 'Готово' : 'Отмена'}</Button>
      {!result?.applied && <Button variant="outline" disabled={pending || !document || !target || (sourceBots.size > 0 && !source)} onClick={() => { void submit(!!result); }}>{pending ? 'Обработка…' : result ? 'Импортировать пользователей' : 'Проверить импорт'}</Button>}
    </div>
  </DialogContent></Dialog>;
}
