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
      /** Пользователь, которому принадлежит ответ. */
      user: typeof users[0];
      /** Название переменной ответа. */
      key: string;
      /** Исходное значение ответа. */
      value: unknown;
      /** Порядковый номер ответа пользователя. */
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

      if (userGameData && typeof userGameData === 'object' && !Array.isArray(userGameData) && Object.keys(userGameData).length > 0) {
        Object.entries(userGameData).forEach(([key, value], index) => {
          entries.push({ user, key, value, index });
        });
      }
    });

    return entries;
  }, [users]);

  const totalPages = Math.ceil(allEntries.length / itemsPerPage);

  /** Ограничивает страницу после изменения фильтра или набора ответов. */
  const activePage = Math.min(currentPage, Math.max(1, totalPages));

  const visibleEntries = React.useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return allEntries.slice(start, start + itemsPerPage);
  }, [allEntries, activePage, itemsPerPage]);

  /** Открывает страницу в допустимом диапазоне. */
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  /** Открывает следующую доступную страницу. */
  const nextPage = () => setCurrentPage(Math.min(activePage + 1, Math.max(1, totalPages)));
  /** Открывает предыдущую доступную страницу. */
  const prevPage = () => setCurrentPage(Math.max(activePage - 1, 1));

  return (
    <div className="space-y-3 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Показывать:</span>
          <ItemsPerPageSelector value={itemsPerPage} onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }} />
        </div>
        <ResponseCount
          currentPage={activePage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalCount={allEntries.length}
        />
      </div>
      <div className="rounded-md border overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[600px] max-w-full text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs whitespace-nowrap px-3 py-3">Пользователь</TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap px-3 py-3">Переменная</TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap px-3 py-3">Ответ</TableHead>
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
                    Нет ответов для выбранных пользователей
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {totalPages > 0 && (
        <PaginationControls
          currentPage={activePage}
          totalPages={totalPages}
          goToPage={goToPage}
          nextPage={nextPage}
          prevPage={prevPage}
        />
      )}
    </div>
  );
}
