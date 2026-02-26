/**
 * @fileoverview Компонент таблицы ответов с пагинацией
 * @description Отображает все ответы пользователей с разбивкой по страницам
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ResponseRow } from './response-row';
import { PaginationControls } from './pagination-controls';
import { ResponseCount } from './response-count';
import { ItemsPerPageSelector } from './items-per-page-selector';
import type { ResponsesTableWithPaginationProps } from '../types';
import type { ItemsPerPageValue } from '../types';

const DEFAULT_ITEMS_PER_PAGE: ItemsPerPageValue = 12;

/**
 * Компонент таблицы ответов с пагинацией
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function ResponsesTableWithPagination({
  users,
}: ResponsesTableWithPaginationProps): React.JSX.Element | null {
  const [itemsPerPage, setItemsPerPage] = React.useState<ItemsPerPageValue>(DEFAULT_ITEMS_PER_PAGE);
  const [currentPage, setCurrentPage] = React.useState(1);

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

  const totalPages = Math.ceil(allEntries.length / itemsPerPage);

  const visibleEntries = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allEntries.slice(start, start + itemsPerPage);
  }, [allEntries, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="space-y-3 w-full max-w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Показывать:</span>
          <ItemsPerPageSelector value={itemsPerPage} onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }} />
        </div>
        <ResponseCount
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalCount={allEntries.length}
        />
      </div>
      <div className="rounded-md border overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[600px] max-w-full text-[9px] xs:text-[10px] sm:text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Пользователь</TableHead>
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Переменная</TableHead>
                <TableHead className="font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Ответ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.length > 0 ? (
                visibleEntries.map((entry) => (
                  <ResponseRow
                    key={`${entry.user.id}-${entry.key}-${entry.index}`}
                    user={entry.user}
                    keyName={entry.key}
                    responseIndex={entry.index}
                    value={entry.value}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Нет ответов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {totalPages > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
          nextPage={nextPage}
          prevPage={prevPage}
        />
      )}
    </div>
  );
}
