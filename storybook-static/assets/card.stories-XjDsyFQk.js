import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{r as l}from"./iframe-C_0L0_58.js";import{c as m}from"./utils-DjgfDMXY.js";import{B as w}from"./Button-BxHg2ZHx.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BMwarh5Z.js";const t=l.forwardRef(({className:r,...s},a)=>e.jsx("div",{ref:a,className:m("rounded-lg border bg-card text-card-foreground shadow-sm",r),...s}));t.displayName="Card";const d=l.forwardRef(({className:r,...s},a)=>e.jsx("div",{ref:a,className:m("flex flex-col space-y-1.5 p-6",r),...s}));d.displayName="CardHeader";const o=l.forwardRef(({className:r,...s},a)=>e.jsx("h3",{ref:a,className:m("text-2xl font-semibold leading-none tracking-tight",r),...s}));o.displayName="CardTitle";const i=l.forwardRef(({className:r,...s},a)=>e.jsx("p",{ref:a,className:m("text-sm text-muted-foreground",r),...s}));i.displayName="CardDescription";const n=l.forwardRef(({className:r,...s},a)=>e.jsx("div",{ref:a,className:m("p-6 pt-0",r),...s}));n.displayName="CardContent";const N=l.forwardRef(({className:r,...s},a)=>e.jsx("div",{ref:a,className:m("flex items-center p-6 pt-0",r),...s}));N.displayName="CardFooter";t.__docgenInfo={description:"",methods:[],displayName:"Card"};d.__docgenInfo={description:"",methods:[],displayName:"CardHeader"};N.__docgenInfo={description:"",methods:[],displayName:"CardFooter"};o.__docgenInfo={description:"",methods:[],displayName:"CardTitle"};i.__docgenInfo={description:"",methods:[],displayName:"CardDescription"};n.__docgenInfo={description:"",methods:[],displayName:"CardContent"};const v=r=>{switch(r){case"default":return"primary";case"destructive":return"destructive";case"outline":return"outline";case"secondary":return"secondary";case"ghost":return"ghost";case"link":return"link";default:return r}},g=r=>{switch(r){case"default":return"md";case"sm":return"sm";case"lg":return"lg";case"icon":return"icon";default:return r}},c=l.forwardRef(({variant:r,size:s,...a},j)=>e.jsx(w,{ref:j,variant:v(r),size:g(s),...a}));c.displayName="Button";c.__docgenInfo={description:"",methods:[],displayName:"Button",props:{variant:{required:!1,tsType:{name:"union",raw:"'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'destructive'"},{name:"literal",value:"'outline'"},{name:"literal",value:"'secondary'"},{name:"literal",value:"'ghost'"},{name:"literal",value:"'link'"}]},description:""},size:{required:!1,tsType:{name:"union",raw:"'default' | 'sm' | 'lg' | 'icon'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'sm'"},{name:"literal",value:"'lg'"},{name:"literal",value:"'icon'"}]},description:""}},composes:["Omit"]};const D={title:"UI/Card",component:t,parameters:{layout:"centered",docs:{description:{component:`
Компонент карточки для отображения группированного контента с поддержкой:
- Заголовка (CardHeader)
- Названия (CardTitle) 
- Описания (CardDescription)
- Основного контента (CardContent)
- Подвала (CardFooter)

## Использование

\`\`\`tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Заголовок карточки</CardTitle>
    <CardDescription>Описание карточки</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Основной контент карточки</p>
  </CardContent>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>
\`\`\`
        `}}},tags:["autodocs"]},p={render:()=>e.jsxs(t,{className:"w-[350px]",children:[e.jsxs(d,{children:[e.jsx(o,{children:"Создать проект"}),e.jsx(i,{children:"Разверните новый проект за одну минуту."})]}),e.jsx(n,{children:e.jsx("p",{children:"Выберите шаблон для быстрого старта вашего проекта."})}),e.jsxs(N,{className:"flex justify-between",children:[e.jsx(c,{variant:"outline",children:"Отмена"}),e.jsx(c,{children:"Создать"})]})]})},x={render:()=>e.jsx(t,{className:"w-[350px]",children:e.jsx(n,{className:"pt-6",children:e.jsx("p",{children:"Простая карточка с минимальным контентом."})})})},u={render:()=>e.jsxs(t,{className:"w-[350px]",children:[e.jsxs(d,{children:[e.jsx(o,{children:"Уведомления"}),e.jsx(i,{children:"У вас есть 3 непрочитанных сообщения."})]}),e.jsx(n,{children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-2 h-2 bg-blue-500 rounded-full"}),e.jsx("p",{className:"text-sm",children:"Новое сообщение от Алексея"})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-2 h-2 bg-green-500 rounded-full"}),e.jsx("p",{className:"text-sm",children:"Задача выполнена"})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-2 h-2 bg-red-500 rounded-full"}),e.jsx("p",{className:"text-sm",children:"Ошибка в системе"})]})]})})]})},C={render:()=>e.jsxs(t,{className:"w-[350px]",children:[e.jsxs(d,{children:[e.jsx(o,{children:"Вход в систему"}),e.jsx(i,{children:"Введите ваши данные для входа в аккаунт."})]}),e.jsxs(n,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Email"}),e.jsx("input",{type:"email",placeholder:"m@example.com",className:"w-full px-3 py-2 border border-input rounded-md"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:"Пароль"}),e.jsx("input",{type:"password",className:"w-full px-3 py-2 border border-input rounded-md"})]})]}),e.jsx(N,{children:e.jsx(c,{className:"w-full",children:"Войти"})})]})},h={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs(t,{children:[e.jsxs(d,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(o,{className:"text-sm font-medium",children:"Всего пользователей"}),e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",className:"h-4 w-4 text-muted-foreground",children:[e.jsx("path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"})]})]}),e.jsxs(n,{children:[e.jsx("div",{className:"text-2xl font-bold",children:"+2,350"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"+180.1% с прошлого месяца"})]})]}),e.jsxs(t,{children:[e.jsxs(d,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(o,{className:"text-sm font-medium",children:"Подписки"}),e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",className:"h-4 w-4 text-muted-foreground",children:e.jsx("path",{d:"M22 12h-4l-3 9L9 3l-3 9H2"})})]}),e.jsxs(n,{children:[e.jsx("div",{className:"text-2xl font-bold",children:"+12,234"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"+19% с прошлого месяца"})]})]}),e.jsxs(t,{children:[e.jsxs(d,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(o,{className:"text-sm font-medium",children:"Продажи"}),e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",className:"h-4 w-4 text-muted-foreground",children:[e.jsx("rect",{width:"20",height:"14",x:"2",y:"5",rx:"2"}),e.jsx("path",{d:"M2 10h20"})]})]}),e.jsxs(n,{children:[e.jsx("div",{className:"text-2xl font-bold",children:"+573"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"+201 с прошлого часа"})]})]})]})},f={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs(t,{className:"w-[250px]",children:[e.jsx(d,{children:e.jsx(o,{className:"text-lg",children:"Маленькая карточка"})}),e.jsx(n,{children:e.jsx("p",{className:"text-sm",children:"Компактный размер для боковых панелей."})})]}),e.jsxs(t,{className:"w-[350px]",children:[e.jsxs(d,{children:[e.jsx(o,{children:"Средняя карточка"}),e.jsx(i,{children:"Стандартный размер для большинства случаев."})]}),e.jsx(n,{children:e.jsx("p",{children:"Оптимальный размер для отображения основного контента."})})]}),e.jsxs(t,{className:"w-[500px]",children:[e.jsxs(d,{children:[e.jsx(o,{className:"text-xl",children:"Большая карточка"}),e.jsx(i,{children:"Расширенное описание для детальной информации."})]}),e.jsx(n,{children:e.jsx("p",{children:"Большой размер подходит для отображения подробной информации, форм или сложного контента, который требует больше места для комфортного восприятия."})}),e.jsx(N,{children:e.jsx(c,{children:"Подробнее"})})]})]})};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-[350px]">\r
      <CardHeader>\r
        <CardTitle>Создать проект</CardTitle>\r
        <CardDescription>Разверните новый проект за одну минуту.</CardDescription>\r
      </CardHeader>\r
      <CardContent>\r
        <p>Выберите шаблон для быстрого старта вашего проекта.</p>\r
      </CardContent>\r
      <CardFooter className="flex justify-between">\r
        <Button variant="outline">Отмена</Button>\r
        <Button>Создать</Button>\r
      </CardFooter>\r
    </Card>
}`,...p.parameters?.docs?.source},description:{story:"Базовая карточка с полной структурой",...p.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-[350px]">\r
      <CardContent className="pt-6">\r
        <p>Простая карточка с минимальным контентом.</p>\r
      </CardContent>\r
    </Card>
}`,...x.parameters?.docs?.source},description:{story:"Простая карточка только с контентом",...x.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-[350px]">\r
      <CardHeader>\r
        <CardTitle>Уведомления</CardTitle>\r
        <CardDescription>У вас есть 3 непрочитанных сообщения.</CardDescription>\r
      </CardHeader>\r
      <CardContent>\r
        <div className="space-y-2">\r
          <div className="flex items-center space-x-2">\r
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>\r
            <p className="text-sm">Новое сообщение от Алексея</p>\r
          </div>\r
          <div className="flex items-center space-x-2">\r
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>\r
            <p className="text-sm">Задача выполнена</p>\r
          </div>\r
          <div className="flex items-center space-x-2">\r
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>\r
            <p className="text-sm">Ошибка в системе</p>\r
          </div>\r
        </div>\r
      </CardContent>\r
    </Card>
}`,...u.parameters?.docs?.source},description:{story:"Карточка без подвала",...u.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-[350px]">\r
      <CardHeader>\r
        <CardTitle>Вход в систему</CardTitle>\r
        <CardDescription>Введите ваши данные для входа в аккаунт.</CardDescription>\r
      </CardHeader>\r
      <CardContent className="space-y-4">\r
        <div className="space-y-2">\r
          <label className="text-sm font-medium">Email</label>\r
          <input type="email" placeholder="m@example.com" className="w-full px-3 py-2 border border-input rounded-md" />\r
        </div>\r
        <div className="space-y-2">\r
          <label className="text-sm font-medium">Пароль</label>\r
          <input type="password" className="w-full px-3 py-2 border border-input rounded-md" />\r
        </div>\r
      </CardContent>\r
      <CardFooter>\r
        <Button className="w-full">Войти</Button>\r
      </CardFooter>\r
    </Card>
}`,...C.parameters?.docs?.source},description:{story:"Карточка с формой",...C.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\r
      <Card>\r
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\r
          <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>\r
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">\r
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />\r
            <circle cx="9" cy="7" r="4" />\r
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />\r
          </svg>\r
        </CardHeader>\r
        <CardContent>\r
          <div className="text-2xl font-bold">+2,350</div>\r
          <p className="text-xs text-muted-foreground">+180.1% с прошлого месяца</p>\r
        </CardContent>\r
      </Card>\r
      \r
      <Card>\r
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\r
          <CardTitle className="text-sm font-medium">Подписки</CardTitle>\r
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">\r
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />\r
          </svg>\r
        </CardHeader>\r
        <CardContent>\r
          <div className="text-2xl font-bold">+12,234</div>\r
          <p className="text-xs text-muted-foreground">+19% с прошлого месяца</p>\r
        </CardContent>\r
      </Card>\r
      \r
      <Card>\r
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\r
          <CardTitle className="text-sm font-medium">Продажи</CardTitle>\r
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">\r
            <rect width="20" height="14" x="2" y="5" rx="2" />\r
            <path d="M2 10h20" />\r
          </svg>\r
        </CardHeader>\r
        <CardContent>\r
          <div className="text-2xl font-bold">+573</div>\r
          <p className="text-xs text-muted-foreground">+201 с прошлого часа</p>\r
        </CardContent>\r
      </Card>\r
    </div>
}`,...h.parameters?.docs?.source},description:{story:"Карточка со статистикой",...h.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">\r
      <Card className="w-[250px]">\r
        <CardHeader>\r
          <CardTitle className="text-lg">Маленькая карточка</CardTitle>\r
        </CardHeader>\r
        <CardContent>\r
          <p className="text-sm">Компактный размер для боковых панелей.</p>\r
        </CardContent>\r
      </Card>\r
      \r
      <Card className="w-[350px]">\r
        <CardHeader>\r
          <CardTitle>Средняя карточка</CardTitle>\r
          <CardDescription>Стандартный размер для большинства случаев.</CardDescription>\r
        </CardHeader>\r
        <CardContent>\r
          <p>Оптимальный размер для отображения основного контента.</p>\r
        </CardContent>\r
      </Card>\r
      \r
      <Card className="w-[500px]">\r
        <CardHeader>\r
          <CardTitle className="text-xl">Большая карточка</CardTitle>\r
          <CardDescription>Расширенное описание для детальной информации.</CardDescription>\r
        </CardHeader>\r
        <CardContent>\r
          <p>Большой размер подходит для отображения подробной информации, форм или сложного контента, который требует больше места для комфортного восприятия.</p>\r
        </CardContent>\r
        <CardFooter>\r
          <Button>Подробнее</Button>\r
        </CardFooter>\r
      </Card>\r
    </div>
}`,...f.parameters?.docs?.source},description:{story:"Различные размеры карточек",...f.parameters?.docs?.description}}};const F=["Default","Simple","WithoutFooter","WithForm","Statistics","Sizes"];export{p as Default,x as Simple,f as Sizes,h as Statistics,C as WithForm,u as WithoutFooter,F as __namedExportsOrder,D as default};
