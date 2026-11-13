/** @fileoverview Атомарный приём webhook без предположения о порядке Telegram update_id. */
/** Сохраняет обновление и историю повторов; подтверждение Python не удаляет историю. */
export const ENQUEUE_WEBHOOK = `
local now = tonumber(redis.call('TIME')[1])
local id = ARGV[1]
local payload = ARGV[2]
local retention = tonumber(ARGV[5])
redis.call('ZREMRANGEBYSCORE', KEYS[7], '-inf', now - retention)
if redis.call('HEXISTS', KEYS[2], id) == 1 or redis.call('ZSCORE', KEYS[7], id) then
  return 1
end
local bytes = tonumber(redis.call('GET', KEYS[4]) or '0')
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[3])
    or bytes + string.len(payload) > tonumber(ARGV[4])
    or redis.call('ZCARD', KEYS[7]) >= tonumber(ARGV[6]) then
  return 0
end
local sequence = redis.call('INCR', KEYS[5])
redis.call('ZADD', KEYS[1], sequence, id)
redis.call('HSET', KEYS[2], id, payload)
redis.call('SET', KEYS[4], bytes + string.len(payload))
redis.call('ZADD', KEYS[7], now, id)
redis.call('EXPIRE', KEYS[7], retention)
return 1
`;
