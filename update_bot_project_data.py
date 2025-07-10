#!/usr/bin/env python3
"""
Обновление данных проекта бота для исправления проблем с inline кнопками
"""

import asyncio
import asyncpg
import json
from datetime import datetime

async def update_bot_project():
    """Обновляет данные проекта бота с исправленными настройками"""
    
    print("🔄 Обновляем данные проекта бота...")
    
    # Подключаемся к базе данных
    try:
        import os
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL не установлен в переменных окружения")
            return False
        connection = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных установлено")
    except Exception as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        return False
    
    try:
        # Получаем текущие данные проекта
        project_id = 1
        project_data = await connection.fetchrow(
            "SELECT * FROM bot_projects WHERE id = $1",
            project_id
        )
        
        if not project_data:
            print("❌ Проект не найден")
            return False
        
        # Парсим текущие данные бота  
        print(f"📋 Колонки в таблице: {project_data.keys()}")
        if 'botData' in project_data:
            bot_data = json.loads(project_data['botData'])
        elif 'bot_data' in project_data:
            bot_data = json.loads(project_data['bot_data'])
        else:
            print("❌ Не найдены данные бота в проекте")
            return False
        
        # Находим узел collection-message
        collection_node = None
        for node in bot_data['nodes']:
            if node['id'] == 'collection-message':
                collection_node = node
                break
        
        if not collection_node:
            print("❌ Узел collection-message не найден")
            return False
        
        print(f"📋 Текущие данные collection-message:")
        print(f"   collectUserInput: {collection_node['data'].get('collectUserInput', 'НЕТ')}")
        print(f"   inputTargetNodeId: {collection_node['data'].get('inputTargetNodeId', 'НЕТ')}")
        print(f"   buttons: {len(collection_node['data'].get('buttons', []))} кнопок")
        
        # Обновляем данные узла
        collection_node['data']['inputTargetNodeId'] = 'thank-you-message'
        collection_node['data']['collectUserInput'] = True
        collection_node['data']['saveToDatabase'] = True
        collection_node['data']['inputVariable'] = 'user_feedback'
        collection_node['data']['inputType'] = 'text'
        
        # Убеждаемся, что кнопки есть
        if 'buttons' not in collection_node['data'] or len(collection_node['data']['buttons']) == 0:
            collection_node['data']['buttons'] = [
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
            ]
        
        # Убеждаемся, что keyboardType правильный
        collection_node['data']['keyboardType'] = 'inline'
        
        # Обновляем данные в базе
        updated_bot_data = json.dumps(bot_data)
        if 'botData' in project_data:
            await connection.execute(
                "UPDATE bot_projects SET \"botData\" = $1, \"updatedAt\" = NOW() WHERE id = $2",
                updated_bot_data, project_id
            )
        else:
            await connection.execute(
                "UPDATE bot_projects SET bot_data = $1, updated_at = NOW() WHERE id = $2",
                updated_bot_data, project_id
            )
        
        print("✅ Данные проекта обновлены")
        print(f"📋 Новые данные collection-message:")
        print(f"   collectUserInput: {collection_node['data'].get('collectUserInput')}")
        print(f"   inputTargetNodeId: {collection_node['data'].get('inputTargetNodeId')}")
        print(f"   buttons: {len(collection_node['data'].get('buttons', []))} кнопок")
        print(f"   keyboardType: {collection_node['data'].get('keyboardType')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка обновления данных: {e}")
        return False
    
    finally:
        await connection.close()

async def main():
    """Основная функция"""
    print("🚀 Исправление данных проекта бота...")
    print("=" * 50)
    
    success = await update_bot_project()
    
    if success:
        print("✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!")
        print("🔄 Теперь бот должен быть перезапущен для применения изменений")
    else:
        print("❌ ОШИБКА ПРИ ИСПРАВЛЕНИИ!")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())