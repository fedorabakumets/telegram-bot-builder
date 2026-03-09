/**
 * @fileoverview Компонент переключателей типа клавиатуры
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface KeyboardTypeTogglesProps {
  keyboardType: string;
  onKeyboardTypeChange: (value: string) => void;
}

/**
 * Компонент переключателей типа клавиатуры (Inline/Reply)
 */
export function KeyboardTypeToggles({ keyboardType, onKeyboardTypeChange }: KeyboardTypeTogglesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-purple-100/30 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200/40 dark:border-purple-800/40">
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-purple-200/40 dark:hover:bg-purple-800/40 transition-all cursor-pointer">
        <i className="fas fa-square text-purple-600 dark:text-purple-400 text-xs"></i>
        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">Inline</Label>
        <Switch checked={keyboardType === 'inline'} onCheckedChange={(checked) => onKeyboardTypeChange(checked ? 'inline' : 'none')} />
      </div>
      <div className="w-px h-5 bg-purple-300/30 dark:bg-purple-700/30"></div>
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-purple-200/40 dark:hover:bg-purple-800/40 transition-all cursor-pointer">
        <i className="fas fa-bars text-purple-600 dark:text-purple-400 text-xs"></i>
        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer">Reply</Label>
        <Switch checked={keyboardType === 'reply'} onCheckedChange={(checked) => onKeyboardTypeChange(checked ? 'reply' : 'none')} />
      </div>
    </div>
  );
}
