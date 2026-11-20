/** @fileoverview Проверка сохранения значений и структурированных ответов в превью переменных. */
import { describe, expect, it } from 'vitest';
import { variablePreview } from './user-variables';

describe('Превью переменных', () => {
  it('не теряет нули и отрицательные логические ответы', () => {
    expect(variablePreview({ value: 0 })).toBe('0');
    expect(variablePreview('{"value":false,"type":"text"}')).toBe('false');
    expect(variablePreview(null)).toBe('Не заполнено');
  });
  it('читает старые JSON ответы, обычный текст и вложения', () => {
    expect(variablePreview('{"value":"Ответ","type":"text"}')).toBe('Ответ');
    expect(variablePreview('Обычный текст')).toBe('Обычный текст');
    expect(variablePreview({ media: [{ type: 'photo' }, { type: 'video' }] })).toBe('Вложений: 2');
    expect(variablePreview({ city: 'Москва' })).toBe('{"city":"Москва"}');
  });
});
