/**
 * @fileoverview Минимальный тест для проверки работы Vitest
 */

import { render, screen } from '@testing-library/react';

describe('Minimal Test', () => {
  it('должен работать', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('должен рендерить', () => {
    render(<div>Привет</div>);
    expect(screen.getByText('Привет')).toBeInTheDocument();
  });
});
