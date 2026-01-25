/**
 * Editor Layout Component
 * 
 * Specialized layout for bot editor with canvas, resizable panels,
 * and optimized workspace for visual editing.
 * 
 * @example
 * ```tsx
 * <EditorLayout
 *   leftPanel={<PropertiesPanel />}
 *   rightPanel={<ComponentsSidebar />}
 *   bottomPanel={<CodePanel />}
 *   toolbar={<EditorToolbar />}
 * >
 *   <Canvas />
 * </EditorLayout>
 * ```
 */

import React from 'react';
import { cn } from '@/design-system/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useTheme } from '@/design-system/hooks/use-theme';

const editorLayoutVariants = cva(
  'h-screen bg-background text-foreground flex flex-col overflow-hidden',
  {
    variants: {
      variant: {
        default: '',
        fullscreen: 'fixed inset-0 z-50',
        windowed: 'rounded-lg border border-border shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const toolbarVariants = cva(
  'flex-shrink-0 bg-card border-b border-border px-4 py-2 flex items-center justify-between',
  {
    variants: {
      size: {
        sm: 'h-12',
        md: 'h-14',
        lg: 'h-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const workspaceVariants = cva(
  'flex-1 flex overflow-hidden',
  {
    variants: {
      direction: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      direction: 'horizontal',
    },
  }
);

const panelVariants = cva(
  'bg-card border-border flex flex-col overflow-hidden transition-all duration-300',
  {
    variants: {
      position: {
        left: 'border-r',
        right: 'border-l',
        top: 'border-b',
        bottom: 'border-t',
      },
      collapsed: {
        true: '',
        false: '',
      },
      resizable: {
        true: 'resize-handle',
        false: '',
      },
    },
    compoundVariants: [
      {
        position: 'left',
        collapsed: true,
        className: 'w-0 border-r-0',
      },
      {
        position: 'left',
        collapsed: false,
        className: 'w-80',
      },
      {
        position: 'right',
        collapsed: true,
        className: 'w-0 border-l-0',
      },
      {
        position: 'right',
        collapsed: false,
        className: 'w-80',
      },
      {
        position: 'top',
        collapsed: true,
        className: 'h-0 border-b-0',
      },
      {
        position: 'top',
        collapsed: false,
        className: 'h-64',
      },
      {
        position: 'bottom',
        collapsed: true,
        className: 'h-0 border-t-0',
      },
      {
        position: 'bottom',
        collapsed: false,
        className: 'h-64',
      },
    ],
  }
);

const canvasAreaVariants = cva(
  'flex-1 bg-muted/30 overflow-hidden relative',
  {
    variants: {
      centered: {
        true: 'flex items-center justify-center',
        false: '',
      },
    },
    defaultVariants: {
      centered: true,
    },
  }
);

const resizeHandleVariants = cva(
  'absolute bg-border hover:bg-accent transition-colors duration-200 z-10',
  {
    variants: {
      direction: {
        horizontal: 'w-1 h-full cursor-col-resize',
        vertical: 'h-1 w-full cursor-row-resize',
      },
      position: {
        left: 'left-0 top-0',
        right: 'right-0 top-0',
        top: 'top-0 left-0',
        bottom: 'bottom-0 left-0',
      },
    },
  }
);

export interface PanelState {
  collapsed: boolean;
  size: number;
  minSize: number;
  maxSize: number;
}

export interface EditorLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof editorLayoutVariants> {
  /** Toolbar content */
  toolbar?: React.ReactNode;
  /** Left panel content */
  leftPanel?: React.ReactNode;
  /** Right panel content */
  rightPanel?: React.ReactNode;
  /** Top panel content */
  topPanel?: React.ReactNode;
  /** Bottom panel content */
  bottomPanel?: React.ReactNode;
  /** Main canvas/editor content */
  children: React.ReactNode;
  /** Panel states */
  panelStates?: {
    left?: Partial<PanelState>;
    right?: Partial<PanelState>;
    top?: Partial<PanelState>;
    bottom?: Partial<PanelState>;
  };
  /** Panel state change handlers */
  onPanelStateChange?: (panel: 'left' | 'right' | 'top' | 'bottom', state: Partial<PanelState>) => void;
  /** Whether panels are resizable */
  resizable?: boolean;
  /** Toolbar size */
  toolbarSize?: VariantProps<typeof toolbarVariants>['size'];
  /** Whether canvas should be centered */
  centeredCanvas?: boolean;
  /** Custom panel toggle buttons */
  panelToggles?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
    top?: React.ReactNode;
    bottom?: React.ReactNode;
  };
}

const PanelToggle = React.memo<{
  position: 'left' | 'right' | 'top' | 'bottom';
  collapsed: boolean;
  onToggle: () => void;
}>(({ position, collapsed, onToggle }) => {
  const getIcon = () => {
    switch (position) {
      case 'left':
        return collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
      case 'right':
        return collapsed ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
      case 'top':
        return collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
      case 'bottom':
        return collapsed ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
  };

  const getLabel = () => {
    const action = collapsed ? 'Show' : 'Hide';
    const panelName = position.charAt(0).toUpperCase() + position.slice(1);
    return `${action} ${panelName} Panel`;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="flex-shrink-0"
      aria-label={getLabel()}
    >
      <Icon name={getIcon()} size="sm" />
    </Button>
  );
});

PanelToggle.displayName = 'PanelToggle';

const ResizeHandle = React.memo<{
  direction: 'horizontal' | 'vertical';
  position: 'left' | 'right' | 'top' | 'bottom';
  onResize: (delta: number) => void;
}>(({ direction, position, onResize }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startPos = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos.current;
    
    // Adjust delta based on panel position
    const adjustedDelta = (position === 'left' || position === 'top') ? delta : -delta;
    
    onResize(adjustedDelta);
    startPos.current = currentPos;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        resizeHandleVariants({ direction, position }),
        isDragging && 'bg-primary'
      )}
      onMouseDown={handleMouseDown}
    />
  );
});

ResizeHandle.displayName = 'ResizeHandle';

export const EditorLayout = React.memo(
  React.forwardRef<HTMLDivElement, EditorLayoutProps>(
    (
      {
        toolbar,
        leftPanel,
        rightPanel,
        topPanel,
        bottomPanel,
        children,
        panelStates = {},
        onPanelStateChange,
        resizable = true,
        toolbarSize = 'md',
        centeredCanvas = true,
        panelToggles = {},
        variant,
        className,
        ...props
      },
      ref
    ) => {
      const { isDark } = useTheme();

      // Default panel states
      const defaultPanelState: PanelState = {
        collapsed: false,
        size: 320,
        minSize: 200,
        maxSize: 600,
      };

      const [internalPanelStates, setInternalPanelStates] = React.useState({
        left: { ...defaultPanelState, ...panelStates.left },
        right: { ...defaultPanelState, ...panelStates.right },
        top: { ...defaultPanelState, size: 256, ...panelStates.top },
        bottom: { ...defaultPanelState, size: 256, ...panelStates.bottom },
      });

      const updatePanelState = (panel: keyof typeof internalPanelStates, updates: Partial<PanelState>) => {
        const newState = { ...internalPanelStates[panel], ...updates };
        setInternalPanelStates(prev => ({ ...prev, [panel]: newState }));
        onPanelStateChange?.(panel, newState);
      };

      const togglePanel = (panel: keyof typeof internalPanelStates) => {
        updatePanelState(panel, { collapsed: !internalPanelStates[panel].collapsed });
      };

      const handleResize = (panel: keyof typeof internalPanelStates, delta: number) => {
        const currentState = internalPanelStates[panel];
        const newSize = Math.max(
          currentState.minSize,
          Math.min(currentState.maxSize, currentState.size + delta)
        );
        updatePanelState(panel, { size: newSize });
      };

      return (
        <div
          ref={ref}
          className={cn(editorLayoutVariants({ variant }), className)}
          {...props}
        >
          {/* Toolbar */}
          {toolbar && (
            <header className={toolbarVariants({ size: toolbarSize })}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {toolbar}
              </div>
              
              {/* Panel Toggles */}
              <div className="flex items-center gap-1">
                {leftPanel && (
                  panelToggles?.left || (
                    <PanelToggle
                      position="left"
                      collapsed={internalPanelStates.left.collapsed}
                      onToggle={() => togglePanel('left')}
                    />
                  )
                )}
                {rightPanel && (
                  panelToggles?.right || (
                    <PanelToggle
                      position="right"
                      collapsed={internalPanelStates.right.collapsed}
                      onToggle={() => togglePanel('right')}
                    />
                  )
                )}
                {topPanel && (
                  panelToggles?.top || (
                    <PanelToggle
                      position="top"
                      collapsed={internalPanelStates.top.collapsed}
                      onToggle={() => togglePanel('top')}
                    />
                  )
                )}
                {bottomPanel && (
                  panelToggles?.bottom || (
                    <PanelToggle
                      position="bottom"
                      collapsed={internalPanelStates.bottom.collapsed}
                      onToggle={() => togglePanel('bottom')}
                    />
                  )
                )}
              </div>
            </header>
          )}

          {/* Main Workspace */}
          <div className={workspaceVariants({ direction: 'horizontal' })}>
            {/* Left Panel */}
            {leftPanel && (
              <div
                className={cn(
                  panelVariants({
                    position: 'left',
                    collapsed: internalPanelStates.left.collapsed,
                    resizable,
                  })
                )}
                style={{
                  width: internalPanelStates.left.collapsed ? 0 : internalPanelStates.left.size,
                }}
              >
                {!internalPanelStates.left.collapsed && (
                  <>
                    {leftPanel}
                    {resizable && (
                      <ResizeHandle
                        direction="horizontal"
                        position="left"
                        onResize={(delta) => handleResize('left', delta)}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Center Area (Canvas + Top/Bottom Panels) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Panel */}
              {topPanel && (
                <div
                  className={cn(
                    panelVariants({
                      position: 'top',
                      collapsed: internalPanelStates.top.collapsed,
                      resizable,
                    })
                  )}
                  style={{
                    height: internalPanelStates.top.collapsed ? 0 : internalPanelStates.top.size,
                  }}
                >
                  {!internalPanelStates.top.collapsed && (
                    <>
                      {topPanel}
                      {resizable && (
                        <ResizeHandle
                          direction="vertical"
                          position="top"
                          onResize={(delta) => handleResize('top', delta)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Canvas Area */}
              <div className={canvasAreaVariants({ centered: centeredCanvas })}>
                {children}
              </div>

              {/* Bottom Panel */}
              {bottomPanel && (
                <div
                  className={cn(
                    panelVariants({
                      position: 'bottom',
                      collapsed: internalPanelStates.bottom.collapsed,
                      resizable,
                    })
                  )}
                  style={{
                    height: internalPanelStates.bottom.collapsed ? 0 : internalPanelStates.bottom.size,
                  }}
                >
                  {!internalPanelStates.bottom.collapsed && (
                    <>
                      {resizable && (
                        <ResizeHandle
                          direction="vertical"
                          position="bottom"
                          onResize={(delta) => handleResize('bottom', delta)}
                        />
                      )}
                      {bottomPanel}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel */}
            {rightPanel && (
              <div
                className={cn(
                  panelVariants({
                    position: 'right',
                    collapsed: internalPanelStates.right.collapsed,
                    resizable,
                  })
                )}
                style={{
                  width: internalPanelStates.right.collapsed ? 0 : internalPanelStates.right.size,
                }}
              >
                {!internalPanelStates.right.collapsed && (
                  <>
                    {resizable && (
                      <ResizeHandle
                        direction="horizontal"
                        position="right"
                        onResize={(delta) => handleResize('right', delta)}
                      />
                    )}
                    {rightPanel}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  )
);

EditorLayout.displayName = 'EditorLayout';

export default EditorLayout;