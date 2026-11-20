/** @fileoverview Независимый выбор поддерживаемых полей импорта с обязательным Telegram ID. */
import type { UserTransferDocument, UserTransferUser } from '@shared/user-transfer';
import { Button } from '@/components/ui/button';
/** Поля, которые сервер разрешает дополнять при импорте. */
export const IMPORT_FIELDS = [
  { id: 'firstName', label: 'Имя' }, { id: 'lastName', label: 'Фамилия' },
  { id: 'userName', label: 'Username' }, { id: 'languageCode', label: 'Язык Telegram' },
  { id: 'isPremium', label: 'Telegram Premium' }, { id: 'deepLinkParam', label: 'Параметр ссылки /start' },
  { id: 'referrerId', label: 'ID пригласившего' }, { id: 'userData', label: 'Переменные' },
] as const;
/** Название разрешённого поля. */
export type ImportField = typeof IMPORT_FIELDS[number]['id'];
/** Оставляет выбранные значения в профиле и каждой связи, сохраняя исходных ботов. @param document - Файл. @param fields - Выбранные поля. @returns Строки для запроса и предпросмотра. */
export function selectImportFields(document: UserTransferDocument, fields: ImportField[]): UserTransferUser[] {
  return document.users.map(user => ({
    userId: user.userId, tokenId: user.tokenId,
    ...Object.fromEntries(fields.filter(field => user[field] !== undefined).map(field => [field, user[field]])),
    memberships: user.memberships?.map(bot => ({ tokenId: bot.tokenId, name: bot.name, username: bot.username,
      ...Object.fromEntries(fields.filter(field => bot[field] !== undefined).map(field => [field, bot[field]])),
    })),
  }));
}
/** Показывает компактные галочки в стиле экспорта. @param props - Выбор и обработчик. @returns Список полей. */
export function UsersImportFields({ fields, disabled, onChange }: {
  /** Выбранные поля. */ fields: ImportField[];
  /** Запрет изменения во время записи. */ disabled: boolean;
  /** Обновляет выбор и сбрасывает прежний расчёт. */ onChange: (fields: ImportField[]) => void;
}) {
  return <fieldset className="space-y-2" disabled={disabled}>
    <legend className="mb-2 text-sm font-medium">Что импортировать</legend>
    <div className="flex gap-2"><Button type="button" variant="outline" size="sm" className="h-8" disabled={disabled || fields.length === IMPORT_FIELDS.length} onClick={() => onChange(IMPORT_FIELDS.map(field => field.id))}>Выбрать всё</Button>
      <Button type="button" variant="outline" size="sm" className="h-8" disabled={disabled || !fields.length} onClick={() => onChange([])}>Снять всё</Button></div>
    <label className="flex min-h-6 items-center gap-2 text-sm"><input type="checkbox" checked disabled className="h-4 w-4 shrink-0 accent-blue-500" />Telegram ID — обязательно</label>
    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">{IMPORT_FIELDS.map(field => <label key={field.id} className="flex min-h-6 cursor-pointer items-start gap-2 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500" checked={fields.includes(field.id)} onChange={event => onChange(event.target.checked ? [...fields, field.id] : fields.filter(id => id !== field.id))} />{field.label}
    </label>)}</div>
  </fieldset>;
}
