import { BotGroup } from '../../../shared/schema';

export function generateGroupHandlers(groups: BotGroup[]): string {
  let code = '';
  
  // Создаем конфигурацию групп из переданных данных
  const groupsConfig = groups.reduce((config, group) => {
    if (group.name && group.groupId !== null && group.groupId !== undefined) {
      config[group.name] = { 
        id: group.groupId,
        isAdmin: group.isAdmin ?? 0,
        settings: group.settings || {}
      };
    }
    return config;
  }, {} as Record<string, { id: string; isAdmin?: number; settings?: any }>);

  code += `
# Обработчики для работы с группами
from datetime import datetime, timezone
import json

# Конфигурация групп из параметров генерации
CONNECTED_GROUPS = ${JSON.stringify(groupsConfig, null, 2)}

@dp.message(F.chat.type.in_(["group", "supergroup"]))
async def handle_group_message(message: types.Message):
    """
    Обработчик сообщений в группах
    """
    chat_id = message.chat.id
    user_id = message.from_user.id
    username = message.from_user.username or "Неизвестный"
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        logging.info(f"📢 Сообщение в подключенной группе {group_name}: {message.text[:50]}... от @{username}")
        
        # Здесь можно добавить логику обработки групповых сообщений
        # Например, модерация, автоответы, статистика и т.д.
        
        # Сохраняем статистику сообщений
        try:
            await save_group_message_stats(chat_id, user_id, message.text, group_name)
        except Exception as e:
            logging.error(f"Ошибка сохранения статистики группы: {e}")
    
# Функция для сохранения статистики групповых сообщений
async def save_group_message_stats(chat_id: int, user_id: int, message_text: str, group_name: str):
    """
    Сохраняет статистику сообщений в группе
    """
    try:
        # Проверяем существование функции сохранения статистики
        if 'save_user_message_stats' in globals():
            # Если функция существует, используем её для общей статистики
            await save_user_message_stats(user_id, message_text)
        
        # Логируем статистику для мониторинга
        logging.info(f"📊 Статистика группы {group_name}: пользователь {user_id}, длина сообщения: {len(message_text or '')}")
        
        # Здесь можно добавить специфичную для групп логику сохранения
        # например, в отдельную таблицу group_activity если она существует
        try:
            # Проверяем существование таблицы group_activity
            # Этот код выполнится только если таблица существует
            if 'db_pool' in globals() and db_pool:
                async with db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO group_activity (chat_id, user_id, message_length, group_name, created_at) 
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT DO NOTHING
                    """, chat_id, user_id, len(message_text or ""), group_name, datetime.now(timezone.utc))
        except Exception as table_error:
            # Если таблица не существует, просто логируем и продолжаем
            logging.debug(f"Таблица group_activity не найдена: {table_error}")
            
    except Exception as e:
        logging.error(f"Ошибка при сохранении статистики группы: {e}")
    
# Добавляем обработчик новых участников в группе
@dp.message(F.new_chat_members)
async def handle_new_member(message: types.Message):
    """
    Обработчик новых участников в группе
    """
    chat_id = message.chat.id
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        for new_member in message.new_chat_members:
            username = new_member.username or new_member.first_name or "Новый участник"
            logging.info(f"👋 Новый участник в группе {group_name}: @{username}")
            
            # Приветственное сообщение (опционально)
            # await message.answer(f"Добро пожаловать в группу, @{username}!")
            
            # Здесь можно добавить логику обработки новых участников
            # Например, отправка приветственного сообщения, добавление в базу и т.д.

# Обработчик ухода участников из группы
@dp.message(F.left_chat_member)
async def handle_left_member(message: types.Message):
    """
    Обработчик ухода участников из группы
    """
    chat_id = message.chat.id
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        left_member = message.left_chat_member
        username = left_member.username or left_member.first_name or "Участник"
        logging.info(f"👋 Участник покинул группу {group_name}: @{username}")

# Функция для проверки прав администратора бота в группе
async def check_bot_admin_rights(chat_id: int, group_name: str) -> bool:
    """
    Проверяет, является ли бот администратором группы
    """
    try:
        chat_member = await bot.get_chat_member(chat_id, bot.id)
        return chat_member.status in ['administrator', 'creator']
    except Exception as e:
        logging.error(f"Ошибка при проверке прав бота в группе {group_name}: {e}")
        return False

# Функция для отправки сообщения в группу от имени бота
async def send_group_message(chat_id: int, text: str, group_name: str = None) -> bool:
    """
    Отправляет сообщение в группу
    """
    try:
        if not group_name:
            # Определяем название группы если не передано
            for name, config in CONNECTED_GROUPS.items():
                if config.get("id") and str(config["id"]) == str(chat_id):
                    group_name = name
                    break
        
        # Проверяем права бота
        if not await check_bot_admin_rights(chat_id, group_name):
            logging.warning(f"Бот не имеет прав администратора в группе {group_name}")
            return False
        
        await bot.send_message(chat_id, text)
        logging.info(f"✅ Сообщение отправлено в группу {group_name}")
        return True
        
    except Exception as e:
        logging.error(f"Ошибка при отправке сообщения в группу {group_name}: {e}")
        return False

`;

  return code;
}