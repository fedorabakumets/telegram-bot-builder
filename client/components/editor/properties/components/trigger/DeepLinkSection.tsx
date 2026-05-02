/**
 * @fileoverview Секция настроек Deep Link для команды /start
 *
 * Отображает поля режима совпадения, параметра deep link,
 * превью ссылки и опциональное сохранение значения в переменную.
 * @module components/editor/properties/components/trigger/DeepLinkSection
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Пропсы компонента DeepLinkSection
 */
interface DeepLinkSectionProps {
  /** Режим совпадения: точное или по префиксу */
  deepLinkMatchMode: 'exact' | 'startsWith';
  /** Параметр deep link, например "ref" или "ref_" */
  deepLinkParam: string;
  /** Сохранять значение параметра в переменную */
  deepLinkSaveToVar: boolean;
  /** Имя переменной для сохранения значения */
  deepLinkVarName: string;
  /** Обработчик изменения любого поля */
  onChange: (updates: Partial<DeepLinkSectionProps>) => void;
}

/**
 * Секция настроек Deep Link
 *
 * Показывается только для команды /start. Позволяет задать
 * параметр ссылки, режим совпадения и переменную для сохранения.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент секции Deep Link
 */
export function DeepLinkSection({
  deepLinkMatchMode,
  deepLinkParam,
  deepLinkSaveToVar,
  deepLinkVarName,
  onChange,
}: DeepLinkSectionProps) {
  const preview = deepLinkParam ? `t.me/bot?start=${deepLinkParam}` : 't.me/bot?start=<значение>';

  return (
    <div className="space-y-3 rounded-lg border border-sky-300/40 dark:border-sky-700/40 p-3">
      <Label className="text-sm font-semibold text-sky-700 dark:text-sky-300">Deep Link</Label>

      {/* Режим совпадения */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Режим совпадения</Label>
        <Select
          value={deepLinkMatchMode}
          onValueChange={(value) =>
            onChange({ deepLinkMatchMode: value as 'exact' | 'startsWith' })
          }
        >
          <SelectTrigger className="text-sm bg-white/70 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 hover:border-sky-400/60 dark:hover:border-sky-600/60 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 rounded-lg text-sky-900 dark:text-sky-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95">
            <SelectItem value="exact">Точное совпадение</SelectItem>
            <SelectItem value="startsWith">Начинается с</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Параметр */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Параметр</Label>
        <Input
          value={deepLinkParam}
          onChange={(e) => onChange({ deepLinkParam: e.target.value })}
          placeholder="ref"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground font-mono">{preview}</p>
      </div>

      {/* Сохранить в переменную */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="deepLinkSaveToVar"
          checked={deepLinkSaveToVar}
          onCheckedChange={(checked) => onChange({ deepLinkSaveToVar: Boolean(checked) })}
        />
        <Label htmlFor="deepLinkSaveToVar" className="text-xs cursor-pointer">
          Сохранить в переменную
        </Label>
      </div>

      {/* Имя переменной */}
      {deepLinkSaveToVar && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Имя переменной</Label>
          <Input
            value={deepLinkVarName}
            onChange={(e) => onChange({ deepLinkVarName: e.target.value })}
            placeholder="referrer_id"
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}
