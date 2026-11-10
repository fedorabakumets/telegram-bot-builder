/** @fileoverview Проверка видимых отметок и перетаскивания навигации сообщений. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageNavigation } from '../../components/message-navigation';
import type { BotMessageWithMedia } from '../../types';

/**
 * Создаёт геометрию элемента для проверки прокрутки без браузерной вёрстки.
 * @param top - Верхняя граница
 * @param bottom - Нижняя граница
 * @returns Прямоугольник элемента
 */
function rect(top: number, bottom: number): DOMRect {
  return { top, bottom, left: 0, right: 40, width: 40, height: bottom - top, x: 0, y: top, toJSON: () => ({}) };
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('PointerEvent', MouseEvent);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

/**
 * Подготавливает прокручиваемую историю и шкалу из сорока сообщений.
 * @returns Контейнер истории и кнопки отметок
 */
function setupNavigation() {
  const root = document.createElement('div');
  const viewport = document.createElement('div');
  viewport.setAttribute('data-radix-scroll-area-viewport', ''); root.append(viewport);
  viewport.getBoundingClientRect = () => rect(0, 250);
  const messages = Array.from({ length: 40 }, (_, index) => {
    const node = document.createElement('div'); node.dataset.dialogIndex = String(index);
    node.getBoundingClientRect = () => rect(index * 100 - viewport.scrollTop, (index + 1) * 100 - viewport.scrollTop);
    viewport.append(node);
    return { id: index, messageText: `Текст ${index}` } as BotMessageWithMedia;
  });
  render(<MessageNavigation messages={messages} scrollRef={{ current: root }} total={40} />);
  const nav = screen.getByRole('navigation');
  const buttons = screen.getAllByRole('button');
  buttons.forEach((button, index) => { button.getBoundingClientRect = () => rect(index * 10, index * 10 + 10); });
  nav.setPointerCapture = vi.fn(); nav.releasePointerCapture = vi.fn();
  return { viewport, nav, buttons };
}

describe('Шкала сообщений', () => {
  it('показывает отдельные отметки и выделяет все сообщения в области просмотра', () => {
    const { buttons, viewport } = setupNavigation();
    expect(buttons).toHaveLength(40);
    expect(buttons.filter((button) => button.getAttribute('aria-current') === 'true')).toHaveLength(3);
    viewport.scrollTop = 500; fireEvent.scroll(viewport);
    expect(buttons[0]).not.toHaveAttribute('aria-current');
    expect(buttons[5]).toHaveAttribute('aria-current', 'true');
    expect(buttons[7]).toHaveAttribute('aria-current', 'true');
  });

  it('пролистывает при удержании и прекращает после отпускания', () => {
    const { nav, viewport } = setupNavigation();
    /** Создаёт событие основного указателя с нужной высотой. */
    const pointerEvent = (type: string, clientY: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientY, button: 0 });
      Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
      fireEvent(nav, event);
    };
    pointerEvent('pointerdown', 25); expect(viewport.scrollTop).toBe(200);
    pointerEvent('pointermove', 95); expect(viewport.scrollTop).toBe(900);
    pointerEvent('pointermove', -20); expect(viewport.scrollTop).toBe(0);
    pointerEvent('pointerup', 0);
    pointerEvent('pointermove', 150); expect(viewport.scrollTop).toBe(0);
    fireEvent.click(screen.getAllByRole('button')[4]); expect(viewport.scrollTop).toBe(400);
  });
});
