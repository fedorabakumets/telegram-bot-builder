/**
 * @fileoverview Страница выключения типов блоков
 * @module components/admin/pages/admin-node-types
 */

import { NodeTypesForm } from '../node-types/node-types-form';

/**
 * Раздел панели: какие типы блоков доступны во всех проектах
 * @returns JSX элемент страницы
 */
export function AdminNodeTypesPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Типы блоков</h1>
        <p className="text-muted-foreground mt-1">
          Включение и выключение типов блоков для конструктора
        </p>
      </div>
      <NodeTypesForm />
    </div>
  );
}
