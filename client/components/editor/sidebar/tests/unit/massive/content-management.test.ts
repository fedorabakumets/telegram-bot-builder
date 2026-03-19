/**
 * @fileoverview Тесты для компонентов управления контентом
 * @module tests/unit/massive/content-management.test
 */

/// <reference types="vitest/globals" />

import { pinMessage } from '../../../massive/content-management/pin-message';
import { unpinMessage } from '../../../massive/content-management/unpin-message';
import { deleteMessage } from '../../../massive/content-management/delete-message';

describe('Content Management Components', () => {
  describe('pinMessage', () => {
    it('должен иметь правильный id', () => {
      expect(pinMessage.id).toBe('pin-message');
    });

    it('должен иметь тип pin_message', () => {
      expect(pinMessage.type).toBe('pin_message');
    });

    it('должен иметь messageIdSource: last_message', () => {
      expect(pinMessage.defaultData?.messageIdSource).toBe('last_message');
    });

    it('должен иметь disableNotification: false', () => {
      expect(pinMessage.defaultData?.disableNotification).toBe(false);
    });
  });

  describe('unpinMessage', () => {
    it('должен иметь правильный id', () => {
      expect(unpinMessage.id).toBe('unpin-message');
    });

    it('должен иметь тип unpin_message', () => {
      expect(unpinMessage.type).toBe('unpin_message');
    });
  });

  describe('deleteMessage', () => {
    it('должен иметь правильный id', () => {
      expect(deleteMessage.id).toBe('delete-message');
    });

    it('должен иметь тип delete_message', () => {
      expect(deleteMessage.type).toBe('delete_message');
    });

    it('должен иметь messageIdSource: last_message', () => {
      expect(deleteMessage.defaultData?.messageIdSource).toBe('last_message');
    });
  });
});
