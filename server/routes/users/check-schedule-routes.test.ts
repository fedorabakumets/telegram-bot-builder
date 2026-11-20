/** @fileoverview Настройка расписаний требует доступа к проекту и проверки принадлежности бота. */
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import { createServer } from 'node:http';
const mocks=vi.hoisted(()=>({ get:vi.fn(),save:vi.fn(),tokens:vi.fn(),launch:vi.fn() }));
vi.mock('../../middleware/requireProjectAccess',()=>({ requireProjectAccess:(req:any,res:any,next:()=>void)=>req.params.projectId==='12'?next():res.sendStatus(403) }));
vi.mock('../../telegram/auth-middleware',()=>({ getOwnerIdFromRequest:()=>1 }));
vi.mock('../../storages/storage',()=>({ storage:{ getBotTokensByProject:mocks.tokens } }));
vi.mock('../check-history/schedule-store',()=>({ checkScheduleStore:{ get:mocks.get,save:mocks.save } }));
vi.mock('../check-history/schedule-worker',()=>({runDueCheckScope:mocks.launch}));
import { registerCheckScheduleRoutes } from '../check-history/schedule-routes';
const app=express(); app.use(express.json()); registerCheckScheduleRoutes(app);
const server=createServer(app); let base='';
beforeAll(async()=>{ await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};base=`http://127.0.0.1:${address.port}/api/projects`; });
afterAll(async()=>{ server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve())); });
beforeEach(()=>{vi.clearAllMocks();mocks.tokens.mockResolvedValue([{id:9}]);mocks.get.mockResolvedValue(null);mocks.save.mockResolvedValue({enabled:true});});
/** Сохранение не запускает проверку и не позволяет выбрать чужого бота. */
it('сохраняет 6 часов и отклоняет чужого бота',async()=>{
  const body={enabled:true,every:6,unit:'hour',firstAt:'2026-12-01T10:00:00Z'};
  const put=(id:number)=>fetch(`${base}/12/check-schedule?kind=private-chats&tokenId=${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  expect((await put(99)).status).toBe(400);expect(mocks.save).not.toHaveBeenCalled();
  expect((await put(9)).status).toBe(200);expect(mocks.save).toHaveBeenCalledWith(12,'private-chats',9,1,body);
});
/** Неверные интервалы и отсутствие доступа отбрасываются до записи. */
it('ограничивает вид, интервал и доступ',async()=>{
  expect((await fetch(`${base}/13/check-schedule?kind=telegram-bots`)).status).toBe(403);
  expect((await fetch(`${base}/12/check-schedule?kind=bad`)).status).toBe(400);
  const response=await fetch(`${base}/12/check-schedule?kind=telegram-bots`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,every:0,unit:'hour',firstAt:'bad'})});
  expect(response.status).toBe(400);expect(mocks.save).not.toHaveBeenCalled();
});

/** Текущий срок запускается в том же запросе после записи настроек, а не ждёт фонового таймера. */
it('немедленно запускает сохранённое расписание с наступившим сроком',async()=>{
  mocks.save.mockResolvedValue({enabled:true,nextRunAt:new Date(Date.now()-1000).toISOString()});
  const body={enabled:true,every:6,unit:'hour',firstAt:new Date().toISOString()};
  const response=await fetch(`${base}/12/check-schedule?kind=telegram-bots&tokenId=9`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  expect(response.status).toBe(200);expect(mocks.launch).toHaveBeenCalledWith({projectId:12,kind:'telegram-bots',tokenId:9});
  expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.launch.mock.invocationCallOrder[0]);
});
