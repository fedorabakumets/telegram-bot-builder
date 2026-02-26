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
  itemsPerPage: initialItemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: ResponsesTableWithPaginationProps): React.JSX.Element | null {
  const [itemsPerPage, setItemsPerPage] = React.useState<ItemsPerPageValue>(initialItemsPerPage);

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
  } = React.useMemo(() => {
    const total = Math.ceil(allEntries.length / itemsPerPage);
    const start = (1 - 1) * itemsPerPage;
    const visible = allEntries.slice(0, itemsPerPage);

    return {
      currentPage: 1,
      totalPages: total,
      visibleEntries: visible,
      goToPage: (page: number) => {
        const clampedPage = Math.max(1, Math.min(page, total));
        return clampedPage;
      },
      nextPage: () => Math.min(1 + 1, total),
      prevPage: () => Math.max(1 - 1, 1),
    };
  }, [allEntries, itemsPerPage]);

  // Пересчитываем видимые записи при изменении страницы
  const [currentPageState, setCurrentPageState] = React.useState(1);
  const totalPagesCalc = Math.ceil(allEntries.length / itemsPerPage);

  const visibleEntriesFinal = React.useMemo(() => {
    const start = (currentPageState - 1) * itemsPerPage;
    return allEntries.slice(start, start + itemsPerPage);
  }, [allEntries, currentPageState, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPageState(Math.max(1, Math.min(page, totalPagesCalc)));
  };

  if (allEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Показывать:</span>
          <ItemsPerPageSelector value={itemsPerPage} onChange={setItemsPerPage} />
        </div>
        <ResponseCount
          currentPage={currentPageState}
          totalPages={totalPagesCalc}
          itemsPerPage={itemsPerPage}
          totalCount={allEntries.length}
        />
      </div>
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
              {visibleEntriesFinal.map(([_, entry]) => (
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
      <PaginationControls
        currentPage={currentPageState}
        totalPages={totalPagesCalc}
        goToPage={goToPage}
        nextPage={() => goToPage(currentPageState + 1)}
        prevPage={() => goToPage(currentPageState - 1)}
      />
    </div>
  );
}
