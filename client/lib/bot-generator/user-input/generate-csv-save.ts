/**
 * @fileoverview Генерация сохранения ID в CSV файл
 * 
 * Модуль создаёт Python-код для записи ID пользователя
 * в CSV файл проекта для рассылки.
 * 
 * @module bot-generator/user-input/generate-csv-save
 */

/**
 * Генерирует Python-код для сохранения ID в CSV
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения в CSV
 */
export function generateCsvSave(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Сохранение ID в CSV файл для рассылки\n`;
  code += `${indent}try:\n`;
  code += `${indent}    import os\n`;
  code += `${indent}    # Путь к файлу CSV в папке проекта\n`;
  code += `${indent}    csv_file = os.path.join(PROJECT_DIR, 'user_ids.csv')\n`;
  code += `${indent}    # Проверяем, есть ли уже такой ID в файле\n`;
  code += `${indent}    id_exists = False\n`;
  code += `${indent}    if os.path.exists(csv_file):\n`;
  code += `${indent}        with open(csv_file, 'r', encoding='utf-8') as f:\n`;
  code += `${indent}            existing_ids = [line.strip() for line in f if line.strip()]\n`;
  code += `${indent}            if str(user_text).strip() in existing_ids:\n`;
  code += `${indent}                id_exists = True\n`;
  code += `${indent}                logging.info(f"⚠️ ID {user_text} уже есть в CSV, пропускаем")\n`;
  code += `${indent}    # Записываем ID в файл (один ID в строке)\n`;
  code += `${indent}    if not id_exists:\n`;
  code += `${indent}        with open(csv_file, 'a', encoding='utf-8') as f:\n`;
  code += `${indent}            f.write(f"{user_text}\\n")\n`;
  code += `${indent}        logging.info(f"✅ ID {user_text} записан в CSV файл: {csv_file}")\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"❌ Ошибка записи в CSV: {e}")\n`;
  return code;
}
