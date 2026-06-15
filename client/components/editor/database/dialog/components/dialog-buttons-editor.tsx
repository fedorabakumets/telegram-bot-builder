/**
 * @fileoverview Компоновщик инлайн-кнопок сообщения для диалога
 * @description Тонкий контейнер над ButtonCard из узла клавиатуры. Позволяет
 * добавлять, редактировать, удалять и дублировать инлайн-кнопки прямо в диалоге.
 * Допустимые действия ограничены url/web_app/copy_text/goto/default.
 */

import { Plus } from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import { ButtonCard } from '@/components/editor/properties/components/button-card/button-card';
import { generateButtonId } from '@/utils/generate-button-id';
import type { Button, Node } from '@shared/schema';
import type { NodeWithSheet } from '../utils/node-utils';

/** Идентификатор виртуального узла клавиатуры для ButtonCard */
const VIRTUAL_NODE_ID = 'dialog-inline-keyboard';

/** Пропсы компоновщика инлайн-кнопок */
interface DialogButtonsEditorProps {
  /** Текущий список инлайн-кнопок */
  buttons: Button[];
  /** Колбэк изменения списка кнопок */
  onChange: (buttons: Button[]) => void;
  /** Узлы проекта для выбора цели действия goto */
  availableNodes?: NodeWithSheet[];
}

/**
 * Компонент редактирования инлайн-кнопок сообщения диалога.
 * @param props - Свойства компонента
 * @returns JSX элемент списка кнопок с возможностью добавления
 */
export function DialogButtonsEditor({ buttons, onChange, availableNodes }: DialogButtonsEditorProps) {
  /** Виртуальный узел клавиатуры, необходимый ButtonCard */
  const virtualNode = {
    id: VIRTUAL_NODE_ID,
    type: 'keyboard',
    data: { buttons, keyboardType: 'inline', allowMultipleSelection: false },
  } as unknown as Node;

  /**
   * Обновляет поля кнопки по её id.
   * @param _nodeId - ID узла (игнорируется, узел виртуальный)
   * @param buttonId - ID обновляемой кнопки
   * @param updates - Частичные обновления полей кнопки
   */
  const handleUpdate = (_nodeId: string, buttonId: string, updates: Partial<Button>) => {
    onChange(buttons.map((b) => (b.id === buttonId ? { ...b, ...updates } : b)));
  };

  /**
   * Удаляет кнопку по её id.
   * @param _nodeId - ID узла (игнорируется)
   * @param buttonId - ID удаляемой кнопки
   */
  const handleDelete = (_nodeId: string, buttonId: string) => {
    onChange(buttons.filter((b) => b.id !== buttonId));
  };

  /**
   * Дублирует кнопку, присваивая копии новый id.
   * @param _nodeId - ID узла (игнорируется)
   * @param button - Дублируемая кнопка
   */
  const handleDuplicate = (_nodeId: string, button: Button) => {
    const index = buttons.findIndex((b) => b.id === button.id);
    const copy: Button = { ...button, id: generateButtonId() };
    const next = [...buttons];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  /** Добавляет новую инлайн-кнопку с действием по умолчанию url */
  const handleAdd = () => {
    onChange([
      ...buttons,
      { id: generateButtonId(), text: 'Новая кнопка', action: 'url', url: '' } as Button,
    ]);
  };

  /** Признак наличия хотя бы одной callback-кнопки (action === 'default') */
  const hasCallbackButton = buttons.some((b) => b.action === 'default');

  return (
    <div className="space-y-2">
      {buttons.map((button) => (
        <ButtonCard
          key={button.id}
          nodeId={VIRTUAL_NODE_ID}
          button={button}
          textVariables={[]}
          getAllNodesFromAllSheets={availableNodes ?? []}
          onButtonUpdate={handleUpdate}
          onButtonDelete={handleDelete}
          onButtonDuplicate={handleDuplicate}
          selectedNode={virtualNode}
          keyboardType="inline"
          hideExtras
          showStyle
          allowedActions={['url', 'web_app', 'copy_text', 'goto', 'default']}
        />
      ))}

      {/* Предупреждение для callback-кнопок: без обработчика callback_data нажатие не сработает */}
      {hasCallbackButton && (
        <p className="text-xs text-muted-foreground">
          Callback-кнопка сработает только если в боте настроен обработчик этого callback_data —
          иначе нажатие ничего не сделает.
        </p>
      )}

      <UIButton variant="outline" size="sm" onClick={handleAdd} className="w-full">
        <Plus className="w-4 h-4 mr-1" />
        Добавить кнопку
      </UIButton>
    </div>
  );
}
