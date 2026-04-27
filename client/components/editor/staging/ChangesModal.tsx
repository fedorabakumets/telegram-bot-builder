/**
 * @fileoverview Модальное окно деталей изменений редактора
 * В canvas-режиме показывает список действий; в json-режиме — информационное сообщение
 */

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ActionHistoryItem } from '@/pages/editor/types/action-history-item';
import type { ActionType } from '@/pages/editor/types';

/** Свойства компонента ChangesModal */
interface ChangesModalProps {
  /** Открыто ли модальное окно */
  open: boolean;
  /** Колбэк закрытия */
  onClose: () => void;
  /** Колбэк сохранения (только для canvas-режима) */
  onSave: () => void;
  /** Идёт ли сохранение */
  isSaving: boolean;
  /** История действий для отображения */
  actionHistory: ActionHistoryItem[];
  /** Режим редактора: canvas или json */
  mode: 'canvas' | 'json';
}

/**
 * Возвращает иконку и цвет для типа действия
 * @param type - Тип действия
 * @returns Объект с классами иконки и цвета
 */
function getActionIcon(type: ActionType) {
  switch (type) {
    case 'add':        return { icon: 'fa-plus',       color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'delete':     return { icon: 'fa-trash',      color: 'text-red-500',     bg: 'bg-red-500/10' };
    case 'move':       return { icon: 'fa-arrows-alt', color: 'text-blue-500',    bg: 'bg-blue-500/10' };
    case 'update':     return { icon: 'fa-pen',        color: 'text-violet-500',  bg: 'bg-violet-500/10' };
    case 'connect':    return { icon: 'fa-link',       color: 'text-cyan-500',    bg: 'bg-cyan-500/10' };
    case 'disconnect': return { icon: 'fa-unlink',     color: 'text-orange-500',  bg: 'bg-orange-500/10' };
    case 'duplicate':  return { icon: 'fa-clone',      color: 'text-amber-500',   bg: 'bg-amber-500/10' };
    default:           return { icon: 'fa-circle-dot', color: 'text-slate-400',   bg: 'bg-slate-500/10' };
  }
}

/**
 * Модальное окно со списком изменений
 * @param props - Свойства компонента
 * @returns JSX элемент диалога
 */
export function ChangesModal({ open, onClose, onSave, isSaving, actionHistory, mode }: ChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <i className="fas fa-clock-rotate-left text-violet-500" />
            Изменения ({actionHistory.length})
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto space-y-0.5 py-1">
          {mode === 'json' && actionHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Изменения применены к JSON редактору</p>
          ) : actionHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Нет изменений</p>
          ) : actionHistory.map((item) => {
            const { icon, color, bg } = getActionIcon(item.type);
            return (
              <div key={item.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <i className={`fas ${icon} ${color}`} style={{ fontSize: '10px' }} />
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-200 truncate flex-1">
                  {item.description.replace(/\s*\([A-Za-z0-9_-]{10,}\)/g, '').trim()}
                </span>
                <span className="text-xs text-slate-400 tabular-nums flex-shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Закрыть</Button>
          {actionHistory.length > 0 && (
            <Button size="sm" onClick={onSave} disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white">
              {isSaving
                ? <><i className="fas fa-spinner fa-spin mr-1.5" />Сохранение…</>
                : <><i className="fas fa-floppy-disk mr-1.5" />Сохранить</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
