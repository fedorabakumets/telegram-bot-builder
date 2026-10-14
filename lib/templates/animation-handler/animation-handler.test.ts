/**
 * @fileoverview Старый узел animation становится медиафайлом и шлёт GIF без перехвата входящих.
 * @module templates/animation-handler/animation-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { migrateAnimationNodesToMedia } from '../../bot-generator/core/migrate-animation-to-media';
import { generatePythonCode } from '../../bot-generator';
import { generateMediaNode } from '../media-node/media-node.renderer';

/**
 * Собирает проект с одним узлом animation.
 * @param data - Данные узла
 * @param id - Идентификатор узла
 * @returns Проект для генератора
 */
function projectWithAnimation(data: Record<string, unknown>, id = 'anim1') {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes: [{ id, type: 'animation', position: { x: 0, y: 0 }, data }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

describe('старый узел animation', () => {
  it('переносится в media: url, автопереход и подпись', () => {
    const [node] = migrateAnimationNodesToMedia([{
      id: 'anim1',
      type: 'animation',
      position: { x: 0, y: 0 },
      data: {
        animationUrl: 'https://example.com/animation.gif',
        mediaCaption: 'Привет, {name}',
        autoTransitionTo: 'next-step',
      },
    } as any]);
    assert.strictEqual(node.type, 'media');
    assert.deepStrictEqual(node.data.attachedMedia, ['https://example.com/animation.gif']);
    assert.strictEqual(node.data.mediaCaption, 'Привет, {name}');
    assert.strictEqual(node.data.autoTransitionTo, 'next-step');
    assert.strictEqual(node.data.enableAutoTransition, true);
  });

  it('генерация шлёт анимацию и не перехватывает входящие GIF', () => {
    const code = generatePythonCode(projectWithAnimation({
      animationUrl: 'https://example.com/animation.gif',
      mediaCaption: 'Привет, {name}',
      buttons: [],
      keyboardType: 'none',
    }) as any, { botName: 'AnimMigrate', userDatabaseEnabled: false });
    assert.ok(code.includes('answer_animation') || code.includes('send_animation'));
    assert.ok(code.includes('https://example.com/animation.gif'));
    assert.ok(code.includes('Привет, {name}'));
    assert.ok(!code.includes('F.animation'));
    assert.ok(!code.includes('@dp.message(F.animation)'));
  });

  it('локальный /uploads/ вызывает get_upload_file_path', () => {
    const code = generatePythonCode(projectWithAnimation({
      animationUrl: '/uploads/116/anim.gif',
      buttons: [],
      keyboardType: 'none',
    }) as any, { botName: 'AnimLocal', userDatabaseEnabled: false });
    assert.ok(code.includes('get_upload_file_path'));
    assert.ok(code.includes('FSInputFile'));
    assert.ok(!code.includes('F.animation'));
  });

  it('пустой animationUrl не шлёт анимацию', () => {
    const [node] = migrateAnimationNodesToMedia([{
      id: 'empty',
      type: 'animation',
      position: { x: 0, y: 0 },
      data: {},
    } as any]);
    const code = generateMediaNode({
      nodeId: node.id,
      attachedMedia: node.data.attachedMedia || [],
    });
    assert.ok(!code.includes('answer_animation'));
    assert.ok(!code.includes('send_animation'));
  });

  it('автопереход вызывает следующий обработчик', () => {
    const [node] = migrateAnimationNodesToMedia([{
      id: 'anim1',
      type: 'animation',
      position: { x: 0, y: 0 },
      data: {
        animationUrl: 'https://example.com/animation.gif',
        autoTransitionTo: 'next-step',
      },
    } as any]);
    const code = generateMediaNode({
      nodeId: node.id,
      attachedMedia: node.data.attachedMedia,
      mediaCaption: '',
      enableAutoTransition: node.data.enableAutoTransition,
      autoTransitionTo: node.data.autoTransitionTo,
    });
    assert.ok(code.includes('handle_callback_next_step'));
    assert.ok(code.includes('answer_animation'));
  });
});
