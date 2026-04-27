/**
 * @fileoverview Панель изменений редактора — встроенная полоса сверху
 * Адаптируется под canvas, json-dirty и json-error варианты
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChangesModal } from './ChangesModal';
import type { UseStagingBarResult } from './use-staging-bar';
import type { ActionHistoryItem } from '@/pages/editor/types/action-history-item';

/** Свойства компонента StagingBar */
interface StagingBarProps extends UseStagingBarResult {
  /** История действий для передачи в ChangesModal */
  actionHistory: ActionHistoryItem[];
}

/**
 * Панель изменений — встроенная полоса сверху контента редактора
 * @param props - Свойства компонента
 * @returns JSX элемент панели или null если не видима
 */
export function StagingBar(props: StagingBarProps) {
  const { isVisible, variant, changesCount, onSave, onSaveAndRestart, onDiscard, isSaving,
    onApplyJson, onResetJson, jsonError, actionHistory, mode } = props;

  /** Открыто ли модальное окно деталей */
  const [modalOpen, setModalOpen] = useState(false);

  if (!isVisible) return null;

  /** Нейтральный фон для canvas и json-dirty; красный для json-error */
  const barClass = variant === 'json-error'
    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
    : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/60';

  return (
    <>
      <div className={`flex items-center justify-center border-b shrink-0 py-1.5 px-3 ${barClass}`}>
        <div className="flex items-center gap-1.5">
          {variant === 'canvas' && (
            <CanvasVariant
              changesCount={changesCount}
              isSaving={isSaving}
              onSave={onSave}
              onSaveAndRestart={onSaveAndRestart}
              onDiscard={onDiscard}
              onDetails={() => setModalOpen(true)}
            />
          )}
          {variant === 'json-dirty' && (
            <JsonDirtyVariant
              onApply={onApplyJson}
              onReset={onResetJson}
              onDetails={() => setModalOpen(true)}
              onSave={onSave}
              onSaveAndRestart={onSaveAndRestart}
              isSaving={isSaving}
            />
          )}
          {variant === 'json-error' && (
            <JsonErrorVariant
              error={jsonError}
              onReset={onResetJson}
              onDetails={() => setModalOpen(true)}
            />
          )}
        </div>
      </div>

      <ChangesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); onSave(); }}
        isSaving={isSaving}
        actionHistory={actionHistory}
        mode={mode}
      />
    </>
  );
}

/** Свойства варианта canvas */
interface CanvasVariantProps {
  /** Количество изменений */
  changesCount: number;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** Колбэк сохранения */
  onSave: () => void;
  /** Колбэк сохранения с перезапуском */
  onSaveAndRestart: () => void;
  /** Колбэк сброса */
  onDiscard: () => void;
  /** Колбэк открытия деталей */
  onDetails: () => void;
}

/**
 * Вариант панели для canvas режима
 * @param props - Свойства варианта
 * @returns JSX элемент
 */
function CanvasVariant({ changesCount, isSaving, onSave, onSaveAndRestart, onDiscard, onDetails }: CanvasVariantProps) {
  return (
    <>
      <span className="text-xs text-slate-600 dark:text-slate-300 px-1.5 whitespace-nowrap">
        <i className="fas fa-pencil text-violet-500 dark:text-violet-400 mr-1.5" />
        {changesCount > 0 ? `${changesCount} изменений` : 'Есть изменения'}
      </span>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onDetails}
        className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
        Детали
      </Button>
      <Button size="sm" variant="ghost" onClick={onDiscard}
        className="h-7 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
        Сбросить
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}
        className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <><i className="fas fa-floppy-disk mr-1" />Сохранить <kbd className="ml-1 opacity-60 text-[10px]">⇧+↵</kbd></>}
      </Button>
      <Button size="sm" onClick={onSaveAndRestart} disabled={isSaving}
        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <><i className="fas fa-play mr-1" />Сохранить и перезапустить</>}
      </Button>
    </>
  );
}

/** Свойства варианта json-dirty */
interface JsonDirtyVariantProps {
  /** Колбэк применения JSON */
  onApply: () => void;
  /** Колбэк сброса JSON */
  onReset: () => void;
  /** Колбэк открытия деталей */
  onDetails: () => void;
  /** Колбэк сохранения на сервер */
  onSave: () => void;
  /** Колбэк сохранения с перезапуском ботов */
  onSaveAndRestart: () => void;
  /** Идёт ли сохранение */
  isSaving: boolean;
}

/**
 * Вариант панели для json-dirty режима
 * @param props - Свойства варианта
 * @returns JSX элемент
 */
function JsonDirtyVariant({ onApply, onReset, onDetails, onSave, onSaveAndRestart, isSaving }: JsonDirtyVariantProps) {
  return (
    <>
      <span className="text-xs text-slate-600 dark:text-slate-300 px-1.5 whitespace-nowrap">
        <i className="fas fa-pencil-alt text-violet-500 dark:text-violet-400 mr-1.5" />
        Есть изменения в JSON
      </span>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onDetails}
        className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
        Детали
      </Button>
      <Button size="sm" variant="ghost" onClick={onReset}
        className="h-7 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
        Сбросить
      </Button>
      <Button size="sm" onClick={onApply}
        className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white">
        <i className="fas fa-check mr-1" />Применить
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}
        className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <><i className="fas fa-floppy-disk mr-1" />Сохранить</>}
      </Button>
      <Button size="sm" onClick={onSaveAndRestart} disabled={isSaving}
        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <><i className="fas fa-play mr-1" />Сохранить и перезапустить</>}
      </Button>
    </>
  );
}

/** Свойства варианта json-error */
interface JsonErrorVariantProps {
  /** Текст ошибки валидации */
  error: string | null;
  /** Колбэк сброса JSON */
  onReset: () => void;
  /** Колбэк открытия деталей */
  onDetails: () => void;
}

/**
 * Вариант панели для json-error режима
 * @param props - Свойства варианта
 * @returns JSX элемент
 */
function JsonErrorVariant({ error, onReset, onDetails }: JsonErrorVariantProps) {
  return (
    <>
      <span className="text-xs text-red-700 dark:text-red-300 px-1.5 max-w-xs truncate">
        <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mr-1.5" />
        {error ?? 'Невалидный JSON'}
      </span>
      <div className="w-px h-4 bg-red-200 dark:bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onDetails}
        className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
        Детали
      </Button>
      <Button size="sm" variant="ghost" onClick={onReset}
        className="h-7 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
        Сбросить
      </Button>
    </>
  );
}
