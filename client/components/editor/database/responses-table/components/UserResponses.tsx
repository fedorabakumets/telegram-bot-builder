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
import { UserBotData } from '@shared/schema';
import { ResponseRow } from './ResponseRow';
import { useResponsePagination } from '../hooks/use-response-pagination';
import { PaginationControls } from './pagination-controls';
import { ResponseCount } from './response-count';
import type { UserResponsesProps } from '../types';

const ITEMS_PER_PAGE = 12;

/**
 * Компонент ответов пользователя
 * @param {UserResponsesProps} props - Свойства компонента
 * @returns {JSX.Element | null} Таблица ответов или null
 */
export function UserResponses({ user }: UserResponsesProps): React.JSX.Element | null {
  if (!user.userData || typeof user.userData !== 'object' || Object.keys(user.userData as Record<string, unknown>).length === 0) {
    return null;
  }

  const entries = Object.entries(user.userData as Record<string, unknown>);
  const totalCount = entries.length;

  const {
    currentPage,
    totalPages,
    visibleEntries,
    goToPage,
    nextPage,
    prevPage,
  } = useResponsePagination({ entries, itemsPerPage: ITEMS_PER_PAGE });

  return (
    <>
      <Separator />
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5 w-full">
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
          <MessageSquare className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <Label className="text-[10px] xs:text-xs sm:text-sm font-semibold truncate w-full">Ответы пользователя</Label>
          <ResponseCount
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={ITEMS_PER_PAGE}
            totalCount={totalCount}
          />
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
