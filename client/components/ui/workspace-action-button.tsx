/** @fileoverview Единая нейтральная кнопка основных действий рабочих вкладок конструктора. */
import { Button, type ButtonProps } from './button';
import './workspace-action-button.css';

/**
 * Сохраняет стандартное поведение кнопки, применяя спокойный общий стиль.
 * @param props - Обработчики, состояние, размер и содержимое кнопки
 * @returns Нейтральная кнопка действия
 */
export function WorkspaceActionButton(props: ButtonProps) {
  return <Button {...props} variant="outline" data-workspace-action="" data-workspace-size={props.size ?? 'default'} />;
}
