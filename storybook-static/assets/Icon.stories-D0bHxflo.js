import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{I as s}from"./Icon-BO6ERM9z.js";import"./iframe-C_0L0_58.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DjgfDMXY.js";const f={title:"Atoms/Icon",component:s,parameters:{layout:"centered",docs:{description:{component:`
Универсальный компонент иконок с поддержкой:
- Font Awesome иконок через prop name
- Кастомных SVG иконок через children
- Различных размеров (xs, sm, md, lg, xl, 2xl)
- Семантических цветов (default, muted, primary, success, warning, error, info)
- Полной доступности с aria-label и role

## Использование

\`\`\`tsx
import { Icon } from '@/components/atoms/Icon';

// Font Awesome иконка
<Icon name="fa-solid fa-user" size="lg" color="primary" aria-label="Пользователь" />

// Кастомная SVG иконка
<Icon size="md" color="success" aria-label="Успех">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
</Icon>

// Декоративная иконка (скрыта от скринридеров)
<Icon name="fa-solid fa-star" decorative />
\`\`\`
        `}}},tags:["autodocs"],argTypes:{size:{control:{type:"select"},options:["xs","sm","md","lg","xl","2xl"],description:"Размер иконки"},color:{control:{type:"select"},options:["default","muted","primary","secondary","success","warning","error","info"],description:"Цвет иконки"},name:{control:{type:"text"},description:'Имя Font Awesome иконки (например, "fa-solid fa-user")'},decorative:{control:{type:"boolean"},description:"Декоративная иконка (скрыта от скринридеров)"},"aria-label":{control:{type:"text"},description:"Подпись для скринридеров"}}},a={args:{name:"fa-solid fa-star","aria-label":"Звезда"}},r={args:{"aria-label":"Галочка",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"})})}},i={render:()=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"xs"}),e.jsx("div",{className:"text-xs mt-1",children:"xs"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"sm"}),e.jsx("div",{className:"text-xs mt-1",children:"sm"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"md"}),e.jsx("div",{className:"text-xs mt-1",children:"md"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"lg"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"xl"}),e.jsx("div",{className:"text-xs mt-1",children:"xl"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"2xl"}),e.jsx("div",{className:"text-xs mt-1",children:"2xl"})]})]})},t={render:()=>e.jsxs("div",{className:"grid grid-cols-4 gap-4",children:[e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"default"}),e.jsx("div",{className:"text-xs mt-1",children:"default"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"muted"}),e.jsx("div",{className:"text-xs mt-1",children:"muted"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"primary"}),e.jsx("div",{className:"text-xs mt-1",children:"primary"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"secondary"}),e.jsx("div",{className:"text-xs mt-1",children:"secondary"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"success"}),e.jsx("div",{className:"text-xs mt-1",children:"success"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"warning"}),e.jsx("div",{className:"text-xs mt-1",children:"warning"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"error"}),e.jsx("div",{className:"text-xs mt-1",children:"error"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-circle",color:"info"}),e.jsx("div",{className:"text-xs mt-1",children:"info"})]})]})},n={render:()=>e.jsxs("div",{className:"grid grid-cols-6 gap-4",children:[e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-user",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"user"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-home",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"home"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-cog",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"settings"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-heart",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"heart"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-star",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"star"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-bell",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"bell"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-envelope",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"mail"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-search",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"search"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-plus",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"plus"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-trash",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"trash"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-edit",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"edit"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{name:"fa-solid fa-check",size:"lg"}),e.jsx("div",{className:"text-xs mt-1",children:"check"})]})]})},c={render:()=>e.jsxs("div",{className:"grid grid-cols-4 gap-4",children:[e.jsxs("div",{className:"text-center",children:[e.jsx(s,{size:"lg","aria-label":"Галочка",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"})})}),e.jsx("div",{className:"text-xs mt-1",children:"check"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{size:"lg","aria-label":"Крестик",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"})})}),e.jsx("div",{className:"text-xs mt-1",children:"close"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{size:"lg","aria-label":"Стрелка вправо",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"})})}),e.jsx("div",{className:"text-xs mt-1",children:"arrow"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx(s,{size:"lg","aria-label":"Информация",children:e.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"})})}),e.jsx("div",{className:"text-xs mt-1",children:"info"})]})]})},l={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{name:"fa-solid fa-user",color:"primary"}),e.jsx("span",{children:"Профиль пользователя"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{name:"fa-solid fa-envelope",color:"info"}),e.jsx("span",{children:"Новое сообщение"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{name:"fa-solid fa-exclamation-triangle",color:"warning"}),e.jsx("span",{children:"Предупреждение"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{name:"fa-solid fa-check-circle",color:"success"}),e.jsx("span",{children:"Операция выполнена"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{name:"fa-solid fa-times-circle",color:"error"}),e.jsx("span",{children:"Произошла ошибка"})]})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    name: 'fa-solid fa-star',
    'aria-label': 'Звезда'
  }
}`,...a.parameters?.docs?.source},description:{story:"Базовая иконка Font Awesome",...a.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    'aria-label': 'Галочка',
    children: <svg viewBox="0 0 24 24" fill="currentColor">\r
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />\r
      </svg>
  }
}`,...r.parameters?.docs?.source},description:{story:"Кастомная SVG иконка",...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="xs" />\r
        <div className="text-xs mt-1">xs</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="sm" />\r
        <div className="text-xs mt-1">sm</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="md" />\r
        <div className="text-xs mt-1">md</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="lg" />\r
        <div className="text-xs mt-1">lg</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="xl" />\r
        <div className="text-xs mt-1">xl</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="2xl" />\r
        <div className="text-xs mt-1">2xl</div>\r
      </div>\r
    </div>
}`,...i.parameters?.docs?.source},description:{story:"Все размеры иконок",...i.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-4 gap-4">\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="default" />\r
        <div className="text-xs mt-1">default</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="muted" />\r
        <div className="text-xs mt-1">muted</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="primary" />\r
        <div className="text-xs mt-1">primary</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="secondary" />\r
        <div className="text-xs mt-1">secondary</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="success" />\r
        <div className="text-xs mt-1">success</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="warning" />\r
        <div className="text-xs mt-1">warning</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="error" />\r
        <div className="text-xs mt-1">error</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-circle" color="info" />\r
        <div className="text-xs mt-1">info</div>\r
      </div>\r
    </div>
}`,...t.parameters?.docs?.source},description:{story:"Все цвета иконок",...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-6 gap-4">\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-user" size="lg" />\r
        <div className="text-xs mt-1">user</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-home" size="lg" />\r
        <div className="text-xs mt-1">home</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-cog" size="lg" />\r
        <div className="text-xs mt-1">settings</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-heart" size="lg" />\r
        <div className="text-xs mt-1">heart</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-star" size="lg" />\r
        <div className="text-xs mt-1">star</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-bell" size="lg" />\r
        <div className="text-xs mt-1">bell</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-envelope" size="lg" />\r
        <div className="text-xs mt-1">mail</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-search" size="lg" />\r
        <div className="text-xs mt-1">search</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-plus" size="lg" />\r
        <div className="text-xs mt-1">plus</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-trash" size="lg" />\r
        <div className="text-xs mt-1">trash</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-edit" size="lg" />\r
        <div className="text-xs mt-1">edit</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon name="fa-solid fa-check" size="lg" />\r
        <div className="text-xs mt-1">check</div>\r
      </div>\r
    </div>
}`,...n.parameters?.docs?.source},description:{story:"Популярные Font Awesome иконки",...n.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-4 gap-4">\r
      <div className="text-center">\r
        <Icon size="lg" aria-label="Галочка">\r
          <svg viewBox="0 0 24 24" fill="currentColor">\r
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />\r
          </svg>\r
        </Icon>\r
        <div className="text-xs mt-1">check</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon size="lg" aria-label="Крестик">\r
          <svg viewBox="0 0 24 24" fill="currentColor">\r
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />\r
          </svg>\r
        </Icon>\r
        <div className="text-xs mt-1">close</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon size="lg" aria-label="Стрелка вправо">\r
          <svg viewBox="0 0 24 24" fill="currentColor">\r
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />\r
          </svg>\r
        </Icon>\r
        <div className="text-xs mt-1">arrow</div>\r
      </div>\r
      <div className="text-center">\r
        <Icon size="lg" aria-label="Информация">\r
          <svg viewBox="0 0 24 24" fill="currentColor">\r
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />\r
          </svg>\r
        </Icon>\r
        <div className="text-xs mt-1">info</div>\r
      </div>\r
    </div>
}`,...c.parameters?.docs?.source},description:{story:"Кастомные SVG иконки",...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">\r
      <div className="flex items-center gap-2">\r
        <Icon name="fa-solid fa-user" color="primary" />\r
        <span>Профиль пользователя</span>\r
      </div>\r
      <div className="flex items-center gap-2">\r
        <Icon name="fa-solid fa-envelope" color="info" />\r
        <span>Новое сообщение</span>\r
      </div>\r
      <div className="flex items-center gap-2">\r
        <Icon name="fa-solid fa-exclamation-triangle" color="warning" />\r
        <span>Предупреждение</span>\r
      </div>\r
      <div className="flex items-center gap-2">\r
        <Icon name="fa-solid fa-check-circle" color="success" />\r
        <span>Операция выполнена</span>\r
      </div>\r
      <div className="flex items-center gap-2">\r
        <Icon name="fa-solid fa-times-circle" color="error" />\r
        <span>Произошла ошибка</span>\r
      </div>\r
    </div>
}`,...l.parameters?.docs?.source},description:{story:"Иконки в контексте (с текстом)",...l.parameters?.docs?.description}}};const p=["Default","CustomSVG","Sizes","Colors","FontAwesome","CustomSVGs","InContext"];export{t as Colors,r as CustomSVG,c as CustomSVGs,a as Default,n as FontAwesome,l as InContext,i as Sizes,p as __namedExportsOrder,f as default};
