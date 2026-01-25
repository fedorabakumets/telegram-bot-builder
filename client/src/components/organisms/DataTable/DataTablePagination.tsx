/**
 * DataTable Pagination Component
 * 
 * Pagination controls for DataTable with page size selection
 * and navigation controls.
 */

import React from 'react';
import { cn } from '@/design-system';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DataTablePaginationProps {
  /** Current page (0-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (pageSize: number) => void;
  /** Whether pagination is disabled */
  disabled?: boolean;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show page info */
  showPageInfo?: boolean;
  /** Custom page info renderer */
  renderPageInfo?: (props: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    startItem: number;
    endItem: number;
  }) => React.ReactNode;
}

export const DataTablePagination = React.memo<DataTablePaginationProps>(
  ({
    page,
    pageSize,
    totalItems,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange,
    onPageSizeChange,
    disabled = false,
    showPageSizeSelector = true,
    showPageInfo = true,
    renderPageInfo,
  }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = page * pageSize + 1;
    const endItem = Math.min((page + 1) * pageSize, totalItems);
    
    const canGoPrevious = page > 0 && !disabled;
    const canGoNext = page < totalPages - 1 && !disabled;

    // Generate page numbers to show
    const getVisiblePages = React.useMemo(() => {
      const delta = 2; // Number of pages to show on each side of current page
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(0, page - delta);
        i <= Math.min(totalPages - 1, page + delta);
        i++
      ) {
        range.push(i);
      }

      if (range[0] > 1) {
        rangeWithDots.push(0);
        if (range[0] > 2) {
          rangeWithDots.push('...');
        }
      }

      rangeWithDots.push(...range);

      if (range[range.length - 1] < totalPages - 2) {
        if (range[range.length - 1] < totalPages - 3) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(totalPages - 1);
      }

      return rangeWithDots;
    }, [page, totalPages]);

    const handlePageSizeChange = React.useCallback(
      (value: string) => {
        const newPageSize = parseInt(value, 10);
        onPageSizeChange(newPageSize);
        // Reset to first page when changing page size
        onPageChange(0);
      },
      [onPageChange, onPageSizeChange]
    );

    if (totalItems === 0) {
      return null;
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-card border-t border-border">
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <Typography variant="body-sm" className="text-muted-foreground">
              Показать
            </Typography>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Typography variant="body-sm" className="text-muted-foreground">
              записей
            </Typography>
          </div>
        )}

        {/* Page Info */}
        {showPageInfo && (
          <div className="flex-1 text-center">
            {renderPageInfo ? (
              renderPageInfo({
                page,
                pageSize,
                totalItems,
                totalPages,
                startItem,
                endItem,
              })
            ) : (
              <Typography variant="body-sm" className="text-muted-foreground">
                {startItem}-{endItem} из {totalItems}
              </Typography>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(0)}
            disabled={!canGoPrevious}
            aria-label="Первая страница"
          >
            <Icon name="fa-solid fa-angles-left" size="xs" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            aria-label="Предыдущая страница"
          >
            <Icon name="fa-solid fa-angle-left" size="xs" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-2">
            {getVisiblePages.map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-2 py-1 text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = pageNum as number;
              const isCurrentPage = pageNumber === page;

              return (
                <Button
                  key={pageNumber}
                  variant={isCurrentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  disabled={disabled}
                  className={cn(
                    'min-w-[2rem]',
                    isCurrentPage && 'bg-primary text-primary-foreground'
                  )}
                  aria-label={`Страница ${pageNumber + 1}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            aria-label="Следующая страница"
          >
            <Icon name="fa-solid fa-angle-right" size="xs" />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!canGoNext}
            aria-label="Последняя страница"
          >
            <Icon name="fa-solid fa-angles-right" size="xs" />
          </Button>
        </div>
      </div>
    );
  }
);

DataTablePagination.displayName = 'DataTablePagination';

export default DataTablePagination;