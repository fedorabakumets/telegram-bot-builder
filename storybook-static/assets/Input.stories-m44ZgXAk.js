import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{I as r}from"./Input-Cu1udcZj.js";import{I as s}from"./Icon-BO6ERM9z.js";import"./iframe-C_0L0_58.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DjgfDMXY.js";const{fn:f}=__STORYBOOK_MODULE_TEST__,k={title:"Atoms/Input",component:r,parameters:{layout:"centered",docs:{description:{component:`
Универсальный компонент поля ввода с поддержкой:
- Различных вариантов (default, error, success)
- Размеров (sm, md, lg)
- Иконок в начале и конце поля
- Состояния загрузки с индикатором
- Сообщений об ошибках и успехе
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { Input } from '@/components/atoms/Input';

// Базовое поле ввода
<Input placeholder="Введите текст" />

// Поле с ошибкой
<Input error="Это поле обязательно" placeholder="Email" />

// Поле с иконками
<Input 
  startIcon={<Icon name="fa-solid fa-search" />}
  placeholder="Поиск..."
/>

// Поле в состоянии загрузки
<Input loading placeholder="Поиск..." />
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["default","error","success"],description:"Вариант оформления поля"},size:{control:{type:"select"},options:["sm","md","lg"],description:"Размер поля"},type:{control:{type:"select"},options:["text","email","password","number","tel","url","search"],description:"Тип поля ввода"},loading:{control:{type:"boolean"},description:"Показать индикатор загрузки"},disabled:{control:{type:"boolean"},description:"Отключить поле"},error:{control:{type:"text"},description:"Сообщение об ошибке"},success:{control:{type:"text"},description:"Сообщение об успехе"},placeholder:{control:{type:"text"},description:"Текст-подсказка"}},args:{onChange:f(),onFocus:f(),onBlur:f()}},a={args:{placeholder:"Введите текст..."}},o={args:{placeholder:"Email",error:"Это поле обязательно для заполнения",value:"invalid-email"}},c={args:{placeholder:"Email",success:"Email корректный",value:"user@example.com"}},l={args:{size:"sm",placeholder:"Маленькое поле"}},t={args:{size:"md",placeholder:"Среднее поле"}},n={args:{size:"lg",placeholder:"Большое поле"}},d={args:{disabled:!0,placeholder:"Отключенное поле",value:"Нельзя редактировать"}},p={args:{loading:!0,placeholder:"Поиск...",value:"Поисковый запрос"}},i={args:{startIcon:e.jsx(s,{name:"fa-solid fa-search"}),placeholder:"Поиск..."}},m={args:{endIcon:e.jsx(s,{name:"fa-solid fa-eye"}),type:"password",placeholder:"Пароль"}},u={args:{startIcon:e.jsx(s,{name:"fa-solid fa-user"}),endIcon:e.jsx(s,{name:"fa-solid fa-check",color:"success"}),placeholder:"Имя пользователя",value:"john_doe"}},h={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsx(r,{type:"text",placeholder:"Текст"}),e.jsx(r,{type:"email",placeholder:"Email"}),e.jsx(r,{type:"password",placeholder:"Пароль"}),e.jsx(r,{type:"number",placeholder:"Число"}),e.jsx(r,{type:"tel",placeholder:"Телефон"}),e.jsx(r,{type:"url",placeholder:"URL"}),e.jsx(r,{type:"search",placeholder:"Поиск"})]})},x={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Маленький"}),e.jsx(r,{size:"sm",placeholder:"Маленькое поле"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Средний"}),e.jsx(r,{size:"md",placeholder:"Среднее поле"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Большой"}),e.jsx(r,{size:"lg",placeholder:"Большое поле"})]})]})},I={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Обычное"}),e.jsx(r,{placeholder:"Обычное поле"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"С ошибкой"}),e.jsx(r,{error:"Поле обязательно",placeholder:"Поле с ошибкой"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Успешное"}),e.jsx(r,{success:"Все корректно",placeholder:"Успешное поле",value:"Корректное значение"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Отключенное"}),e.jsx(r,{disabled:!0,placeholder:"Отключенное поле"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium mb-1 block",children:"Загрузка"}),e.jsx(r,{loading:!0,placeholder:"Поле в загрузке"})]})]})},b={render:()=>e.jsxs("div",{className:"space-y-4 w-80",children:[e.jsx(r,{startIcon:e.jsx(s,{name:"fa-solid fa-search"}),placeholder:"Поиск"}),e.jsx(r,{startIcon:e.jsx(s,{name:"fa-solid fa-envelope"}),type:"email",placeholder:"Email"}),e.jsx(r,{startIcon:e.jsx(s,{name:"fa-solid fa-lock"}),endIcon:e.jsx(s,{name:"fa-solid fa-eye"}),type:"password",placeholder:"Пароль"}),e.jsx(r,{startIcon:e.jsx(s,{name:"fa-solid fa-phone"}),type:"tel",placeholder:"Телефон"}),e.jsx(r,{endIcon:e.jsx(s,{name:"fa-solid fa-check",color:"success"}),placeholder:"Проверенное поле",value:"Корректное значение"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Введите текст...'
  }
}`,...a.parameters?.docs?.source},description:{story:"Базовое поле ввода",...a.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Email',
    error: 'Это поле обязательно для заполнения',
    value: 'invalid-email'
  }
}`,...o.parameters?.docs?.source},description:{story:"Поле с ошибкой",...o.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Email',
    success: 'Email корректный',
    value: 'user@example.com'
  }
}`,...c.parameters?.docs?.source},description:{story:"Поле с успешным состоянием",...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    placeholder: 'Маленькое поле'
  }
}`,...l.parameters?.docs?.source},description:{story:"Маленький размер",...l.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    placeholder: 'Среднее поле'
  }
}`,...t.parameters?.docs?.source},description:{story:"Средний размер (по умолчанию)",...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    placeholder: 'Большое поле'
  }
}`,...n.parameters?.docs?.source},description:{story:"Большой размер",...n.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    placeholder: 'Отключенное поле',
    value: 'Нельзя редактировать'
  }
}`,...d.parameters?.docs?.source},description:{story:"Отключенное поле",...d.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    placeholder: 'Поиск...',
    value: 'Поисковый запрос'
  }
}`,...p.parameters?.docs?.source},description:{story:"Поле в состоянии загрузки",...p.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    startIcon: <Icon name="fa-solid fa-search" />,
    placeholder: 'Поиск...'
  }
}`,...i.parameters?.docs?.source},description:{story:"Поле с иконкой в начале",...i.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    endIcon: <Icon name="fa-solid fa-eye" />,
    type: 'password',
    placeholder: 'Пароль'
  }
}`,...m.parameters?.docs?.source},description:{story:"Поле с иконкой в конце",...m.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    startIcon: <Icon name="fa-solid fa-user" />,
    endIcon: <Icon name="fa-solid fa-check" color="success" />,
    placeholder: 'Имя пользователя',
    value: 'john_doe'
  }
}`,...u.parameters?.docs?.source},description:{story:"Поле с иконками с обеих сторон",...u.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <Input type="text" placeholder="Текст" />\r
      <Input type="email" placeholder="Email" />\r
      <Input type="password" placeholder="Пароль" />\r
      <Input type="number" placeholder="Число" />\r
      <Input type="tel" placeholder="Телефон" />\r
      <Input type="url" placeholder="URL" />\r
      <Input type="search" placeholder="Поиск" />\r
    </div>
}`,...h.parameters?.docs?.source},description:{story:"Различные типы полей",...h.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Маленький</label>\r
        <Input size="sm" placeholder="Маленькое поле" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Средний</label>\r
        <Input size="md" placeholder="Среднее поле" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Большой</label>\r
        <Input size="lg" placeholder="Большое поле" />\r
      </div>\r
    </div>
}`,...x.parameters?.docs?.source},description:{story:"Все размеры полей",...x.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Обычное</label>\r
        <Input placeholder="Обычное поле" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">С ошибкой</label>\r
        <Input error="Поле обязательно" placeholder="Поле с ошибкой" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Успешное</label>\r
        <Input success="Все корректно" placeholder="Успешное поле" value="Корректное значение" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Отключенное</label>\r
        <Input disabled placeholder="Отключенное поле" />\r
      </div>\r
      <div>\r
        <label className="text-sm font-medium mb-1 block">Загрузка</label>\r
        <Input loading placeholder="Поле в загрузке" />\r
      </div>\r
    </div>
}`,...I.parameters?.docs?.source},description:{story:"Все состояния полей",...I.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-80">\r
      <Input startIcon={<Icon name="fa-solid fa-search" />} placeholder="Поиск" />\r
      <Input startIcon={<Icon name="fa-solid fa-envelope" />} type="email" placeholder="Email" />\r
      <Input startIcon={<Icon name="fa-solid fa-lock" />} endIcon={<Icon name="fa-solid fa-eye" />} type="password" placeholder="Пароль" />\r
      <Input startIcon={<Icon name="fa-solid fa-phone" />} type="tel" placeholder="Телефон" />\r
      <Input endIcon={<Icon name="fa-solid fa-check" color="success" />} placeholder="Проверенное поле" value="Корректное значение" />\r
    </div>
}`,...b.parameters?.docs?.source},description:{story:"Поля с различными иконками",...b.parameters?.docs?.description}}};const E=["Default","Error","Success","Small","Medium","Large","Disabled","Loading","WithStartIcon","WithEndIcon","WithBothIcons","Types","AllSizes","AllStates","WithIcons"];export{x as AllSizes,I as AllStates,a as Default,d as Disabled,o as Error,n as Large,p as Loading,t as Medium,l as Small,c as Success,h as Types,u as WithBothIcons,m as WithEndIcon,b as WithIcons,i as WithStartIcon,E as __namedExportsOrder,k as default};
