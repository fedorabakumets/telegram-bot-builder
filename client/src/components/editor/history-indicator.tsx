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
    </>
  );
}