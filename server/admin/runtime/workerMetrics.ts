/** @fileoverview Ограниченная история свежих снимков исполнителя без тяжёлого профилирования. */
import type { WorkerMetricPoint, WorkerMetrics, MetricDistribution } from '../../../shared/worker-metrics';
import { workerActivity } from './workerActivity';
import { workerPythonMemory } from './workerPythonMemory';
/** Минимальный клиент позволяет использовать существующее соединение Redis. */
interface MetricsRedis {
  /** Атомарно сохраняет ограниченное окно. */
  eval(script: string, count: number, ...args: string[]): Promise<unknown>;
}
/** Окно в Redis ограничено числом точек, частотой записи и временем жизни ключа. */
const HISTORY_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
local history = {}
if raw and string.len(raw) < 65536 then
  local ok, decoded = pcall(cjson.decode, raw)
  if ok and type(decoded) == 'table' then history = decoded end
end
local now = tonumber(ARGV[1])
local cleaned = {}
for _, p in ipairs(history) do
  if type(p) == 'table' and tonumber(p.savedAt) and p.savedAt >= now - 3600000 and p.savedAt <= now then
    table.insert(cleaned, p)
  end
end
if ARGV[2] ~= '' and (#cleaned == 0 or now - cleaned[#cleaned].savedAt >= 10000) then
  local point = cjson.decode(ARGV[2]); point.savedAt = now; table.insert(cleaned, point)
end
while #cleaned > 120 do table.remove(cleaned, 1) end
if #cleaned > 0 then redis.call('SET', KEYS[1], cjson.encode(cleaned), 'EX', 3600) end
return cjson.encode(cleaned)
`;
/** Возвращает объект либо пустой словарь без доверия удалённому JSON. */
function object(value: unknown): Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
/** Принимает только конечные неотрицательные измерения. */
function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
/** Фильтрует разрешённые числовые поля статистики задержек. */
function distribution(value: unknown): MetricDistribution | null {
  const source = object(value), fields = ['count', 'p50Ms', 'p95Ms', 'lastMs'];
  if (fields.some(key => number(source[key]) === null) || source.count > 120) return null;
  return { count: source.count, p50Ms: source.p50Ms, p95Ms: source.p95Ms, lastMs: source.lastMs };
}
/** Собирает свежие числа; отсутствие ответа никогда не превращает старый снимок в новый. */
export async function collectWorkerMetrics(snapshot: unknown, runnerId: string, redis: MetricsRedis | null = null,
  now = Date.now()): Promise<WorkerMetrics> {
  const source = object(snapshot), runtime = object(source.runtime);
  const workers: Array<Record<string, any>> = Array.isArray(source.workers) ? source.workers.slice(0, 1000).map(object) : [];
  const complete = Array.isArray(source.workers) && source.workers.length <= 1000;
  const fresh = snapshot !== null && number(runtime.nodeRssBytes) !== null;
  const execution = workers.map(worker => object(worker.execution));
  const activities = workers.map(workerActivity);
  /** Складывает уже проверенные измерения без подстановки неизвестных значений. */
  const sum = (items: number[]) => items.reduce((total, value) => total + value, 0);
  /** Сумма доступна только при полном наборе подтверждённых измерений. */
  const aggregate = (key: keyof ReturnType<typeof workerActivity>) => fresh && complete &&
    activities.every(item => item[key] !== null) ? sum(activities.map(item => item[key]!)) : null;
  const python = execution.map(workerPythonMemory);
  const pythonKnown = fresh && complete && python.every(item => item.pythonRssBytes !== null);
  const point: WorkerMetricPoint = { sampledAt: new Date(now).toISOString(),
    nodeRssBytes: fresh ? number(runtime.nodeRssBytes) : null,
    pythonRssBytes: pythonKnown ? sum(python.map(item => item.pythonRssBytes!)) : null,
    activeHandlers: aggregate('activeHandlers'), sleepingBots: aggregate('sleepingBots'),
    permanentBots: aggregate('permanentBots'), waitingBots: aggregate('waitingBots') };
  let history: WorkerMetricPoint[] = [];
  if (redis) try {
    const raw = await redis.eval(HISTORY_SCRIPT, 1, `tbb:runner:${runnerId}:admin-metrics`, String(now), fresh ? JSON.stringify(point) : '');
    if (typeof raw === 'string' && raw.length < 65536) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed.slice(-120).filter(item => typeof object(item).sampledAt === 'string')
        .map(item => ({ sampledAt: item.sampledAt, nodeRssBytes: number(item.nodeRssBytes),
          pythonRssBytes: number(item.pythonRssBytes), activeHandlers: number(item.activeHandlers),
          sleepingBots: number(item.sleepingBots), permanentBots: number(item.permanentBots), waitingBots: number(item.waitingBots) }));
    }
  } catch { /* Недоступность истории не скрывает актуальный снимок исполнителя. */ }
  return { ...point, status: fresh ? 'live' : 'unavailable', sampledAt: fresh ? point.sampledAt : null, source: 'runner-inspect', historyMode: 'while-observed', history,
    latency: { startupMs: fresh ? distribution(object(runtime.latency).startupMs) : null,
      handlingMs: fresh ? distribution(object(runtime.latency).handlingMs) : null } };
}
