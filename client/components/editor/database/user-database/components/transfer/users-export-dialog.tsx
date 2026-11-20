/** @fileoverview Экспорт полной выборки пользователей с выбором состава полей. */
import { useEffect, useRef, useState } from 'react';
import { USER_TRANSFER_FIELDS, createUserTransfer, serializeUserTransfer, type UserTransferField } from '@shared/user-transfer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadFile } from '@/components/editor/tables/utils/download-file';
import { exportUsers } from './users-export';
/** Свойства экспорта пользователей. */
interface UsersExportDialogProps {
  /** Проект источника. */ projectId: number;
  /** Название файла. */ projectName: string;
  /** Бот источника либо все боты. */ tokenId: number | null;
  /** Название выбранного бота для области выгрузки. */ botName?: string;
  /** Текущие условия поиска. */ query: Record<string, string>;
  /** Число найденных людей. */ total?: number;
  /** Закрытие формы. */ onClose: () => void;
}
/** Выгружает все страницы после выбора полей. @param props - Область выгрузки. @returns Диалог экспорта. */
export function UsersExportDialog({ projectId, projectName, tokenId, botName, query, total, onClose }: UsersExportDialogProps) {
  /** Проект и бот выводятся внутри выбранной области без обрезки названия. */
  const sourceLabel = tokenId ? `${botName || 'Бот'} #${tokenId}` : 'Все боты';
  const contextLabel = `${projectName} #${projectId} · ${sourceLabel}`;
  const [fields, setFields] = useState<UserTransferField[]>(USER_TRANSFER_FIELDS.map(field => field.id));
  const [scope, setScope] = useState('filtered'), [format, setFormat] = useState<'json' | 'csv'>('json');
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const [progress, setProgress] = useState<{ /** Загружено людей. */ loaded: number; /** Общий итог. */ total: number } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  /** Отменяет загрузку при закрытии диалога. */
  function close() { controller.current?.abort(); onClose(); }
  /** Загружает все страницы и сохраняет только отмеченные группы. */
  async function save() {
    const request = new AbortController(); controller.current = request; setPending(true); setError(''); setProgress(null);
    try {
      const users = await exportUsers({ projectId, tokenId, query: scope === 'filtered' ? query : {}, signal: request.signal,
        onProgress: (loaded, total) => setProgress({ loaded, total }) });
      const document = createUserTransfer(users as unknown as Record<string, unknown>[], fields, tokenId);
      const name = projectName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80) || 'Пользователи';
      downloadFile(serializeUserTransfer(document, format), `${name}-пользователи.${format}`, format === 'json' ? 'application/json' : 'text/csv;charset=utf-8');
      onClose();
    } catch (cause) { if (!request.signal.aborted) setError(cause instanceof Error ? cause.message : 'Не удалось выполнить экспорт'); }
    finally { if (!request.signal.aborted) setPending(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="users-portal max-h-[85vh] gap-3 overflow-y-auto p-5 sm:max-w-xl">
    <DialogHeader><DialogTitle>Экспорт пользователей</DialogTitle><DialogDescription>ID и привязка к ботам сохраняются всегда.</DialogDescription></DialogHeader>
    {/** Выборке отведена полная ширина: длинные названия переносятся внутри селектора. */}
    <div className="grid grid-cols-1 gap-3">
    <label className="min-w-0 space-y-1 text-sm"><span>Выборка</span><Select value={scope} onValueChange={setScope} disabled={pending}>
      <SelectTrigger aria-label="Область экспорта" className="h-auto min-h-9 py-2 text-left [&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:whitespace-normal [&>span]:break-words [&>span]:[overflow-wrap:anywhere]"><SelectValue /></SelectTrigger><SelectContent className="users-portal">
        <SelectItem value="filtered">Текущая выборка{total === undefined ? '' : ` · ${total.toLocaleString('ru-RU')}`} — {contextLabel}</SelectItem>
        <SelectItem value="all">Все пользователи — {contextLabel}</SelectItem>
      </SelectContent></Select></label>
    <label className="min-w-0 space-y-1 text-sm"><span>Формат</span><Select value={format} onValueChange={value => setFormat(value as 'json' | 'csv')} disabled={pending}>
      <SelectTrigger aria-label="Формат экспорта" className="h-9 [&>span]:truncate"><SelectValue /></SelectTrigger><SelectContent className="users-portal"><SelectItem value="json">JSON — для импорта</SelectItem><SelectItem value="csv">CSV — для таблиц</SelectItem></SelectContent>
    </Select></label></div>
    <fieldset disabled={pending} className="space-y-2"><legend className="mb-2 text-sm font-medium">Что экспортировать</legend>
      {/** Общие действия меняют только дополнительные поля; Telegram ID и связи сохраняются всегда. */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8" disabled={pending || fields.length === USER_TRANSFER_FIELDS.length}
          onClick={() => setFields(USER_TRANSFER_FIELDS.map(field => field.id))}>Выбрать всё</Button>
        <Button type="button" variant="outline" size="sm" className="h-8" disabled={pending || fields.length === 0}
          onClick={() => setFields([])}>Снять всё</Button>
      </div>
      {/** Telegram ID обязателен для сопоставления людей и не снимается общими действиями. */}
      <label className="flex min-h-6 items-center gap-2 text-sm" title="Telegram ID нужен для импорта и проверки дублей">
        <input type="checkbox" checked disabled className="h-4 w-4 shrink-0 accent-blue-500" />Telegram ID — обязательно
      </label>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">{USER_TRANSFER_FIELDS.map(field => <label key={field.id} className="flex min-h-6 cursor-pointer items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500" checked={fields.includes(field.id)} onChange={event => setFields(current => event.target.checked ? [...current, field.id] : current.filter(id => id !== field.id))} />{field.label}
      </label>)}</div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {pending && progress && <p role="status" className="text-sm text-muted-foreground">Загружено {progress.loaded.toLocaleString('ru-RU')} из {progress.total.toLocaleString('ru-RU')}</p>}
    <div className="flex justify-end gap-3"><Button variant="ghost" onClick={close}>Отмена</Button><Button variant="outline" disabled={pending} onClick={() => { void save(); }}>{pending ? 'Подготовка файла…' : 'Скачать файл'}</Button></div>
  </DialogContent></Dialog>;
}
