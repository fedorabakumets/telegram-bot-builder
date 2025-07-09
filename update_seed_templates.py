#!/usr/bin/env python3
"""
Обновление seed-templates.ts для исправления форматирования
"""
import re

def clean_message_text(content):
    """Очищает messageText от HTML тегов и markdown синтаксиса"""
    # Заменяем HTML теги
    content = re.sub(r'<b>(.*?)</b>', r'\1', content)
    content = re.sub(r'<i>(.*?)</i>', r'\1', content)
    content = re.sub(r'<u>(.*?)</u>', r'\1', content)
    content = re.sub(r'<code>(.*?)</code>', r'\1', content)
    content = re.sub(r'<pre>(.*?)</pre>', r'\1', content)
    
    # Заменяем markdown синтаксис
    content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)
    content = re.sub(r'\*(.*?)\*', r'\1', content)
    content = re.sub(r'__(.*?)__', r'\1', content)
    content = re.sub(r'_(.*?)_', r'\1', content)
    content = re.sub(r'`(.*?)`', r'\1', content)
    content = re.sub(r'~~(.*?)~~', r'\1', content)
    content = re.sub(r'> (.*)', r'\1', content)
    content = re.sub(r'# (.*)', r'\1', content)
    content = re.sub(r'## (.*)', r'\1', content)
    
    return content

def update_seed_templates():
    """Обновляет seed-templates.ts"""
    try:
        # Читаем файл
        with open('server/seed-templates.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Найдем и обновим messageText с HTML тегами или markdown
        lines = content.split('\n')
        updated_lines = []
        
        for line in lines:
            if 'messageText:' in line and ('**' in line or '<b>' in line or '<i>' in line):
                # Очищаем форматирование в messageText
                cleaned_line = clean_message_text(line)
                updated_lines.append(cleaned_line)
                print(f"✅ Очищена строка: {line[:100]}...")
            elif 'markdown: true' in line:
                # Заменяем на formatMode: 'none'
                updated_lines.append(line.replace('markdown: true', 'formatMode: "none"'))
                print(f"✅ Заменено markdown: true на formatMode: 'none'")
            elif 'formatMode: "html"' in line:
                # Заменяем на formatMode: 'none'
                updated_lines.append(line.replace('formatMode: "html"', 'formatMode: "none"'))
                print(f"✅ Заменено formatMode: 'html' на formatMode: 'none'")
            elif 'formatMode: "markdown"' in line:
                # Заменяем на formatMode: 'none'
                updated_lines.append(line.replace('formatMode: "markdown"', 'formatMode: "none"'))
                print(f"✅ Заменено formatMode: 'markdown' на formatMode: 'none'")
            else:
                updated_lines.append(line)
        
        # Записываем обновленный файл
        with open('server/seed-templates.ts', 'w', encoding='utf-8') as f:
            f.write('\n'.join(updated_lines))
        
        print("✅ Файл seed-templates.ts успешно обновлен!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    update_seed_templates()