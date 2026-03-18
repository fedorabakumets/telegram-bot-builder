/**
 * @fileoverview Тесты для компонентов сообщений
 * @module tests/unit/massive/messages.test
 */

/// <reference types="vitest/globals" />

import { describe, it, expect } from 'vitest';
import { textMessage } from '../../../massive/messages/text-message';
import { stickerMessage } from '../../../massive/messages/sticker-message';
import { voiceMessage } from '../../../massive/messages/voice-message';
import { locationMessage } from '../../../massive/messages/location-message';
import { contactMessage } from '../../../massive/messages/contact-message';

describe('Message Components', () => {
  describe('textMessage', () => {
    it('должен иметь правильный id', () => {
      expect(textMessage.id).toBe('text-message');
    });

    it('должен иметь тип message', () => {
      expect(textMessage.type).toBe('message');
    });

    it('должен иметь текст по умолчанию', () => {
      expect(textMessage.defaultData?.messageText).toBe('Новое сообщение');
    });

    it('должен иметь keyboardType: none', () => {
      expect(textMessage.defaultData?.keyboardType).toBe('none');
    });

    it('должен иметь пустой массив кнопок', () => {
      expect(textMessage.defaultData?.buttons).toEqual([]);
    });
  });

  describe('stickerMessage', () => {
    it('должен иметь правильный id', () => {
      expect(stickerMessage.id).toBe('sticker-message');
    });

    it('должен иметь тип sticker', () => {
      expect(stickerMessage.type).toBe('sticker');
    });

    it('должен иметь пустой fileId по умолчанию', () => {
      expect(stickerMessage.defaultData?.fileId).toBe('');
    });
  });

  describe('voiceMessage', () => {
    it('должен иметь правильный id', () => {
      expect(voiceMessage.id).toBe('voice-message');
    });

    it('должен иметь тип voice', () => {
      expect(voiceMessage.type).toBe('voice');
    });

    it('должен иметь duration: 0 по умолчанию', () => {
      expect(voiceMessage.defaultData?.duration).toBe(0);
    });
  });

  describe('locationMessage', () => {
    it('должен иметь правильный id', () => {
      expect(locationMessage.id).toBe('location-message');
    });

    it('должен иметь тип location', () => {
      expect(locationMessage.type).toBe('location');
    });

    it('должен иметь широту и долготу по умолчанию', () => {
      expect(locationMessage.defaultData?.latitude).toBe(0);
      expect(locationMessage.defaultData?.longitude).toBe(0);
    });
  });

  describe('contactMessage', () => {
    it('должен иметь правильный id', () => {
      expect(contactMessage.id).toBe('contact-message');
    });

    it('должен иметь тип contact', () => {
      expect(contactMessage.type).toBe('contact');
    });

    it('должен иметь пустой phoneNumber по умолчанию', () => {
      expect(contactMessage.defaultData?.phoneNumber).toBe('');
    });
  });
});
