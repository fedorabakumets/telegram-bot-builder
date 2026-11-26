/** @fileoverview Настройки рабочей области отдельных вкладок профиля. */
import { useBotViewMode } from '@/components/editor/bot/canvas/use-bot-view-mode';
import { Switch } from '@/components/ui/switch';
import { setEditorAppearance, useEditorAppearance } from '@/components/editor/shared/use-editor-appearance';
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

/** Показывает подписанный переключатель оформления. */
function AppearanceSwitch({ setting, label }: {
  /** Ключ настройки редактора. */
  setting: Parameters<typeof useEditorAppearance>[0];
  /** Название в профиле. */
  label: string;
}) {
  const checked = useEditorAppearance(setting);
  const id = `profile-editor-${setting}`;
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={value => setEditorAppearance(setting, value)} />
    </div>
  );
}

/** Показывает настройки листов, холста и палитры. */
export function EditorTabViewSettings() {
  const underlineTabs = useEditorAppearance('underlineTabs');
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
      <AppearanceSwitch setting="blockLabels" label="Подписи над содержимым блоков на холсте" />
      <AppearanceSwitch setting="coloredIcons" label="Цветные иконки в панелях компонентов и свойств" />
      <Label htmlFor="profile-tab-highlight" className="block pt-2">Выделение вкладок в панелях редактора</Label>
      <Select value={underlineTabs ? 'line' : 'fill'} onValueChange={value => setEditorAppearance('underlineTabs', value === 'line')}>
        <SelectTrigger id="profile-tab-highlight"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Подчёркивание</SelectItem>
          <SelectItem value="fill">Синяя заливка</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
