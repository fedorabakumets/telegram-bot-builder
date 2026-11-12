/** @fileoverview Атомарные Lua-операции, совместимые с очередью Python demand_queue. */
/** Атомарная операция ENQUEUE для надёжной очереди. */
export const ENQUEUE = `
local previous = tonumber(redis.call('GET', KEYS[3]) or '-1')
local last_received = tonumber(redis.call('GET', KEYS[6]) or '0')
if tonumber(ARGV[3]) - last_received >= 518400 then previous = -1 end
local count = redis.call('ZCARD', KEYS[1])
local bytes = tonumber(redis.call('GET', KEYS[4]) or '0')
local incoming = {}
local added = 0
local added_bytes = 0
local next_offset = previous
for i = 4, #ARGV, 2 do
  local id = ARGV[i]
  local numeric = tonumber(id)
  if numeric >= previous and not incoming[id]
      and redis.call('HEXISTS', KEYS[2], id) == 0 then
    incoming[id] = ARGV[i + 1]
    added = added + 1
    added_bytes = added_bytes + string.len(ARGV[i + 1])
  end
  if numeric + 1 > next_offset then next_offset = numeric + 1 end
end
if count + added > tonumber(ARGV[1]) or bytes + added_bytes > tonumber(ARGV[2]) then
  return 0
end
local ordered = {}
for id, _ in pairs(incoming) do table.insert(ordered, tonumber(id)) end
table.sort(ordered)
for _, numeric in ipairs(ordered) do
  local id = tostring(numeric)
  local payload = incoming[id]
  local sequence = redis.call('INCR', KEYS[5])
  redis.call('ZADD', KEYS[1], sequence, id)
  redis.call('HSET', KEYS[2], id, payload)
end
redis.call('SET', KEYS[4], bytes + added_bytes)
if next_offset >= 0 then redis.call('SET', KEYS[3], next_offset) end
redis.call('SET', KEYS[6], ARGV[3])
return 1
`;

/** Атомарная операция OFFSET для надёжной очереди. */
export const OFFSET = `
local last_received = tonumber(redis.call('GET', KEYS[6]) or '0')
if tonumber(ARGV[1]) - last_received >= 518400 then return false end
return redis.call('GET', KEYS[3])
`;

/** Атомарная операция PEEK для надёжной очереди. */
export const PEEK = `
local ids = redis.call('ZRANGE', KEYS[1], 0, 0)
if #ids == 0 then return false end
return redis.call('HGET', KEYS[2], ids[1])
`;

/** Атомарная операция ACK для надёжной очереди. */
export const ACK = `
local payload = redis.call('HGET', KEYS[2], ARGV[1])
if not payload then return 0 end
redis.call('HDEL', KEYS[2], ARGV[1])
redis.call('ZREM', KEYS[1], ARGV[1])
redis.call('DECRBY', KEYS[4], string.len(payload))
return 1
`;
