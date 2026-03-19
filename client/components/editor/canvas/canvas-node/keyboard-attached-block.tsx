/**
 * @fileoverview Прикреплённый блок клавиатуры под основной карточкой ноды
 *
 * Визуально отображается как отдельная карточка, позиционированная
 * абсолютно под основной нодой. Переиспользует KeyboardGrid,
 * InlineButton и ReplyButton из существующих компонентов.
 *
 * Показывается только если у ноды есть кнопки и тип клавиатуры не 'none'.
 *
 * @module canvas-node/keyboard-attached-block
 */

import { Node } from '@/types/bot';
import { KeyboardGrid } from '../keyboard-grid';
import { InlineButton } from './inline-button';
import { ReplyButton } from './reply-button';
import { DoneButton } from './done-button';
import { OptionButton } from './option-button';
import { forwardRef } from 'react';

/** Зазор между основной карточкой и блоком клавиатуры (px) */
export const KEYBOARD_BLOCK_GAP = 48;

/** Ширина карточки ноды (w-80 = 320px) */
const CARD_WIDTH = 320;

/**
 * Свойства компонента KeyboardAttachedBlock
 */
interface KeyboardAttachedBlockProps {
  /** Нода с данными кнопок */
  node: Node;
  /** Все ноды холста (для отображения целевых узлов) */
  allNodes?: Node[];
  /** Высота основной карточки ноды */
  mainCardHeight: number;
  /** Выделена ли родительская нода */
  isSelected?: boolean;
  /** Обработчик клика (пробрасывается от основной ноды) */
  onClick?: () => void;
}

/**
 * Цвета акцента по типу клавиатуры
 * inline — синий, reply — зелёный
 */
const KEYBOARD_ACCENT: Record<'inline' | 'reply', { border: string; label: string; dot: string }> = {
  inline: {
    border: 'border-blue-400/60 dark:border-blue-500/50',
    label: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-400',
  },
  reply: {
    border: 'border-emerald-400/60 dark:border-emerald-500/50',
    label: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-400',
  },
};

/**
 * Заголовок блока клавиатуры с цветовым акцентом
 */
function KeyboardBlockHeader({ keyboardType }: { keyboardType: 'inline' | 'reply' }) {
  const accent = KEYBOARD_ACCENT[keyboardType];
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`inline-block w-2 h-2 rounded-full ${accent.dot}`} />
      <span className={`text-[11px] font-semibold uppercase tracking-widest ${accent.label}`}>
        {keyboardType === 'inline' ? 'Inline кнопки' : 'Reply клавиатура'}
      </span>
    </div>
  );
}

/**
 * Прикреплённый блок клавиатуры под основной карточкой ноды.
 * Принимает forwardRef для измерения высоты снаружи.
 *
 * @param props - Свойства компонента
 * @param ref - Ref на корневой div для ResizeObserver
 * @returns Карточка с кнопками или null если кнопок нет
 */
export const KeyboardAttachedBlock = forwardRef<HTMLDivElement, KeyboardAttachedBlockProps>(
  function KeyboardAttachedBlock({ node, allNodes, mainCardHeight, isSelected, onClick }, ref) {
  const buttons = node.data.buttons;
  const keyboardType = node.data.keyboardType as 'inline' | 'reply' | 'none' | undefined;

  if (!buttons?.length || !keyboardType || keyboardType === 'none') return null;

  const top = node.position.y + mainCardHeight + KEYBOARD_BLOCK_GAP;
  const accent = KEYBOARD_ACCENT[keyboardType];

  return (
    <div
      ref={ref}
      data-keyboard-block={node.id}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.position.x,
        top,
        width: CARD_WIDTH,
        zIndex: isSelected ? 100 : 10,
      }}
      className={`bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-sm rounded-2xl border-2 ${accent.border} p-4 shadow-lg cursor-pointer select-none`}
    >
      <KeyboardBlockHeader keyboardType={keyboardType} />

      {keyboardType === 'inline' ? (
        <KeyboardGrid
          buttons={buttons}
          keyboardLayout={node.data.keyboardLayout}
          renderButton={(button) => {
            if ((button as any).action === 'complete') return <DoneButton button={button} />;
            if ((button as any).action === 'selection') return <OptionButton button={button} />;
            return <InlineButton button={button} allNodes={allNodes} />;
          }}
        />
      ) : (
        <KeyboardGrid
          buttons={buttons}
          keyboardLayout={node.data.keyboardLayout}
          renderButton={(button) => <ReplyButton button={button} allNodes={allNodes} />}
        />
      )}
    </div>
  );
});
