/**
 * DataTable Component
 * 
 * A comprehensive data table component with sorting, pagination,
 * filtering, row selection, and virtualization support.
 * 
 * @example
 * ```tsx
 * const columns: DataTableColumnDef<User>[] = [
 *   createTextColumn('name', 'Name', 'name'),
 *   createTextColumn('email', 'Email', 'email'),
 *   createDateColumn('createdAt', 'Created', 'createdAt'),
 *   createCustomColumn('actions', 'Actions', ({ row }) => (
 *     <Button onClick={() => editUser(row.id)}>Edit</Button>
 *   ))
 * ];
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   pagination={{
 *     page: 0,
 *     pageSize: 25,
 *     total: 100,
 *     onPageChange: setPage,
 *     onPageSizeChange: setPageSize
 *   }}
 *   sorting={{
 *     field: 'name',
 *     direction: 'asc',
 *     onSort: handleSort
 *   }}
 *   selection={{
 *     selectedRows: selectedUsers,
 *     onSelectionChange: setSelectedUsers
 *   }}
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTableColumnDef,
  DataTableSortDirection,
  getCellValue,
  defaultCellRenderer,
} from './DataTableColumn';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar, DataTableToolbarAction } from './DataTableToolbar';
import { VirtualizedTableBody } from './VirtualizedTableBody';

const dataTableVariants = cva(
  'bg-card border border-border rounded-lg overflow-hidden',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      density: {
        compact: '[&_td]:py-2 [&_th]:py-2',
        comfortable: '[&_td]:py-3 [&_th]:py-3',
        spacious: '[&_td]:py-4 [&_th]:py-4',
      },
    },
    defaultVariants: {
      size: 'md',
      density: 'comfortable',
    },
  }
);

export interface DataTablePaginationConfig {
  /** Current page (0-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  total: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (pageSize: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
}

export interface DataTableSortingConfig<T = any> {
  /** Current sort field */
  field: keyof T | null;
  /** Current sort direction */
  direction: DataTableSortDirection;
  /** Sort change handler */
  onSort: (field: keyof T, direction: DataTableSortDirection) => void;
}

export interface DataTableSelectionConfig<T = any> {
  /** Selected rows */
  selectedRows: T[];
  /** Selection change handler */
  onSelectionChange: (rows: T[]) => void;
  /** Row ID accessor */
  getRowId?: (row: T) => string | number;
  /** Whether selection is disabled */
  disabled?: boolean;
}

export interface DataTableProps<T = any>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataTableVariants> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: DataTableColumnDef<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Error state */
  error?: string | null;
  /** Pagination configuration */
  pagination?: DataTablePaginationConfig;
  /** Sorting configuration */
  sorting?: DataTableSortingConfig<T>;
  /** Selection configuration */
  selection?: DataTableSelectionConfig<T>;
  /** Search configuration */
  search?: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
  };
  /** Toolbar actions */
  toolbarActions?: DataTableToolbarAction[];
  /** Bulk actions */
  bulkActions?: DataTableToolbarAction[];
  /** Whether to show toolbar */
  showToolbar?: boolean;
  /** Whether to show pagination */
  showPagination?: boolean;
  /** Custom toolbar content */
  toolbarContent?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Row double click handler */
  onRowDoubleClick?: (row: T, index: number) => void;
  /** Custom row props */
  getRowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  /** Virtualization (for large datasets) */
  virtualized?: boolean;
  /** Virtual item height (when virtualized) */
  itemHeight?: number;
  /** Container height (when virtualized) */
  height?: number;
}

