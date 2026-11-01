/**
 * @fileoverview Тексты подсказки прикрепления файла к ноде.
 * @module components/editor/files/tests/file-attach-hint-text.test
 */

import { describe, it, expect } from 'vitest';
import { getAttachHintKind, getAttachHintText } from '../panel/file-attach-hint-text';

describe('getAttachHintKind', () => {
  it('в модалке с целью даёт ready', () => {
    expect(getAttachHintKind({ mode: 'modal', attachModeEnabled: false, hasTarget: true })).toBe('ready');
  });

  it('в модалке без цели даёт modal-idle', () => {
    expect(getAttachHintKind({ mode: 'modal', attachModeEnabled: false, hasTarget: false })).toBe('modal-idle');
  });

  it('на странице без режима прикрепления даёт page-idle', () => {
    expect(getAttachHintKind({ mode: 'page', attachModeEnabled: false, hasTarget: true })).toBe('page-idle');
  });

  it('на странице с режимом, но без ноды даёт page-need-node', () => {
    expect(getAttachHintKind({ mode: 'page', attachModeEnabled: true, hasTarget: false })).toBe('page-need-node');
  });
});

describe('getAttachHintText', () => {
  it('в ready называет ноду и кнопку Прикрепить', () => {
    const text = getAttachHintText('ready', 'Приветствие');
    expect(text).toContain('Приветствие');
    expect(text).toContain('Прикрепить');
    expect(text).toContain('отметьте файлы');
  });

  it('отличает загрузку от прикрепления', () => {
    expect(getAttachHintText('ready', 'Нода')).toContain('Загрузка сама по себе не добавляет файл к блоку');
  });

  it('позволяет выбрать блок по списку или ID без перехода на холст', () => {
    expect(getAttachHintText('page-need-node')).toContain('из списка или вставьте его ID');
  });
});
