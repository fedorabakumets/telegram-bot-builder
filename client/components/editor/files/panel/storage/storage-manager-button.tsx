/**
 * @fileoverview Кнопка доступа к менеджеру хранилищ из шапки панели
 * (`StorageManagerButton`). Держит состояние открытия модалки и рендерит
 * самодостаточный `StorageConfigManager` (Req 11.1). Вынесена из
 * FileStorageHeader, чтобы шапка оставалась в пределах лимита строк.
 * Иконка — смысловая lucide-react (Database), без эмодзи (Req 13.2).
 * @module components/editor/files/panel/storage/storage-manager-button
 */

import { useState } from 'react';
import { Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StorageConfigManager } from './storage-config-manager';

/**
 * Кнопка «Хранилища» в шапке: открывает менеджер конфигов хранилищ.
 * @returns JSX элемент кнопки и связанной модалки менеджера
 */
export function StorageManagerButton() {
  /** Открыта ли модалка менеджера хранилищ */
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setOpen(true)}
        title="Управление хранилищами"
        data-testid="open-storage-manager"
      >
        <Database className="h-3.5 w-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">Хранилища</span>
      </Button>

      <StorageConfigManager open={open} onOpenChange={setOpen} />
    </>
  );
}
