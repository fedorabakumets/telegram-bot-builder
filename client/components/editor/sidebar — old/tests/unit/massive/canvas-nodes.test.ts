/**
 * @fileoverview Тесты для canvas-node компонентов
 * @module tests/unit/massive/canvas-nodes.test
 */

/// <reference types="vitest/globals" />

import { broadcastNode } from '@/components/editor/canvas/canvas-node/broadcast-node';
import { clientAuthNode } from '@/components/editor/canvas/canvas-node/client-auth-node';

describe('Canvas Node Components', () => {
  describe('broadcastNode', () => {
    it('должен иметь правильный id', () => {
      expect(broadcastNode.id).toBe('broadcast');
    });

    it('должен иметь тип broadcast', () => {
      expect(broadcastNode.type).toBe('broadcast');
    });

    it('должен иметь название "Рассылка"', () => {
      expect(broadcastNode.name).toBe('Рассылка');
    });

    it('должен иметь описание', () => {
      expect(broadcastNode.description).toContain('Отправка сообщения');
    });

    it('должен иметь правильный цвет', () => {
      expect(broadcastNode.color).toBe('bg-purple-100 text-purple-600');
    });

    it('должен иметь иконку', () => {
      expect(broadcastNode.icon).toBe('fas fa-bullhorn');
    });

    it('должен иметь настройки рассылки по умолчанию', () => {
      expect(broadcastNode.defaultData?.broadcastVariable).toBe('user_id');
      expect(broadcastNode.defaultData?.broadcastTarget).toBe('all_users');
      expect(broadcastNode.defaultData?.enableConfirmation).toBe(true);
    });

    it('должен иметь confirmationText', () => {
      expect(broadcastNode.defaultData?.confirmationText).toContain('Отправить рассылку');
    });

    it('должен иметь successMessage с эмодзи', () => {
      expect(broadcastNode.defaultData?.successMessage).toContain('✅');
    });

    it('должен иметь errorMessage с эмодзи', () => {
      expect(broadcastNode.defaultData?.errorMessage).toContain('❌');
    });

    it('должен иметь keyboardType: none', () => {
      expect(broadcastNode.defaultData?.keyboardType).toBe('none');
    });

    it('должен иметь пустой массив кнопок', () => {
      expect(broadcastNode.defaultData?.buttons).toEqual([]);
    });
  });

  describe('clientAuthNode', () => {
    it('должен иметь правильный id', () => {
      expect(clientAuthNode.id).toBe('client-auth');
    });

    it('должен иметь тип client_auth', () => {
      expect(clientAuthNode.type).toBe('client_auth');
    });

    it('должен иметь название', () => {
      expect(clientAuthNode.name).toBe('Client API Авторизация');
    });

    it('должен иметь описание', () => {
      expect(clientAuthNode.description).toContain('сессию из БД');
    });

    it('должен иметь правильный цвет', () => {
      expect(clientAuthNode.color).toBe('bg-emerald-100 text-emerald-600');
    });

    it('должен иметь иконку', () => {
      expect(clientAuthNode.icon).toBe('fas fa-user-shield');
    });

    it('должен иметь sessionName по умолчанию', () => {
      expect(clientAuthNode.defaultData?.sessionName).toBe('user_session');
    });

    it('должен иметь sessionCreated: false', () => {
      expect(clientAuthNode.defaultData?.sessionCreated).toBe(false);
    });
  });
});
