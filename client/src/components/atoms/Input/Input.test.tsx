import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';
import { renderWithProviders } from '@/test/test-utils';

describe('Input', () => {
  it('рендерится с базовыми пропсами', () => {
    render(<Input placeholder="Введите текст" />);
    
    const input = screen.getByPlaceholderText('Введите текст');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('применяет правильные классы для вариантов', () => {
    const { rerender } = render(<Input variant="default" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-input');

    rerender(<Input variant="error" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');

    rerender(<Input variant="success" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-green-500');
  });

  it('автоматически устанавливает вариант error при наличии ошибки', () => {
    render(<Input error="Обязательное поле" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('автоматически устанавливает вариант success при наличии success', () => {
    render(<Input success="Поле заполнено корректно" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-green-500');
  });

  it('применяет правильные классы для размеров', () => {
    const { rerender } = render(<Input size="sm" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-8');

    rerender(<Input size="md" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-10');

    rerender(<Input size="lg" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-12');
  });

  it('обрабатывает изменения значения', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'новое значение' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'новое значение' })
    }));
  });

  it('отключается при disabled', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('показывает состояние загрузки', () => {
    render(<Input loading />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    
    // Проверяем наличие спиннера
    const spinner = document.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('отображает иконку в начале', () => {
    const StartIcon = () => <span data-testid="start-icon">🔍</span>;
    render(<Input startIcon={<StartIcon />} />);
    
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10');
  });

  it('отображает иконку в конце', () => {
    const EndIcon = () => <span data-testid="end-icon">✓</span>;
    render(<Input endIcon={<EndIcon />} />);
    
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pr-10');
  });

  it('отображает обе иконки одновременно', () => {
    const StartIcon = () => <span data-testid="start-icon">🔍</span>;
    const EndIcon = () => <span data-testid="end-icon">✓</span>;
    render(<Input startIcon={<StartIcon />} endIcon={<EndIcon />} />);
    
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10', 'pr-10');
  });

  it('заменяет endIcon спиннером при загрузке', () => {
    const EndIcon = () => <span data-testid="end-icon">✓</span>;
    render(<Input endIcon={<EndIcon />} loading />);
    
    expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
    
    const spinner = document.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('поддерживает разные типы input', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('применяет кастомные классы', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('поддерживает все HTML атрибуты input', () => {
    render(
      <Input 
        name="test-input"
        id="test-input"
        required
        maxLength={100}
        data-testid="test-input"
        aria-label="Тестовое поле ввода"
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('name', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('maxLength', '100');
    expect(input).toHaveAttribute('aria-label', 'Тестовое поле ввода');
  });

  it('обрабатывает события focus и blur', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('работает с темами', () => {
    renderWithProviders(<Input placeholder="Поле с темой" />, { theme: 'dark' });
    
    const input = screen.getByPlaceholderText('Поле с темой');
    expect(input).toBeInTheDocument();
  });

  it('правильно обрабатывает controlled значение', () => {
    const { rerender } = render(<Input value="начальное значение" onChange={() => {}} />);
    
    let input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('начальное значение');
    
    rerender(<Input value="новое значение" onChange={() => {}} />);
    input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('новое значение');
  });
});