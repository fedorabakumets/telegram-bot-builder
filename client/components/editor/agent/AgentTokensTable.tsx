/**
 * @fileoverview Адаптивный список токенов MCP с правами, датами и отзывом доступа.
 */
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/components/editor/database/user-database/utils/format-relative-time";
import type { AgentTokenDto } from "./agent-token-types";

/** Свойства списка токенов агента. */
export interface AgentTokensTableProps {
  /** Список токенов. */
  tokens: AgentTokenDto[];
  /** Обработчик запроса отзыва токена. */
  onRevoke: (token: AgentTokenDto) => void;
}

/**
 * Отображает токены карточками, помещающимися в узкой панели редактора.
 * @param props - Токены и обработчик отзыва доступа.
 * @returns Адаптивный список или подсказка по созданию первого токена.
 */
export function AgentTokensTable({ tokens, onRevoke }: AgentTokensTableProps) {
  if (tokens.length === 0) {
    return (
      <div className="agent-surface space-y-2 rounded-xl border border-dashed p-6">
        <p className="text-base font-semibold">Подключите свой ИИ клиент</p>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">Создайте первый токен и добавьте его в настройки MCP вашего клиента. Для Telegram Agent отдельный токен не нужен.</p>
      </div>
    );
  }
  return (
    <ul aria-label="Токены MCP" className="grid gap-3">
      {tokens.map((token) => (
        <li key={token.id} className="agent-token agent-surface grid gap-4 rounded-xl border p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h4 className="break-words text-base font-semibold">{token.label}</h4>
              <p className="break-all font-mono text-xs text-muted-foreground">{token.prefix}…</p>
            </div>
            <span className="agent-permission shrink-0 rounded-md px-2 py-1 text-xs font-medium">
              {token.revokedAt ? 'Отозван' : token.scopes.includes('write') ? 'Чтение и запись' : 'Только чтение'}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1"><dt className="text-muted-foreground">Создан</dt><dd>{token.createdAt ? formatRelativeTime(token.createdAt) : 'Не указано'}</dd></div>
              <div className="space-y-1"><dt className="text-muted-foreground">Использован</dt><dd>{token.lastUsedAt ? formatRelativeTime(token.lastUsedAt) : 'Ещё ни разу'}</dd></div>
            </dl>
            <Button variant="ghost" size="sm" aria-label={`Отозвать токен «${token.label}»`} disabled={!!token.revokedAt}
              onClick={() => onRevoke(token)} className="agent-action px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              {token.revokedAt ? 'Доступ отозван' : 'Отозвать доступ'}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
