/**
 * BotStructureTemplate - Шаблоны для структуры Telegram ботов
 * 
 * Содержит шаблоны для различных архитектурных паттернов и структур ботов.
 * Позволяет быстро создавать базовую структуру бота с различными возможностями.
 */

import { GenerationContext } from '../Core/types';

/**
 * Интерфейс для шаблонов структуры бота
 */
export interface IBotStructureTemplate {
  /**
   * Получить полную структуру простого бота
   */
  getSimpleBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с базой данных
   */
  getDatabaseBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с админ-панелью
   */
  getAdminBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с медиа-обработкой
   */
  getMediaBotStructure(context: GenerationContext): string;
  
  /**
   * Получить структуру бота с множественным выбором
   */
  getMultiSelectBotStructure(context: GenerationContext): string;
  
  /**
   * Получить шаблон регистрации middleware
   */
  getMiddlewareRegistrationTemplate(enableDatabase: boolean): string;
  
  /**
   * Получить шаблон регистрации обработчиков
   */
  getHandlerRegistrationTemplate(): string;
  
  /**
   * Получить шаблон глобальных переменных
   */
  getGlobalVariablesTemplate(context: GenerationContext): string;
}

/**
 * Реализация шаблонов структуры бота
 */
export class BotStructureTemplate implements IBotStructureTemplate {
  
  /**
   * Получить полную структуру простого бота
   */
  getSimpleBotStructure(context: GenerationContext): string {
    return `# Простая структура бота
${this.getGlobalVariablesTemplate(context)}

${this.getMiddlewareRegistrationTemplate(false)}

# Здесь будут размещены обработчики сообщений
# [HANDLERS_PLACEHOLDER]

${this.getHandlerRegistrationTemplate()}

# Основная функция запуска
async def main():
    """Основная функция запуска простого бота"""
    try:
        logging.info("🚀 Запуск простого бота...")
        
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("✅ Простой бот готов к работе!")
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Ошибка запуска простого бота: {e}")
    finally:
        await bot.session.close()
        logging.info("🛑 Простой бот остановлен")
`;
  }

  /**
   * Получить структуру бота с базой данных
   */
  getDatabaseBotStructure(context: GenerationContext): string {
    return `# Структура бота с базой данных
${this.getGlobalVariablesTemplate(context)}

# API configuration для сохранения сообщений
API_BASE_URL = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN", "http://localhost:5000"))
PROJECT_ID = int(os.getenv("PROJECT_ID", "${context.projectId || 0}"))

${this.getMiddlewareRegistrationTemplate(true)}

# Здесь будут размещены обработчики сообщений
# [HANDLERS_PLACEHOLDER]

${this.getHandlerRegistrationTemplate()}

# Основная функция запуска
async def main():
    """Основная функция запуска бота с базой данных"""
    try:
        logging.info("🚀 Запуск бота с базой данных...")
        
        # Регистрируем middleware для сохранения сообщений
        dp.message.middleware(message_logging_middleware)
        dp.callback_query.middleware(callback_query_logging_middleware)
        
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("✅ Бот с базой данных готов к работе!")
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Ошибка запуска бота с БД: {e}")
    finally:
        await bot.session.close()
        logging.info("🛑 Бот с базой данных остановлен")
`;
  }

  /**
   * Получить структуру бота с админ-панелью
   */
  getAdminBotStructure(context: GenerationContext): string {
    return `# Структура бота с админ-панелью
${this.getGlobalVariablesTemplate(context)}

# Расширенные права администратора
SUPER_ADMIN_IDS = [123456789]  # Супер-администраторы
MODERATOR_IDS = []  # Модераторы

${this.getMiddlewareRegistrationTemplate(context.userDatabaseEnabled)}

# Middleware для проверки прав доступа
async def admin_access_middleware(handler, event, data: dict):
    """Middleware для проверки административных прав"""
    user_id = None
    
    if hasattr(event, 'from_user') and event.from_user:
        user_id = event.from_user.id
    
    # Проверяем права доступа для админ-команд
    if hasattr(event, 'text') and event.text and event.text.startswith('/admin'):
        if user_id not in ADMIN_IDS and user_id not in SUPER_ADMIN_IDS:
            if hasattr(event, 'answer'):
                await event.answer("❌ У вас нет прав для выполнения этой команды")
            return
    
    return await handler(event, data)

# Здесь будут размещены обработчики сообщений
# [HANDLERS_PLACEHOLDER]

${this.getHandlerRegistrationTemplate()}

# Основная функция запуска
async def main():
    """Основная функция запуска бота с админ-панелью"""
    try:
        logging.info("🚀 Запуск бота с админ-панелью...")
        
        # Регистрируем middleware
        dp.message.middleware(admin_access_middleware)
        ${context.userDatabaseEnabled ? `
        dp.message.middleware(message_logging_middleware)
        dp.callback_query.middleware(callback_query_logging_middleware)` : ''}
        
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
            BotCommand(command="admin", description="Админ-панель"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("✅ Бот с админ-панелью готов к работе!")
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Ошибка запуска админ-бота: {e}")
    finally:
        await bot.session.close()
        logging.info("🛑 Админ-бот остановлен")
`;
  }

