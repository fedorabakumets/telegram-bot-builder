import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:Werty334@localhost:5432/telegram_bot_builder' });

async function updateProject() {
  try {
    const client = await pool.connect();
    
    const defaultProjectData = {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: {
            command: '/start',
            description: 'Запустить бота',
            messageText: 'Привет! 👋 Добро пожаловать в наш бот!',
            keyboardType: 'reply',
            buttons: [
              {
                id: 'btn-1',
                text: '📋 Главное меню',
                action: 'goto',
                target: 'menu-1'
              },
              {
                id: 'btn-2', 
                text: 'ℹ️ О нас',
                action: 'goto',
                target: 'about-1'
              }
            ],
            markdown: false,
            oneTimeKeyboard: false,
            resizeKeyboard: true
          }
        },
        {
          id: 'menu-1',
          type: 'message',
          position: { x: 400, y: 100 },
          data: {
            messageText: '📋 Главное меню\n\nВыберите действие:',
            keyboardType: 'reply',
            buttons: [
              {
                id: 'btn-help',
                text: '❓ Помощь',
                action: 'goto',
                target: 'help-1'
              },
              {
                id: 'btn-back',
                text: '⬅️ Назад',
                action: 'goto',
                target: 'start-1'
              }
            ]
          }
        },
        {
          id: 'about-1',
          type: 'message',
          position: { x: 400, y: 300 },
          data: {
            messageText: 'ℹ️ О нашем боте\n\nЭто пример бота, созданного с помощью конструктора Telegram ботов.',
            keyboardType: 'reply',
            buttons: [
              {
                id: 'btn-back-about',
                text: '⬅️ Назад',
                action: 'goto',
                target: 'start-1'
              }
            ]
          }
        },
        {
          id: 'help-1',
          type: 'message',
          position: { x: 700, y: 100 },
          data: {
            messageText: '❓ Помощь\n\nИспользуйте кнопки для навигации по боту.',
            keyboardType: 'reply',
            buttons: [
              {
                id: 'btn-back-help',
                text: '⬅️ Назад в меню',
                action: 'goto',
                target: 'menu-1'
              }
            ]
          }
        }
      ],
      connections: [
        {
          id: 'conn-1',
          source: 'start-1',
          target: 'menu-1',
          sourceHandle: 'btn-1'
        },
        {
          id: 'conn-2',
          source: 'start-1',
          target: 'about-1',
          sourceHandle: 'btn-2'
        },
        {
          id: 'conn-3',
          source: 'menu-1',
          target: 'help-1',
          sourceHandle: 'btn-help'
        }
      ]
    };
    
    const result = await client.query(
      'UPDATE bot_projects SET data = $1, updated_at = NOW() WHERE id = 1',
      [JSON.stringify(defaultProjectData)]
    );
    
    console.log('Проект успешно обновлен с базовой структурой!');
    console.log('Добавлено узлов:', defaultProjectData.nodes.length);
    console.log('Добавлено связей:', defaultProjectData.connections.length);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Ошибка:', err);
  }
}

updateProject();