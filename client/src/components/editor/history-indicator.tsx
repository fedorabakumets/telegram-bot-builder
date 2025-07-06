import { Button } from '@/components/ui/button';

interface HistoryIndicatorProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryIndicator({ canUndo, canRedo, onUndo, onRedo }: HistoryIndicatorProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-7 w-7 p-0"
        title="Отменить (Ctrl+Z)"
      >
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-7 w-7 p-0"
        title="Повторить (Ctrl+Y)"
      >
      </Button>
    </>
  );
}