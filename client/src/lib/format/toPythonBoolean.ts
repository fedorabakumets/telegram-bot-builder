// Функция для конвертации JavaScript boolean в Python boolean

export function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}
