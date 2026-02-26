/**
 * @fileoverview Компонент ответов пользователя
 * @description Отображает таблицу с ответами пользователя на вопросы с пагинацией
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ResponseRow } from './ResponseRow';
import { PaginationControls } from './pagination-controls';
import { ResponseCount } from './response-count';
import { ItemsPerPageSelector } from './items-per-page-selector';
import type { UserResponsesProps } from '../types';
import type { ItemsPerPageValue } from '../types';

const DEFAULT_ITEMS_PER_PAGE: ItemsPerPageValue = 12;

/**
 * Компонент ответов пользователя
 * @param {UserResponsesProps} props - Свойства компонента
 * @returns {JSX.Element | null} Таблица ответов или null
 */
export function UserResponses({ user }: UserResponsesProps): React.JSX.Element | null {
  const [itemsPerPage, setItemsPerPage] = React.useState<ItemsPerPageValue>(DEFAULT_ITEMS_PER_PAGE);

  let userData: Record<string, unknown>;

  // Проверяем, является ли userData строкой JSON
  if (typeof user.userData === 'string') {
    try {
      userData = JSON.parse(user.userData) as Record<string, unknown>;
    } catch {
      userData = {};
    }
  } else if (user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)) {
    userData = user.userData as Record<string, unknown>;
  } else {
    userData = {};
  }

  const hasUserData = Object.keys(userData).length > 0;

  if (!hasUserData) {
    return null;
  }

  const entries = Object.entries(userData);
  const totalCount = entries.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [currentPage, setCurrentPage] = React.useState(1);

  const visibleEntries = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return entries.slice(start, start + itemsPerPage);
  }, [entries, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <>
      <Separator />
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5 w-full">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 w-full">
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
            <MessageSquare className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <Label className="text-[10px] xs:text-xs sm:text-sm font-semibold truncate">Ответы пользователя</Label>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground">
              <span className="whitespace-nowrap">Показывать:</span>
              <ItemsPerPageSelector value={itemsPerPage} onChange={setItemsPerPage} />
            </div>
            <ResponseCount
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalCount={totalCount}
            />
          </div>
        </div>
        <div className="pl-3 xs:pl-4 sm:pl-5 w-full">
          <div className="rounded-md border overflow-hidden w-full">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[240px] text-[9px] xs:text-[10px] sm:text-xs">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%] min-w-[80px] font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Переменная</TableHead>
                    <TableHead className="w-[60%] min-w-[120px] font-semibold text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2">Ответ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleEntries.map(([key, value]) => (
                    <ResponseRow key={key} variableKey={key} rawValue={value} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            nextPage={nextPage}
            prevPage={prevPage}
          />
        </div>
      </div>
    </>
  );
}
