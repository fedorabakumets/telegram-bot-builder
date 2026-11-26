/** @fileoverview Настройка видимости питомца Mini в профиле. */
import { useEffect, useRef, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { miniTabs, setMiniOnAllTabs, type MiniTab, useMiniTabVisibility, useMiniVisibility, useMiniVisibleOnAllTabs } from '@/components/editor/no-projects/use-mini-visibility';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/**
 * Позволяет скрыть или вернуть Mini и принимает фокус при переходе из его меню.
 * @returns Переключатель видимости питомца.
 */
export function MiniVisibilitySetting() {
  const [visible] = useMiniVisibility();
  const allVisible = useMiniVisibleOnAllTabs();
  const [tab, setTab] = useState<MiniTab>('editor');
  const [tabVisible, setTabVisible] = useMiniTabVisibility(tab);
  const switchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    /** Переводит фокус на настройку, когда её якорь указан в адресе профиля. */
    function focusLinkedSetting() {
      if (window.location.hash === '#mini-settings') {
        switchRef.current?.focus({ preventScroll: true });
        switchRef.current?.scrollIntoView({ block: 'nearest' });
      }
    }
    focusLinkedSetting();
    const events = ['pushState', 'replaceState', 'popstate', 'hashchange'];
    events.forEach(event => window.addEventListener(event, focusLinkedSetting));
    return () => events.forEach(event => window.removeEventListener(event, focusLinkedSetting));
  }, []);

  return (
    <fieldset className="min-w-0 space-y-3 border-t pt-4 sm:col-span-2">
      <legend className="font-semibold">Mini</legend>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="mini-settings">Показывать на всех вкладках</Label>
        <Switch ref={switchRef} id="mini-settings" checked={allVisible} onCheckedChange={setMiniOnAllTabs} />
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mini-tab">Вкладка Mini</Label>
          <Select value={tab} onValueChange={value => {
            const selected = miniTabs.find(([key]) => key === value);
            if (selected) setTab(selected[0]);
          }}>
            <SelectTrigger id="mini-tab"><SelectValue /></SelectTrigger>
            <SelectContent>{miniTabs.map(([key, label]) =>
              <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <Label htmlFor="mini-tab-visible">Показывать на этой вкладке</Label>
          <Switch id="mini-tab-visible" checked={tabVisible} onCheckedChange={setTabVisible} disabled={!visible} />
        </div>
      </div>
    </fieldset>
  );
}
