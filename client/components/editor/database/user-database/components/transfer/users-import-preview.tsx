/** @fileoverview Предпросмотр выбранного исходного бота и итогов безопасного импорта. */
import type { UserTransferDocument } from '@shared/user-transfer';
import type { UserImportResult } from './users-import-dialog';
/** Показывает первые строки и серверные итоги. @param props - Файл, исходный бот и результат. @returns Предпросмотр. */
export function UsersImportPreview({ document, sourceTokenId, name, result }: {
  /** Прочитанный документ. */ document: UserTransferDocument;
  /** Бот данных из файла. */ sourceTokenId?: number;
  /** Название файла. */ name: string;
  /** Расчёт либо применённые изменения. */ result: UserImportResult | null;
}) {
  const users = document.users.filter(user => !sourceTokenId || user.tokenId === sourceTokenId || user.memberships?.some(bot => bot.tokenId === sourceTokenId));
  return <div className="space-y-2">
    <p className="text-sm text-muted-foreground break-all">{name} · Пользователей: {users.length.toLocaleString('ru-RU')}</p>
    {result && <div className="rounded-lg border border-border p-3 text-sm" role="status">
      <p className="mb-2 font-medium">{result.applied ? 'Импорт завершён' : 'Результат проверки'}</p>
      <dl className="grid grid-cols-3 gap-3">{[['Новых', result.created], ['Дополнено', result.updated], ['Без изменений', result.unchanged]].map(([label, count]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 tabular-nums">{Number(count).toLocaleString('ru-RU')}</dd></div>)}</dl>
    </div>}
    <div className="max-h-32 overflow-auto rounded-lg border border-border"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="px-3 py-2 font-medium">Telegram ID</th><th className="px-3 py-2 font-medium">Пользователь</th><th className="px-3 py-2 font-medium">Переменные</th></tr></thead>
      <tbody>{users.slice(0, 10).map((user, index) => {
        const data = user.memberships?.find(bot => bot.tokenId === sourceTokenId) ?? user;
        return <tr key={`${user.userId}:${index}`} className="border-b border-border last:border-0"><td className="px-3 py-2 tabular-nums">{user.userId}</td><td className="px-3 py-2">{[data.firstName || user.firstName, data.lastName || user.lastName].filter(Boolean).join(' ') || user.userName || '—'}</td><td className="px-3 py-2 tabular-nums">{Object.keys(data.userData ?? {}).length}</td></tr>;
      })}</tbody></table></div>
    {users.length > 10 && <p className="text-xs text-muted-foreground">Показаны первые 10 пользователей</p>}
  </div>;
}
