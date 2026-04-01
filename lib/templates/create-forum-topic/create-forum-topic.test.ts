/**
 * @fileoverview Тесты шаблона create-forum-topic — создание топика в форуме Telegram.
 * @module templates/create-forum-topic/create-forum-topic.test
 */

import { describe, expect, it } from 'vitest';
import {
  generateCreateForumTopic,
  generateCreateForumTopicFromNode,
  nodeToCreateForumTopicParams,
} from './create-forum-topic.renderer';
import { createForumTopicParamsSchema } from './create-forum-topic.schema';
import {
  validParamsBasic,
  validParamsVariable,
  validParamsSkipIfExists,
  validParamsNoSave,
  createForumTopicNodeBasic,
  createForumTopicNodeVariable,
  createForumTopicNodeSkip,
} from './create-forum-topic.fixture';

describe('generateCreateForumTopic()', () => {
  it('генерирует callback-обработчик с вызовом bot.create_forum_topic()', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('@dp.callback_query(lambda c: c.data == "create_forum_topic_1")');
    expect(code).toContain('bot.create_forum_topic(');
    expect(code).toContain('chat_id=_forum_chat_id');
    expect(code).toContain('name=_topic_name');
  });

  it('передаёт числовой icon_color в bot.create_forum_topic()', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain("icon_color=int('7322096')");
  });

  it('сохраняет thread_id в переменную при наличии saveThreadIdTo', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain("set_user_var(user_id, 'forum_thread_id'");
    expect(code).toContain('str(_thread_id)');
  });

  it('не сохраняет thread_id, если saveThreadIdTo пустой', () => {
    const code = generateCreateForumTopic(validParamsNoSave);
    expect(code).not.toContain('set_user_var');
  });

  it('использует ID группы из переменной при forumChatIdSource=variable', () => {
    const code = generateCreateForumTopic(validParamsVariable);
    expect(code).toContain('init_all_user_vars(user_id)');
    expect(code).toContain("_all_vars.get('forum_chat_id'");
  });

  it('использует ручной ID группы при forumChatIdSource=manual', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain("'-1002300967595'");
  });

  it('подставляет переменные в название топика', () => {
    const code = generateCreateForumTopic(validParamsVariable);
    expect(code).toContain("'Топик {user_name}'");
    expect(code).toContain('_topic_name.replace(');
  });

  it('инициализирует переменные пользователя до подстановки в название топика', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('await init_user_variables(user_id, callback_query.from_user)');
    // init_user_variables должен вызываться до вызова _resolve_topic_name
    const initIdx = code.indexOf('await init_user_variables(user_id, callback_query.from_user)');
    const resolveIdx = code.indexOf('await _resolve_topic_name_');
    expect(initIdx).toBeGreaterThan(-1);
    expect(initIdx).toBeLessThan(resolveIdx);
  });

  it('генерирует проверку skipIfExists при включённом флаге', () => {
    const code = generateCreateForumTopic(validParamsSkipIfExists);
    expect(code).toContain('_existing_thread_id');
    expect(code).toContain("_existing_vars.get('support_thread_id'");
  });

  it('не генерирует проверку skipIfExists при выключенном флаге', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).not.toContain('_existing_thread_id');
  });

  it('нормализует числовой ID группы с положительным значением через -100 префикс', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('if _chat_id > 0');
    expect(code).toContain('int(f"-100{_chat_id}")');
  });

  it('валидирует параметры через Zod-схему без ошибок', () => {
    expect(() => createForumTopicParamsSchema.parse(validParamsBasic)).not.toThrow();
    expect(() => createForumTopicParamsSchema.parse(validParamsVariable)).not.toThrow();
    expect(() => createForumTopicParamsSchema.parse(validParamsSkipIfExists)).not.toThrow();
  });

  it('логирует создание топика', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('logging.info(');
    expect(code).toContain('create_forum_topic node create_forum_topic_1');
  });

  it('отвечает пользователю "Топик создан" при успехе', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('await callback_query.answer("Топик создан")');
  });

  it('отвечает пользователю с ошибкой при неудаче', () => {
    const code = generateCreateForumTopic(validParamsBasic);
    expect(code).toContain('"Не удалось создать топик"');
  });
});

describe('nodeToCreateForumTopicParams()', () => {
  it('корректно извлекает параметры из узла с ручным ID', () => {
    const params = nodeToCreateForumTopicParams(createForumTopicNodeBasic);
    expect(params.nodeId).toBe('create_forum_topic_1');
    expect(params.forumChatIdSource).toBe('manual');
    expect(params.forumChatId).toBe('-1002300967595');
    expect(params.topicName).toBe('Новый топик');
    expect(params.topicIconColor).toBe('7322096');
    expect(params.saveThreadIdTo).toBe('forum_thread_id');
    expect(params.skipIfExists).toBe(false);
  });

  it('корректно извлекает параметры из узла с переменной', () => {
    const params = nodeToCreateForumTopicParams(createForumTopicNodeVariable);
    expect(params.forumChatIdSource).toBe('variable');
    expect(params.forumChatVariableName).toBe('forum_chat_id');
    expect(params.topicName).toBe('Топик {user_name}');
  });

  it('корректно извлекает флаг skipIfExists', () => {
    const params = nodeToCreateForumTopicParams(createForumTopicNodeSkip);
    expect(params.skipIfExists).toBe(true);
    expect(params.saveThreadIdTo).toBe('support_thread_id');
  });

  it('использует дефолтный forumChatIdSource=manual при отсутствии поля', () => {
    const params = nodeToCreateForumTopicParams({
      id: 'test_node',
      type: 'create_forum_topic',
      position: { x: 0, y: 0 },
      data: {} as any,
    });
    expect(params.forumChatIdSource).toBe('manual');
  });

  it('использует дефолтный topicIconColor=7322096 при отсутствии поля', () => {
    const params = nodeToCreateForumTopicParams({
      id: 'test_node',
      type: 'create_forum_topic',
      position: { x: 0, y: 0 },
      data: {} as any,
    });
    expect(params.topicIconColor).toBe('7322096');
  });

  it('генерирует safeName без спецсимволов', () => {
    const params = nodeToCreateForumTopicParams({
      id: 'node-with-dashes',
      type: 'create_forum_topic',
      position: { x: 0, y: 0 },
      data: {} as any,
    });
    expect(params.safeName).toBe('node_with_dashes');
    expect(params.safeName).not.toContain('-');
  });
});

describe('generateCreateForumTopicFromNode()', () => {
  it('рендерит код из узла графа', () => {
    const code = generateCreateForumTopicFromNode(createForumTopicNodeBasic);
    expect(code).toContain('create_forum_topic node create_forum_topic_1');
    expect(code).toContain('bot.create_forum_topic(');
  });

  it('рендерит код из узла с переменной', () => {
    const code = generateCreateForumTopicFromNode(createForumTopicNodeVariable);
    expect(code).toContain("_all_vars.get('forum_chat_id'");
  });
});
