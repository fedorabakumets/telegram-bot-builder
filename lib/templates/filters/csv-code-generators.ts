/**
 * @fileoverview Генераторы Python-кода для работы с CSV файлами
 * @module templates/filters/csv-code-generators
 */

/**
 * Генерирует Python-код для безопасной записи в CSV файл
 */
export function generateSafeCsvWrite(
  csvFileVar: string,
  dataVar: string,
  indent: string = '                '
): string {
  let code = '';
  code += `${indent}try:\n`;
  code += `${indent}    # Проверяем наличие файла\n`;
  code += `${indent}    if os.path.exists(${csvFileVar}):\n`;
  code += `${indent}        with open(${csvFileVar}, 'r', encoding='utf-8') as f:\n`;
  code += `${indent}            existing_ids = [line.strip() for line in f if line.strip()]\n`;
  code += `${indent}            if str(${dataVar}).strip() in existing_ids:\n`;
  code += `${indent}                logging.info(f"⚠️ ID {${dataVar}} уже есть в CSV, пропускаем")\n`;
  code += `${indent}                return\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Записываем ID в файл\n`;
  code += `${indent}    with open(${csvFileVar}, 'a', encoding='utf-8') as f:\n`;
  code += `${indent}        f.write(f"{${dataVar}}\\n")\n`;
  code += `${indent}    logging.info(f"✅ ID {${dataVar}} записан в CSV файл: {${csvFileVar}}")\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"❌ Ошибка записи в CSV: {e}")\n`;
  return code;
}

/**
 * Генерирует Python-код для чтения из CSV файла с обработкой ошибок
 */
export function generateSafeCsvRead(
  csvFileVar: string,
  resultVar: string,
  indent: string = '                '
): string {
  let code = '';
  code += `${indent}try:\n`;
  code += `${indent}    ${resultVar} = []\n`;
  code += `${indent}    if os.path.exists(${csvFileVar}):\n`;
  code += `${indent}        with open(${csvFileVar}, 'r', encoding='utf-8') as f:\n`;
  code += `${indent}            ${resultVar} = [line.strip() for line in f if line.strip()]\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"❌ Ошибка чтения CSV: {e}")\n`;
  code += `${indent}    ${resultVar} = []\n`;
  return code;
}
