/** @fileoverview Настройка рабочей области и шапки для выбранной вкладки. */
import { useState } from 'react';
import { ExternalLink, Image, PanelTop, Rows2, RotateCcw, Sparkles } from 'lucide-react';
import { BotTabViewSettings, EditorTabViewSettings } from './workspace-tab-view-settings';
import { WorkspaceActionSettings } from './workspace-action-settings';
import { CanvasToolbarSettings } from './canvas-toolbar-settings';
import { SIDEBAR_NAV_ITEMS } from '@/components/editor/app-sidebar/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  setWorkspaceHeaderPreferences, useWorkspaceHeaderPreferences, workspaceTabs,
  type WorkspaceHeaderPreferences, type WorkspaceTabKey,
} from '@/components/ui/workspace-header-preferences';

/** Подписи управления видимостью элементов. */
const visibility = [
  ['showIcon', 'Иконка вкладки', Image],
] as const;

/**
 * Показывает локальную форму настройки выбранной вкладки.
 * @param props - Проект для открытия выбранной вкладки.
 * @returns Элементы управления видимостью и расположением.
 */
export function WorkspaceLayoutSettings({ projectId }: { /** Проект для предварительного просмотра. */ projectId?: number }) {
  const [tab, setTab] = useState<WorkspaceTabKey>('editor');
  const preferences = useWorkspaceHeaderPreferences(tab);
  /** Обновляет одну настройку, сохраняя остальные параметры вкладки. */
  const update = (field: keyof WorkspaceHeaderPreferences, checked: boolean) =>
    setWorkspaceHeaderPreferences(tab, { ...preferences, [field]: checked });

  return (
    <section className="min-w-0 space-y-4 border-t pt-5 sm:col-span-2" aria-labelledby="workspace-layout-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h3 id="workspace-layout-heading" className="flex items-center gap-2 text-base font-semibold">
            <PanelTop className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />Настройки вкладок
          </h3>
          <Label htmlFor="interface-layout-tab">Вкладка</Label>
          <Select value={tab} onValueChange={value => {
            const selected = workspaceTabs.find(([key]) => key === value);
            if (selected) setTab(selected[0]);
          }}>
            <SelectTrigger id="interface-layout-tab" className="min-w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{workspaceTabs.map(([key, label]) => {
              const Icon = SIDEBAR_NAV_ITEMS.find(item => item.tab === key)?.icon ?? Sparkles;
              return <SelectItem key={key} value={key} textValue={label}>
                <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-muted-foreground" />{label}</span>
              </SelectItem>;
            })}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
        {projectId != null && <Button variant="outline" size="sm" asChild>
          <a href={`/projects/${projectId}?tab=${tab}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />Открыть в новой вкладке
          </a>
        </Button>}
        <Button type="button" variant="outline" size="sm" onClick={() => setWorkspaceHeaderPreferences(tab)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />Сбросить шапку
        </Button>
        </div>
      </div>
      {(tab === 'bot' || tab === 'editor') && (
        <fieldset className="space-y-3 border-b pb-4">
          <legend className="text-sm font-medium">Рабочая область</legend>
          <div className="max-w-sm">
            {tab === 'bot' ? <BotTabViewSettings /> : <EditorTabViewSettings />}
          </div>
        </fieldset>
      )}
      <WorkspaceActionSettings tab={tab} preferences={preferences} kind="selectors" />
      <WorkspaceActionSettings tab={tab} preferences={preferences} />
      {tab === 'editor' && <CanvasToolbarSettings />}
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">Видимость</legend>
          {visibility.map(([field, label, Icon]) => (
            <div key={field} className="flex items-center justify-between gap-2">
              <Label htmlFor={`layout-${field}`} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{label}
              </Label>
              <Switch id={`layout-${field}`} checked={preferences[field]} onCheckedChange={checked => update(field, checked)} />
            </div>
          ))}
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">Расположение</legend>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="layout-selectors-below" className="flex items-center gap-2">
              <Rows2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />Селекторы отдельной строкой
            </Label>
            <Switch id="layout-selectors-below" checked={preferences.selectorsBelow}
              onCheckedChange={checked => update('selectorsBelow', checked)} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="layout-actions-below" className="flex items-center gap-2">
              <Rows2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />Кнопки отдельной строкой
            </Label>
            <Switch id="layout-actions-below" checked={preferences.actionsBelow}
              onCheckedChange={checked => update('actionsBelow', checked)} />
          </div>
        </fieldset>
      </div>
    </section>
  );
}
