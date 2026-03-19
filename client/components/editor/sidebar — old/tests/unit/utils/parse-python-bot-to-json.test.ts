/**
 * @fileoverview Тесты для утилиты parsePythonBotToJson
 * @module tests/unit/utils/parse-python-bot-to-json.test
 */

/// <reference types="vitest/globals" />

import { parsePythonBotToJson } from '../../../utils/parse-python-bot-to-json';

describe('parsePythonBotToJson', () => {
  describe('Парсинг базовой структуры', () => {
    it('должен парсить Python код с @@NODE_START:@@', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes).toHaveLength(1);
      expect(result.data.sheets[0].nodes[0].id).toBe('start');
    });

    it('должен возвращать правильную структуру data с sheets', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data).toHaveProperty('sheets');
      expect(result.data).toHaveProperty('version', 2);
      expect(result.data).toHaveProperty('activeSheetId', 'main');
      expect(result.data.sheets).toHaveLength(1);
      expect(result.data.sheets[0]).toHaveProperty('id', 'main');
      expect(result.data.sheets[0]).toHaveProperty('name', 'Импортированный бот');
      expect(result.data.sheets[0]).toHaveProperty('nodes');
      expect(result.data.sheets[0]).toHaveProperty('connections');
    });

    it('должен возвращать nodeCount', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@

# @@NODE_START:help@@
@dp.message()
async def help(message: Message):
    await message.answer(text="Помощь")
# @@NODE_END:help@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.nodeCount).toBe(2);
    });

    it('должен обрабатывать пустой код', () => {
      const result = parsePythonBotToJson('');
      expect(result.data.sheets[0].nodes).toHaveLength(0);
      expect(result.data.sheets[0].connections).toHaveLength(0);
      expect(result.nodeCount).toBe(0);
      expect(result.data.version).toBe(2);
      expect(result.data.activeSheetId).toBe('main');
    });

    it('должен обрабатывать код без узлов', () => {
      const code = `
# Это просто комментарий
def some_function():
    pass
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes).toHaveLength(0);
      expect(result.nodeCount).toBe(0);
    });
  });

  describe('Парсинг нескольких узлов', () => {
    it('должен парсить несколько узлов', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@

# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    await message.answer(text="Меню")
# @@NODE_END:menu@@

# @@NODE_START:help@@
@dp.message()
async def help(message: Message):
    await message.answer(text="Помощь")
# @@NODE_END:help@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes).toHaveLength(3);
      expect(result.nodeCount).toBe(3);
      expect(result.data.sheets[0].nodes.map((n: any) => n.id)).toEqual(['start', 'menu', 'help']);
    });
  });

  describe('Структура соединений', () => {
    it('должен создавать соединения на основе кнопок', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Next", callback_data="next_node")]
    ])
    await message.answer(text="Меню")
# @@NODE_END:menu@@

# @@NODE_START:next_node@@
@dp.message()
async def next_node(message: Message):
    await message.answer(text="Next")
# @@NODE_END:next_node@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].connections).toHaveLength(1);
      expect(result.data.sheets[0].connections[0].source).toBe('menu');
      expect(result.data.sheets[0].connections[0].target).toBe('next_node');
    });
  });

  describe('Типы узлов', () => {
    it('должен определять узел start', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes[0].type).toBe('start');
    });

    it('должен определять узел с командой', () => {
      const code = `
# @@NODE_START:command_node@@
@dp.message(commands=['start'])
async def command_node(message: Message):
    await message.answer(text="Command")
# @@NODE_END:command_node@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes[0].type).toBe('command');
    });

    it('должен определять узел с фото', () => {
      const code = `
# @@NODE_START:photo_node@@
@dp.message(F.photo)
async def photo_node(message: Message):
    await message.answer(text="Фото")
# @@NODE_END:photo_node@@
      `.trim();

      const result = parsePythonBotToJson(code);
      expect(result.data.sheets[0].nodes[0].type).toBe('photo');
    });
  });
});
