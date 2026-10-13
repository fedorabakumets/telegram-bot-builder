/**
 * @fileoverview Тесты анализа и массовой правки кнопочной навигации
 * @module lib/bot-tools/scenario-navigation.test
 */

import { describe, expect, it } from 'vitest';
import type { BotDataWithSheets } from '@shared/schema';
import {
  findInboundReferences,
  reportButtonNavigation,
  rewriteButtonNavigation,
} from './scenario-navigation.ts';

/**
 * Создаёт сценарий с главным меню, обычным экраном и возвратом.
 * @returns Тестовый project.json
 */
function makeProject(): BotDataWithSheets {
  return {
    version: 2,
    activeSheetId: 'main',
    sheets: [{
      id: 'main',
      name: 'Главная',
      nodes: [
        {
          id: 'start',
          type: 'command_trigger',
          position: { x: 0, y: 0 },
          data: { command: '/start', autoTransitionTo: 'menu' },
        },
        {
          id: 'menu',
          type: 'message',
          position: { x: 200, y: 0 },
          data: { messageText: 'Меню', keyboardNodeId: 'menu-kb' },
        },
        {
          id: 'menu-kb',
          type: 'keyboard',
          position: { x: 400, y: 0 },
          data: {
            keyboardType: 'inline',
            buttons: [{ id: 'site', text: 'Сайт', action: 'goto', target: 'site' }],
          },
        },
        {
          id: 'site',
          type: 'message',
          position: { x: 600, y: 0 },
          data: { messageText: 'Сайт', formatMode: 'html', keyboardNodeId: 'site-kb' },
        },
        {
          id: 'site-kb',
          type: 'keyboard',
          position: { x: 800, y: 0 },
          data: {
            keyboardType: 'inline',
            buttons: [{ id: 'home', text: 'Меню', action: 'goto', target: 'menu' }],
          },
        },
      ],
    }],
  } as BotDataWithSheets;
}

describe('анализ навигации сценария', () => {
  it('находит кнопочные и некнопочные входящие ссылки', () => {
    const inbound = findInboundReferences(makeProject() as unknown as Record<string, unknown>, 'menu');
    expect(inbound.targetFound).toBe(true);
    expect(inbound.references.map((item) => item.path)).toEqual([
      'autoTransitionTo',
      'buttons[0].target',
    ]);
  });

  it('находит легаси targetNodeId и дополнительные выходы', () => {
    const project = makeProject();
    const source = project.sheets[0].nodes[2];
    (source.data.buttons as any[])[0] = {
      id: 'legacy', text: 'Сайт', action: 'goto', targetNodeId: 'site',
    };
    (source.data as any).afterLoopTo = 'site';
    const inbound = findInboundReferences(project as unknown as Record<string, unknown>, 'site');
    expect(inbound.references.map((item) => item.path)).toEqual([
      'afterLoopTo',
      'buttons[0].targetNodeId',
    ]);
  });

  it('отличает отправку сообщения от внешнего действия', () => {
    const project = makeProject();
    (project.sheets[0].nodes[2].data.buttons as any[]).push({
      id: 'url', text: 'URL', action: 'url', url: 'https://example.com',
    });
    const report = reportButtonNavigation(project as unknown as Record<string, unknown>);
    expect(report.sendsNew).toBe(2);
    expect(report.external).toBe(1);
  });
});

describe('массовая правка навигации', () => {
  it('делает копию меню-входа и переводит обычный экран на edit_message', () => {
    const result = rewriteButtonNavigation(makeProject(), 'edit_current');
    expect(result.plan.changed).toBe(2);
    expect(result.plan.redirectedButtons).toBe(1);

    const nodes = result.project.sheets[0].nodes;
    expect(nodes.find((node) => node.id === 'menu')?.type).toBe('message');
    expect(nodes.find((node) => node.id === 'menu_button_edit')?.type).toBe('edit_message');
    expect(nodes.find((node) => node.id === 'site')?.type).toBe('edit_message');
    expect((nodes.find((node) => node.id === 'site')?.data as any).editMessageText).toBe('Сайт');
    expect((nodes.find((node) => node.id === 'site-kb')?.data.buttons as any[])[0].target).toBe('menu_button_edit');
  });

  it('полностью отменяет изменения, созданные инструментом', () => {
    const edited = rewriteButtonNavigation(makeProject(), 'edit_current').project;
    const restored = rewriteButtonNavigation(edited, 'send_new');
    const nodes = restored.project.sheets[0].nodes;
    expect(restored.plan.changed).toBe(2);
    expect(nodes.find((node) => node.id === 'menu_button_edit')).toBeUndefined();
    expect(nodes.find((node) => node.id === 'site')?.type).toBe('message');
    expect((nodes.find((node) => node.id === 'site-kb')?.data.buttons as any[])[0].target).toBe('menu');
  });

  it('пропускает message-ноду с медиа или сбором ввода', () => {
    const project = makeProject();
    const site = project.sheets[0].nodes.find((node) => node.id === 'site')!;
    site.data.imageUrl = 'https://example.com/image.jpg';
    const result = rewriteButtonNavigation(project, 'edit_current');
    expect(result.project.sheets[0].nodes.find((node) => node.id === 'site')?.type).toBe('message');
    expect(result.plan.skipped).toContainEqual({ nodeId: 'site', reason: 'message_contains_media' });
  });
});
