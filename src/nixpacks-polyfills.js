// Специализированный полифилл для Nixpacks среды (Node.js 16 совместимость)
// Этот файл будет использоваться только в Nixpacks сборке

// Немедленно выполняемый полифилл для crypto.getRandomValues
(function() {
  // Проверяем, существует ли уже реализация
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return;
  }

  // Создаем реализацию crypto.getRandomValues с учетом совместимости Node.js 16
  const cryptoPolyfill = {
    getRandomValues: function(array) {
      if (typeof array === 'object' && array !== null) {
        // Для Node.js среды используем встроенный модуль crypto
        try {
          // Проверяем доступность require (Node.js среда)
          if (typeof require !== 'undefined') {
            const nodeCrypto = require('crypto');
            if (typeof nodeCrypto.randomBytes === 'function') {
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
              return array;
            }
          }
        } catch (e) {
          // Продолжаем к резервной реализации
        }
        
        // Резервная реализация, если crypto недоступен
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return array;
    }
  };

  // Добавляем в globalThis
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.crypto) {
      globalThis.crypto = cryptoPolyfill;
    }
  }

  // Добавляем в global для Node.js совместимости
  if (typeof global !== 'undefined') {
    if (!global.crypto) {
      global.crypto = cryptoPolyfill;
    }
  }

  // Добавляем в window для браузерной совместимости
  if (typeof window !== 'undefined') {
    if (!window.crypto) {
      window.crypto = cryptoPolyfill;
    }
  }
})();

// Экспорт для использования в модулях (ESM совместимый)
export {};