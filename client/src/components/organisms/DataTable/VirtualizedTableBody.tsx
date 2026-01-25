/**
 * VirtualizedTableBody Component
 * 
 * A virtualized table body implementation for DataTable component
 * to handle large datasets efficiently.
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/design-system';
import { DataTableColumnDef, getCellValue, defaultCellRenderer } from './DataTableColumn';

export interface VirtualizedTableBodyProps<T = any> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: DataTableColumnDef<T>[];
  /** Height of each row in pixels */
  itemHeight: number;
  /** Total height of the container */
  height: number;
  /** Row click handler */
  onRowClick?: (row: T, index: number, event: React.MouseEvent) => void;
  /** Row double click handler */
  onRowDoubleClick?: (row: T, index: number) => void;
  /** Custom row props */
  getRowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  /** Selected rows for highlighting */
  selectedRows?: T[];
  /** Optional className for the container */
  className?: string;
}

interface VirtualizedRowProps extends ListChildComponentProps {
  data: {
    items: any[];
    columns: DataTableColumnDef[];
    onRowClick?: (row: any, index: number, event: React.MouseEvent) => void;
    onRowDoubleClick?: (row: any, index: number) => void;
    getRowProps?: (row: any, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
    selectedRows?: any[];
  };
}

const VirtualizedRow = React.memo<VirtualizedRowProps>(({ index, style, data }) => {
  const { items, columns, onRowClick, onRowDoubleClick, getRowProps, selectedRows } = data;
  const row = items[index];
  
  // Handle row click
  const handleRowClick = useCallback(
    (event: React.MouseEvent) => {
      // Don't trigger row click if clicking on interactive elements
      if ((event.target as HTMLElement).closest('button, input, a, [role="button"]')) {
        return;
      }
      onRowClick?.(row, index, event);
    },
    [row, index, onRowClick]
  );

  // Handle row double click
  const handleRowDoubleClick = useCallback(
    () => {
      onRowDoubleClick?.(row, index);
    },
    [row, index, onRowDoubleClick]
  );

  // Get row props
  const rowProps = useMemo(
    () => getRowProps?.(row, index) || {},
    [getRowProps, row, index]
  );

  // Check if row is selected
  const isSelected = useMemo(
    () => selectedRows?.includes(row) || false,
    [selectedRows, row]
  );

  return (
    <div style={style}>
      <TableRow
        {...rowProps}
        className={cn(
          rowProps.className,
          (onRowClick || onRowDoubleClick) && 'cursor-pointer',
          isSelected && 'bg-accent/50',
          'flex w-full' // Make row flex for proper column alignment
        )}
        onClick={handleRowClick}
        onDoubleClick={handleRowDoubleClick}
        data-state={isSelected ? 'selected' : undefined}
      >
        {columns.map((column) => {
          const value = getCellValue(row, column);
          
          return (
            <TableCell
              key={column.id}
              className={cn(
                column.className,
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right',
                'flex-shrink-0' // Prevent cell from shrinking
              )}
              style={{
                width: column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                flex: column.width ? 'none' : '1',
              }}
            >
              {column.cell ? (
                column.cell({
                  row,
                  rowIndex: index,
                  column,
                  value,
                  isSelected,
                })
              ) : (
                defaultCellRenderer({ row, rowIndex: index, column, value, isSelected })
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </div>
  );
});

VirtualizedRow.displayName = 'VirtualizedRow';

export const VirtualizedTableBody = React.memo(
  <T,>({
    data,
    columns,
    itemHeight,
    height,
    onRowClick,
    onRowDoubleClick,
    getRowProps,
    selectedRows,
    className,
  }: VirtualizedTableBodyProps<T>) => {
    // Memoize the row data to prevent unnecessary re-renders
    const rowData = useMemo(
      () => ({
        items: data,
        columns,
        onRowClick,
        onRowDoubleClick,
        getRowProps,
        selectedRows,
      }),
      [data, columns, onRowClick, onRowDoubleClick, getRowProps, selectedRows]
    );

    // Memoize the item key function
    const itemKey = useCallback(
      (index: number) => {
        const row = data[index];
        // Try to use a unique identifier if available
        if (row && typeof row === 'object' && 'id' in row) {
          return (row as any).id;
        }
        return index;
      },
      [data]
    );

    if (data.length === 0) {
      return null;
    }

    return (
      <div className={cn('virtualized-table-body', className)}>
        <List
          height={height}
          width="100%"
          itemCount={data.length}
          itemSize={itemHeight}
          itemData={rowData}
          itemKey={itemKey}
          overscanCount={5}
        >
          {VirtualizedRow}
        </List>
      </div>
    );
  }
) as <T>(props: VirtualizedTableBodyProps<T>) => React.ReactElement;

VirtualizedTableBody.displayName = 'VirtualizedTableBody';

export default VirtualizedTableBody;