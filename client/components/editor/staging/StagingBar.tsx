/**
 * @fileoverview Плавающая панель изменений редактора
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
 * Плавающая панель изменений, позиционированная внизу по центру редактора
 * @param props - Свойства компонента
 * @returns JSX элемент панели или null если не видима
 */
export function StagingBar(props: StagingBarProps) {
  const { isVisible, variant, changesCount, onSave, onDiscard, isSaving,
    onApplyJson, onResetJson, jsonError, actionHistory } = props;

  /** Открыто ли модальное окно деталей */
  const [modalOpen, setModalOpen] = useState(false);

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`
          absolute bottom-4 left-1/2 -translate-x-1/2 z-50
          flex items-center gap-1.5 px-2 py-1.5 rounded-xl shadow-lg
          backdrop-blur-md border transition-all duration-300
          translate-y-0 opacity-100
          bg-slate-900/95 border-slate-700/60 dark:bg-slate-900/95
          light:bg-white/95 light:border-slate-200/80
        `}
        style={{ pointerEvents: 'auto' }}
      >
        {variant === 'canvas' && (
          <CanvasVariant
            changesCount={changesCount}
            isSaving={isSaving}
            onSave={onSave}
            onDiscard={onDiscard}
            onDetails={() => setModalOpen(true)}
          />
        )}
        {variant === 'json-dirty' && (
          <JsonDirtyVariant onApply={onApplyJson} onReset={onResetJson} />
        )}
        {variant === 'json-error' && (
          <JsonErrorVariant error={jsonError} onReset={onResetJson} />
        )}
      </div>

      <ChangesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); onSave(); }}
        isSaving={isSaving}
        actionHistory={actionHistory}
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
function CanvasVariant({ changesCount, isSaving, onSave, onDiscard, onDetails }: CanvasVariantProps) {
  return (
    <>
      <span className="text-xs text-slate-300 px-1.5 whitespace-nowrap">
        <i className="fas fa-pencil text-violet-400 mr-1.5" />
        {changesCount > 0 ? `${changesCount} изменений` : 'Есть изменения'}
      </span>
      <div className="w-px h-4 bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onDetails}
        className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700">
        Детали
      </Button>
      <Button size="sm" variant="ghost" onClick={onDiscard}
        className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700">
        Сбросить
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}
        className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700 text-white">
        {isSaving
          ? <><i className="fas fa-spinner fa-spin mr-1" />Сохранение…</>
          : <><i className="fas fa-floppy-disk mr-1" />Сохранить <kbd className="ml-1 opacity-60 text-[10px]">⇧+↵</kbd></>}
      </Button>
    </>
  );
}

/**
 * Вариант панели для json-dirty режима
 * @param props - Колбэки применения и сброса
 * @returns JSX элемент
 */
function JsonDirtyVariant({ onApply, onReset }: { onApply: () => void; onReset: () => void }) {
  return (
    <>
      <span className="text-xs text-amber-300 px-1.5 whitespace-nowrap">
        <i className="fas fa-pencil-alt text-amber-400 mr-1.5" />
        Есть изменения в JSON
      </span>
      <div className="w-px h-4 bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onReset}
        className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700">
        Сбросить
      </Button>
      <Button size="sm" onClick={onApply}
        className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white">
        <i className="fas fa-check mr-1" />Применить
      </Button>
    </>
  );
}

/**
 * Вариант панели для json-error режима
 * @param props - Текст ошибки и колбэк сброса
 * @returns JSX элемент
 */
function JsonErrorVariant({ error, onReset }: { error: string | null; onReset: () => void }) {
  return (
    <>
      <span className="text-xs text-red-300 px-1.5 max-w-xs truncate">
        <i className="fas fa-exclamation-circle text-red-400 mr-1.5" />
        {error ?? 'Невалидный JSON'}
      </span>
      <div className="w-px h-4 bg-slate-700" />
      <Button size="sm" variant="ghost" onClick={onReset}
        className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700">
        Сбросить
      </Button>
    </>
  );
}
