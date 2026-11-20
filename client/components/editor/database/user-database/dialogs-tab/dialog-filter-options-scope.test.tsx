/** @fileoverview Справочники фильтров диалогов используют личную историю, не подменяя её списком пользователей. */
import {render,renderHook,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {afterEach,it,expect,vi} from 'vitest';
import type {ReactNode} from 'react';
import {UserDirectoryControls} from '../content/user-directory-controls';
import {SourceFilter} from '../components/filters/source-filter';
import {useVariableOptions} from '../components/filters/use-variable-options';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
/** Проверяет область запроса без доступа к настоящим данным. */
function expectScope(raw:string,audience:'users'|'dialogs') {
  const url=new URL(raw,'http://localhost');
  expect(url.searchParams.get('tokenId')).toBe('11');
  if(audience==='dialogs') {
    expect(url.searchParams.get('dialogUserFilters')).toBe('true');
    expect(url.searchParams.get('dialogKind')).toBe('users');
    expect(url.searchParams.has('privateContactsOnly')).toBe(false);
  } else {
    expect(url.searchParams.get('privateContactsOnly')).toBe('true');
    expect(url.searchParams.has('dialogUserFilters')).toBe(false);
  }
}
for(const audience of ['users','dialogs'] as const) {
  it(`загружает источники в области ${audience}`,async()=>{
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({sources:[]})});vi.stubGlobal('fetch',fetcher);
    const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
    render(<QueryClientProvider client={client}><UserDirectoryControls audience={audience}><SourceFilter projectId={13} tokenId={11}/></UserDirectoryControls></QueryClientProvider>);
    await waitFor(()=>expect(fetcher).toHaveBeenCalled());
    expectScope(fetcher.mock.calls[0][0],audience);
  });
  it(`загружает значения переменных в области ${audience}`,async()=>{
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({total:0,variables:[],values:[]})});vi.stubGlobal('fetch',fetcher);
    /** Изолирует состояние переиспользуемого контрола в нужной вкладке. */
    function Wrapper({children}:{children:ReactNode}) {return <UserDirectoryControls audience={audience}>{children}</UserDirectoryControls>;}
    renderHook(()=>useVariableOptions({projectId:13,tokenId:11,search:'тест',value:{variableName:'city',variableMode:'filled'},enabled:true}),{wrapper:Wrapper});
    await waitFor(()=>expect(fetcher).toHaveBeenCalled());
    expectScope(fetcher.mock.calls[0][0],audience);
    expect(new URL(fetcher.mock.calls[0][0],'http://localhost').searchParams.get('variableOptions')).toBe('true');
  });
}
