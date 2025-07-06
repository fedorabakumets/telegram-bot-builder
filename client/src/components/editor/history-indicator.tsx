import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HistoryIndicatorProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryIndicator({ canUndo, canRedo, onUndo, onRedo }: HistoryIndicatorProps) {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            disabled={!canUndo && !canRedo}
          >
            <i className="fas fa-history text-gray-500"></i>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-48 p-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">История изменений</h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="w-full justify-start text-xs"
              >
                <i className="fas fa-undo mr-2"></i>
                Отменить (Ctrl+Z)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="w-full justify-start text-xs"
              >
                <i className="fas fa-redo mr-2"></i>
                Повторить (Ctrl+Y)
              </Button>
            </div>
            <div className="text-xs text-gray-500 border-t pt-2">
              {!canUndo && !canRedo && "Нет доступных действий"}
              {canUndo && !canRedo && "Доступна только отмена"}
              {!canUndo && canRedo && "Доступен только повтор"}
              {canUndo && canRedo && "Доступны отмена и повтор"}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-7 w-7 p-0"
        title="Отменить (Ctrl+Z)"
      >
        <i className="fas fa-undo text-xs"></i>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-7 w-7 p-0"
        title="Повторить (Ctrl+Y)"
      >
        <i className="fas fa-redo text-xs"></i>
      </Button>
    </>
  );
}