import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { renderWithProviders } from '@/test/test-utils';

describe('Button', () => {
  it('рендерится с базовыми пропсами', () => {
    render(<Button>Тестовая кнопка</Button>);
    
    const button = screen.getByRole('button', { name: 'Тестовая кнопка' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Тестовая кнопка');
  });

  it('применяет правильные классы для вариантов', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent');

    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('применяет правильные классы для размеров', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('обрабатывает клики', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Кликни меня</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('отключается при disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Отключенная кнопка</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('показывает состояние загрузки', () => {
    render(<Button loading>Загрузка...</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    // Проверяем наличие спиннера
    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('отображает иконку слева', () => {
    const TestIcon = () => <span data-testid="test-icon">🔥</span>;
    render(<Button icon={<TestIcon />}>С иконкой</Button>);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('С иконкой')).toBeInTheDocument();
  });

  it('отображает иконку справа', () => {
    const TestIcon = () => <span data-testid="test-icon-right">→</span>;
    render(<Button iconRight={<TestIcon />}>С иконкой справа</Button>);
    
    expect(screen.getByTestId('test-icon-right')).toBeInTheDocument();
    expect(screen.getByText('С иконкой справа')).toBeInTheDocument();
  });

  it('скрывает иконки при загрузке', () => {
    const TestIcon = () => <span data-testid="test-icon">🔥</span>;
    render(
      <Button loading icon={<TestIcon />} iconRight={<TestIcon />}>
        Загрузка...
      </Button>
    );
    
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    const spinner = screen.getByRole('button').querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('применяет кастомные классы', () => {
    render(<Button className="custom-class">Кастомная кнопка</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('рендерится как другой элемент с asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Ссылка-кнопка</a>
      </Button>
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveTextContent('Ссылка-кнопка');
  });

  it('поддерживает все HTML атрибуты кнопки', () => {
    render(
      <Button 
        type="submit" 
        form="test-form" 
        data-testid="submit-button"
        aria-label="Отправить форму"
      >
        Отправить
      </Button>
    );
    
    const button = screen.getByTestId('submit-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'test-form');
    expect(button).toHaveAttribute('aria-label', 'Отправить форму');
  });

  it('работает с темами', () => {
    renderWithProviders(<Button>Кнопка с темой</Button>, { theme: 'dark' });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});