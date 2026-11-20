/** @fileoverview Проверки доступа, принадлежности бота и обязательного подтверждения удаления. */
import express from 'express';
import {createServer} from 'node:http';
import {beforeAll,afterAll,beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({count:vi.fn(),remove:vi.fn(),token:vi.fn()}));
vi.mock('../../database/db',()=>({pool:{}}));
vi.mock('../../middleware/requireProjectAccess',()=>({requireProjectAccess:(req:any,res:any,next:()=>void)=>req.params.projectId==='12'?next():res.sendStatus(403)}));
vi.mock('../../storages/storage',()=>({storage:{getBotToken:mocks.token}}));
vi.mock('./delete-without-private-store',()=>({countWithoutPrivateContacts:mocks.count,deleteWithoutPrivateContacts:mocks.remove}));
import {registerDeleteWithoutPrivateRoutes} from './delete-without-private-routes';
const app=express();app.use(express.json());registerDeleteWithoutPrivateRoutes(app);
const server=createServer(app);let base='';
beforeAll(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${(server.address() as {port:number}).port}/api/projects`;});
afterAll(async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));});
beforeEach(()=>{vi.clearAllMocks();mocks.count.mockResolvedValue({people:2,botRecords:3});mocks.remove.mockResolvedValue({people:2,botRecords:3});mocks.token.mockResolvedValue({id:9,projectId:12});});
/** Только явное подтверждение вызывает изменение карточек. */
it('читает количество без удаления и требует подтверждения количества',async()=>{
  const url=`${base}/12/users/without-private-messages`;
  expect((await fetch(url)).status).toBe(200);expect(mocks.remove).not.toHaveBeenCalled();
  expect((await fetch(url,{method:'DELETE',headers:{'Content-Type':'application/json'},body:'{}'})).status).toBe(400);
  expect((await fetch(url,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({people:2,botRecords:3})})).status).toBe(200);
});
it('отклоняет чужой проект, чужого бота и некорректный токен',async()=>{
  expect((await fetch(`${base}/13/users/without-private-messages`)).status).toBe(403);
  expect((await fetch(`${base}/12/users/without-private-messages?tokenId=bad`)).status).toBe(400);
  mocks.token.mockResolvedValue({id:9,projectId:13});
  expect((await fetch(`${base}/12/users/without-private-messages?tokenId=9`)).status).toBe(404);
  expect(mocks.count).not.toHaveBeenCalled();expect(mocks.remove).not.toHaveBeenCalled();
});
it('сообщает об изменении списка вместо удаления неподтверждённого количества',async()=>{
  mocks.remove.mockRejectedValue(new Error('selection_changed'));
  const response=await fetch(`${base}/12/users/without-private-messages`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({people:2,botRecords:3})});
  expect(response.status).toBe(409);
});

/** Отдельный маршрут всегда задаёт удалённый статус на сервере. */
it('передаёт подтверждённую область очистки удалённых аккаунтов',async()=>{
  const url=`${base}/12/users/deleted-accounts?tokenId=9`;
  expect((await fetch(url)).status).toBe(200);
  expect(mocks.count).toHaveBeenCalledWith(expect.anything(),12,9,'deleted');
  expect((await fetch(url,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({people:2,botRecords:3})})).status).toBe(200);
  expect(mocks.remove).toHaveBeenCalledWith(expect.anything(),12,9,{people:2,botRecords:3},'deleted');
});
