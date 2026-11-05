/** @fileoverview Проверка смены состояния форматированного текста. */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormattedText } from './FormattedText';

describe('FormattedText', () => {
  it('сохраняет порядок хуков при очистке и восстановлении текста', () => {
    const view = render(<FormattedText value="Текст" />);
    expect(view.container.textContent).toBe('Текст');
    view.rerender(<FormattedText value="" />);
    expect(view.container.textContent).toBe('');
    view.rerender(<FormattedText value="Новый текст" />);
    expect(view.container.textContent).toBe('Новый текст');
  });
});