const LoadingSkeleton = React.memo<{ columns: number; rows?: number }>(
  ({ columns, rows = 5 }) => (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
);

LoadingSkeleton.displayName = 'LoadingSkeleton';

const EmptyState = React.memo<{ message: string; columns: number }>(
  ({ message, columns }) => (
    <TableRow>
      <TableCell colSpan={columns} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Icon name="fa-solid fa-inbox" size="lg" className="text-muted-foreground" />
          <Typography variant="body-md" className="text-muted-foreground">
            {message}
          </Typography>
        </div>
      </TableCell>
    </TableRow>
  )
);

EmptyState.displayName = 'EmptyState';

const ErrorState = React.memo<{ error: string; columns: number }>(
  ({ error, columns }) => (
    <TableRow>
      <TableCell colSpan={columns} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Icon name="fa-solid fa-exclamation-triangle" size="lg" className="text-destructive" />
          <Typography variant="body-md" className="text-destructive">
            {error}
          </Typography>
        </div>
      </TableCell>
    </TableRow>
  )
);

ErrorState.displayName = 'ErrorState';

export const DataTable = React.memo(
  React.forwardRef<HTMLDivElement, DataTableProps>(
    (
      {
        data,
        columns,
        loading = false,
        emptyMessage = 'Нет данных для отображения',
        error = null,
        pagination,
        sorting,
        selection,
        search,
        toolbarActions = [],
        bulkActions = [],
        showToolbar = true,
        showPagination = true,
        toolbarContent,
        onRowClick,
        onRowDoubleClick,
        getRowProps,
        virtualized = false,
        itemHeight = 48,
        height = 400,
        size,
        density,
        className,
        ...props
      },
      ref
    ) => {
      // Filter visible columns
      const visibleColumns = React.useMemo(
        () => columns.filter(col => !col.hidden),
        [columns]
      );

      // Add selection column if selection is enabled
      const allColumns = React.useMemo(() => {
        if (!selection) return visibleColumns;

        const selectionColumn: DataTableColumnDef = {
          id: '__selection__',
          header: '',
          width: 48,
          sortable: false,
          filterable: false,
          hideable: false,
          cell: ({ row, rowIndex }) => {
            const rowId = selection.getRowId ? selection.getRowId(row) : rowIndex;
            const isSelected = selection.selectedRows.some(selectedRow => {
              const selectedId = selection.getRowId ? selection.getRowId(selectedRow) : selection.selectedRows.indexOf(selectedRow);
              return selectedId === rowId;
            });

            return (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selection.onSelectionChange([...selection.selectedRows, row]);
                  } else {
                    selection.onSelectionChange(
                      selection.selectedRows.filter(selectedRow => {
                        const selectedId = selection.getRowId ? selection.getRowId(selectedRow) : selection.selectedRows.indexOf(selectedRow);
                        return selectedId !== rowId;
                      })
                    );
                  }
                }}
                disabled={selection.disabled}
                aria-label={`Select row ${rowIndex + 1}`}
              />
            );
          },
          headerCell: () => {
            const allSelected = data.length > 0 && selection.selectedRows.length === data.length;
            const someSelected = selection.selectedRows.length > 0;

            return (
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selection.onSelectionChange(data);
                  } else {
                    selection.onSelectionChange([]);
                  }
                }}
                disabled={selection.disabled || data.length === 0}
                aria-label="Select all rows"
              />
            );
          },
        };

        return [selectionColumn, ...visibleColumns];
      }, [visibleColumns, selection, data]);

      // Handle sorting
      const handleSort = React.useCallback(
        (columnId: string, direction: DataTableSortDirection) => {
          if (!sorting) return;
          
          const column = columns.find(col => col.id === columnId);
          if (!column?.sortable) return;

          sorting.onSort(columnId as keyof typeof data[0], direction);
        },
        [sorting, columns]
      );

      // Handle row click
      const handleRowClick = React.useCallback(
        (row: any, index: number, event: React.MouseEvent) => {
          // Don't trigger row click if clicking on interactive elements
          if ((event.target as HTMLElement).closest('button, input, a, [role="button"]')) {
            return;
          }
          onRowClick?.(row, index);
        },
        [onRowClick]
      );

      // Handle row double click
      const handleRowDoubleClick = React.useCallback(
        (row: any, index: number) => {
          onRowDoubleClick?.(row, index);
        },
        [onRowDoubleClick]
      );

      // Render table header
      const renderHeader = () => (
        <TableHeader>
          <TableRow>
            {allColumns.map((column) => {
              const isSorted = sorting?.field === column.id;
              const sortDirection = isSorted ? sorting.direction : null;

              if (column.headerCell) {
                return (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.headerClassName,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.width && `w-[${column.width}px]`
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                  >
                    {column.headerCell({
                      column,
                      sortDirection,
                      onSort: handleSort,
                      isSorted,
                    })}
                  </TableHead>
                );
              }

              return (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.headerClassName,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-accent/50',
                    column.width && `w-[${column.width}px]`
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={
                    column.sortable
                      ? () => {
                          const newDirection = 
                            sortDirection === 'asc' ? 'desc' : 
                            sortDirection === 'desc' ? null : 'asc';
                          handleSort(column.id, newDirection);
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <Icon
                        name={
                          sortDirection === 'asc' ? 'fa-solid fa-sort-up' :
                          sortDirection === 'desc' ? 'fa-solid fa-sort-down' :
                          'fa-solid fa-sort'
                        }
                        size="xs"
                        className={cn(
                          'transition-colors',
                          isSorted ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
      );

      // Render table body
      const renderBody = () => {
        if (loading) {
          return (
            <TableBody>
              <LoadingSkeleton columns={allColumns.length} />
            </TableBody>
          );
        }

        if (error) {
          return (
            <TableBody>
              <ErrorState error={error} columns={allColumns.length} />
            </TableBody>
          );
        }

        if (data.length === 0) {
          return (
            <TableBody>
              <EmptyState message={emptyMessage} columns={allColumns.length} />
            </TableBody>
          );
        }

        // Use virtualization for large datasets
        if (virtualized && data.length > 0) {
          return (
            <VirtualizedTableBody
              data={data}
              columns={allColumns}
              itemHeight={itemHeight}
              height={height - 100} // Account for header and pagination
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              getRowProps={getRowProps}
              selectedRows={selection?.selectedRows}
            />
          );
        }

        return (
          <TableBody>
            {data.map((row, rowIndex) => {
              const rowProps = getRowProps?.(row, rowIndex) || {};
              const isSelected = selection?.selectedRows.includes(row);

              return (
                <TableRow
                  key={rowIndex}
                  {...rowProps}
                  className={cn(
                    rowProps.className,
                    (onRowClick || onRowDoubleClick) && 'cursor-pointer',
                    isSelected && 'bg-accent/50'
                  )}
                  onClick={(e) => handleRowClick(row, rowIndex, e)}
                  onDoubleClick={() => handleRowDoubleClick(row, rowIndex)}
                  data-state={isSelected ? 'selected' : undefined}
                >
                  {allColumns.map((column) => {
                    const value = getCellValue(row, column);
                    
                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.className,
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.cell ? (
                          column.cell({
                            row,
                            rowIndex,
                            column,
                            value,
                            isSelected: Boolean(isSelected),
                          })
                        ) : (
                          defaultCellRenderer({ row, rowIndex, column, value, isSelected: Boolean(isSelected) })
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        );
      };

      return (
        <div
          ref={ref}
          className={cn(dataTableVariants({ size, density }), className)}
          {...props}
        >
          {/* Toolbar */}
          {showToolbar && (
            <DataTableToolbar
              searchValue={search?.value}
              searchPlaceholder={search?.placeholder}
              onSearchChange={search?.onChange}
              columns={columns}
              selectedCount={selection?.selectedRows.length || 0}
              totalCount={data.length}
              bulkActions={bulkActions}
              actions={toolbarActions}
              disabled={loading}
            >
              {toolbarContent}
            </DataTableToolbar>
          )}

          {/* Table */}
          <div className="overflow-auto" style={virtualized ? { height } : undefined}>
            <Table>
              {renderHeader()}
              {renderBody()}
            </Table>
          </div>

          {/* Pagination */}
          {showPagination && pagination && (
            <DataTablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.total}
              pageSizeOptions={pagination.pageSizeOptions}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              disabled={loading}
            />
          )}
        </div>
      );
    }
  )
) as <T = any>(props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }) => React.ReactElement;

DataTable.displayName = 'DataTable';

export default DataTable;