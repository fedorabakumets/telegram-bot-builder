import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{r as i,R as q}from"./iframe-C_0L0_58.js";import{c as h}from"./theme-provider-LgxGQKri.js";import{c as X,a as V}from"./utils-DjgfDMXY.js";import{I as Y}from"./Icon-BO6ERM9z.js";import{B as P}from"./Button-BxHg2ZHx.js";import{T as J}from"./Typography-hcafC64q.js";import{B as D}from"./badge-Dh2tIZQL.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BMwarh5Z.js";const ee=V("relative inline-flex items-center justify-center font-medium text-foreground select-none shrink-0",{variants:{size:{xs:"h-6 w-6 text-xs",sm:"h-8 w-8 text-sm",md:"h-10 w-10 text-base",lg:"h-12 w-12 text-lg",xl:"h-16 w-16 text-xl","2xl":"h-20 w-20 text-2xl"},shape:{circle:"rounded-full",square:"rounded-md",rounded:"rounded-lg"},variant:{default:"bg-muted",primary:"bg-primary text-primary-foreground",secondary:"bg-secondary text-secondary-foreground",success:"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",warning:"bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",error:"bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}},defaultVariants:{size:"md",shape:"circle",variant:"default"}}),me=V("absolute border-2 border-background rounded-full",{variants:{status:{online:"bg-green-500",offline:"bg-gray-400",away:"bg-yellow-500",busy:"bg-red-500"},size:{xs:"h-2 w-2 -bottom-0 -right-0",sm:"h-2.5 w-2.5 -bottom-0 -right-0",md:"h-3 w-3 -bottom-0.5 -right-0.5",lg:"h-3.5 w-3.5 -bottom-0.5 -right-0.5",xl:"h-4 w-4 -bottom-1 -right-1","2xl":"h-5 w-5 -bottom-1 -right-1"}}}),ue=a=>{if(!a)return"";const t=a.trim().split(/\s+/);return t.length===1?t[0].charAt(0).toUpperCase():(t[0].charAt(0)+t[t.length-1].charAt(0)).toUpperCase()},pe=a=>{if(!a)return"";let t=0;for(let c=0;c<a.length;c++)t=a.charCodeAt(c)+((t<<5)-t);const l=["bg-red-500 text-white","bg-orange-500 text-white","bg-amber-500 text-white","bg-yellow-500 text-black","bg-lime-500 text-black","bg-green-500 text-white","bg-emerald-500 text-white","bg-teal-500 text-white","bg-cyan-500 text-white","bg-sky-500 text-white","bg-blue-500 text-white","bg-indigo-500 text-white","bg-violet-500 text-white","bg-purple-500 text-white","bg-fuchsia-500 text-white","bg-pink-500 text-white","bg-rose-500 text-white"];return l[Math.abs(t)%l.length]},ae=i.memo(({size:a,shape:t})=>e.jsx("div",{className:X(ee({size:a,shape:t}),"animate-pulse bg-muted")}));ae.displayName="AvatarSkeleton";const te=i.memo(({status:a,size:t})=>e.jsx("div",{className:me({status:a,size:t}),"aria-label":`Status: ${a}`,title:`Status: ${a}`}));te.displayName="StatusIndicator";const fe=(a,t)=>!(a.name!==t.name||a.src!==t.src||a.alt!==t.alt||a.status!==t.status||a.showStatus!==t.showStatus||a.initials!==t.initials||a.fallbackIconName!==t.fallbackIconName||a.clickable!==t.clickable||a.loading!==t.loading||a.size!==t.size||a.shape!==t.shape||a.variant!==t.variant||a.className!==t.className||a.onClick!==t.onClick||a.fallbackIcon!==t.fallbackIcon),G=i.memo(i.forwardRef(({className:a,size:t,shape:l,variant:c,name:m="",src:v,alt:B,status:u,showStatus:E=!1,initials:d,fallbackIcon:b,fallbackIconName:L="fa-solid fa-user",clickable:z=!1,onClick:p,loading:n=!1,...F},O)=>{const[W,_]=i.useState(!1),[r,M]=i.useState(!1);i.useEffect(()=>{_(!1),M(!1)},[v]);const $=i.useMemo(()=>d||ue(m),[d,m]),oe=i.useMemo(()=>c!=="default"?"":pe(m),[m,c]),g=z||!!p,Q=i.useCallback(()=>{_(!0)},[]),Z=i.useCallback(()=>{M(!0)},[]),le=i.useCallback(()=>{p&&!n&&p()},[p,n]),ce=i.useCallback(K=>{(K.key==="Enter"||K.key===" ")&&p&&!n&&(K.preventDefault(),p())},[p,n]),de=i.useMemo(()=>n?null:v&&!W?e.jsx("img",{src:v,alt:B||m||"User avatar",className:X("h-full w-full object-cover",l==="circle"&&"rounded-full",l==="square"&&"rounded-md",l==="rounded"&&"rounded-lg",!r&&"opacity-0"),onError:Q,onLoad:Z}):$?e.jsx("span",{className:"font-semibold",children:$}):b||e.jsx(Y,{name:L,size:t==="xs"?"xs":t==="sm"?"sm":"md"}),[n,v,W,r,B,m,l,$,b,L,t,Q,Z]);return n?e.jsx(ae,{size:t,shape:l}):e.jsxs("div",{ref:O,className:X(ee({size:t,shape:l,variant:c}),c==="default"&&oe,g&&"cursor-pointer hover:opacity-80 transition-opacity",a),onClick:g?le:void 0,onKeyDown:g?ce:void 0,tabIndex:g?0:void 0,role:g?"button":void 0,"aria-label":g?`${m||"User"} avatar`:void 0,...F,children:[de,E&&u&&e.jsx(te,{status:u,size:t})]})}),fe);G.displayName="UserAvatar";G.__docgenInfo={description:`UserAvatar component for displaying user profile pictures with fallbacks\r
\r
Features:\r
- Multiple sizes and shapes from design system\r
- Image with fallback to initials or icon\r
- Online status indicator\r
- Automatic color generation based on name\r
- Loading state with skeleton animation\r
- Clickable mode with hover effects\r
- Performance optimized with React.memo and custom prop comparison\r
- Accessible with proper ARIA attributes and alt text\r
\r
@example\r
\`\`\`tsx\r
// Basic avatar with image\r
<UserAvatar \r
  name="John Doe" \r
  src="/avatars/john.jpg" \r
/>\r
\r
// Avatar with initials fallback\r
<UserAvatar \r
  name="Jane Smith" \r
  size="lg"\r
  shape="rounded"\r
/>\r
\r
// Avatar with status indicator\r
<UserAvatar\r
  name="Alice Johnson"\r
  status="online"\r
  showStatus\r
  clickable\r
  onClick={() => console.log('Avatar clicked')}\r
/>\r
\r
// Loading avatar\r
<UserAvatar loading size="xl" />\r
\r
// Custom fallback icon\r
<UserAvatar\r
  fallbackIcon={<CustomIcon />}\r
  variant="primary"\r
/>\r
\`\`\``,methods:[],displayName:"UserAvatar",props:{name:{required:!1,tsType:{name:"string"},description:"User's name for generating initials and alt text",defaultValue:{value:'""',computed:!1}},src:{required:!1,tsType:{name:"string"},description:"Avatar image URL"},alt:{required:!1,tsType:{name:"string"},description:`Alt text for the avatar image\r
Defaults to user's name`},status:{required:!1,tsType:{name:"union",raw:"'online' | 'offline' | 'away' | 'busy'",elements:[{name:"literal",value:"'online'"},{name:"literal",value:"'offline'"},{name:"literal",value:"'away'"},{name:"literal",value:"'busy'"}]},description:"User's online status"},showStatus:{required:!1,tsType:{name:"boolean"},description:`Whether to show the status indicator\r
@default false`,defaultValue:{value:"false",computed:!1}},initials:{required:!1,tsType:{name:"string"},description:"Custom initials to display (overrides generated initials)"},fallbackIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Fallback icon when no image or initials are available"},fallbackIconName:{required:!1,tsType:{name:"string"},description:`Fallback icon name for Font Awesome icons\r
@default "fa-solid fa-user"`,defaultValue:{value:'"fa-solid fa-user"',computed:!1}},clickable:{required:!1,tsType:{name:"boolean"},description:"Whether the avatar is clickable",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler"},loading:{required:!1,tsType:{name:"boolean"},description:"Loading state",defaultValue:{value:"false",computed:!1}}},composes:["VariantProps"]};const se=V("bg-card border border-border rounded-lg transition-colors",{variants:{variant:{compact:"p-4",detailed:"p-6"},interactive:{true:"hover:bg-accent/50 cursor-pointer",false:""}},defaultVariants:{variant:"compact",interactive:!1}}),re=V("flex items-center gap-3",{variants:{variant:{compact:"gap-3",detailed:"gap-4"}},defaultVariants:{variant:"compact"}}),ne=V("flex-1 min-w-0",{variants:{variant:{compact:"space-y-0.5",detailed:"space-y-1"}},defaultVariants:{variant:"compact"}}),ie=q.memo(({variant:a="compact"})=>e.jsx("div",{className:h(se({variant:a})),children:e.jsxs("div",{className:h(re({variant:a})),children:[e.jsx("div",{className:h("rounded-full bg-muted animate-pulse",a==="compact"?"h-10 w-10":"h-12 w-12")}),e.jsxs("div",{className:h(ne({variant:a})),children:[e.jsx("div",{className:"h-4 bg-muted rounded animate-pulse w-24"}),a==="detailed"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"h-3 bg-muted rounded animate-pulse w-32"}),e.jsx("div",{className:"h-3 bg-muted rounded animate-pulse w-16"})]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("div",{className:"h-8 w-16 bg-muted rounded animate-pulse"}),e.jsx("div",{className:"h-8 w-16 bg-muted rounded animate-pulse"})]})]})}));ie.displayName="UserCardSkeleton";const o=q.memo(q.forwardRef(({user:a,actions:t=[],showStatus:l=!0,showEmail:c=!0,showRole:m=!0,children:v,loading:B=!1,onCardClick:u,maxInlineActions:E=2,variant:d,interactive:b,className:L,...z},p)=>{const n=!!u||b,F=t.slice(0,E),O=t.slice(E),W=q.useCallback(r=>{r.target.closest("button")||u?.()},[u]),_=q.useCallback(r=>{(r.key==="Enter"||r.key===" ")&&u&&(r.preventDefault(),u())},[u]);return B?e.jsx(ie,{variant:d}):e.jsxs("div",{ref:p,className:h(se({variant:d,interactive:n}),L),onClick:n?W:void 0,onKeyDown:n?_:void 0,tabIndex:n?0:void 0,role:n?"button":void 0,"aria-label":n?`User card for ${a.name}`:void 0,...z,children:[e.jsxs("div",{className:h(re({variant:d})),children:[e.jsx(G,{name:a.name,src:a.avatar,status:a.status,showStatus:l,size:d==="detailed"?"lg":"md"}),e.jsxs("div",{className:h(ne({variant:d})),children:[e.jsx(J,{variant:d==="detailed"?"body-lg":"body-md",weight:"semibold",className:"text-foreground truncate",children:a.name}),c&&a.email&&e.jsx(J,{variant:d==="detailed"?"body-sm":"body-xs",className:"text-muted-foreground truncate",children:a.email}),m&&a.role&&e.jsx(J,{variant:"body-xs",className:"text-muted-foreground",children:a.role})]}),t.length>0&&e.jsxs("div",{className:"flex items-center gap-2 flex-shrink-0",children:[F.map((r,M)=>e.jsxs(P,{variant:r.variant||"outline",size:"sm",disabled:r.disabled,loading:r.loading,onClick:r.onClick,className:"flex-shrink-0",children:[r.icon&&e.jsx(Y,{name:r.icon,size:"xs",className:"mr-1"}),r.label]},`${r.label}-${M}`)),O.length>0&&e.jsx(P,{variant:"ghost",size:"sm",className:"flex-shrink-0",children:e.jsx(Y,{name:"fa-solid fa-ellipsis-vertical",size:"xs"})})]})]}),v&&e.jsx("div",{className:"mt-4 pt-4 border-t border-border",children:v})]})}));o.displayName="UserCard";o.__docgenInfo={description:"",methods:[],displayName:"UserCard",props:{user:{required:!0,tsType:{name:"User"},description:"User data to display"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"UserCardAction"}],raw:"UserCardAction[]"},description:"Custom actions for the user",defaultValue:{value:"[]",computed:!1}},showStatus:{required:!1,tsType:{name:"boolean"},description:"Whether to show user status",defaultValue:{value:"true",computed:!1}},showEmail:{required:!1,tsType:{name:"boolean"},description:"Whether to show user email",defaultValue:{value:"true",computed:!1}},showRole:{required:!1,tsType:{name:"boolean"},description:"Whether to show user role",defaultValue:{value:"true",computed:!1}},children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Custom content to display below user info"},loading:{required:!1,tsType:{name:"boolean"},description:"Loading state",defaultValue:{value:"false",computed:!1}},onCardClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the entire card"},maxInlineActions:{required:!1,tsType:{name:"number"},description:"Maximum number of actions to show inline",defaultValue:{value:"2",computed:!1}}},composes:["VariantProps"]};const{fn:s}=__STORYBOOK_MODULE_TEST__,Ue={title:"Organisms/UserCard",component:o,parameters:{layout:"centered",docs:{description:{component:`
Компонент карточки пользователя для отображения информации с поддержкой:
- Компактного и детального вариантов отображения
- Аватара с индикатором статуса
- Настраиваемых действий (кнопки)
- Интерактивности с обработкой кликов
- Состояния загрузки со скелетоном
- Кастомного контента
- Переполнения действий в меню

## Использование

\`\`\`tsx
import { UserCard } from '@/components/organisms/UserCard';

<UserCard
  user={{
    id: '1',
    name: 'Алексей Иванов',
    email: 'alexey@example.com',
    avatar: '/avatars/alexey.jpg',
    role: 'Администратор',
    status: 'online'
  }}
  variant="detailed"
  actions={[
    { label: 'Редактировать', onClick: () => {}, variant: 'primary' },
    { label: 'Удалить', onClick: () => {}, variant: 'destructive' }
  ]}
/>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["compact","detailed"],description:"Вариант отображения карточки"},interactive:{control:{type:"boolean"},description:"Интерактивная карточка с эффектами наведения"},showStatus:{control:{type:"boolean"},description:"Показывать статус пользователя"},showEmail:{control:{type:"boolean"},description:"Показывать email пользователя"},showRole:{control:{type:"boolean"},description:"Показывать роль пользователя"},loading:{control:{type:"boolean"},description:"Состояние загрузки"},maxInlineActions:{control:{type:"number",min:0,max:5},description:"Максимальное количество действий в строке"}},args:{onCardClick:s()}},f={id:"1",name:"Алексей Иванов",email:"alexey.ivanov@example.com",avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",role:"Frontend Developer",status:"online"},H={id:"2",name:"Мария Петрова",email:"maria.petrova@example.com",avatar:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",role:"Администратор",status:"away"},ve={id:"3",name:"Дмитрий Сидоров",email:"dmitry.sidorov@example.com",role:"Backend Developer",status:"offline"},R=[{label:"Редактировать",onClick:s(),variant:"outline",icon:"fa-solid fa-edit"},{label:"Удалить",onClick:s(),variant:"destructive",icon:"fa-solid fa-trash"}],x={args:{user:f,variant:"compact",actions:R}},y={args:{user:f,variant:"detailed",actions:R}},w={args:{user:f,variant:"detailed",interactive:!0,actions:[{label:"Сообщение",onClick:s(),variant:"primary",icon:"fa-solid fa-envelope"}]}},k={args:{user:f,loading:!0,variant:"detailed"}},j={args:{user:f,variant:"detailed",actions:[]}},C={args:{user:{...f,email:void 0},variant:"detailed",showEmail:!1,actions:R}},N={args:{user:f,variant:"detailed",showStatus:!1,actions:R}},U={args:{user:H,variant:"detailed",maxInlineActions:2,actions:[{label:"Редактировать",onClick:s(),variant:"outline",icon:"fa-solid fa-edit"},{label:"Сообщение",onClick:s(),variant:"primary",icon:"fa-solid fa-envelope"},{label:"Заблокировать",onClick:s(),variant:"secondary",icon:"fa-solid fa-ban"},{label:"Удалить",onClick:s(),variant:"destructive",icon:"fa-solid fa-trash"}]}},A={args:{user:H,variant:"detailed",actions:R,children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Последний вход:"}),e.jsx("span",{children:"2 часа назад"})]}),e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Проектов:"}),e.jsx("span",{children:"12"})]}),e.jsxs("div",{className:"flex gap-2 mt-3",children:[e.jsx(D,{variant:"secondary",children:"React"}),e.jsx(D,{variant:"secondary",children:"TypeScript"}),e.jsx(D,{variant:"secondary",children:"Node.js"})]})]})}},S={render:()=>e.jsxs("div",{className:"space-y-4 w-96",children:[e.jsx(o,{user:{...f,status:"online"},variant:"compact",actions:[{label:"Написать",onClick:s(),variant:"primary"}]}),e.jsx(o,{user:{...H,status:"away"},variant:"compact",actions:[{label:"Написать",onClick:s(),variant:"outline"}]}),e.jsx(o,{user:{...ve,status:"offline"},variant:"compact",actions:[{label:"Написать",onClick:s(),variant:"outline",disabled:!0}]}),e.jsx(o,{user:{...f,name:"Анна Козлова",status:"busy"},variant:"compact",actions:[{label:"Написать",onClick:s(),variant:"outline"}]})]})},I={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl",children:[e.jsx(o,{user:{id:"1",name:"Алексей Иванов",email:"alexey@company.com",avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",role:"Team Lead",status:"online"},variant:"detailed",actions:[{label:"Профиль",onClick:s(),variant:"outline"},{label:"Сообщение",onClick:s(),variant:"primary"}]}),e.jsx(o,{user:{id:"2",name:"Мария Петрова",email:"maria@company.com",avatar:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",role:"Frontend Developer",status:"away"},variant:"detailed",actions:[{label:"Профиль",onClick:s(),variant:"outline"},{label:"Сообщение",onClick:s(),variant:"primary"}]}),e.jsx(o,{user:{id:"3",name:"Дмитрий Сидоров",email:"dmitry@company.com",role:"Backend Developer",status:"offline"},variant:"detailed",actions:[{label:"Профиль",onClick:s(),variant:"outline"},{label:"Сообщение",onClick:s(),variant:"outline",disabled:!0}]}),e.jsx(o,{user:{id:"4",name:"Анна Козлова",email:"anna@company.com",avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",role:"UI/UX Designer",status:"busy"},variant:"detailed",actions:[{label:"Профиль",onClick:s(),variant:"outline"},{label:"Сообщение",onClick:s(),variant:"primary"}]})]})},T={render:()=>e.jsxs("div",{className:"space-y-4 w-full max-w-2xl",children:[e.jsx(o,{user:{id:"1",name:"Супер Администратор",email:"admin@company.com",avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",role:"Super Admin",status:"online"},variant:"detailed",actions:[{label:"Настройки",onClick:s(),variant:"outline",icon:"fa-solid fa-cog"},{label:"Логи",onClick:s(),variant:"secondary",icon:"fa-solid fa-list"},{label:"Блокировать",onClick:s(),variant:"destructive",icon:"fa-solid fa-ban"}],children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Права доступа:"}),e.jsx(D,{variant:"destructive",children:"Полный доступ"})]}),e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Последний вход:"}),e.jsx("span",{children:"Сейчас"})]}),e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"IP адрес:"}),e.jsx("span",{className:"font-mono",children:"192.168.1.100"})]})]})}),e.jsx(o,{user:{id:"2",name:"Модератор",email:"moderator@company.com",role:"Moderator",status:"away"},variant:"detailed",actions:[{label:"Редактировать",onClick:s(),variant:"outline",icon:"fa-solid fa-edit"},{label:"Права",onClick:s(),variant:"secondary",icon:"fa-solid fa-key"},{label:"Удалить",onClick:s(),variant:"destructive",icon:"fa-solid fa-trash"}],children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Права доступа:"}),e.jsx(D,{variant:"secondary",children:"Ограниченный"})]}),e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"text-muted-foreground",children:"Последний вход:"}),e.jsx("span",{children:"1 час назад"})]})]})})]})};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    variant: 'compact',
    actions: basicActions
  }
}`,...x.parameters?.docs?.source},description:{story:"Компактная карточка пользователя",...x.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    variant: 'detailed',
    actions: basicActions
  }
}`,...y.parameters?.docs?.source},description:{story:"Детальная карточка пользователя",...y.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    variant: 'detailed',
    interactive: true,
    actions: [{
      label: 'Сообщение',
      onClick: fn(),
      variant: 'primary',
      icon: 'fa-solid fa-envelope'
    }]
  }
}`,...w.parameters?.docs?.source},description:{story:"Интерактивная карточка",...w.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    loading: true,
    variant: 'detailed'
  }
}`,...k.parameters?.docs?.source},description:{story:"Карточка в состоянии загрузки",...k.parameters?.docs?.description}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    variant: 'detailed',
    actions: []
  }
}`,...j.parameters?.docs?.source},description:{story:"Карточка без действий",...j.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    user: {
      ...sampleUser,
      email: undefined
    },
    variant: 'detailed',
    showEmail: false,
    actions: basicActions
  }
}`,...C.parameters?.docs?.source},description:{story:"Карточка без email",...C.parameters?.docs?.description}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    user: sampleUser,
    variant: 'detailed',
    showStatus: false,
    actions: basicActions
  }
}`,...N.parameters?.docs?.source},description:{story:"Карточка без статуса",...N.parameters?.docs?.description}}};U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    user: adminUser,
    variant: 'detailed',
    maxInlineActions: 2,
    actions: [{
      label: 'Редактировать',
      onClick: fn(),
      variant: 'outline',
      icon: 'fa-solid fa-edit'
    }, {
      label: 'Сообщение',
      onClick: fn(),
      variant: 'primary',
      icon: 'fa-solid fa-envelope'
    }, {
      label: 'Заблокировать',
      onClick: fn(),
      variant: 'secondary',
      icon: 'fa-solid fa-ban'
    }, {
      label: 'Удалить',
      onClick: fn(),
      variant: 'destructive',
      icon: 'fa-solid fa-trash'
    }]
  }
}`,...U.parameters?.docs?.source},description:{story:"Карточка с множеством действий",...U.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    user: adminUser,
    variant: 'detailed',
    actions: basicActions,
    children: <div className="space-y-2">\r
        <div className="flex items-center justify-between text-sm">\r
          <span className="text-muted-foreground">Последний вход:</span>\r
          <span>2 часа назад</span>\r
        </div>\r
        <div className="flex items-center justify-between text-sm">\r
          <span className="text-muted-foreground">Проектов:</span>\r
          <span>12</span>\r
        </div>\r
        <div className="flex gap-2 mt-3">\r
          <Badge variant="secondary">React</Badge>\r
          <Badge variant="secondary">TypeScript</Badge>\r
          <Badge variant="secondary">Node.js</Badge>\r
        </div>\r
      </div>
  }
}`,...A.parameters?.docs?.source},description:{story:"Карточка с кастомным контентом",...A.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-96">\r
      <UserCard user={{
      ...sampleUser,
      status: 'online'
    }} variant="compact" actions={[{
      label: 'Написать',
      onClick: fn(),
      variant: 'primary'
    }]} />\r
      <UserCard user={{
      ...adminUser,
      status: 'away'
    }} variant="compact" actions={[{
      label: 'Написать',
      onClick: fn(),
      variant: 'outline'
    }]} />\r
      <UserCard user={{
      ...offlineUser,
      status: 'offline'
    }} variant="compact" actions={[{
      label: 'Написать',
      onClick: fn(),
      variant: 'outline',
      disabled: true
    }]} />\r
      <UserCard user={{
      ...sampleUser,
      name: 'Анна Козлова',
      status: 'busy'
    }} variant="compact" actions={[{
      label: 'Написать',
      onClick: fn(),
      variant: 'outline'
    }]} />\r
    </div>
}`,...S.parameters?.docs?.source},description:{story:"Различные статусы пользователей",...S.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">\r
      <UserCard user={{
      id: '1',
      name: 'Алексей Иванов',
      email: 'alexey@company.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'Team Lead',
      status: 'online'
    }} variant="detailed" actions={[{
      label: 'Профиль',
      onClick: fn(),
      variant: 'outline'
    }, {
      label: 'Сообщение',
      onClick: fn(),
      variant: 'primary'
    }]} />\r
      \r
      <UserCard user={{
      id: '2',
      name: 'Мария Петрова',
      email: 'maria@company.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      role: 'Frontend Developer',
      status: 'away'
    }} variant="detailed" actions={[{
      label: 'Профиль',
      onClick: fn(),
      variant: 'outline'
    }, {
      label: 'Сообщение',
      onClick: fn(),
      variant: 'primary'
    }]} />\r
      \r
      <UserCard user={{
      id: '3',
      name: 'Дмитрий Сидоров',
      email: 'dmitry@company.com',
      role: 'Backend Developer',
      status: 'offline'
    }} variant="detailed" actions={[{
      label: 'Профиль',
      onClick: fn(),
      variant: 'outline'
    }, {
      label: 'Сообщение',
      onClick: fn(),
      variant: 'outline',
      disabled: true
    }]} />\r
      \r
      <UserCard user={{
      id: '4',
      name: 'Анна Козлова',
      email: 'anna@company.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      role: 'UI/UX Designer',
      status: 'busy'
    }} variant="detailed" actions={[{
      label: 'Профиль',
      onClick: fn(),
      variant: 'outline'
    }, {
      label: 'Сообщение',
      onClick: fn(),
      variant: 'primary'
    }]} />\r
    </div>
}`,...I.parameters?.docs?.source},description:{story:"Команда разработчиков",...I.parameters?.docs?.description}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-full max-w-2xl">\r
      <UserCard user={{
      id: '1',
      name: 'Супер Администратор',
      email: 'admin@company.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      role: 'Super Admin',
      status: 'online'
    }} variant="detailed" actions={[{
      label: 'Настройки',
      onClick: fn(),
      variant: 'outline',
      icon: 'fa-solid fa-cog'
    }, {
      label: 'Логи',
      onClick: fn(),
      variant: 'secondary',
      icon: 'fa-solid fa-list'
    }, {
      label: 'Блокировать',
      onClick: fn(),
      variant: 'destructive',
      icon: 'fa-solid fa-ban'
    }]} children={<div className="space-y-2">\r
            <div className="flex items-center justify-between text-sm">\r
              <span className="text-muted-foreground">Права доступа:</span>\r
              <Badge variant="destructive">Полный доступ</Badge>\r
            </div>\r
            <div className="flex items-center justify-between text-sm">\r
              <span className="text-muted-foreground">Последний вход:</span>\r
              <span>Сейчас</span>\r
            </div>\r
            <div className="flex items-center justify-between text-sm">\r
              <span className="text-muted-foreground">IP адрес:</span>\r
              <span className="font-mono">192.168.1.100</span>\r
            </div>\r
          </div>} />\r
      \r
      <UserCard user={{
      id: '2',
      name: 'Модератор',
      email: 'moderator@company.com',
      role: 'Moderator',
      status: 'away'
    }} variant="detailed" actions={[{
      label: 'Редактировать',
      onClick: fn(),
      variant: 'outline',
      icon: 'fa-solid fa-edit'
    }, {
      label: 'Права',
      onClick: fn(),
      variant: 'secondary',
      icon: 'fa-solid fa-key'
    }, {
      label: 'Удалить',
      onClick: fn(),
      variant: 'destructive',
      icon: 'fa-solid fa-trash'
    }]} children={<div className="space-y-2">\r
            <div className="flex items-center justify-between text-sm">\r
              <span className="text-muted-foreground">Права доступа:</span>\r
              <Badge variant="secondary">Ограниченный</Badge>\r
            </div>\r
            <div className="flex items-center justify-between text-sm">\r
              <span className="text-muted-foreground">Последний вход:</span>\r
              <span>1 час назад</span>\r
            </div>\r
          </div>} />\r
    </div>
}`,...T.parameters?.docs?.source},description:{story:"Административная панель",...T.parameters?.docs?.description}}};const Ae=["Compact","Detailed","Interactive","Loading","WithoutActions","WithoutEmail","WithoutStatus","ManyActions","WithCustomContent","UserStatuses","DeveloperTeam","AdminPanel"];export{T as AdminPanel,x as Compact,y as Detailed,I as DeveloperTeam,w as Interactive,k as Loading,U as ManyActions,S as UserStatuses,A as WithCustomContent,j as WithoutActions,C as WithoutEmail,N as WithoutStatus,Ae as __namedExportsOrder,Ue as default};
