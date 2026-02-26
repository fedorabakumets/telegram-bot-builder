/**
 * @fileoverview Компонент таблицы ответов с пагинацией
 * @description Отображает все ответы пользователей с разбивкой по страницам
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ResponseRowTable } from './response-row';
import { useResponsePagination } from '../hooks/use-response-pagination';
import { PaginationControls } from './pagination-controls';
import { ResponseCount } from './response-count';
import type { ResponsesTableWithPaginationProps } from '../types';

const ITEMS_PER_PAGE = 12;

/**
 * Компонент таблицы ответов с пагинацией
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function ResponsesTableWithPagination({
  users,
  itemsPerPage = ITEMS_PER_PAGE,
}: ResponsesTableWithPaginationProps): React.JSX.Element | null {
  // Собираем все ответы от всех пользователей
  const allEntries = React.useMemo(() => {
    const entries: Array<{
      user: typeof users[0];
      key: string;
      value: unknown;
      index: number;
    }> = [];

    users.forEach((user) => {
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

      if (Object.keys(userGameData).length > 0) {
        Object.entries(userGameData).forEach(([key, value], index) => {
          entries.push({ user, key, value, index });
        });
      }
    });

    return entries;
  }, [users]);

  const {
    currentPage,
    totalPages,
    visibleEntries,
    goToPage,
    nextPage,
    prevPage,
  } = useResponsePagination({
    entries: allEntries.map((e) => [`${e.user.id}-${e.key}`, e] as [string, typeof e]),
    itemsPerPage,
  });

  if (allEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[600px] text-[9px] xs:text-[10px] sm:text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Пользователь</TableHead>
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Переменная</TableHead>
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Ответ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.map(([_, entry]) => (
                <ResponseRowTable
                  key={`${entry.user.id}-${entry.key}-${entry.index}`}
                  user={entry.user}
                  keyName={entry.key}
                  responseIndex={entry.index}
                  value={entry.value}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <ResponseCount
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalCount={allEntries.length}
        />
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
          nextPage={nextPage}
          prevPage={prevPage}
        />
      </div>
    </div>
  );
}
