/** @fileoverview Проверка потоковой перезагрузки контента на реальном Python без БД. */
import { execFileSync } from 'child_process';
import { generateContentCode } from '../templates/content/content.renderer';

/** Проверить атомарную замену, ограничение порций и отсутствие параллельных сборок. */
export function checkContentCacheRuntime(): void {
  const code = generateContentCode({ projectId: 12, reloadIntervalSeconds: 60, contentCache: true });
  const checks = `
import asyncio, logging, sys
exec(sys.stdin.read())
_content_table_id = 1

class Context:
    async def __aenter__(self):
        return self
    async def __aexit__(self, *args):
        return False

class Pool(Context):
    def __init__(self):
        self.active = 0
        self.maximum = 0
        self.fail = False
    def acquire(self):
        return self
    def transaction(self):
        return Context()
    def cursor(self, query, table_id, *, prefetch):
        assert prefetch == 128 and table_id == 1
        return self.rows()
    async def rows(self):
        self.active += 1
        self.maximum = max(self.maximum, self.active)
        try:
            for index in range(260):
                await asyncio.sleep(0)
                if self.fail and index == 129:
                    raise RuntimeError('проверка обрыва чтения')
                yield {'data': {'0': str(index), '1': 'тип', '2': 'текст', '3': 'значение'}}
        finally:
            self.active -= 1

async def check():
    global _content_cache
    pool = Pool()
    await asyncio.gather(reload_content(pool), reload_content(pool))
    assert pool.maximum == 1 and len(_content_cache) == 260
    assert get_content('259') == 'значение'
    assert get_content('missing', 'fallback') == 'fallback'
    snapshot = _content_cache
    pool.fail = True
    await reload_content(pool)
    assert _content_cache is snapshot

asyncio.run(check())
`;
  execFileSync('python', ['-c', checks], { input: code, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}
