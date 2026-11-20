/** @fileoverview Настройки рабочей области отдельных вкладок профиля. */
import { useBotViewMode } from '@/components/editor/bot/canvas/use-bot-view-mode';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { canvasSheetsPositions, setCanvasSheetsPosition, useCanvasSheetsPosition } from '@/components/editor/canvas/use-canvas-sheets-position';

/** Показывает выбор вида вкладки «Боты». */
export function BotTabViewSettings() {
  const { viewMode, setViewMode } = useBotViewMode();
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor="profile-interface-bots">Вид вкладки «Боты»</Label>
      <Select value={viewMode} onValueChange={value => {
        if (value === 'canvas' || value === 'list') setViewMode(value);
      }}>
        <SelectTrigger id="profile-interface-bots"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="canvas">Холст</SelectItem>
          <SelectItem value="list">Список</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Показывает выбор положения листов редактора. */
export function EditorTabViewSettings() {
  const sheetsPosition = useCanvasSheetsPosition();
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor="profile-canvas-sheets-position">Положение листов редактора</Label>
      <Select value={sheetsPosition} onValueChange={value => {
        const selected = canvasSheetsPositions.find(([position]) => position === value);
        if (selected) setCanvasSheetsPosition(selected[0]);
      }}>
        <SelectTrigger id="profile-canvas-sheets-position"><SelectValue /></SelectTrigger>
        <SelectContent>{canvasSheetsPositions.map(([position, label]) => <SelectItem key={position} value={position}>{label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
