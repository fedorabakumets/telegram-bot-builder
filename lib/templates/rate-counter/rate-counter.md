# Узел rate_counter

In-memory счётчик событий в скользящем окне. Использует `collections.deque` по ключу `counterKey`.
Результат (количество событий в окне) сохраняется в переменную `saveResultTo`.
