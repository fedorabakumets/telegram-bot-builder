/**
 * @fileoverview Тесты для проекта "новый_бот_2" с автопереходами
 *
 * Проверяет генерацию Python кода для проекта с:
 * - Узлом start с автопереходом
 * - Узлом message с изображением
 * - AttachedMedia переменными
 *
 * @module tests/test-noviy-bot-2-project
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePythonCode } from '../bot-generator.js';

/**
 * Данные проекта "новый_бот_2_49_43"
 * Содержит start узел с автопереходом и message узел с изображением
 */
const noviyBot2Project = {
  sheets: [
    {
      id: 'bLdytdQiNb_K91i6M6hor',
      name: 'Лист 1',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: {
            command: '/start',
            messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
            imageUrl: 'https://as1.ftcdn.net/jpg/01/79/96/28/1000_F_179962877_jwmSRcyLYaRW7NDJ7CPUQUYNqzw9b3lA.jpg',
            attachedMedia: ['imageUrlVar_start'],
            enableAutoTransition: true,
            autoTransitionTo: 'b-l8-dmGLRZlnSX0G7tW6',
            collectUserInput: false,
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            adminOnly: false,
            showInMenu: true,
            requiresAuth: false,
            isPrivateOnly: false,
            enableStatistics: true,
            enableConditionalMessages: false,
            conditionalMessages: [],
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: ''
          }
        },
        {
          id: 'b-l8-dmGLRZlnSX0G7tW6',
          type: 'message',
          position: { x: 100, y: 653.3125 },
          data: {
            messageText: 'Новое сообщение',
            imageUrl: 'https://as1.ftcdn.net/jpg/01/79/96/28/1000_F_179962877_jwmSRcyLYaRW7NDJ7CPUQUYNqzw9b3lA.jpg',
            attachedMedia: ['imageUrlVar_b-l8-dmGLRZlnSX0G7tW6'],
            collectUserInput: false,
            buttons: [],
            keyboardType: 'none',
            resizeKeyboard: true,
            oneTimeKeyboard: false,
            adminOnly: false,
            showInMenu: true,
            requiresAuth: false,
            isPrivateOnly: false,
            enableStatistics: true,
            enableConditionalMessages: false,
            conditionalMessages: [],
            enableTextInput: false,
            enablePhotoInput: false,
            enableVideoInput: false,
            enableAudioInput: false,
            enableDocumentInput: false,
            inputVariable: '',
            photoInputVariable: '',
            videoInputVariable: '',
            audioInputVariable: '',
            documentInputVariable: ''
          }
        }
      ],
      createdAt: '2026-02-28T08:18:00.993Z',
      updatedAt: '2026-02-28T16:12:08.527Z',
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 }
    }
  ],
  version: 2,
  activeSheetId: 'bLdytdQiNb_K91i6M6hor'
};

describe('Проект "новый_бот_2" с автопереходами', () => {
  let generatedCode = '';
  let generateError = null;

  try {
    generatedCode = generatePythonCode(
      noviyBot2Project,
      'NoviyBot2',
      [],
      false,
      null,
      false,
      false,
      true
    );
  } catch (error) {
    generateError = error.message;
    console.error('Ошибка генерации:', error.message);
  }

  it('должен успешно генерировать код без ошибок', () => {
    assert.strictEqual(generateError, null, `Генерация не удалась: ${generateError}`);
  });

  it('должен содержать обработчик команды /start', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('/start') || generatedCode.includes('Command("start")'),
      'Отсутствует обработчик команды /start'
    );
  });

  it('должен содержать автопереход от start к b-l8-dmGLRZlnSX0G7tW6', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('b-l8-dmGLRZlnSX0G7tW6'),
      'Отсутствует автопереход к узлу b-l8-dmGLRZlnSX0G7tW6'
    );
  });

  it('должен содержать URL изображения из start узла', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('as1.ftcdn.net'),
      'Отсутствует URL изображения из start узла'
    );
  });

  it('должен содержать текст "Привет! Я ваш новый бот"', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('Привет! Я ваш новый бот'),
      'Отсутствует текст приветствия'
    );
  });

  it('должен содержать текст "Новое сообщение"', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('Новое сообщение'),
      'Отсутствует текст "Новое сообщение"'
    );
  });

  it('должен содержать переменные attachedMedia для изображений', () => {
    if (generateError) this.skip();
    assert.ok(
      generatedCode.includes('imageUrlVar_start') || generatedCode.includes('image_url'),
      'Отсутствуют переменные attachedMedia для изображений'
    );
  });

  it('должен содержать функцию отправки фото send_photo или answer_photo', () => {
    if (generateError) this.skip();
    const hasSendPhoto = generatedCode.includes('send_photo') || generatedCode.includes('answer_photo');
    assert.ok(hasSendPhoto, 'Отсутствует функция отправки фото');
  });
});
