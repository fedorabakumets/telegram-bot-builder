import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './FormField';
import { Input } from '@/components/atoms/Input/Input';
import { renderWithProviders } from '@/test/test-utils';

describe('FormField', () => {
  it('рендерится с базовыми пропсами', () => {
    render(
      <FormField label="Тестовое поле">
        <Input placeholder="Введите значение" />
      </FormField>
    );
    
    expect(screen.getByText('Тестовое поле')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите значение')).toBeInTheDocument();
  });

  it('связывает label с input через htmlFor и id', () => {
    render(
      <FormField label="Email" id="email-field">
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'email-field');
    expect(input).toHaveAttribute('id', 'email-field');
  });

  it('генерирует уникальный ID если не предоставлен', () => {
    render(
      <FormField label="Автоматический ID">
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Автоматический ID');
    const input = screen.getByRole('textbox');
    
    const labelFor = label.getAttribute('for');
    const inputId = input.getAttribute('id');
    
    expect(labelFor).toBeTruthy();
    expect(inputId).toBeTruthy();
    expect(labelFor).toBe(inputId);
    expect(labelFor).toMatch(/^field-/);
  });

  it('показывает индикатор обязательного поля', () => {
    render(
      <FormField label="Обязательное поле" required>
        <Input />
      </FormField>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
    
    // Проверяем, что label содержит индикатор обязательности
    const label = screen.getByText('Обязательное поле');
    expect(label.closest('label')).toBeInTheDocument();
  });

  it('отображает сообщение об ошибке', () => {
    render(
      <FormField label="Поле с ошибкой" error="Это поле обязательно" id="error-field">
        <Input />
      </FormField>
    );
    
    // Use getAllByText to handle multiple elements and select the helper text
    const errorMessages = screen.getAllByText('Это поле обязательно');
    const helperText = errorMessages.find(el => el.getAttribute('role') === 'alert');
    
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-red-600');
    expect(helperText).toHaveAttribute('role', 'alert');
    expect(helperText).toHaveAttribute('aria-live', 'assertive');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-field-helper');
  });

  it('отображает сообщение об успехе', () => {
    render(
      <FormField label="Успешное поле" success="Поле заполнено корректно" id="success-field">
        <Input />
      </FormField>
    );
    
    const successMessage = screen.getByText('Поле заполнено корректно');
    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveClass('text-green-600');
    expect(successMessage).toHaveAttribute('role', 'status');
    expect(successMessage).toHaveAttribute('aria-live', 'polite');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'success-field-helper');
  });

  it('отображает описание поля', () => {
    render(
      <FormField 
        label="Поле с описанием" 
        description="Дополнительная информация о поле"
        id="desc-field"
      >
        <Input />
      </FormField>
    );
    
    const description = screen.getByText('Дополнительная информация о поле');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-muted-foreground');
    expect(description).toHaveAttribute('role', 'status');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'desc-field-helper');
  });

  it('приоритизирует ошибку над успехом и описанием', () => {
    render(
      <FormField 
        label="Поле с приоритетом" 
        error="Ошибка"
        success="Успех"
        description="Описание"
      >
        <Input />
      </FormField>
    );
    
    // Use getAllByText to handle multiple elements and select the helper text
    const errorMessages = screen.getAllByText('Ошибка');
    const helperText = errorMessages.find(el => el.getAttribute('role') === 'alert');
    expect(helperText).toBeInTheDocument();
    
    expect(screen.queryByText('Успех')).not.toBeInTheDocument();
    expect(screen.queryByText('Описание')).not.toBeInTheDocument();
  });

  it('приоритизирует успех над описанием', () => {
    render(
      <FormField 
        label="Поле с приоритетом" 
        success="Успех"
        description="Описание"
      >
        <Input />
      </FormField>
    );
    
    expect(screen.getByText('Успех')).toBeInTheDocument();
    expect(screen.queryByText('Описание')).not.toBeInTheDocument();
  });

  it('поддерживает вертикальную ориентацию (по умолчанию)', () => {
    render(
      <FormField label="Вертикальное поле">
        <Input />
      </FormField>
    );
    
    // Find the root container with the orientation classes
    const container = screen.getByText('Вертикальное поле').closest('[class*="flex"]');
    expect(container).toHaveClass('space-y-2', 'flex', 'flex-col');
  });

  it('поддерживает горизонтальную ориентацию', () => {
    render(
      <FormField label="Горизонтальное поле" orientation="horizontal">
        <Input />
      </FormField>
    );
    
    // Find the root container with the orientation classes
    const container = screen.getByText('Горизонтальное поле').closest('[class*="flex"]');
    expect(container).toHaveClass('space-y-2', 'flex', 'flex-row');
  });

  it('скрывает label визуально при hideLabel', () => {
    render(
      <FormField label="Скрытый label" hideLabel>
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Скрытый label');
    expect(label).toHaveClass('sr-only');
  });

  it('передает кастомные пропсы в label', () => {
    render(
      <FormField 
        label="Кастомный label" 
        labelProps={{ className: 'custom-label-class' }}
      >
        <Input />
      </FormField>
    );
    
    const label = screen.getByText('Кастомный label');
    expect(label).toHaveClass('custom-label-class');
  });

  it('применяет кастомные классы', () => {
    render(
      <FormField 
        label="Поле с классами" 
        className="custom-field-class"
        inputWrapperClassName="custom-wrapper-class"
      >
        <Input />
      </FormField>
    );
    
    // Find the root container by test id
    const container = screen.getByText('Поле с классами').closest('[class*="custom-field-class"]');
    expect(container).toHaveClass('custom-field-class');
    
    // Check wrapper class through DOM structure
    const wrapper = container?.querySelector('.custom-wrapper-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('работает с разными типами детей', () => {
    render(
      <FormField label="Поле с checkbox">
        <input type="checkbox" data-testid="checkbox" />
      </FormField>
    );
    
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('работает с несколькими детьми', () => {
    render(
      <FormField label="Поле с несколькими элементами" id="multi-field">
        <Input placeholder="Первый input" />
        <Input placeholder="Второй input" />
      </FormField>
    );
    
    expect(screen.getByPlaceholderText('Первый input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Второй input')).toBeInTheDocument();
  });

  it('не перезаписывает существующий ID у детей', () => {
    render(
      <FormField label="Поле с существующим ID" id="field-id">
        <Input id="existing-id" />
      </FormField>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'existing-id');
    
    const label = screen.getByText('Поле с существующим ID');
    expect(label).toHaveAttribute('for', 'field-id');
  });

  it('работает с темами', () => {
    renderWithProviders(
      <FormField label="Поле с темой" error="Ошибка темы">
        <Input />
      </FormField>,
      { theme: 'dark' }
    );
    
    const errorMessages = screen.getAllByText('Ошибка темы');
    // Проверяем, что есть сообщение об ошибке с правильными классами
    const helperTextError = errorMessages.find(el => el.getAttribute('role') === 'alert');
    expect(helperTextError).toHaveClass('dark:text-red-400');
  });

  it('поддерживает все HTML атрибуты div', () => {
    render(
      <FormField 
        label="Поле с атрибутами"
        data-testid="form-field"
        role="group"
        aria-labelledby="custom-label"
      >
        <Input />
      </FormField>
    );
    
    const container = screen.getByTestId('form-field');
    expect(container).toHaveAttribute('role', 'group');
    expect(container).toHaveAttribute('aria-labelledby', 'custom-label');
  });
});