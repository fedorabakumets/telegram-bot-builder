#!/usr/bin/env python3
"""
Проверяет успешность исправления галочек интересов
"""

import json
import asyncpg
import asyncio
import os

async def check_fix_status():
    """Проверяет данные пользователя и статус исправления"""
    
    print("🔍 Проверяем статус исправления восстановления галочек...")
    
    # Подключаемся к БД
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            print("❌ DATABASE_URL не найден")
            return
            
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Проверяем данные пользователя
        user_data = await conn.fetchrow(
            "SELECT user_data FROM user_bot_data WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
            "1612141295"
        )
        
        if user_data and user_data['user_data']:
            try:
                data = json.loads(user_data['user_data'])
                print(f"✅ Данные пользователя найдены: {list(data.keys())}")
                
                # Ищем интересы
                interests_found = []
                for key, value in data.items():
                    if "интерес" in key.lower() or "interests" in key.lower() or "user_interests" in key:
                        interests_found.append((key, value))
                        print(f"📝 Найдены интересы: {key} = {value}")
                
                if interests_found:
                    print("✅ ИСПРАВЛЕНИЕ РАБОТАЕТ - интересы сохраняются в БД")
                    print("🎯 Теперь кнопка 'Изменить выбор' должна показывать галочки")
                else:
                    print("⚠️ Интересы не найдены в данных пользователя")
                    print("🔍 Все данные пользователя:", json.dumps(data, ensure_ascii=False, indent=2))
                    
            except json.JSONDecodeError:
                print("❌ Ошибка парсинга JSON данных пользователя")
        else:
            print("⚠️ Данные пользователя не найдены в БД")
            
        await conn.close()
        
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")

if __name__ == "__main__":
    asyncio.run(check_fix_status())