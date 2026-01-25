// Функция для удаления маркеров из кода (опционально)

export function removeCodeMarkers(code: string): string {
  return code.replace(/# @@NODE_(START|END):.+?@@\n/g, '');
}
