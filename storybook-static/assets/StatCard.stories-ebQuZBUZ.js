import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{r as i}from"./iframe-C_0L0_58.js";import{c as W,a as q}from"./utils-DjgfDMXY.js";import{I as N}from"./Icon-BO6ERM9z.js";import{T as C}from"./Typography-hcafC64q.js";import"./preload-helper-PPVm8Dsz.js";const B=q("rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",{variants:{variant:{default:"border-border",success:"border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",warning:"border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",error:"border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",info:"border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"},size:{sm:"p-4",md:"p-6",lg:"p-8"},interactive:{true:"cursor-pointer hover:shadow-md hover:scale-[1.02]",false:""}},defaultVariants:{variant:"default",size:"md",interactive:!1}}),K=q("inline-flex items-center gap-1 text-xs font-medium",{variants:{type:{increase:"text-green-600 dark:text-green-400",decrease:"text-red-600 dark:text-red-400",neutral:"text-muted-foreground"}},defaultVariants:{type:"neutral"}}),R=i.memo(()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("div",{className:"h-4 bg-muted rounded w-20 animate-pulse"}),e.jsx("div",{className:"h-6 w-6 bg-muted rounded animate-pulse"})]}),e.jsx("div",{className:"h-8 bg-muted rounded w-24 mb-1 animate-pulse"}),e.jsx("div",{className:"h-3 bg-muted rounded w-16 animate-pulse"})]}));R.displayName="StatCardSkeleton";const A=i.memo(({change:a})=>{const r=i.useMemo(()=>{switch(a.type){case"increase":return e.jsx(N,{name:"fa-solid fa-arrow-up",size:"xs"});case"decrease":return e.jsx(N,{name:"fa-solid fa-arrow-down",size:"xs"});default:return e.jsx(N,{name:"fa-solid fa-minus",size:"xs"})}},[a.type]);return e.jsxs("div",{className:K({type:a.type}),children:[r,e.jsx("span",{children:a.value}),a.label&&e.jsx("span",{className:"text-muted-foreground ml-1",children:a.label})]})});A.displayName="ChangeIndicator";const U=(a,r)=>!(a.title!==r.title||a.value!==r.value||a.subtitle!==r.subtitle||a.variant!==r.variant||a.size!==r.size||a.interactive!==r.interactive||a.loading!==r.loading||a.iconName!==r.iconName||a.className!==r.className||a.onClick!==r.onClick||a.formatValue!==r.formatValue||a.change!==r.change&&(!a.change||!r.change||a.change.value!==r.change.value||a.change.type!==r.change.type||a.change.label!==r.change.label)||a.icon!==r.icon||a.footer!==r.footer),Y=a=>typeof a=="number"?a.toLocaleString():String(a),t=i.memo(i.forwardRef(({className:a,variant:r,size:F,interactive:_,title:w,value:z,subtitle:k,change:T,icon:x,iconName:S,loading:s=!1,footer:$,onClick:n,formatValue:V=Y,...D},E)=>{const l=_||!!n,I=i.useMemo(()=>s?"...":V(z),[z,s,V]),L=i.useMemo(()=>s?e.jsx("div",{className:"h-6 w-6 bg-muted rounded animate-pulse"}):x||(S?e.jsx(N,{name:S,size:"lg",color:"muted"}):null),[s,x,S]),O=i.useCallback(()=>{n&&!s&&n()},[n,s]),M=i.useCallback(j=>{(j.key==="Enter"||j.key===" ")&&n&&!s&&(j.preventDefault(),n())},[n,s]);return e.jsx("div",{ref:E,className:W(B({variant:r,size:F,interactive:l}),a),onClick:l?O:void 0,onKeyDown:l?M:void 0,tabIndex:l?0:void 0,role:l?"button":void 0,"aria-label":l?`${w}: ${I}`:void 0,...D,children:s?e.jsx(R,{}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx(C,{variant:"body-small",color:"muted",className:"font-medium",children:w}),L]}),e.jsx(C,{variant:"h3",className:"font-bold mb-1",children:I}),e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("div",{className:"flex flex-col gap-1",children:[k&&e.jsx(C,{variant:"caption",color:"muted",children:k}),T&&e.jsx(A,{change:T})]})}),$&&e.jsx("div",{className:"mt-4 pt-4 border-t border-border",children:$})]})})}),U);t.displayName="StatCard";t.__docgenInfo={description:`StatCard component for displaying statistics with optional change indicators\r
\r
Features:\r
- Multiple variants and sizes from design system\r
- Support for icons (Font Awesome or custom)\r
- Change indicators with increase/decrease/neutral states\r
- Loading state with skeleton animation\r
- Interactive mode with hover effects\r
- Customizable value formatting\r
- Performance optimized with React.memo and custom prop comparison\r
- Accessible with proper ARIA attributes\r
\r
@example\r
\`\`\`tsx\r
// Basic stat card\r
<StatCard \r
  title="Total Users" \r
  value={1234} \r
  iconName="fa-solid fa-users"\r
/>\r
\r
// Stat card with change indicator\r
<StatCard\r
  title="Revenue"\r
  value="$45,678"\r
  subtitle="This month"\r
  change={{\r
    value: "+12.5%",\r
    type: "increase",\r
    label: "vs last month"\r
  }}\r
  variant="success"\r
  iconName="fa-solid fa-dollar-sign"\r
/>\r
\r
// Interactive loading card\r
<StatCard\r
  title="Active Sessions"\r
  value={0}\r
  loading\r
  interactive\r
  onClick={() => console.log('Card clicked')}\r
/>\r
\r
// Custom icon and formatting\r
<StatCard\r
  title="Storage Used"\r
  value={75.5}\r
  formatValue={(val) => \`\${val}%\`}\r
  icon={<CustomStorageIcon />}\r
  footer={<ProgressBar value={75.5} />}\r
/>\r
\`\`\``,methods:[],displayName:"StatCard",props:{title:{required:!0,tsType:{name:"string"},description:"Title/label for the statistic"},value:{required:!0,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"Main value to display"},subtitle:{required:!1,tsType:{name:"string"},description:"Optional subtitle or description"},change:{required:!1,tsType:{name:"signature",type:"object",raw:`{\r
  /** Change value (can include % or other units) */\r
  value: string | number;\r
  /** Type of change */\r
  type: 'increase' | 'decrease' | 'neutral';\r
  /** Optional label for the change (e.g., "vs last month") */\r
  label?: string;\r
}`,signature:{properties:[{key:"value",value:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}],required:!0},description:"Change value (can include % or other units)"},{key:"type",value:{name:"union",raw:"'increase' | 'decrease' | 'neutral'",elements:[{name:"literal",value:"'increase'"},{name:"literal",value:"'decrease'"},{name:"literal",value:"'neutral'"}],required:!0},description:"Type of change"},{key:"label",value:{name:"string",required:!1},description:'Optional label for the change (e.g., "vs last month")'}]}},description:"Change information (growth/decline)"},icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display"},iconName:{required:!1,tsType:{name:"string"},description:"Icon name for Font Awesome icons"},loading:{required:!1,tsType:{name:"boolean"},description:"Whether the card is in a loading state",defaultValue:{value:"false",computed:!1}},footer:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Custom footer content"},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for interactive cards"},formatValue:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string | number) => string",signature:{arguments:[{type:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},name:"value"}],return:{name:"string"}}},description:"Format function for the main value",defaultValue:{value:`(value: string | number): string => {\r
  if (typeof value === 'number') {\r
    // Format large numbers with commas\r
    return value.toLocaleString();\r
  }\r
  return String(value);\r
}`,computed:!1}}},composes:["VariantProps"]};const{fn:G}=__STORYBOOK_MODULE_TEST__,ee={title:"Molecules/StatCard",component:t,parameters:{layout:"centered",docs:{description:{component:`
Компонент карточки статистики для отображения ключевых метрик с поддержкой:
- Различных вариантов оформления (default, success, warning, error, info)
- Размеров (sm, md, lg)
- Индикаторов изменений (рост, снижение, нейтрально)
- Иконок (Font Awesome или кастомные)
- Состояния загрузки со скелетоном
- Интерактивности с эффектами наведения
- Кастомного форматирования значений

## Использование

\`\`\`tsx
import { StatCard } from '@/components/molecules/StatCard';

// Базовая карточка
<StatCard 
  title="Всего пользователей" 
  value={1234} 
  iconName="fa-solid fa-users"
/>

// Карточка с индикатором изменений
<StatCard
  title="Доход"
  value="$45,678"
  subtitle="За этот месяц"
  change={{
    value: "+12.5%",
    type: "increase",
    label: "по сравнению с прошлым месяцем"
  }}
  variant="success"
  iconName="fa-solid fa-dollar-sign"
/>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["default","success","warning","error","info"],description:"Вариант оформления карточки"},size:{control:{type:"select"},options:["sm","md","lg"],description:"Размер карточки"},interactive:{control:{type:"boolean"},description:"Интерактивная карточка с эффектами наведения"},loading:{control:{type:"boolean"},description:"Состояние загрузки"},title:{control:{type:"text"},description:"Заголовок карточки"},value:{control:{type:"text"},description:"Основное значение"},subtitle:{control:{type:"text"},description:"Подзаголовок"}},args:{onClick:G()}},o={args:{title:"Всего пользователей",value:2350,iconName:"fa-solid fa-users"}},c={args:{title:"Доход",value:"$45,678",subtitle:"За этот месяц",change:{value:"+12.5%",type:"increase",label:"по сравнению с прошлым месяцем"},variant:"success",iconName:"fa-solid fa-dollar-sign"}},d={args:{title:"Активные сессии",value:1234,subtitle:"Сейчас онлайн",change:{value:"-8.2%",type:"decrease",label:"за последний час"},variant:"error",iconName:"fa-solid fa-chart-line"}},u={args:{title:"Среднее время сессии",value:"4:32",subtitle:"Минуты",change:{value:"0%",type:"neutral",label:"без изменений"},iconName:"fa-solid fa-clock"}},m={args:{title:"Новые заказы",value:89,subtitle:"За сегодня",interactive:!0,iconName:"fa-solid fa-shopping-cart",change:{value:"+23%",type:"increase",label:"по сравнению с вчера"}}},g={args:{title:"Загрузка данных...",value:0,loading:!0}},v={args:{title:"Уведомления",value:12,size:"sm",iconName:"fa-solid fa-bell"}},f={args:{title:"Общий доход",value:"$1,234,567",subtitle:"За весь период",size:"lg",change:{value:"+45.2%",type:"increase",label:"рост за год"},variant:"success",iconName:"fa-solid fa-chart-bar"}},p={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:[e.jsx(t,{title:"По умолчанию",value:1234,variant:"default",iconName:"fa-solid fa-chart-line"}),e.jsx(t,{title:"Успех",value:5678,variant:"success",iconName:"fa-solid fa-check-circle",change:{value:"+15%",type:"increase"}}),e.jsx(t,{title:"Предупреждение",value:890,variant:"warning",iconName:"fa-solid fa-exclamation-triangle",change:{value:"-5%",type:"decrease"}}),e.jsx(t,{title:"Ошибка",value:123,variant:"error",iconName:"fa-solid fa-times-circle",change:{value:"-25%",type:"decrease"}}),e.jsx(t,{title:"Информация",value:456,variant:"info",iconName:"fa-solid fa-info-circle",change:{value:"0%",type:"neutral"}})]})},h={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Маленький размер"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsx(t,{title:"Задачи",value:24,size:"sm",iconName:"fa-solid fa-tasks"}),e.jsx(t,{title:"Сообщения",value:8,size:"sm",iconName:"fa-solid fa-envelope"}),e.jsx(t,{title:"Файлы",value:156,size:"sm",iconName:"fa-solid fa-file"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Средний размер"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsx(t,{title:"Пользователи",value:2350,size:"md",iconName:"fa-solid fa-users",change:{value:"+12%",type:"increase"}}),e.jsx(t,{title:"Продажи",value:"$45,678",size:"md",iconName:"fa-solid fa-dollar-sign",change:{value:"+8%",type:"increase"}})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Большой размер"}),e.jsx(t,{title:"Общая выручка",value:"$1,234,567",subtitle:"За весь период работы",size:"lg",iconName:"fa-solid fa-chart-bar",change:{value:"+156.7%",type:"increase",label:"рост за последний год"},variant:"success"})]})]})},b={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsx(t,{title:"Всего пользователей",value:12543,change:{value:"+12.5%",type:"increase",label:"за месяц"},variant:"success",iconName:"fa-solid fa-users",interactive:!0}),e.jsx(t,{title:"Активные сессии",value:1834,change:{value:"-2.1%",type:"decrease",label:"за час"},variant:"warning",iconName:"fa-solid fa-chart-line",interactive:!0}),e.jsx(t,{title:"Доход",value:"$89,432",change:{value:"+23.8%",type:"increase",label:"за неделю"},variant:"success",iconName:"fa-solid fa-dollar-sign",interactive:!0}),e.jsx(t,{title:"Ошибки",value:23,change:{value:"+15%",type:"decrease",label:"за день"},variant:"error",iconName:"fa-solid fa-exclamation-triangle",interactive:!0})]})},y={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsx(t,{title:"Использование диска",value:75.5,formatValue:a=>`${a}%`,iconName:"fa-solid fa-hdd",change:{value:"+5.2%",type:"increase",label:"за неделю"}}),e.jsx(t,{title:"Время отклика",value:245,formatValue:a=>`${a}ms`,iconName:"fa-solid fa-tachometer-alt",change:{value:"-12ms",type:"increase",label:"улучшение"},variant:"success"}),e.jsx(t,{title:"Рейтинг",value:4.8,formatValue:a=>`${a}/5.0 ⭐`,iconName:"fa-solid fa-star",change:{value:"+0.2",type:"increase",label:"за месяц"},variant:"success"})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Всего пользователей',
    value: 2350,
    iconName: 'fa-solid fa-users'
  }
}`,...o.parameters?.docs?.source},description:{story:"Базовая карточка статистики",...o.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Доход',
    value: '$45,678',
    subtitle: 'За этот месяц',
    change: {
      value: '+12.5%',
      type: 'increase',
      label: 'по сравнению с прошлым месяцем'
    },
    variant: 'success',
    iconName: 'fa-solid fa-dollar-sign'
  }
}`,...c.parameters?.docs?.source},description:{story:"Карточка с положительным изменением",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Активные сессии',
    value: 1234,
    subtitle: 'Сейчас онлайн',
    change: {
      value: '-8.2%',
      type: 'decrease',
      label: 'за последний час'
    },
    variant: 'error',
    iconName: 'fa-solid fa-chart-line'
  }
}`,...d.parameters?.docs?.source},description:{story:"Карточка с отрицательным изменением",...d.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Среднее время сессии',
    value: '4:32',
    subtitle: 'Минуты',
    change: {
      value: '0%',
      type: 'neutral',
      label: 'без изменений'
    },
    iconName: 'fa-solid fa-clock'
  }
}`,...u.parameters?.docs?.source},description:{story:"Карточка с нейтральным изменением",...u.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Новые заказы',
    value: 89,
    subtitle: 'За сегодня',
    interactive: true,
    iconName: 'fa-solid fa-shopping-cart',
    change: {
      value: '+23%',
      type: 'increase',
      label: 'по сравнению с вчера'
    }
  }
}`,...m.parameters?.docs?.source},description:{story:"Интерактивная карточка",...m.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Загрузка данных...',
    value: 0,
    loading: true
  }
}`,...g.parameters?.docs?.source},description:{story:"Карточка в состоянии загрузки",...g.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Уведомления',
    value: 12,
    size: 'sm',
    iconName: 'fa-solid fa-bell'
  }
}`,...v.parameters?.docs?.source},description:{story:"Маленький размер",...v.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Общий доход',
    value: '$1,234,567',
    subtitle: 'За весь период',
    size: 'lg',
    change: {
      value: '+45.2%',
      type: 'increase',
      label: 'рост за год'
    },
    variant: 'success',
    iconName: 'fa-solid fa-chart-bar'
  }
}`,...f.parameters?.docs?.source},description:{story:"Большой размер",...f.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\r
      <StatCard title="По умолчанию" value={1234} variant="default" iconName="fa-solid fa-chart-line" />\r
      <StatCard title="Успех" value={5678} variant="success" iconName="fa-solid fa-check-circle" change={{
      value: '+15%',
      type: 'increase'
    }} />\r
      <StatCard title="Предупреждение" value={890} variant="warning" iconName="fa-solid fa-exclamation-triangle" change={{
      value: '-5%',
      type: 'decrease'
    }} />\r
      <StatCard title="Ошибка" value={123} variant="error" iconName="fa-solid fa-times-circle" change={{
      value: '-25%',
      type: 'decrease'
    }} />\r
      <StatCard title="Информация" value={456} variant="info" iconName="fa-solid fa-info-circle" change={{
      value: '0%',
      type: 'neutral'
    }} />\r
    </div>
}`,...p.parameters?.docs?.source},description:{story:"Различные варианты оформления",...p.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">\r
      <div>\r
        <h3 className="text-lg font-semibold mb-2">Маленький размер</h3>\r
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\r
          <StatCard title="Задачи" value={24} size="sm" iconName="fa-solid fa-tasks" />\r
          <StatCard title="Сообщения" value={8} size="sm" iconName="fa-solid fa-envelope" />\r
          <StatCard title="Файлы" value={156} size="sm" iconName="fa-solid fa-file" />\r
        </div>\r
      </div>\r
      \r
      <div>\r
        <h3 className="text-lg font-semibold mb-2">Средний размер</h3>\r
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\r
          <StatCard title="Пользователи" value={2350} size="md" iconName="fa-solid fa-users" change={{
          value: '+12%',
          type: 'increase'
        }} />\r
          <StatCard title="Продажи" value="$45,678" size="md" iconName="fa-solid fa-dollar-sign" change={{
          value: '+8%',
          type: 'increase'
        }} />\r
        </div>\r
      </div>\r
      \r
      <div>\r
        <h3 className="text-lg font-semibold mb-2">Большой размер</h3>\r
        <StatCard title="Общая выручка" value="$1,234,567" subtitle="За весь период работы" size="lg" iconName="fa-solid fa-chart-bar" change={{
        value: '+156.7%',
        type: 'increase',
        label: 'рост за последний год'
      }} variant="success" />\r
      </div>\r
    </div>
}`,...h.parameters?.docs?.source},description:{story:"Все размеры карточек",...h.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">\r
      <StatCard title="Всего пользователей" value={12543} change={{
      value: '+12.5%',
      type: 'increase',
      label: 'за месяц'
    }} variant="success" iconName="fa-solid fa-users" interactive />\r
      \r
      <StatCard title="Активные сессии" value={1834} change={{
      value: '-2.1%',
      type: 'decrease',
      label: 'за час'
    }} variant="warning" iconName="fa-solid fa-chart-line" interactive />\r
      \r
      <StatCard title="Доход" value="$89,432" change={{
      value: '+23.8%',
      type: 'increase',
      label: 'за неделю'
    }} variant="success" iconName="fa-solid fa-dollar-sign" interactive />\r
      \r
      <StatCard title="Ошибки" value={23} change={{
      value: '+15%',
      type: 'decrease',
      label: 'за день'
    }} variant="error" iconName="fa-solid fa-exclamation-triangle" interactive />\r
    </div>
}`,...b.parameters?.docs?.source},description:{story:"Дашборд с различными метриками",...b.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\r
      <StatCard title="Использование диска" value={75.5} formatValue={val => \`\${val}%\`} iconName="fa-solid fa-hdd" change={{
      value: '+5.2%',
      type: 'increase',
      label: 'за неделю'
    }} />\r
      \r
      <StatCard title="Время отклика" value={245} formatValue={val => \`\${val}ms\`} iconName="fa-solid fa-tachometer-alt" change={{
      value: '-12ms',
      type: 'increase',
      label: 'улучшение'
    }} variant="success" />\r
      \r
      <StatCard title="Рейтинг" value={4.8} formatValue={val => \`\${val}/5.0 ⭐\`} iconName="fa-solid fa-star" change={{
      value: '+0.2',
      type: 'increase',
      label: 'за месяц'
    }} variant="success" />\r
    </div>
}`,...y.parameters?.docs?.source},description:{story:"Карточки с кастомным форматированием",...y.parameters?.docs?.description}}};const ae=["Default","WithPositiveChange","WithNegativeChange","WithNeutralChange","Interactive","Loading","Small","Large","AllVariants","AllSizes","Dashboard","CustomFormatting"];export{h as AllSizes,p as AllVariants,y as CustomFormatting,b as Dashboard,o as Default,m as Interactive,f as Large,g as Loading,v as Small,d as WithNegativeChange,u as WithNeutralChange,c as WithPositiveChange,ae as __namedExportsOrder,ee as default};
