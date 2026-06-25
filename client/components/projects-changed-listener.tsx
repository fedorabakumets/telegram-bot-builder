/**
 * @fileoverview Невидимый компонент глобальной подписки на projects-changed.
 * Монтируется на уровне приложения, чтобы список проектов в шапке, на домашней
 * странице и в сайдбаре обновлялся в реальном времени независимо от открытой
 * вкладки или проекта.
 * @module client/components/projects-changed-listener
 */

import { useProjectsChangedWs } from '@/hooks/use-projects-changed-ws';

/**
 * Невидимый компонент: активирует глобальную подписку на projects-changed.
 * @returns null
 */
export function ProjectsChangedListener(): null {
  useProjectsChangedWs();
  return null;
}
