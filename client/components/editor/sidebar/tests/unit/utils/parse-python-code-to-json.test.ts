/**
 * @fileoverview Тесты для утилиты парсинга Python кода в JSON
 * @module tests/unit/utils/parse-python-code-to-json.test
 */

/// <reference types="vitest/globals" />

import { parsePythonCodeToJson } from '../../../parsePythonCodeToJson';

describe('parsePythonCodeToJson', () => {
  describe('Парсинг базовой структуры', () => {
    it('должен возвращать пустые массивы для пустого кода', () => {
      const result = parsePythonCodeToJson('');
      expect(result.nodes).toEqual([]);
      expect(result.connections).toEqual([]);
    });

    it('должен парсить узел start', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет! Я бот.")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('start');
      expect(result.nodes[0].type).toBe('start');
    });

    it('должен парсить несколько узлов', () => {
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

# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    await message.answer(text="Меню")
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.map(n => n.id)).toEqual(['start', 'help', 'menu']);
    });
  });

  describe('Определение типов узлов', () => {
    it('должен определять узел с фото', () => {
      const code = `
# @@NODE_START:photo_node@@
@dp.message(F.photo)
async def photo_node(message: Message):
    await message.answer(text="Фото")
# @@NODE_END:photo_node@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].type).toBe('photo');
    });

    it('должен определять узел с видео', () => {
      const code = `
# @@NODE_START:video_node@@
@dp.message(F.video)
async def video_node(message: Message):
    await message.answer(text="Видео")
# @@NODE_END:video_node@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].type).toBe('video');
    });

    it('должен определять узел с voice', () => {
      const code = `
# @@NODE_START:voice_node@@
@dp.message(F.voice)
async def voice_node(message: Message):
    await message.answer(text="Голосовое")
# @@NODE_END:voice_node@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].type).toBe('voice');
    });

    it('должен определять узел с командой', () => {
      const code = `
# @@NODE_START:command_node@@
@dp.message(commands=['start'])
async def command_node(message: Message):
    await message.answer(text="Command")
# @@NODE_END:command_node@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].type).toBe('command');
    });
  });

  describe('Парсинг текста сообщения', () => {
    it('должен извлекать однострочный текст', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет мир!")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.messageText).toBe('Привет мир!');
    });

    it('должен извлекать многострочный текст', () => {
      const code = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="""Привет!
Это многострочное
сообщение.""")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.messageText).toContain('Привет!');
      expect(result.nodes[0].data.messageText).toContain('многострочное');
    });

    it('должен использовать значение по умолчанию если текст не найден', () => {
      const code = `
# @@NODE_START:node1@@
@dp.message()
async def node1(message: Message):
    pass
# @@NODE_END:node1@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.messageText).toContain('Узел node1');
    });
  });

  describe('Парсинг команд', () => {
    it('должен извлекать команду', () => {
      const code = `
# @@NODE_START:start@@
@dp.message(commands=['start'])
async def start(message: Message):
    await message.answer(text="Start")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.command).toBe('/start');
    });

    it('должен извлекать описание команды', () => {
      const code = `
# @@NODE_START:start@@
@dp.message(commands=['start'], description="Запуск бота")
async def start(message: Message):
    await message.answer(text="Start")
# @@NODE_END:start@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.description).toBe('Запуск бота');
    });
  });

  describe('Парсинг кнопок', () => {
    it('должен парсить Inline кнопки', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Кнопка 1", callback_data="btn1")],
        [InlineKeyboardButton(text="Кнопка 2", callback_data="btn2")]
    ])
    await message.answer(text="Меню", reply_markup=keyboard)
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.buttons).toHaveLength(2);
      expect(result.nodes[0].data.buttons[0].text).toBe('Кнопка 1');
      expect(result.nodes[0].data.buttons[0].target).toBe('btn1');
    });

    it('должен парсить Reply кнопки', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="Контакты")],
        [KeyboardButton(text="Локация")]
    ])
    await message.answer(text="Меню", reply_markup=keyboard)
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.buttons).toHaveLength(2);
      expect(result.nodes[0].data.buttons[0].text).toBe('Контакты');
    });

    it('должен определять тип клавиатуры inline', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[])
    await message.answer(text="Меню")
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.keyboardType).toBe('inline');
    });

    it('должен определять тип клавиатуры reply', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = ReplyKeyboardMarkup(keyboard=[])
    await message.answer(text="Меню")
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].data.keyboardType).toBe('reply');
    });
  });

  describe('Парсинг соединений (connections)', () => {
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

      const result = parsePythonCodeToJson(code);
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].source).toBe('menu');
      expect(result.connections[0].target).toBe('next_node');
    });

    it('должен избегать дублирования соединений', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Next", callback_data="next_node")],
        [InlineKeyboardButton(text="Next Again", callback_data="next_node")]
    ])
    await message.answer(text="Меню")
# @@NODE_END:menu@@

# @@NODE_START:next_node@@
@dp.message()
async def next_node(message: Message):
    await message.answer(text="Next")
# @@NODE_END:next_node@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      // Должно быть только одно соединение, несмотря на две кнопки
      expect(result.connections.filter(c => c.target === 'next_node')).toHaveLength(1);
    });

    it('должен создавать соединения только для существующих узлов', () => {
      const code = `
# @@NODE_START:menu@@
@dp.message()
async def menu(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Next", callback_data="nonexistent_node")]
    ])
    await message.answer(text="Меню")
# @@NODE_END:menu@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.connections).toHaveLength(0);
    });
  });

  describe('Позиционирование узлов', () => {
    it('должен располагать узлы горизонтально с шагом 280', () => {
      const code = `
# @@NODE_START:node1@@
@dp.message()
async def node1(message: Message):
    await message.answer(text="1")
# @@NODE_END:node1@@

# @@NODE_START:node2@@
@dp.message()
async def node2(message: Message):
    await message.answer(text="2")
# @@NODE_END:node2@@

# @@NODE_START:node3@@
@dp.message()
async def node3(message: Message):
    await message.answer(text="3")
# @@NODE_END:node3@@
      `.trim();

      const result = parsePythonCodeToJson(code);
      expect(result.nodes[0].position.x).toBe(50);
      expect(result.nodes[1].position.x).toBe(330); // 50 + 280
      expect(result.nodes[2].position.x).toBe(610); // 50 + 280 * 2
    });
  });
});
