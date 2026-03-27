import { describe, it, expect } from 'vitest';
import { SaveAnswerProperties, SAVE_ANSWER_SOURCE_OPTIONS } from '../properties/components/input/save-answer-properties';
import { SaveAnswerIndicator } from '../canvas/canvas-node/save-answer-indicator';
import { PropertiesHeader } from '../properties/components/layout/properties-header';

describe('save-answer node ui', () => {
  it('exports the properties and canvas components', () => {
    expect(typeof SaveAnswerProperties).toBe('function');
    expect(typeof SaveAnswerIndicator).toBe('function');
    expect(typeof PropertiesHeader).toBe('function');
  });

  it('uses realistic source options', () => {
    const labels = SAVE_ANSWER_SOURCE_OPTIONS.map((option) => option.label);
    expect(labels).toContain('Последний ответ');
    expect(labels).toContain('Текстовый ответ');
    expect(labels).toContain('Фото');
    expect(labels).not.toContain('Число');
    expect(labels).not.toContain('Email');
    expect(labels).not.toContain('Телефон');
  });
});
