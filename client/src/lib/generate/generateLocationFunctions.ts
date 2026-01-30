/**
 * Функция для генерации Python-функций работы с картографическими сервисами
 * @returns Строка с кодом функций для работы с картами
 */
export function generateLocationFunctions(): string {
  let code = '';

  code += '\n# Функции для работы с картографическими сервисами\n';
  code += 'def extract_coordinates_from_yandex(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Яндекс.Карт"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате ll=longitude,latitude\n';
  code += '    match = re.search(r"ll=([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Ищем координаты в формате /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_google(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Google Maps"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате @latitude,longitude\n';
  code += '    match = re.search(r"@([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    # Ищем координаты в формате /latitude,longitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_2gis(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки 2ГИС"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в различных форматах 2ГИС\n';
  code += '    # Формат: center/longitude,latitude\n';
  code += '    match = re.search(r"center/([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Формат: /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def generate_map_urls(latitude: float, longitude: float, title: str = "") -> dict:\n';
  code += '    """Генерирует ссылки на различные картографические сервисы"""\n';
  code += '    import urllib.parse\n';
  code += '    \n';
  code += '    encoded_title = urllib.parse.quote(title) if title else ""\n';
  code += '    \n';
  code += '    return {\n';
  code += '        "yandex": f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15&l=map&pt={longitude},{latitude}",\n';
  code += '        "google": f"https://maps.google.com/?q={latitude},{longitude}",\n';
  code += '        "2gis": f"https://2gis.ru/geo/{longitude},{latitude}",\n';
  code += '        "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=15"\n';
  code += '    }\n\n';

  return code;
}