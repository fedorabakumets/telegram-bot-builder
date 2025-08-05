"""
Создание современного шаблона сбора данных с актуальными возможностями
"""

import asyncio
import asyncpg
from datetime import datetime

def create_modern_data_collection_template():
    """Создает современный шаблон сбора данных с актуальными возможностями"""
    
    template_data = {
        "name": "🔄 Современный сбор данных",
        "description": "Шаблон с командой, дополнительным сбором ответов и текстовым вводом",
        "category": "official",
        "difficulty": "medium",
        "author": "TelegramBot Builder",
        "authorId": "system",
        "version": "1.0.0",
        "featured": True,
        "rating": 4.8,
        "ratingCount": 25,
        "useCount": 0,
        "tags": ["современный", "сбор данных", "текстовый ввод", "дополнительные ответы"],
        "estimatedTime": 7,
        "previewImage": None,
        "botData": {
            "nodes": [
                # Стартовый узел с командой
                {
                    "id": "start-command",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "command": "/start",
                        "description": "Запустить процесс сбора данных",
                        "messageText": "👋 Добро пожаловать в современный бот для сбора данных!\n\nНажмите кнопку ниже, чтобы начать процесс сбора информации.",
                        "formatMode": "none",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-start-collection",
                                "text": "🚀 Начать сбор данных",
                                "action": "goto",
                                "target": "collection-message"
                            }
                        ],
                        "resizeKeyboard": True,
                        "oneTimeKeyboard": False,
                        "showInMenu": True,
                        "isPrivateOnly": False,
                        "requiresAuth": False,
                        "adminOnly": False
                    }
                },
                
                # Сообщение с дополнительным сбором ответов и текстовым вводом
                {
                    "id": "collection-message",
                    "type": "message",
                    "position": {"x": 400, "y": 100},
                    "data": {
                        "messageText": "📊 Расскажите о своем опыте с нашим сервисом:\n\n• Нажмите одну из кнопок для быстрого ответа\n• Или напишите развернутый отзыв текстом\n\nВаш ответ будет сохранен в любом случае!",
                        "formatMode": "none",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-excellent",
                                "text": "⭐⭐⭐⭐⭐ Отлично",
                                "action": "goto",
                                "target": "thank-you-message"
                            },
                            {
                                "id": "btn-good",
                                "text": "⭐⭐⭐⭐ Хорошо",
                                "action": "goto",
                                "target": "thank-you-message"
                            },
                            {
                                "id": "btn-average",
                                "text": "⭐⭐⭐ Средне",
                                "action": "goto",
                                "target": "thank-you-message"
                            },
                            {
                                "id": "btn-poor",
                                "text": "⭐⭐ Плохо",
                                "action": "goto",
                                "target": "thank-you-message"
                            }
                        ],
                        "resizeKeyboard": True,
                        "oneTimeKeyboard": False,
                        
                        # Включаем дополнительный сбор ответов
                        "collectUserInput": True,
                        "enableTextInput": True,
                        "inputVariable": "user_feedback",
                        "inputType": "text",
                        "inputRequired": False,
                        "inputMinLength": 5,
                        "inputMaxLength": 500,
                        "inputTimeout": 120,
                        "saveToDatabase": True,
                        "inputRetryMessage": "Пожалуйста, напишите отзыв от 5 до 500 символов",
                        "inputSuccessMessage": "Спасибо за ваш отзыв! Мы ценим вашу обратную связь.",
                        "inputTargetNodeId": "thank-you-message"
                    }
                },
                
                # Сообщение благодарности (куда происходит перенаправление)
                {
                    "id": "thank-you-message",
                    "type": "message",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "messageText": "🎉 Спасибо за участие в опросе!\n\nВаш отзыв поможет нам улучшить наш сервис. Мы ценим каждое мнение наших пользователей.\n\n💾 Все данные сохранены в нашей системе.",
                        "formatMode": "none",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-restart",
                                "text": "🔄 Пройти опрос снова",
                                "action": "goto",
                                "target": "start-command"
                            },
                            {
                                "id": "btn-help",
                                "text": "❓ Помощь",
                                "action": "command",
                                "target": "/help"
                            }
                        ],
                        "resizeKeyboard": True,
                        "oneTimeKeyboard": False
                    }
                },
                
                # Команда помощи
                {
                    "id": "help-command",
                    "type": "command",
                    "position": {"x": 400, "y": 300},
                    "data": {
                        "command": "/help",
                        "description": "Получить помощь",
                        "messageText": "❓ Помощь по использованию бота:\n\n• /start - Начать сбор данных\n• /help - Эта справка\n\nБот демонстрирует современные возможности сбора данных:\n✅ Кнопочные ответы\n✅ Текстовый ввод\n✅ Сохранение в базу данных\n✅ Аддитивная логика сбора",
                        "formatMode": "none",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-back-to-start",
                                "text": "🏠 Вернуться к началу",
                                "action": "goto",
                                "target": "start-command"
                            }
                        ],
                        "resizeKeyboard": True,
                        "oneTimeKeyboard": False,
                        "showInMenu": True,
                        "isPrivateOnly": False,
                        "requiresAuth": False,
                        "adminOnly": False
                    }
                }
            ],
            "connections": [
                {
                    "id": "conn-1",
                    "sourceId": "start-command",
                    "targetId": "collection-message",
                    "sourceHandle": "btn-start-collection",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-2",
                    "sourceId": "collection-message",
                    "targetId": "thank-you-message",
                    "sourceHandle": "btn-excellent",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-3",
                    "sourceId": "collection-message",
                    "targetId": "thank-you-message",
                    "sourceHandle": "btn-good",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-4",
                    "sourceId": "collection-message",
                    "targetId": "thank-you-message",
                    "sourceHandle": "btn-average",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-5",
                    "sourceId": "collection-message",
                    "targetId": "thank-you-message",
                    "sourceHandle": "btn-poor",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-6",
                    "sourceId": "thank-you-message",
                    "targetId": "start-command",
                    "sourceHandle": "btn-restart",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-7",
                    "sourceId": "thank-you-message",
                    "targetId": "help-command",
                    "sourceHandle": "btn-help",
                    "targetHandle": "input"
                },
                {
                    "id": "conn-8",
                    "sourceId": "help-command",
                    "targetId": "start-command",
                    "sourceHandle": "btn-back-to-start",
                    "targetHandle": "input"
                }
            ]
        }
    }
    
    return template_data