  /**
   * Получить структуру бота с медиа-обработкой
   */
  getMediaBotStructure(context: GenerationContext): string {
    return `# Структура бота с медиа-обработкой
${this.getGlobalVariablesTemplate(context)}

# Настройки для медиа
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MEDIA_TYPES = ['photo', 'video', 'audio', 'document', 'voice', 'animation', 'sticker']

${this.getMiddlewareRegistrationTemplate(context.userDatabaseEnabled)}

# Middleware для обработки медиа
async def media_processing_middleware(handler, event: types.Message, data: dict):
    """Middleware для предварительной обработки медиа"""
    try:
        # Проверяем размер файла для различных типов медиа
        file_size = None
        
        if event.photo:
            # Для фото берем самое большое разрешение
            largest_photo = event.photo[-1]
            file_size = getattr(largest_photo, 'file_size', None)
        elif event.video:
            file_size = getattr(event.video, 'file_size', None)
        elif event.audio:
            file_size = getattr(event.audio, 'file_size', None)
        elif event.document:
            file_size = getattr(event.document, 'file_size', None)
        elif event.voice:
            file_size = getattr(event.voice, 'file_size', None)
        elif event.animation:
            file_size = getattr(event.animation, 'file_size', None)
        
        # Проверяем размер файла
        if file_size and file_size > MAX_FILE_SIZE:
            await event.answer(f"❌ Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024*1024)}MB")
            return
        
        # Логируем информацию о медиа
        media_type = "unknown"
        if event.photo: media_type = "photo"
        elif event.video: media_type = "video"
        elif event.audio: media_type = "audio"
        elif event.document: media_type = "document"
        elif event.voice: media_type = "voice"
        elif event.animation: media_type = "animation"
        elif event.sticker: media_type = "sticker"
        
        logging.info(f"📎 Получено медиа типа {media_type} от пользователя {event.from_user.id}")
        
    except Exception as e:
        logging.error(f"Ошибка в middleware обработки медиа: {e}")
    
    return await handler(event, data)

# Здесь будут размещены обработчики сообщений
# [HANDLERS_PLACEHOLDER]

${this.getHandlerRegistrationTemplate()}

# Основная функция запуска
async def main():
    """Основная функция запуска бота с медиа-обработкой"""
    try:
        logging.info("🚀 Запуск бота с медиа-обработкой...")
        
        # Регистрируем middleware
        dp.message.middleware(media_processing_middleware)
        ${context.userDatabaseEnabled ? `
        dp.message.middleware(message_logging_middleware)
        dp.callback_query.middleware(callback_query_logging_middleware)` : ''}
        
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("✅ Медиа-бот готов к работе!")
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Ошибка запуска медиа-бота: {e}")
    finally:
        await bot.session.close()
        logging.info("🛑 Медиа-бот остановлен")
`;
  }

