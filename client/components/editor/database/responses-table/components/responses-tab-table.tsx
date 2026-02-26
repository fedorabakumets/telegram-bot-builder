/**
 * @fileoverview Компонент таблицы ответов пользователей
 * @description Отображает таблицу с ответами пользователей во вкладке "Ответы"
 */

import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { MessageSquare } from 'lucide-react';
import { ResponseRow } from './response-row';

/**
 * Пропсы компонента ResponsesTabTable
 */
interface ResponsesTabTableProps {
  /** Список пользователей с ответами */
  users: UserBotData[];
}

/**
 * Компонент таблицы ответов пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function ResponsesTabTable({ users }: ResponsesTabTableProps): React.JSX.Element {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40 hover:bg-muted/50">
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead className="font-semibold h-10">Пользователь</TableHead>
              <TableHead className="font-semibold h-10">Переменная</TableHead>
              <TableHead className="font-semibold h-10">Ответ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <span>Нет пользователей или ответов</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40 hover:bg-muted/50">
          <TableRow className="border-b border-border/50 hover:bg-transparent">
            <TableHead className="font-semibold h-10">Пользователь</TableHead>
            <TableHead className="font-semibold h-10">Переменная</TableHead>
            <TableHead className="font-semibold h-10">Ответ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.flatMap((user) => {
            // Проверяем, является ли userData строкой JSON
            let userGameData: Record<string, unknown> = {};
            if (typeof user.userData === 'string') {
              try {
                userGameData = JSON.parse(user.userData) as Record<string, unknown>;
              } catch {
                userGameData = {};
              }
            } else if (user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)) {
              userGameData = user.userData as Record<string, unknown>;
            }

            if (Object.keys(userGameData).length === 0) {
              return [];
            }
            return Object.entries(userGameData).map(([key, value], index) => (
              <ResponseRow
                key={`${user.id}-${key}-${index}`}
                user={user}
                keyName={key}
                responseIndex={index}
                value={value}
              />
            ));
          })}
        </TableBody>
      </Table>
    </div>
  );
}