async def save_template_to_database():
    """Сохраняет шаблон в базу данных"""
    try:
        # Подключение к базе данных
        import os
        DATABASE_URL = os.getenv('DATABASE_URL')
        
        if not DATABASE_URL:
            print("❌ DATABASE_URL не найден")
            return False
            
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Создаем шаблон
        template_data = create_modern_data_collection_template()
        
        # Проверяем, существует ли уже такой шаблон
        import json
        existing = await conn.fetchrow("""
            SELECT id FROM bot_templates WHERE name = $1
        """, template_data["name"])
        
        if existing:
            # Обновляем существующий шаблон
            await conn.execute("""
                UPDATE bot_templates SET
                    description = $2,
                    category = $3,
                    difficulty = $4,
                    author_name = $5,
                    author_id = $6,
                    version = $7,
                    featured = $8,
                    rating = $9,
                    rating_count = $10,
                    use_count = $11,
                    tags = $12,
                    estimated_time = $13,
                    preview_image = $14,
                    data = $15,
                    updated_at = $16
                WHERE name = $1
            """, 
                template_data["name"],
                template_data["description"],
                template_data["category"],
                template_data["difficulty"],
                template_data["author"],
                template_data["authorId"],
                template_data["version"],
                template_data["featured"],
                template_data["rating"],
                template_data["ratingCount"],
                template_data["useCount"],
                template_data["tags"],
                template_data["estimatedTime"],
                template_data["previewImage"],
                json.dumps(template_data["botData"]),
                datetime.now()
            )
        else:
            # Вставляем новый шаблон
            await conn.execute("""
                INSERT INTO bot_templates (
                    name, description, category, difficulty, author_name, author_id, version,
                    featured, rating, rating_count, use_count, tags, estimated_time,
                    preview_image, data, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            """, 
                template_data["name"],
                template_data["description"],
                template_data["category"],
                template_data["difficulty"],
                template_data["author"],
                template_data["authorId"],
                template_data["version"],
                template_data["featured"],
                template_data["rating"],
                template_data["ratingCount"],
                template_data["useCount"],
                template_data["tags"],
                template_data["estimatedTime"],
                template_data["previewImage"],
                json.dumps(template_data["botData"]),
                datetime.now(),
                datetime.now()
            )
        
        await conn.close()
        print("✅ Шаблон 'Современный сбор данных' успешно сохранен в базу данных")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при сохранении шаблона: {e}")
        return False

async def main():
    """Основная функция"""
    print("📋 Создание современного шаблона сбора данных...")
    
    # Создаем шаблон
    template_data = create_modern_data_collection_template()
    
    print(f"✅ Шаблон создан: {template_data['name']}")
    print(f"📝 Описание: {template_data['description']}")
    print(f"🏷️ Категория: {template_data['category']}")
    print(f"⭐ Сложность: {template_data['difficulty']}")
    print(f"👨‍💻 Автор: {template_data['author']}")
    print(f"📊 Узлов: {len(template_data['botData']['nodes'])}")
    print(f"🔗 Связей: {len(template_data['botData']['connections'])}")
    print(f"🏷️ Теги: {', '.join(template_data['tags'])}")
    
    # Сохраняем в базу данных
    await save_template_to_database()
    
    print("\n🎯 Особенности шаблона:")
    print("• Команда /start запускает процесс")
    print("• Сообщение с дополнительным сбором ответов")
    print("• Кнопки для быстрого выбора + текстовый ввод")
    print("• Аддитивная логика: кнопки работают + ответы сохраняются")
    print("• Автоматическое перенаправление после ввода текста")
    print("• Сохранение всех данных в базу данных")
    print("• Команда /help для справки")

if __name__ == "__main__":
    asyncio.run(main())