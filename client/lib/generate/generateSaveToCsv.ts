/**
 * @fileoverview Генерация кода для сохранения ID в CSV файл
 * Для узлов с включённой опцией saveToCsv
 * Формат CSV: один ID в строке (совместимо с импортом)
 */

import { Node } from '@shared/schema';

/**
 * Генерирует Python код для сохранения ID в CSV файл
 * @param node - Узел с настройками
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateSaveToCsvCode(node: Node, indent: string = '        '): string {
  const { saveToCsv, inputVariable } = node.data || {};

  if (!saveToCsv) {
    return '';
  }

  return [
    `${indent}# Сохранение ID в CSV файл для рассылки`,
    `${indent}try:`,
    `${indent}    import os`,
    `${indent}    # Путь к файлу CSV в папке проекта`,
    `${indent}    # PROJECT_DIR уже определён как папка проекта (например, bots/импортированный_проект_0312_40_35)`,
    `${indent}    csv_file = os.path.join(PROJECT_DIR, 'user_ids.csv')`,
    `${indent}    # Проверяем, есть ли уже такой ID в файле`,
    `${indent}    id_exists = False`,
    `${indent}    if os.path.exists(csv_file):`,
    `${indent}        with open(csv_file, 'r', encoding='utf-8') as f:`,
    `${indent}            existing_ids = [line.strip() for line in f if line.strip()]`,
    `${indent}            if str(user_text).strip() in existing_ids:`,
    `${indent}                id_exists = True`,
    `${indent}                logging.info(f"⚠️ ID {user_text} уже есть в CSV, пропускаем")`,
    `${indent}    # Записываем ID в файл (один ID в строке)`,
    `${indent}    if not id_exists:`,
    `${indent}        with open(csv_file, 'a', encoding='utf-8') as f:`,
    `${indent}            f.write(f"{user_text}\\n")`,
    `${indent}        logging.info(f"✅ ID {user_text} записан в CSV файл: {csv_file}")`,
    `${indent}except Exception as e:`,
    `${indent}    logging.error(f"❌ Ошибка записи в CSV: {e}")`,
  ].join('\n');
}
