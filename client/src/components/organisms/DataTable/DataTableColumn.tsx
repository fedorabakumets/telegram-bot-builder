/**
 * DataTable Column Definitions
 * 
 * Type definitions and utilities for DataTable columns
 */

import React from 'react';

export type DataTableColumnType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'select' 
  | 'custom';

export type DataTableSortDirection = 'asc' | 'desc' | null;

export interface DataTableColumnDef<T = any> {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: string;
  /** Data accessor key or function */
  accessor?: keyof T | ((row: T) => any);
  /** Column type for formatting */
  type?: DataTableColumnType;
  /** Column width */
  width?: number | string;
  /** Minimum column width */
  minWidth?: number;
  /** Maximum column width */
  maxWidth?: number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Whether column is resizable */
  resizable?: boolean;
  /** Whether column can be hidden */
  hideable?: boolean;
  /** Whether column is initially hidden */
  hidden?: boolean;
  /** Custom cell renderer */
  cell?: (props: DataTableCellProps<T>) => React.ReactNode;
  /** Custom header renderer */
  headerCell?: (props: DataTableHeaderCellProps<T>) => React.ReactNode;
  /** Custom filter component */
  filter?: (props: DataTableFilterProps<T>) => React.ReactNode;
  /** Format function for display */
  format?: (value: any, row: T) => string;
  /** CSS class for column cells */
  className?: string;
  /** CSS class for header cell */
  headerClassName?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: 'left' | 'right';
  /** Column metadata */
  meta?: Record<string, any>;
}

export interface DataTableCellProps<T = any> {
  /** Row data */
  row: T;
  /** Row index */
  rowIndex: number;
  /** Column definition */
  column: DataTableColumnDef<T>;
  /** Cell value */
  value: any;
  /** Whether row is selected */
  isSelected: boolean;
  /** Whether row is expanded */
  isExpanded?: boolean;
}

export interface DataTableHeaderCellProps<T = any> {
  /** Column definition */
  column: DataTableColumnDef<T>;
  /** Current sort direction */
  sortDirection: DataTableSortDirection;
  /** Sort handler */
  onSort: (columnId: string, direction: DataTableSortDirection) => void;
  /** Whether column is being sorted */
  isSorted: boolean;
}

export interface DataTableFilterProps<T = any> {
  /** Column definition */
  column: DataTableColumnDef<T>;
  /** Current filter value */
  value: any;
  /** Filter change handler */
  onChange: (value: any) => void;
  /** All table data for filter options */
  data: T[];
}

/**
 * Default cell renderer based on column type
 */
export const defaultCellRenderer = <T,>({ value, column }: DataTableCellProps<T>) => {
  if (value == null) return '-';

  switch (column.type) {
    case 'boolean':
      return value ? '✓' : '✗';
    
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return new Date(value).toLocaleDateString();
    
    case 'number':
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return value;
    
    default:
      return column.format ? column.format(value, {} as T) : String(value);
  }
};

/**
 * Get cell value from row using accessor
 */
export const getCellValue = <T,>(row: T, column: DataTableColumnDef<T>) => {
  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }
  
  if (column.accessor) {
    return (row as any)[column.accessor];
  }
  
  return (row as any)[column.id];
};

/**
 * Create a simple text column
 */
export const createTextColumn = <T,>(
  id: string,
  header: string,
  accessor?: keyof T | ((row: T) => any),
  options?: Partial<DataTableColumnDef<T>>
): DataTableColumnDef<T> => ({
  id,
  header,
  accessor,
  type: 'text',
  sortable: true,
  filterable: true,
  ...options,
});

/**
 * Create a number column
 */
export const createNumberColumn = <T,>(
  id: string,
  header: string,
  accessor?: keyof T | ((row: T) => any),
  options?: Partial<DataTableColumnDef<T>>
): DataTableColumnDef<T> => ({
  id,
  header,
  accessor,
  type: 'number',
  align: 'right',
  sortable: true,
  filterable: true,
  ...options,
});

/**
 * Create a date column
 */
export const createDateColumn = <T,>(
  id: string,
  header: string,
  accessor?: keyof T | ((row: T) => any),
  options?: Partial<DataTableColumnDef<T>>
): DataTableColumnDef<T> => ({
  id,
  header,
  accessor,
  type: 'date',
  sortable: true,
  filterable: true,
  ...options,
});

/**
 * Create a boolean column
 */
export const createBooleanColumn = <T,>(
  id: string,
  header: string,
  accessor?: keyof T | ((row: T) => any),
  options?: Partial<DataTableColumnDef<T>>
): DataTableColumnDef<T> => ({
  id,
  header,
  accessor,
  type: 'boolean',
  align: 'center',
  sortable: true,
  filterable: true,
  ...options,
});

/**
 * Create a custom column
 */
export const createCustomColumn = <T,>(
  id: string,
  header: string,
  cell: (props: DataTableCellProps<T>) => React.ReactNode,
  options?: Partial<DataTableColumnDef<T>>
): DataTableColumnDef<T> => ({
  id,
  header,
  type: 'custom',
  cell,
  sortable: false,
  filterable: false,
  ...options,
});