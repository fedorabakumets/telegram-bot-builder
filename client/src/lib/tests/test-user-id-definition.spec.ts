import { generatePythonCode } from '../bot-generator';
import { BotData } from '@shared/schema';

describe('Проверка определения user_id в сгенерированном коде', () => {
  it('должен содержать определение user_id в обработчике start', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Привет!',
            command: '/start'
          }
        }
      ],
      edges: []
    };

    const code = generatePythonCode(botData, 'TestBot');
    
    // Проверяем, что в коде есть определение user_id в start_handler
    expect(code).toContain('user_id = message.from_user.id');
    expect(code).toContain('@dp.message(CommandStart())');
    expect(code).toContain('async def start_handler');
  });

  it('должен содержать определение user_id в обработчике команды', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'help',
          type: 'command',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Справка',
            command: '/help'
          }
        }
      ],
      edges: []
    };

    const code = generatePythonCode(botData, 'TestBot');
    
    // Проверяем, что в коде есть определение user_id в обработчике команды
    expect(code).toContain('user_id = message.from_user.id');
    expect(code).toContain('@dp.message(Command("help"))');
    expect(code).toContain('_handler');
  });

  it('должен содержать определение user_id в универсальном обработчике ввода', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'input_node',
          type: 'message',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Введите что-нибудь',
            collectUserInput: true,
            inputVariable: 'user_input'
          }
        }
      ],
      edges: []
    };

    const code = generatePythonCode(botData, 'TestBot');
    
    // Проверяем, что в коде есть определение user_id в handle_user_input
    expect(code).toContain('user_id = message.from_user.id');
    expect(code).toContain('@dp.message(F.text)');
    expect(code).toContain('async def handle_user_input');
  });

  it('должен содержать определение user_id в обработчике callback\'ов', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'callback_node',
          type: 'message',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Выберите опцию',
            buttons: [
              {
                id: 'btn1',
                text: 'Опция 1',
                action: 'goto',
                target: 'next_node'
              }
            ]
          }
        },
        {
          id: 'next_node',
          type: 'message',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Следующий шаг'
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'callback_node',
          target: 'next_node',
          sourceHandle: 'btn1',
          targetHandle: null
        }
      ]
    };

    const code = generatePythonCode(botData, 'TestBot');
    
    // Проверяем, что в коде есть определение user_id в обработчике callback'ов
    expect(code).toContain('user_id = callback_query.from_user.id');
    expect(code).toContain('@dp.callback_query');
    expect(code).toContain('async def handle_callback_');
  });

  it('должен содержать определение user_id в алиасах команд', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Привет!',
            command: '/start'
          }
        },
        {
          id: 'menu',
          type: 'command',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Меню',
            command: '/menu'
          }
        }
      ],
      edges: []
    };

    const code = generatePythonCode(botData, 'TestBot');
    
    // Проверяем, что в коде есть определение user_id в алиасах команд
    expect(code).toContain('user_id = message.from_user.id');
    expect(code).toContain('#      Алиасы для обработчиков команд');
    expect(code).toContain('async def handle_command_start');
    expect(code).toContain('async def handle_command_menu');
  });

  it('должен содержать определение user_id при включенной базе данных', () => {
    const botData: BotData = {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            messageText: 'Привет!',
            command: '/start'
          }
        }
      ],
      edges: []
    };

    const code = generatePythonCode(botData, 'TestBot', [], true); // Включаем базу данных
    
    // Проверяем, что в коде есть определение user_id при включенной базе данных
    expect(code).toContain('user_id = message.from_user.id');
    expect(code).toContain('await save_user_to_db');
    expect(code).toContain('await update_user_data_in_db');
  });
});