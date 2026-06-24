/**
 * @fileoverview Таблица персональных токенов агента (MCP)
 *
 * Показывает название, префикс, права, даты и кнопку отзыва.
 *
 * @module editor/agent/AgentTokensTable
 */

import { KeyRound, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/components/editor/database/user-database/utils/format-relative-time";
import type { AgentTokenDto } from "./agent-token-types";

/** Свойства таблицы токенов агента */
export interface AgentTokensTableProps {
  /** Список токенов */
  tokens: AgentTokenDto[];
  /** Обработчик запроса отзыва токена */
  onRevoke: (token: AgentTokenDto) => void;
}

/**
 * Таблица токенов агента с действием отзыва.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AgentTokensTable({ tokens, onRevoke }: AgentTokensTableProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <KeyRound className="h-8 w-8 opacity-50" />
        <p className="text-sm">Токенов пока нет. Создай первый, чтобы подключить ИИ-агента.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Префикс</TableHead>
          <TableHead>Права</TableHead>
          <TableHead>Создан</TableHead>
          <TableHead>Использование</TableHead>
          <TableHead className="text-right">Действие</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((t) => (
          <TableRow key={t.id} className={t.revokedAt ? "opacity-50" : undefined}>
            <TableCell className="font-medium">{t.label}</TableCell>
            <TableCell className="font-mono text-xs">{t.prefix}…</TableCell>
            <TableCell>
              <Badge variant={t.scopes.includes("write") ? "default" : "secondary"}>
                {t.scopes.includes("write") ? "чтение+запись" : "чтение"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {t.createdAt ? formatRelativeTime(t.createdAt) : "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {t.lastUsedAt ? formatRelativeTime(t.lastUsedAt) : "ни разу"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={!!t.revokedAt}
                onClick={() => onRevoke(t)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t.revokedAt ? "Отозван" : "Отозвать"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
