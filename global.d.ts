// Глобальные объявления типов для проекта

declare global {
  var __dbPoolActive: boolean | undefined;

  interface ImportMeta {
    env: {
      [key: string]: string | undefined;
    };
  }
}

export {};