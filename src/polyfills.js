// Полифилл для crypto.getRandomValues в браузерной среде
if (typeof window !== 'undefined' && window.crypto && !window.crypto.getRandomValues) {
  window.crypto.getRandomValues = function(array) {
    if (array instanceof Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  };
}

// Экспорт для использования в модулях
export {};