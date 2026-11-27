/** @fileoverview Проверки совместимости кнопок рассылки с обработчиками переходов бота. */
import { describe, expect, it } from 'vitest';
import { extractButtonsFromNode } from './extract-buttons';

describe('Кнопки рассылки', () => {
  /** Проверяет передачу идентификатора экрана без несовместимого префикса. */
  it('передаёт create-own-intro как callback перехода без префикса', () => {
    expect(extractButtonsFromNode({ buttons: [{ id: 'new-button', text: 'Новая кнопка',
      action: 'goto', target: 'create-own-intro' }] })).toEqual([
      { id: 'new-button', text: 'Новая кнопка', callbackData: 'create-own-intro' },
    ]);
  });

  /** Проверяет приоритет явно заданных данных перед целевым экраном. */
  it('сохраняет приоритет пользовательского callback', () => {
    expect(extractButtonsFromNode({ buttons: [{ id: 'button', text: 'Выбрать',
      action: 'goto', target: 'create-own-intro', customCallbackData: 'custom-action' }] })[0])
      .toMatchObject({ callbackData: 'custom-action' });
  });

  /** Проверяет резервное значение для кнопок без целевого экрана. */
  it('использует идентификатор кнопки при отсутствии цели', () => {
    expect(extractButtonsFromNode({ buttons: [
      { id: 'without-target', text: 'Открыть', action: 'goto' },
      { id: 'default-button', text: 'Выбрать' },
    ] }).map(button => button.callbackData)).toEqual(['without-target', 'default-button']);
  });

  /** Проверяет сохранение ссылки и визуального стиля без callback. */
  it('сохраняет ссылку и стиль кнопки', () => {
    expect(extractButtonsFromNode({ buttons: [{ id: 'support', text: 'Поддержка',
      action: 'url', url: 'https://example.com/support', style: 'primary' }] })).toEqual([
      { id: 'support', text: 'Поддержка', url: 'https://example.com/support', style: 'primary' },
    ]);
  });
});
