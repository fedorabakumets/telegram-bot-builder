/** @fileoverview Настройки инструментов холста в профиле. */
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { canvasToolbarTitles, setCanvasToolbarPreferences, useCanvasToolbarPreferences } from '@/components/editor/canvas/canvas/canvas-toolbar-preferences';
import { OrderedVisibilitySettings } from './ordered-visibility-settings';

/** Показывает настройки инструментов, включая видимость закреплённого переключателя режима. */
export function CanvasToolbarSettings() {
  const preferences = useCanvasToolbarPreferences();
  return (
    <div className="space-y-2">
      <OrderedVisibilitySettings legend="Инструменты холста" idPrefix="canvas-toolbar"
        items={preferences.order.filter(key => key !== 'view')} titles={canvasToolbarTitles} hidden={preferences.hidden}
        onOrderChange={order => setCanvasToolbarPreferences({ ...preferences, order })}
        onHiddenChange={hidden => setCanvasToolbarPreferences({ ...preferences, hidden })} />
      <div className="flex items-center justify-between gap-2 border-t py-2">
        <Label htmlFor="canvas-toolbar-view">Холст / JSON</Label>
        <Switch id="canvas-toolbar-view" checked={!preferences.hidden.includes('view')}
          onCheckedChange={checked => setCanvasToolbarPreferences({ ...preferences,
            hidden: checked ? preferences.hidden.filter(key => key !== 'view') : [...preferences.hidden, 'view'],
          })} />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setCanvasToolbarPreferences()}>
        Сбросить инструменты холста
      </Button>
    </div>
  );
}
