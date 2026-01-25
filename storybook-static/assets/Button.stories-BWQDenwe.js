import{j as r}from"./jsx-runtime-ikxUOHmY.js";import{B as e}from"./Button-BxHg2ZHx.js";import{I as x}from"./Icon-BO6ERM9z.js";import"./iframe-C_0L0_58.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BMwarh5Z.js";import"./utils-DjgfDMXY.js";const{fn:f}=__STORYBOOK_MODULE_TEST__,D={title:"Atoms/Button",component:e,parameters:{layout:"centered",docs:{description:{component:`
Универсальный компонент кнопки с поддержкой:
- Различных вариантов оформления (primary, secondary, outline, ghost, destructive, link)
- Размеров (sm, md, lg, icon)
- Состояния загрузки с индикатором
- Иконок до и после текста
- Полиморфного рендеринга через asChild
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { Button } from '@/components/atoms/Button';

// Базовая кнопка
<Button variant="primary" size="md">
  Нажми меня
</Button>

// Кнопка с иконкой
<Button icon={<Icon name="fa-solid fa-plus" />}>
  Добавить
</Button>

// Кнопка в состоянии загрузки
<Button loading disabled>
  Сохранение...
</Button>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["primary","secondary","outline","ghost","destructive","link"],description:"Вариант оформления кнопки"},size:{control:{type:"select"},options:["sm","md","lg","icon"],description:"Размер кнопки"},loading:{control:{type:"boolean"},description:"Показать индикатор загрузки"},disabled:{control:{type:"boolean"},description:"Отключить кнопку"},asChild:{control:{type:"boolean"},description:"Рендерить как дочерний элемент (полиморфизм)"}},args:{onClick:f()}},s={args:{variant:"primary",children:"Primary Button"}},t={args:{variant:"secondary",children:"Secondary Button"}},a={args:{variant:"outline",children:"Outline Button"}},n={args:{variant:"ghost",children:"Ghost Button"}},o={args:{variant:"destructive",children:"Delete"}},i={args:{variant:"link",children:"Link Button"}},c={args:{size:"sm",children:"Small Button"}},d={args:{size:"md",children:"Medium Button"}},l={args:{size:"lg",children:"Large Button"}},m={args:{loading:!0,disabled:!0,children:"Loading..."}},p={args:{disabled:!0,children:"Disabled Button"}},u={args:{icon:r.jsx(x,{name:"fa-solid fa-plus"}),children:"Add Item"}},g={args:{iconRight:r.jsx(x,{name:"fa-solid fa-arrow-right"}),children:"Next"}},h={args:{size:"icon",variant:"outline",children:r.jsx(x,{name:"fa-solid fa-heart"})}},B={render:()=>r.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[r.jsx(e,{variant:"primary",children:"Primary"}),r.jsx(e,{variant:"secondary",children:"Secondary"}),r.jsx(e,{variant:"outline",children:"Outline"}),r.jsx(e,{variant:"ghost",children:"Ghost"}),r.jsx(e,{variant:"destructive",children:"Destructive"}),r.jsx(e,{variant:"link",children:"Link"})]})},y={render:()=>r.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[r.jsx(e,{size:"sm",children:"Small"}),r.jsx(e,{size:"md",children:"Medium"}),r.jsx(e,{size:"lg",children:"Large"}),r.jsx(e,{size:"icon",children:r.jsx(x,{name:"fa-solid fa-star"})})]})},v={render:()=>r.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[r.jsx(e,{children:"Normal"}),r.jsx(e,{loading:!0,disabled:!0,children:"Loading"}),r.jsx(e,{disabled:!0,children:"Disabled"}),r.jsx(e,{icon:r.jsx(x,{name:"fa-solid fa-check"}),children:"With Icon"})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}`,...s.parameters?.docs?.source},description:{story:"Основная кнопка - используется для главных действий",...s.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}`,...t.parameters?.docs?.source},description:{story:"Вторичная кнопка - для менее важных действий",...t.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
}`,...a.parameters?.docs?.source},description:{story:"Кнопка с контуром - для альтернативных действий",...a.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
}`,...n.parameters?.docs?.source},description:{story:"Призрачная кнопка - минималистичный стиль",...n.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Delete'
  }
}`,...o.parameters?.docs?.source},description:{story:"Деструктивная кнопка - для опасных действий (удаление, сброс)",...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'link',
    children: 'Link Button'
  }
}`,...i.parameters?.docs?.source},description:{story:"Кнопка-ссылка - выглядит как ссылка",...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small Button'
  }
}`,...c.parameters?.docs?.source},description:{story:"Маленький размер кнопки",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    children: 'Medium Button'
  }
}`,...d.parameters?.docs?.source},description:{story:"Средний размер кнопки (по умолчанию)",...d.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Large Button'
  }
}`,...l.parameters?.docs?.source},description:{story:"Большой размер кнопки",...l.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    disabled: true,
    children: 'Loading...'
  }
}`,...m.parameters?.docs?.source},description:{story:"Кнопка в состоянии загрузки",...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}`,...p.parameters?.docs?.source},description:{story:"Отключенная кнопка",...p.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    icon: <Icon name="fa-solid fa-plus" />,
    children: 'Add Item'
  }
}`,...u.parameters?.docs?.source},description:{story:"Кнопка с иконкой слева",...u.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    iconRight: <Icon name="fa-solid fa-arrow-right" />,
    children: 'Next'
  }
}`,...g.parameters?.docs?.source},description:{story:"Кнопка с иконкой справа",...g.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'icon',
    variant: 'outline',
    children: <Icon name="fa-solid fa-heart" />
  }
}`,...h.parameters?.docs?.source},description:{story:"Кнопка только с иконкой",...h.parameters?.docs?.description}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-4 items-center">\r
      <Button variant="primary">Primary</Button>\r
      <Button variant="secondary">Secondary</Button>\r
      <Button variant="outline">Outline</Button>\r
      <Button variant="ghost">Ghost</Button>\r
      <Button variant="destructive">Destructive</Button>\r
      <Button variant="link">Link</Button>\r
    </div>
}`,...B.parameters?.docs?.source},description:{story:"Все варианты кнопок в одном ряду",...B.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-4 items-center">\r
      <Button size="sm">Small</Button>\r
      <Button size="md">Medium</Button>\r
      <Button size="lg">Large</Button>\r
      <Button size="icon">\r
        <Icon name="fa-solid fa-star" />\r
      </Button>\r
    </div>
}`,...y.parameters?.docs?.source},description:{story:"Все размеры кнопок",...y.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-4 items-center">\r
      <Button>Normal</Button>\r
      <Button loading disabled>Loading</Button>\r
      <Button disabled>Disabled</Button>\r
      <Button icon={<Icon name="fa-solid fa-check" />}>With Icon</Button>\r
    </div>
}`,...v.parameters?.docs?.source},description:{story:"Различные состояния кнопки",...v.parameters?.docs?.description}}};const O=["Primary","Secondary","Outline","Ghost","Destructive","Link","Small","Medium","Large","Loading","Disabled","WithIcon","WithIconRight","IconOnly","AllVariants","AllSizes","States"];export{y as AllSizes,B as AllVariants,o as Destructive,p as Disabled,n as Ghost,h as IconOnly,l as Large,i as Link,m as Loading,d as Medium,a as Outline,s as Primary,t as Secondary,c as Small,v as States,u as WithIcon,g as WithIconRight,O as __namedExportsOrder,D as default};
