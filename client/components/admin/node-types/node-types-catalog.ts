/**
 * @fileoverview Каталог типов блоков для страницы панели управления
 * @module components/admin/node-types/node-types-catalog
 */

import { componentCategories } from '@/components/editor/sidebar/constants';
import { nodeRegistry } from '@/components/editor/shared/node-registry';

/** Элемент каталога для переключателя */
export interface NodeTypeCatalogItem {
  /** Внутреннее имя типа */
  type: string;
  /** Подпись для оператора */
  label: string;
}

/** Группа типов как в наборе блоков слева */
export interface NodeTypeCatalogGroup {
  /** Название группы */
  title: string;
  /** Типы в группе */
  items: NodeTypeCatalogItem[];
}

/**
 * Собирает группы типов из палитры редактора
 * @returns Группы «главная · подкатегория» без пустых
 */
export function buildNodeTypeCatalog(): NodeTypeCatalogGroup[] {
  return componentCategories.flatMap((main) =>
    main.subcategories.map((sub) => ({
      title: `${main.title} · ${sub.title}`,
      items: sub.components.map((component) => ({
        type: component.type,
        label: nodeRegistry[component.type]?.name ?? component.name ?? component.type,
      })),
    })),
  ).filter((group) => group.items.length > 0);
}
