/** @fileoverview Очистка требует открытия окна, загрузки количества и отдельного подтверждения. */
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
import {DeleteWithoutPrivateButton} from './delete-without-private-button';
const mocks=vi.hoisted(()=>({request:vi.fn(),toast:vi.fn()}));
vi.mock('@/queryClient',()=>({apiRequest:(method:string,url:string,body?:unknown)=>url.endsWith('/tokens')?Promise.resolve([{id:9,botUsername:'test_bot'},{id:10,botUsername:'other_bot'}]):mocks.request(method,url,...(body===undefined?[]:[body]))}));
vi.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:mocks.toast})}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
/** Открывает изолированный клиент без повторов сетевых запросов. */
function show(tokenId:number|null=null,kind:'without-private'|'deleted'='without-private'){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});render(<QueryClientProvider client={client}><DeleteWithoutPrivateButton projectId={12} tokenId={tokenId} kind={kind}/></QueryClientProvider>);}
it('не удаляет при открытии или отмене, показывает точный предварительный итог',async()=>{
  mocks.request.mockResolvedValue({people:67,botRecords:70});show();
  expect(mocks.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Удалить тех, кто без сообщений'}));
  await screen.findByText('67');
  expect(mocks.request.mock.calls.map(call=>call[0])).toEqual(['GET']);
  fireEvent.click(screen.getByRole('button',{name:'Отмена'}));
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('передаёт подтверждённое количество и область выбранного бота',async()=>{
  mocks.request.mockResolvedValue({people:2,botRecords:2});show(9);
  fireEvent.click(screen.getByRole('button',{name:'Удалить тех, кто без сообщений'}));
  await screen.findByText('2',{selector:'strong'});
  fireEvent.click(screen.getByRole('button',{name:'Удалить'}));
  await waitFor(()=>expect(mocks.request).toHaveBeenCalledWith('DELETE','/api/projects/12/users/without-private-messages?tokenId=9',{people:2,botRecords:2}));
});

/** Закрытие окна не запускает удаление и возвращает фокус к исходной кнопке. */
it('закрывается по Escape и крестику с возвратом фокуса',async()=>{
  mocks.request.mockResolvedValue({people:2,botRecords:2});show();
  const trigger=screen.getByRole('button',{name:'Удалить тех, кто без сообщений'});
  fireEvent.click(trigger);await screen.findByRole('dialog');
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(()=>expect(document.activeElement).toBe(trigger));
  fireEvent.click(trigger);await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button',{name:'Закрыть'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
  expect(mocks.request.mock.calls.every(call=>call[0]==='GET')).toBe(true);
});
/** Во время запроса удаления окно остаётся открытым, а повторное действие недоступно. */
it('не закрывается по Escape, пока выполняется удаление',async()=>{
  mocks.request.mockImplementation((method:string)=>method==='GET'?Promise.resolve({people:2,botRecords:2}):new Promise(()=>{}));show();
  fireEvent.click(screen.getByRole('button',{name:'Удалить тех, кто без сообщений'}));
  await screen.findByText('2',{selector:'strong'});
  fireEvent.click(screen.getByRole('button',{name:'Удалить'}));
  await screen.findByRole('button',{name:'Удаление…'});
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Закрыть'}).hasAttribute('disabled')).toBe(true);
});

/** Выбор области использует тот же компонент, что окно проверок, и обновляет предварительный подсчёт. */
it('показывает понятные имена ботов и пересчитывает пользователей при смене области',async()=>{
  mocks.request.mockResolvedValue({people:2,botRecords:3});show();
  fireEvent.click(screen.getByRole('button',{name:'Удалить тех, кто без сообщений'}));
  await screen.findByRole('option',{name:'@test_bot'});
  expect(screen.getByRole('option',{name:'Все боты проекта · 2'})).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox',{name:'Бот для удаления'}),{target:{value:'9'}});
  await waitFor(()=>expect(mocks.request).toHaveBeenCalledWith('GET','/api/projects/12/users/without-private-messages?tokenId=9'));
  expect(screen.queryByText(/Записей в ботах|Карточек ботов/)).toBeNull();
});

/** Общий диалог показывает отдельный критерий удалённых аккаунтов без автоматического удаления. */
it('открывает удалённые аккаунты с тем же селектором и подтверждением',async()=>{
  mocks.request.mockResolvedValue({people:96,botRecords:96});show(9,'deleted');
  fireEvent.click(screen.getByRole('button',{name:'Удалить удалённые аккаунты'}));
  await screen.findByText('96',{selector:'strong'});
  expect(screen.getByText(/со статусом «Аккаунт удалён»/)).toBeTruthy();
  expect(screen.getByRole('combobox',{name:'Бот для удаления'})).toBeTruthy();
  expect(mocks.request).toHaveBeenCalledWith('GET','/api/projects/12/users/deleted-accounts?tokenId=9');
  expect(mocks.request.mock.calls.every(call=>call[0]==='GET')).toBe(true);
});
