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
 * @returns Группы без пустых категорий
 */
export function buildNodeTypeCatalog(): NodeTypeCatalogGroup[] {
  return componentCategories
    .map((category) => ({
      title: category.title,
      items: category.components.map((component) => ({
        type: component.type,
        label: nodeRegistry[component.type]?.name ?? component.name ?? component.type,
      })),
    }))
    .filter((group) => group.items.length > 0);
}
