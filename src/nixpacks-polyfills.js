// Специализированный полифилл для Nixpacks среды
// Этот файл будет использоваться только в Nixpacks сборке

// Глобальный полифилл для crypto.getRandomValues
globalThis.crypto = {
  getRandomValues: function(array) {
    if (typeof array === 'object' && array !== null) {
      // Для Node.js среды используем встроенный модуль crypto
      try {
        const nodeCrypto = require('crypto');
        if (array.buffer && array.buffer instanceof ArrayBuffer) {
          const buffer = nodeCrypto.randomBytes(array.length);
          for (let i = 0; i < array.length; i++) {
            array[i] = buffer[i];
          }
          return array;
        }
        // Для обычных массивов
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      } catch (e) {
        // Резервная реализация, если crypto недоступен
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
    }
    return array;
  }
};

// Для совместимости с global
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = globalThis.crypto;
}

// Экспорт для использования в модулях (ESM совместимый)
export {};