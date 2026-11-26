/** @fileoverview Общая настройка видимости питомца Mini для всех экранов конструктора. */
import { workspaceTabs } from '@/components/ui/workspace-header-preferences';
import { setEditorAppearance, useAllEditorAppearance, useEditorAppearance } from '../shared/use-editor-appearance';

/**
 * Показывает или скрывает питомца на этом устройстве.
 * @param visible - Должен ли питомец быть виден.
 */
function setMiniVisibility(visible: boolean): void {
  setEditorAppearance('miniVisible', visible);
}

/**
 * Синхронизирует видимость питомца с настройками интерфейса в этом браузере.
 * @returns Текущая видимость и функция для её изменения.
 */
export function useMiniVisibility() {
  return [useEditorAppearance('miniVisible'), setMiniVisibility] as const;
}

/** Экраны и вкладки, на которых доступен Mini. */
export const miniTabs = [
  ...workspaceTabs, ['broadcast', 'Рассылки'], ['preview', 'Предпросмотр'],
  ['start', 'Стартовый экран'], ['templates', 'Каталог шаблонов'],
  ['account', 'Профиль · Аккаунт'], ['projects', 'Профиль · Проекты'],
  ['interface', 'Профиль · Интерфейс'], ['sessions', 'Профиль · Сессии'],
] as const;

/** Идентификатор места показа питомца. */
export type MiniTab = typeof miniTabs[number][0];

/** Включает Mini во всех разделах, включая ранее скрытые вкладки. */
export function setMiniOnAllTabs(visible: boolean) {
  if (visible) {
    for (const [tab] of miniTabs) setEditorAppearance(`miniTab-${tab}`, true);
  }
  setMiniVisibility(visible);
}

const miniVisibilityKeys = ['miniVisible', ...miniTabs.map(([tab]) => `miniTab-${tab}` as const)] as const;

/** Отмечает общий переключатель только при показе Mini на каждой вкладке. */
export function useMiniVisibleOnAllTabs() {
  return useAllEditorAppearance(miniVisibilityKeys);
}

/** Читает и обновляет предпочтение только для выбранной вкладки. */
export function useMiniTabVisibility(tab: MiniTab) {
  const key = `miniTab-${tab}` as const;
  return [useEditorAppearance(key), (visible: boolean) => setEditorAppearance(key, visible)] as const;
}
