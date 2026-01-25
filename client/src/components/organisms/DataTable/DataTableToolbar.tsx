/**
 * DataTable Toolbar Component
 * 
 * Toolbar with search, filters, column visibility controls,
 * and bulk actions for DataTable.
 */

import React from 'react';
import { cn } from '@/design-system';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnDef } from './DataTableColumn';

export interface DataTableToolbarAction {
  /** Action identifier */
  id: string;
  /** Action label */
  label: string;
  /** Action icon */
  icon?: string;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Action handler */
  onClick: () => void;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Whether action is loading */
  loading?: boolean;
}

export interface DataTableToolbarProps<T = any> {
  /** Search value */
  searchValue?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Column definitions */
  columns?: DataTableColumnDef<T>[];
  /** Visible column IDs */
  visibleColumns?: string[];
  /** Column visibility change handler */
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  /** Selected row count */
  selectedCount?: number;
  /** Total row count */
  totalCount?: number;
  /** Bulk actions */
  bulkActions?: DataTableToolbarAction[];
  /** Regular actions */
  actions?: DataTableToolbarAction[];
  /** Custom toolbar content */
  children?: React.ReactNode;
  /** Whether toolbar is disabled */
  disabled?: boolean;
}

export const DataTableToolbar = React.memo<DataTableToolbarProps>(
  ({
    searchValue = '',
    searchPlaceholder = 'Поиск...',
    onSearchChange,
    columns = [],
    visibleColumns = [],
    onColumnVisibilityChange,
    selectedCount = 0,
    totalCount = 0,
    bulkActions = [],
    actions = [],
    children,
    disabled = false,
  }) => {
    const hideableColumns = columns.filter(col => col.hideable !== false);
    const hasColumnControls = hideableColumns.length > 0 && onColumnVisibilityChange;
    const hasBulkActions = selectedCount > 0 && bulkActions.length > 0;

    return (
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          {onSearchChange && (
            <div className="relative max-w-sm">
              <Icon
                name="fa-solid fa-search"
                size="xs"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={disabled}
                className="pl-9"
              />
            </div>
          )}

          {/* Selection Info */}
          {hasBulkActions && (
            <div className="flex items-center gap-2">
              <Typography variant="body-sm" className="text-muted-foreground">
                Выбрано {selectedCount} из {totalCount}
              </Typography>
              
              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                {bulkActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled || disabled}
                    loading={action.loading}
                  >
                    {action.icon && (
                      <Icon
                        name={action.icon}
                        size="xs"
                        className="mr-1"
                      />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Content */}
          {children}
        </div>

        <div className="flex items-center gap-2">
          {/* Regular Actions */}
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || disabled}
              loading={action.loading}
            >
              {action.icon && (
                <Icon
                  name={action.icon}
                  size="xs"
                  className="mr-1"
                />
              )}
              {action.label}
            </Button>
          ))}

          {/* Column Visibility */}
          {hasColumnControls && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <Icon name="fa-solid fa-columns" size="xs" className="mr-1" />
                  Колонки
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Видимые колонки</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => {
                  const isVisible = visibleColumns.includes(column.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isVisible}
                      onCheckedChange={(checked) =>
                        onColumnVisibilityChange(column.id, checked)
                      }
                    >
                      {column.header}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.length === hideableColumns.length}
                  onCheckedChange={(checked) => {
                    hideableColumns.forEach((column) => {
                      onColumnVisibilityChange(column.id, checked);
                    });
                  }}
                >
                  Показать все
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }
);

DataTableToolbar.displayName = 'DataTableToolbar';

export default DataTableToolbar;