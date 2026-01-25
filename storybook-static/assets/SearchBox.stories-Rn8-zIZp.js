import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{r as a}from"./iframe-C_0L0_58.js";import{a as ee}from"./utils-DjgfDMXY.js";import{c as K}from"./theme-provider-LgxGQKri.js";import{I as se}from"./Input-Cu1udcZj.js";import{I as P}from"./Icon-BO6ERM9z.js";import"./preload-helper-PPVm8Dsz.js";const re=ee("relative w-full",{variants:{size:{sm:"",md:"",lg:""}},defaultVariants:{size:"md"}});function ae(i,o){const[d,n]=a.useState(i);return a.useEffect(()=>{const C=setTimeout(()=>{n(i)},o);return()=>{clearTimeout(C)}},[i,o]),d}const te=(i,o)=>o.trim()?i.filter(d=>d.toLowerCase().includes(o.toLowerCase())):[],t=a.forwardRef(({className:i,size:o,value:d="",onChange:n,onSearch:C,debounceMs:G=300,showClearButton:L=!0,loading:B=!1,suggestions:A=[],onSuggestionSelect:M,showSuggestions:I=!0,maxSuggestions:_=5,filterSuggestions:R=te,placeholder:Q="Search...",disabled:u,...U},Y)=>{const[c,T]=a.useState(d),[W,m]=a.useState(!1),[z,p]=a.useState(-1),F=ae(c,G),l=a.useMemo(()=>!I||!A.length?[]:R(A,c).slice(0,_),[A,c,I,_,R]);a.useEffect(()=>{T(d)},[d]),a.useEffect(()=>{n&&n(c,F)},[F]);const H=s=>{const r=s.target.value;T(r),p(-1),m(r.length>0&&l.length>0)},E=()=>{C&&!u&&C(c),m(!1)},J=()=>{T(""),m(!1),p(-1),n&&n("","")},O=s=>{T(s),m(!1),p(-1),M&&M(s),n&&n(s,s)},X=s=>{if(!u){if(!W||!l.length){s.key==="Enter"?(s.preventDefault(),E()):s.key==="Escape"&&J();return}switch(s.key){case"ArrowDown":s.preventDefault(),p(r=>r<l.length-1?r+1:0);break;case"ArrowUp":s.preventDefault(),p(r=>r>0?r-1:l.length-1);break;case"Enter":s.preventDefault(),z>=0?O(l[z]):E();break;case"Escape":s.preventDefault(),m(!1),p(-1);break}}},Z=()=>{l.length>0&&m(!0)},$=a.useMemo(()=>B?null:L&&c&&!u?e.jsx("button",{type:"button",onClick:J,className:"hover:text-foreground transition-colors","aria-label":"Clear search",children:e.jsx(P,{name:"fa-solid fa-times",size:"sm"})}):e.jsx("button",{type:"button",onClick:E,className:"hover:text-foreground transition-colors","aria-label":"Search",disabled:u,children:e.jsx(P,{name:"fa-solid fa-search",size:"sm"})}),[B,L,c,u]);return e.jsxs("div",{className:K(re({size:o}),i),children:[e.jsx(se,{ref:Y,value:c,onChange:H,onKeyDown:X,onFocus:Z,placeholder:Q,disabled:u,loading:B,size:o,endIcon:B?void 0:$,...U}),W&&l.length>0&&e.jsx("div",{className:"absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto",role:"listbox",children:l.map((s,r)=>e.jsx("button",{type:"button",role:"option","aria-selected":r===z,className:K("w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",r===z&&"bg-accent text-accent-foreground"),onClick:()=>O(s),children:s},s))})]})});t.displayName="SearchBox";t.__docgenInfo={description:"SearchBox component with autocomplete, debouncing, and filtering capabilities",methods:[],displayName:"SearchBox",props:{value:{required:!1,tsType:{name:"string"},description:"Current search value",defaultValue:{value:'""',computed:!1}},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string, debouncedValue: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"},{type:{name:"string"},name:"debouncedValue"}],return:{name:"void"}}},description:`Callback when search value changes\r
Includes debounced value for optimization`},onSearch:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:"Callback when search is submitted (Enter key or search icon click)"},debounceMs:{required:!1,tsType:{name:"number"},description:`Debounce delay in milliseconds\r
@default 300`,defaultValue:{value:"300",computed:!1}},showClearButton:{required:!1,tsType:{name:"boolean"},description:`Whether to show clear button when there's text\r
@default true`,defaultValue:{value:"true",computed:!1}},loading:{required:!1,tsType:{name:"boolean"},description:"Whether the search is in loading state",defaultValue:{value:"false",computed:!1}},suggestions:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Autocomplete suggestions",defaultValue:{value:"[]",computed:!1}},onSuggestionSelect:{required:!1,tsType:{name:"signature",type:"function",raw:"(suggestion: string) => void",signature:{arguments:[{type:{name:"string"},name:"suggestion"}],return:{name:"void"}}},description:"Callback when a suggestion is selected"},showSuggestions:{required:!1,tsType:{name:"boolean"},description:`Whether to show suggestions dropdown\r
@default true when suggestions are provided`,defaultValue:{value:"true",computed:!1}},maxSuggestions:{required:!1,tsType:{name:"number"},description:`Maximum number of suggestions to show\r
@default 5`,defaultValue:{value:"5",computed:!1}},filterSuggestions:{required:!1,tsType:{name:"signature",type:"function",raw:"(suggestions: string[], query: string) => string[]",signature:{arguments:[{type:{name:"Array",elements:[{name:"string"}],raw:"string[]"},name:"suggestions"},{type:{name:"string"},name:"query"}],return:{name:"Array",elements:[{name:"string"}],raw:"string[]"}}},description:`Custom filter function for suggestions\r
@default case-insensitive includes filter`,defaultValue:{value:`(suggestions: string[], query: string): string[] => {\r
  if (!query.trim()) return [];\r
  \r
  return suggestions.filter(suggestion =>\r
    suggestion.toLowerCase().includes(query.toLowerCase())\r
  );\r
}`,computed:!1}},placeholder:{defaultValue:{value:'"Search..."',computed:!1},required:!1}},composes:["Omit","VariantProps"]};const{fn:q}=__STORYBOOK_MODULE_TEST__,me={title:"Molecules/SearchBox",component:t,parameters:{layout:"centered",docs:{description:{component:`
Компонент поиска с расширенными возможностями:
- Дебаунсинг для оптимизации производительности
- Автодополнение с выпадающим списком
- Навигация с клавиатуры (стрелки, Enter, Escape)
- Кнопка очистки
- Состояние загрузки
- Настраиваемая фильтрация предложений

## Использование

\`\`\`tsx
import { SearchBox } from '@/components/molecules/SearchBox';

<SearchBox
  placeholder="Поиск пользователей..."
  suggestions={['Алексей', 'Мария', 'Дмитрий']}
  onChange={(value, debouncedValue) => console.log(value, debouncedValue)}
  onSearch={(value) => console.log('Search:', value)}
/>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{size:{control:{type:"select"},options:["sm","md","lg"],description:"Размер поля поиска"},debounceMs:{control:{type:"number",min:0,max:1e3,step:50},description:"Задержка дебаунсинга в миллисекундах"},showClearButton:{control:{type:"boolean"},description:"Показывать кнопку очистки"},loading:{control:{type:"boolean"},description:"Состояние загрузки"},showSuggestions:{control:{type:"boolean"},description:"Показывать предложения автодополнения"},maxSuggestions:{control:{type:"number",min:1,max:10},description:"Максимальное количество предложений"}},args:{onChange:q(),onSearch:q(),onSuggestionSelect:q()}},g={args:{placeholder:"Поиск..."}},h={args:{placeholder:"Поиск пользователей...",suggestions:["Алексей Иванов","Мария Петрова","Дмитрий Сидоров","Анна Козлова","Сергей Морозов","Елена Волкова","Михаил Новиков","Ольга Соколова"]}},f={args:{placeholder:"Поиск...",loading:!0,value:"поисковый запрос"}},b={args:{size:"sm",placeholder:"Маленький поиск...",suggestions:["React","Vue","Angular","Svelte"]}},x={args:{size:"lg",placeholder:"Большой поиск...",suggestions:["JavaScript","TypeScript","Python","Java","C#"]}},S={args:{placeholder:"Поиск без очистки...",showClearButton:!1,suggestions:["Опция 1","Опция 2","Опция 3"]}},v={args:{placeholder:"Отключенный поиск...",disabled:!0,value:"Нельзя редактировать"}},y={args:{placeholder:"Быстрый дебаунсинг (100мс)...",debounceMs:100,suggestions:["Быстро 1","Быстро 2","Быстро 3"]}},w={args:{placeholder:"Медленный дебаунсинг (800мс)...",debounceMs:800,suggestions:["Медленно 1","Медленно 2","Медленно 3"]}},j={args:{placeholder:"Максимум 3 предложения...",maxSuggestions:3,suggestions:["Первое предложение","Второе предложение","Третье предложение","Четвертое предложение (не показывается)","Пятое предложение (не показывается)"]}},N={args:{placeholder:"Выберите страну...",suggestions:["Россия","США","Германия","Франция","Италия","Испания","Великобритания","Канада","Австралия","Япония","Китай","Индия","Бразилия","Аргентина","Мексика"]}},k={args:{placeholder:"Поиск технологий...",suggestions:["React","Vue.js","Angular","Svelte","Next.js","Nuxt.js","Gatsby","TypeScript","JavaScript","Node.js","Express","Fastify","Nest.js","MongoDB","PostgreSQL","MySQL","Redis","Docker","Kubernetes","AWS","Azure","Google Cloud"]}},D={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Маленький"}),e.jsx(t,{size:"sm",placeholder:"Маленький поиск...",suggestions:["Опция 1","Опция 2"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Средний"}),e.jsx(t,{size:"md",placeholder:"Средний поиск...",suggestions:["Опция 1","Опция 2"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Большой"}),e.jsx(t,{size:"lg",placeholder:"Большой поиск...",suggestions:["Опция 1","Опция 2"]})]})]})},V={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Обычный"}),e.jsx(t,{placeholder:"Обычный поиск..."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"С предложениями"}),e.jsx(t,{placeholder:"С автодополнением...",suggestions:["Предложение 1","Предложение 2","Предложение 3"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Загрузка"}),e.jsx(t,{placeholder:"Поиск...",loading:!0,value:"поисковый запрос"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Отключенный"}),e.jsx(t,{placeholder:"Отключенный поиск...",disabled:!0,value:"нельзя редактировать"})]})]})};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Поиск...'
  }
}`,...g.parameters?.docs?.source},description:{story:"Базовый поиск без автодополнения",...g.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Поиск пользователей...',
    suggestions: ['Алексей Иванов', 'Мария Петрова', 'Дмитрий Сидоров', 'Анна Козлова', 'Сергей Морозов', 'Елена Волкова', 'Михаил Новиков', 'Ольга Соколова']
  }
}`,...h.parameters?.docs?.source},description:{story:"Поиск с автодополнением",...h.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Поиск...',
    loading: true,
    value: 'поисковый запрос'
  }
}`,...f.parameters?.docs?.source},description:{story:"Поиск в состоянии загрузки",...f.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    placeholder: 'Маленький поиск...',
    suggestions: ['React', 'Vue', 'Angular', 'Svelte']
  }
}`,...b.parameters?.docs?.source},description:{story:"Маленький размер",...b.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    placeholder: 'Большой поиск...',
    suggestions: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#']
  }
}`,...x.parameters?.docs?.source},description:{story:"Большой размер",...x.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Поиск без очистки...',
    showClearButton: false,
    suggestions: ['Опция 1', 'Опция 2', 'Опция 3']
  }
}`,...S.parameters?.docs?.source},description:{story:"Без кнопки очистки",...S.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Отключенный поиск...',
    disabled: true,
    value: 'Нельзя редактировать'
  }
}`,...v.parameters?.docs?.source},description:{story:"Отключенный поиск",...v.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Быстрый дебаунсинг (100мс)...',
    debounceMs: 100,
    suggestions: ['Быстро 1', 'Быстро 2', 'Быстро 3']
  }
}`,...y.parameters?.docs?.source},description:{story:"Быстрый дебаунсинг",...y.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Медленный дебаунсинг (800мс)...',
    debounceMs: 800,
    suggestions: ['Медленно 1', 'Медленно 2', 'Медленно 3']
  }
}`,...w.parameters?.docs?.source},description:{story:"Медленный дебаунсинг",...w.parameters?.docs?.description}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Максимум 3 предложения...',
    maxSuggestions: 3,
    suggestions: ['Первое предложение', 'Второе предложение', 'Третье предложение', 'Четвертое предложение (не показывается)', 'Пятое предложение (не показывается)']
  }
}`,...j.parameters?.docs?.source},description:{story:"Ограниченное количество предложений",...j.parameters?.docs?.description}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Выберите страну...',
    suggestions: ['Россия', 'США', 'Германия', 'Франция', 'Италия', 'Испания', 'Великобритания', 'Канада', 'Австралия', 'Япония', 'Китай', 'Индия', 'Бразилия', 'Аргентина', 'Мексика']
  }
}`,...N.parameters?.docs?.source},description:{story:"Поиск по странам",...N.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Поиск технологий...',
    suggestions: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'Fastify', 'Nest.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud']
  }
}`,...k.parameters?.docs?.source},description:{story:"Поиск по технологиям",...k.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Маленький</label>\r
        <SearchBox size="sm" placeholder="Маленький поиск..." suggestions={['Опция 1', 'Опция 2']} />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Средний</label>\r
        <SearchBox size="md" placeholder="Средний поиск..." suggestions={['Опция 1', 'Опция 2']} />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Большой</label>\r
        <SearchBox size="lg" placeholder="Большой поиск..." suggestions={['Опция 1', 'Опция 2']} />\r
      </div>\r
    </div>
}`,...D.parameters?.docs?.source},description:{story:"Все размеры поиска",...D.parameters?.docs?.description}}};V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Обычный</label>\r
        <SearchBox placeholder="Обычный поиск..." />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">С предложениями</label>\r
        <SearchBox placeholder="С автодополнением..." suggestions={['Предложение 1', 'Предложение 2', 'Предложение 3']} />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Загрузка</label>\r
        <SearchBox placeholder="Поиск..." loading value="поисковый запрос" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Отключенный</label>\r
        <SearchBox placeholder="Отключенный поиск..." disabled value="нельзя редактировать" />\r
      </div>\r
    </div>
}`,...V.parameters?.docs?.source},description:{story:"Различные состояния поиска",...V.parameters?.docs?.description}}};const pe=["Default","WithSuggestions","Loading","Small","Large","WithoutClearButton","Disabled","FastDebounce","SlowDebounce","LimitedSuggestions","CountrySearch","TechSearch","AllSizes","AllStates"];export{D as AllSizes,V as AllStates,N as CountrySearch,g as Default,v as Disabled,y as FastDebounce,x as Large,j as LimitedSuggestions,f as Loading,w as SlowDebounce,b as Small,k as TechSearch,h as WithSuggestions,S as WithoutClearButton,pe as __namedExportsOrder,me as default};
