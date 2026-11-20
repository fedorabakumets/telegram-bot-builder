/** @fileoverview Справочник пользовательских переменных, значений и численности условий. */
export interface UserVariableOption {
  /** Точное имя переменной. */ name: string;
  /** Люди с непустым значением. */ filled: number;
  /** Люди с точным значением текущего сравнения. */ equals: number;
}
export interface UserVariableOptions {
  /** Всего людей в области остальных фильтров. */ total: number;
  /** Доступные переменные и численность условий. */ variables: UserVariableOption[];
  /** Реальные значения выбранной переменной с количеством людей. */
  values?: Array<{ /** Точное текстовое значение. */ value: string; /** Число людей с этим значением. */ count: number }>;
  /** Есть дополнительные значения за пределами текущего поиска. */ hasMoreValues?: boolean;
}