  /**
   * Получить структуру бота с множественным выбором
   */
  getMultiSelectBotStructure(context: GenerationContext): string {
    return `# Структура бота с множественным выбором
${this.getGlobalVariablesTemplate(context)}

# Хранилище для множественного выбора
user_selections = {}  # {user_id: {node_id: [selected_items]}}

${this.getMiddlewareRegistrationTemplate(context.userDatabaseEnabled)}

# Функции для работы с множественным выбором
def get_user_selections(user_id: int, node_id: str) -> list:
    """Получить выбранные элементы пользователя для узла"""
    return user_selections.get(user_id, {}).get(node_id, [])

def add_user_selection(user_id: int, node_id: str, item: str):
    """Добавить элемент в выбор пользователя"""
    if user_id not in user_selections:
        user_selections[user_id] = {}
    if node_id not in user_selections[user_id]:
        user_selections[user_id][node_id] = []
    
    if item not in user_selections[user_id][node_id]:
        user_selections[user_id][node_id].append(item)

def remove_user_selection(user_id: int, node_id: str, item: str):
    """Удалить элемент из выбора пользователя"""
    if user_id in user_selections and node_id in user_selections[user_id]:
        if item in user_selections[user_id][node_id]:
            user_selections[user_id][node_id].remove(item)

def clear_user_selections(user_id: int, node_id: str):
    """Очистить выбор пользователя для узла"""
    if user_id in user_selections and node_id in user_selections[user_id]:
        user_selections[user_id][node_id] = []

def format_user_selections(user_id: int, node_id: str) -> str:
    """Форматировать выбранные элементы для отображения"""
    selections = get_user_selections(user_id, node_id)
    if not selections:
        return "Ничего не выбрано"
    return "Выбрано: " + ", ".join(selections)

# Здесь будут размещены обработчики сообщений
# [HANDLERS_PLACEHOLDER]

${this.getHandlerRegistrationTemplate()}

# Основная функция запуска
async def main():
    """Основная функция запуска бота с множественным выбором"""
    try:
        logging.info("🚀 Запуск бота с множественным выбором...")
        
        # Регистрируем middleware
        ${context.userDatabaseEnabled ? `
        dp.message.middleware(message_logging_middleware)
        dp.callback_query.middleware(callback_query_logging_middleware)` : ''}
        
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("✅ Бот с множественным выбором готов к работе!")
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Ошибка запуска бота с множественным выбором: {e}")
    finally:
        await bot.session.close()
        logging.info("🛑 Бот с множественным выбором остановлен")
`;
  }

  /**
   * Получить шаблон регистрации middleware
   */
  getMiddlewareRegistrationTemplate(enableDatabase: boolean): string {
    let template = `# Регистрация middleware`;
    
    if (enableDatabase) {
      template += `
# Middleware для сохранения сообщений в базу данных
dp.message.middleware(message_logging_middleware)
dp.callback_query.middleware(callback_query_logging_middleware)`;
    }
    
    template += `

# Middleware для обработки ошибок
async def error_handling_middleware(handler, event, data: dict):
    """Middleware для глобальной обработки ошибок"""
    try:
        return await handler(event, data)
    except Exception as e:
        logging.error(f"❌ Необработанная ошибка: {e}")
        
        # Пытаемся отправить сообщение об ошибке пользователю
        try:
            if hasattr(event, 'answer'):
                await event.answer("Произошла ошибка при обработке запроса. Попробуйте позже.")
            elif hasattr(event, 'message') and hasattr(event.message, 'answer'):
                await event.message.answer("Произошла ошибка при обработке запроса. Попробуйте позже.")
        except:
            pass  # Игнорируем ошибки при отправке сообщения об ошибке

# Регистрируем middleware для обработки ошибок
dp.message.middleware(error_handling_middleware)
dp.callback_query.middleware(error_handling_middleware)
`;
    
    return template;
  }

  /**
   * Получить шаблон регистрации обработчиков
   */
  getHandlerRegistrationTemplate(): string {
    return `# Регистрация обработчиков
# Все обработчики регистрируются автоматически через декораторы @dp.message и @dp.callback_query

# Обработчик для неизвестных команд
@dp.message()
async def handle_unknown_message(message: types.Message):
    """Обработчик для всех неизвестных сообщений"""
    try:
        user_id = message.from_user.id
        text = message.text or "[медиа]"
        logging.info(f"❓ Неизвестное сообщение от {user_id}: {text}")
        
        await message.answer(
            "Извините, я не понимаю это сообщение. Используйте /start для начала работы.",
            reply_markup=ReplyKeyboardRemove()
        )
    except Exception as e:
        logging.error(f"Ошибка в обработчике неизвестных сообщений: {e}")
`;
  }

  /**
   * Получить шаблон глобальных переменных
   */
  getGlobalVariablesTemplate(context: GenerationContext): string {
    let template = `# Глобальные переменные
# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов
`;

    if (context.userDatabaseEnabled) {
      template += `
# API configuration для сохранения сообщений
API_BASE_URL = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN", "http://localhost:5000"))
PROJECT_ID = int(os.getenv("PROJECT_ID", "${context.projectId || 0}"))  # ID проекта в системе
`;
    }

    return template;
  }
}

/**
 * Глобальный экземпляр шаблонов структуры бота
 */
export const botStructureTemplate = new BotStructureTemplate();