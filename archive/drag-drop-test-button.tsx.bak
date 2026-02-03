import { Button } from '@/components/ui/button';
import { Move } from 'lucide-react';

interface DragDropTestButtonProps {
  onOpenCustomizer: () => void;
}

export const DragDropTestButton: React.FC<DragDropTestButtonProps> = ({ onOpenCustomizer }) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onOpenCustomizer}
        className="w-full flex items-center gap-2"
      >
        <Move className="w-4 h-4" />
        Перетащить элементы
      </Button>
    </div>
  );
};