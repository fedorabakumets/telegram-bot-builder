/** @fileoverview Проверка смены состояния предпросмотра клавиатуры. */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ButtonsPreview } from './buttons-preview';
import type { Node } from '@/types/bot';

describe('ButtonsPreview', () => {
  it('сохраняет порядок хуков при появлении и исчезновении клавиатуры', () => {
    const empty = { type: 'message', data: { keyboardType: 'none', buttons: [] } } as unknown as Node;
    const filled = { ...empty, data: { ...empty.data, keyboardType: 'inline', buttons: [{ id: '1', text: 'Кнопка' }] } } as Node;
    const view = render(<ButtonsPreview node={filled} />);
    expect(view.container.textContent).toContain('Кнопка');
    view.rerender(<ButtonsPreview node={empty} />);
    expect(view.container.textContent).toBe('');
    view.rerender(<ButtonsPreview node={filled} />);
    expect(view.container.textContent).toContain('Кнопка');
  });
});
