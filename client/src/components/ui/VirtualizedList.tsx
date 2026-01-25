/**
 * VirtualizedList Component
 * 
 * A high-performance virtualized list component for rendering large datasets
 * with minimal DOM nodes and optimal performance.
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '@/design-system';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Total height of the container */
  height: number;
  /** Width of the container */
  width?: number | string;
  /** Function to render each item */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** Optional className for the container */
  className?: string;
  /** Optional overscan count for better scrolling performance */
  overscanCount?: number;
  /** Optional item key extractor */
  getItemKey?: (index: number, item: T) => string | number;
  /** Optional scroll offset */
  initialScrollOffset?: number;
  /** Scroll event handler */
  onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void;
}

interface ItemRendererProps extends ListChildComponentProps {
  data: {
    items: any[];
    renderItem: (item: any, index: number, style: React.CSSProperties) => React.ReactNode;
  };
}

const ItemRenderer = React.memo<ItemRendererProps>(({ index, style, data }) => {
  const { items, renderItem } = data;
  const item = items[index];
  
  return (
    <div style={style}>
      {renderItem(item, index, style)}
    </div>
  );
});

ItemRenderer.displayName = 'VirtualizedListItem';

export const VirtualizedList = React.memo(
  <T,>({
    items,
    itemHeight,
    height,
    width = '100%',
    renderItem,
    className,
    overscanCount = 5,
    getItemKey,
    initialScrollOffset = 0,
    onScroll,
  }: VirtualizedListProps<T>) => {
    // Memoize the item data to prevent unnecessary re-renders
    const itemData = useMemo(
      () => ({
        items,
        renderItem,
      }),
      [items, renderItem]
    );

    // Memoize the item key function
    const itemKey = useCallback(
      (index: number) => {
        if (getItemKey) {
          return getItemKey(index, items[index]);
        }
        return index;
      },
      [getItemKey, items]
    );

    // Handle scroll events
    const handleScroll = useCallback(
      (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
        onScroll?.(props);
      },
      [onScroll]
    );

    return (
      <div className={cn('virtualized-list', className)}>
        <List
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight}
          itemData={itemData}
          itemKey={itemKey}
          overscanCount={overscanCount}
          initialScrollOffset={initialScrollOffset}
          onScroll={handleScroll}
        >
          {ItemRenderer}
        </List>
      </div>
    );
  }
) as <T>(props: VirtualizedListProps<T>) => React.ReactElement;

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;