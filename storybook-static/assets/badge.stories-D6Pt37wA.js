import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{B as r}from"./badge-Dh2tIZQL.js";import"./iframe-C_0L0_58.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-DjgfDMXY.js";const h={title:"UI/Badge",component:r,parameters:{layout:"centered",docs:{description:{component:`
Компонент значка для отображения коротких меток, статусов и категорий с поддержкой:
- Различных вариантов оформления (default, secondary, destructive, outline)
- Настраиваемых цветов и стилей
- Компактного размера для встраивания в другие компоненты

## Использование

\`\`\`tsx
import { Badge } from '@/components/ui/badge';

// Базовый значок
<Badge>Новый</Badge>

// Значок с вариантом
<Badge variant="destructive">Ошибка</Badge>

// Значок с контуром
<Badge variant="outline">В процессе</Badge>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["default","secondary","destructive","outline"],description:"Вариант оформления значка"},children:{control:{type:"text"},description:"Текст значка"}}},a={args:{children:"Значок"}},s={args:{variant:"secondary",children:"Вторичный"}},n={args:{variant:"destructive",children:"Ошибка"}},t={args:{variant:"outline",children:"Контур"}},d={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(r,{variant:"default",children:"По умолчанию"}),e.jsx(r,{variant:"secondary",children:"Вторичный"}),e.jsx(r,{variant:"destructive",children:"Деструктивный"}),e.jsx(r,{variant:"outline",children:"Контур"})]})},i={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(r,{variant:"default",children:"Активный"}),e.jsx(r,{variant:"secondary",children:"В ожидании"}),e.jsx(r,{variant:"destructive",children:"Отклонен"}),e.jsx(r,{variant:"outline",children:"Черновик"})]})},c={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(r,{children:"1"}),e.jsx(r,{variant:"secondary",children:"12"}),e.jsx(r,{variant:"destructive",children:"99+"}),e.jsx(r,{variant:"outline",children:"0"})]})},o={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Задачи"}),e.jsx(r,{children:"5"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between p-3 border rounded",children:[e.jsx("span",{children:"Исправить баг в авторизации"}),e.jsx(r,{variant:"destructive",children:"Критично"})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 border rounded",children:[e.jsx("span",{children:"Добавить новую функцию"}),e.jsx(r,{variant:"secondary",children:"В процессе"})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 border rounded",children:[e.jsx("span",{children:"Обновить документацию"}),e.jsx(r,{variant:"outline",children:"Планируется"})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 border rounded",children:[e.jsx("span",{children:"Оптимизировать производительность"}),e.jsx(r,{children:"Готово"})]})]})]})},l={render:()=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{className:"text-xs px-2 py-0.5",children:"Маленький"}),e.jsx(r,{children:"Обычный"}),e.jsx(r,{className:"text-sm px-3 py-1",children:"Большой"})]})},p={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(r,{className:"bg-blue-500 text-white hover:bg-blue-600",children:"Синий"}),e.jsx(r,{className:"bg-green-500 text-white hover:bg-green-600",children:"Зеленый"}),e.jsx(r,{className:"bg-yellow-500 text-black hover:bg-yellow-600",children:"Желтый"}),e.jsx(r,{className:"bg-purple-500 text-white hover:bg-purple-600",children:"Фиолетовый"}),e.jsx(r,{className:"bg-pink-500 text-white hover:bg-pink-600",children:"Розовый"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Значок'
  }
}`,...a.parameters?.docs?.source},description:{story:"Базовый значок",...a.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Вторичный'
  }
}`,...s.parameters?.docs?.source},description:{story:"Вторичный значок",...s.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Ошибка'
  }
}`,...n.parameters?.docs?.source},description:{story:"Деструктивный значок для ошибок и предупреждений",...n.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Контур'
  }
}`,...t.parameters?.docs?.source},description:{story:"Значок с контуром",...t.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge variant="default">По умолчанию</Badge>\r
      <Badge variant="secondary">Вторичный</Badge>\r
      <Badge variant="destructive">Деструктивный</Badge>\r
      <Badge variant="outline">Контур</Badge>\r
    </div>
}`,...d.parameters?.docs?.source},description:{story:"Все варианты значков",...d.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge variant="default">Активный</Badge>\r
      <Badge variant="secondary">В ожидании</Badge>\r
      <Badge variant="destructive">Отклонен</Badge>\r
      <Badge variant="outline">Черновик</Badge>\r
    </div>
}`,...i.parameters?.docs?.source},description:{story:"Значки статусов",...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge>1</Badge>\r
      <Badge variant="secondary">12</Badge>\r
      <Badge variant="destructive">99+</Badge>\r
      <Badge variant="outline">0</Badge>\r
    </div>
}`,...c.parameters?.docs?.source},description:{story:"Значки с числами",...c.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">\r
      <div className="flex items-center gap-2">\r
        <h3 className="text-lg font-semibold">Задачи</h3>\r
        <Badge>5</Badge>\r
      </div>\r
      \r
      <div className="space-y-2">\r
        <div className="flex items-center justify-between p-3 border rounded">\r
          <span>Исправить баг в авторизации</span>\r
          <Badge variant="destructive">Критично</Badge>\r
        </div>\r
        \r
        <div className="flex items-center justify-between p-3 border rounded">\r
          <span>Добавить новую функцию</span>\r
          <Badge variant="secondary">В процессе</Badge>\r
        </div>\r
        \r
        <div className="flex items-center justify-between p-3 border rounded">\r
          <span>Обновить документацию</span>\r
          <Badge variant="outline">Планируется</Badge>\r
        </div>\r
        \r
        <div className="flex items-center justify-between p-3 border rounded">\r
          <span>Оптимизировать производительность</span>\r
          <Badge>Готово</Badge>\r
        </div>\r
      </div>\r
    </div>
}`,...o.parameters?.docs?.source},description:{story:"Значки в контексте",...o.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">\r
      <Badge className="text-xs px-2 py-0.5">Маленький</Badge>\r
      <Badge>Обычный</Badge>\r
      <Badge className="text-sm px-3 py-1">Большой</Badge>\r
    </div>
}`,...l.parameters?.docs?.source},description:{story:"Значки разных размеров (с кастомными стилями)",...l.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">\r
      <Badge className="bg-blue-500 text-white hover:bg-blue-600">Синий</Badge>\r
      <Badge className="bg-green-500 text-white hover:bg-green-600">Зеленый</Badge>\r
      <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Желтый</Badge>\r
      <Badge className="bg-purple-500 text-white hover:bg-purple-600">Фиолетовый</Badge>\r
      <Badge className="bg-pink-500 text-white hover:bg-pink-600">Розовый</Badge>\r
    </div>
}`,...p.parameters?.docs?.source},description:{story:"Цветные значки (с кастомными стилями)",...p.parameters?.docs?.description}}};const B=["Default","Secondary","Destructive","Outline","AllVariants","StatusBadges","WithNumbers","InContext","CustomSizes","ColoredBadges"];export{d as AllVariants,p as ColoredBadges,l as CustomSizes,a as Default,n as Destructive,o as InContext,t as Outline,s as Secondary,i as StatusBadges,c as WithNumbers,B as __namedExportsOrder,h as default};
