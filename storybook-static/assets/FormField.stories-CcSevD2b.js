import{j as e}from"./jsx-runtime-ikxUOHmY.js";import{r as t}from"./iframe-C_0L0_58.js";import{c as E,a as M}from"./utils-DjgfDMXY.js";import"./index-D00bCsrw.js";import{c as U}from"./index-BMwarh5Z.js";import{I as a}from"./Input-Cu1udcZj.js";import{I as f}from"./Icon-BO6ERM9z.js";import"./preload-helper-PPVm8Dsz.js";import"./index-eofBg1r6.js";var B=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],K=B.reduce((r,i)=>{const l=U(`Primitive.${i}`),d=t.forwardRef((n,o)=>{const{asChild:c,...m}=n,u=c?l:i;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),e.jsx(u,{...m,ref:o})});return d.displayName=`Primitive.${i}`,{...r,[i]:d}},{}),G="Label",V=t.forwardRef((r,i)=>e.jsx(K.label,{...r,ref:i,onMouseDown:l=>{l.target.closest("button, input, select, textarea")||(r.onMouseDown?.(l),!l.defaultPrevented&&l.detail>1&&l.preventDefault())}}));V.displayName=G;var J=V;const Q=M("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",{variants:{size:{sm:"text-xs",md:"text-sm",lg:"text-base"},weight:{normal:"font-normal",medium:"font-medium",semibold:"font-semibold"},color:{default:"text-foreground",muted:"text-muted-foreground",error:"text-red-600 dark:text-red-400",success:"text-green-600 dark:text-green-400"}},defaultVariants:{size:"md",weight:"medium",color:"default"}}),X=(r,i)=>!(r.size!==i.size||r.weight!==i.weight||r.color!==i.color||r.required!==i.required||r.description!==i.description||r.error!==i.error||r.className!==i.className||r.children!==i.children||r.htmlFor!==i.htmlFor),A=t.memo(()=>e.jsx("span",{className:"text-red-500 ml-1","aria-label":"required",children:"*"}));A.displayName="RequiredIndicator";const W=t.memo(t.forwardRef(({className:r,size:i,weight:l,color:d,required:n=!1,description:o,error:c,children:m,...u},R)=>{const z=t.useMemo(()=>c?"error":d,[c,d]),T=t.useMemo(()=>e.jsxs(e.Fragment,{children:[m,n&&e.jsx(A,{})]}),[m,n]),k=t.useMemo(()=>c?e.jsx("span",{className:"text-xs text-red-600 dark:text-red-400 mt-1 block",children:c}):o?e.jsx("span",{className:"text-xs text-muted-foreground mt-1 block",children:o}):null,[c,o]);return e.jsxs("div",{className:"space-y-1",children:[e.jsx(J,{ref:R,className:E(Q({size:i,weight:l,color:z}),r),...u,children:T}),k]})}),X);W.displayName="Label";W.__docgenInfo={description:`Enhanced Label component with performance optimizations and extended functionality\r
\r
Features:\r
- Multiple sizes, weights, and colors from design system\r
- Required field indicator\r
- Description and error message support\r
- Performance optimized with React.memo and custom prop comparison\r
- Built on Radix UI Label primitive for accessibility\r
- Automatic color adjustment for error states\r
\r
@example\r
\`\`\`tsx\r
// Basic label\r
<Label htmlFor="email">Email Address</Label>\r
\r
// Required field\r
<Label htmlFor="password" required>\r
  Password\r
</Label>\r
\r
// Label with description\r
<Label \r
  htmlFor="username" \r
  description="Must be at least 3 characters long"\r
>\r
  Username\r
</Label>\r
\r
// Label with error\r
<Label \r
  htmlFor="email" \r
  error="Please enter a valid email address"\r
>\r
  Email\r
</Label>\r
\`\`\``,methods:[],displayName:"Label",props:{required:{required:!1,tsType:{name:"boolean"},description:`Whether the field is required\r
Shows a red asterisk when true`,defaultValue:{value:"false",computed:!1}},description:{required:!1,tsType:{name:"string"},description:`Optional description or helper text\r
Rendered below the label`},error:{required:!1,tsType:{name:"string"},description:`Error message to display\r
When provided, automatically sets color to "error"`}},composes:["Omit","VariantProps"]};const Y=M("space-y-2",{variants:{orientation:{vertical:"flex flex-col",horizontal:"flex flex-row items-start gap-4"}},defaultVariants:{orientation:"vertical"}}),Z=(r,i)=>{if(r.label!==i.label||r.id!==i.id||r.required!==i.required||r.error!==i.error||r.description!==i.description||r.success!==i.success||r.orientation!==i.orientation||r.hideLabel!==i.hideLabel||r.className!==i.className||r.inputWrapperClassName!==i.inputWrapperClassName||r.children!==i.children)return!1;if(r.labelProps!==i.labelProps){if(!r.labelProps||!i.labelProps)return!1;const l=Object.keys(r.labelProps),d=Object.keys(i.labelProps);if(l.length!==d.length)return!1;for(const n of l)if(r.labelProps[n]!==i.labelProps[n])return!1}return!0},D=t.memo(({error:r,success:i,description:l,fieldId:d})=>{const n=r||i||l;if(!n)return null;const o=r?"text-red-600 dark:text-red-400":i?"text-green-600 dark:text-green-400":"text-muted-foreground";return e.jsx("div",{id:d?`${d}-helper`:void 0,className:E("text-xs",o),role:r?"alert":"status","aria-live":r?"assertive":"polite",children:n})});D.displayName="HelperText";const s=t.memo(t.forwardRef(({className:r,orientation:i,label:l,id:d,required:n=!1,error:o,description:c,success:m,children:u,labelProps:R={},hideLabel:z=!1,inputWrapperClassName:T,...k},H)=>{const p=t.useMemo(()=>d||`field-${Math.random().toString(36).substr(2,9)}`,[d]),C=t.useMemo(()=>{if(o||m||c)return`${p}-helper`},[p,o,m,c]),_=t.useMemo(()=>t.Children.map(u,S=>{if(t.isValidElement(S)){const h={};if(S.props.id||(h.id=p),C&&(h["aria-describedby"]=C),o&&(h["aria-invalid"]=!0),n&&(h.required=!0),Object.keys(h).length>0)return t.cloneElement(S,h)}return S}),[u,p,C,o,n]),O=t.useMemo(()=>e.jsx(W,{htmlFor:p,required:n,error:o,className:z?"sr-only":void 0,...R,children:l}),[p,n,o,z,l,R]),$=t.useMemo(()=>e.jsx(D,{error:o,success:m,description:c,fieldId:p}),[o,m,c,p]);return e.jsxs("div",{ref:H,className:E(Y({orientation:i}),r),...k,children:[O,e.jsxs("div",{className:E("flex-1",T),children:[_,$]})]})}),Z);s.displayName="FormField";s.__docgenInfo={description:`Universal FormField component for consistent form field layout and styling\r
\r
Features:\r
- Consistent label, input, and helper text layout\r
- Support for required field indicators\r
- Error, success, and description states\r
- Horizontal and vertical orientations\r
- Proper accessibility with ARIA attributes\r
- Integration with existing Input, Label components\r
- Performance optimized with React.memo and custom prop comparison\r
- Flexible children support for any form control\r
\r
@example\r
\`\`\`tsx\r
// Basic form field with input\r
<FormField\r
  label="Email Address"\r
  id="email"\r
  required\r
  description="We'll never share your email"\r
>\r
  <Input \r
    id="email"\r
    type="email" \r
    placeholder="Enter your email"\r
  />\r
</FormField>\r
\r
// Form field with error\r
<FormField\r
  label="Password"\r
  id="password"\r
  required\r
  error="Password must be at least 8 characters"\r
>\r
  <Input \r
    id="password"\r
    type="password"\r
    error="Password must be at least 8 characters"\r
  />\r
</FormField>\r
\r
// Horizontal layout form field\r
<FormField\r
  label="Newsletter"\r
  id="newsletter"\r
  orientation="horizontal"\r
  description="Receive updates about new features"\r
>\r
  <input \r
    id="newsletter"\r
    type="checkbox"\r
    className="rounded border-gray-300"\r
  />\r
</FormField>\r
\r
// Form field with custom label props\r
<FormField\r
  label="Important Field"\r
  id="important"\r
  labelProps={{ size: "lg", weight: "semibold" }}\r
>\r
  <Input id="important" />\r
</FormField>\r
\`\`\``,methods:[],displayName:"FormField",props:{label:{required:!0,tsType:{name:"string"},description:"Label text for the form field"},id:{required:!1,tsType:{name:"string"},description:`Unique identifier for the form field\r
Used to associate label with input`},required:{required:!1,tsType:{name:"boolean"},description:`Whether the field is required\r
Shows a red asterisk in the label`,defaultValue:{value:"false",computed:!1}},error:{required:!1,tsType:{name:"string"},description:`Error message to display\r
When provided, shows error styling`},description:{required:!1,tsType:{name:"string"},description:`Helper text or description\r
Displayed below the input field`},success:{required:!1,tsType:{name:"string"},description:`Success message to display\r
When provided, shows success styling`},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`The form input element(s)\r
Can be Input, Select, Textarea, or any form control`},labelProps:{required:!1,tsType:{name:"Partial",elements:[{name:"ReactComponentProps",raw:"React.ComponentProps<typeof Label>",elements:[{name:"Label"}]}],raw:"Partial<React.ComponentProps<typeof Label>>"},description:`Custom label props\r
Allows overriding label component properties`,defaultValue:{value:"{}",computed:!1}},hideLabel:{required:!1,tsType:{name:"boolean"},description:"Whether to hide the label visually but keep it for screen readers",defaultValue:{value:"false",computed:!1}},inputWrapperClassName:{required:!1,tsType:{name:"string"},description:"Custom class for the input wrapper"}},composes:["VariantProps"]};const ne={title:"Molecules/FormField",component:s,parameters:{layout:"centered",docs:{description:{component:`
Универсальный компонент поля формы с поддержкой:
- Консистентного оформления label, input и helper text
- Индикаторов обязательных полей
- Состояний ошибки, успеха и описания
- Горизонтальной и вертикальной ориентации
- Полной доступности с ARIA атрибутами
- Интеграции с любыми элементами форм
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { FormField } from '@/components/molecules/FormField';
import { Input } from '@/components/atoms/Input';

// Базовое поле формы
<FormField
  label="Email Address"
  id="email"
  required
  description="Мы никогда не поделимся вашим email"
>
  <Input 
    id="email"
    type="email" 
    placeholder="Введите email"
  />
</FormField>

// Поле с ошибкой
<FormField
  label="Пароль"
  id="password"
  required
  error="Пароль должен содержать минимум 8 символов"
>
  <Input 
    id="password"
    type="password"
    error="Пароль должен содержать минимум 8 символов"
  />
</FormField>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{orientation:{control:{type:"select"},options:["vertical","horizontal"],description:"Ориентация поля (вертикальная или горизонтальная)"},required:{control:{type:"boolean"},description:"Обязательное поле (показывает звездочку)"},hideLabel:{control:{type:"boolean"},description:"Скрыть label визуально (но оставить для скринридеров)"},label:{control:{type:"text"},description:"Текст метки поля"},error:{control:{type:"text"},description:"Сообщение об ошибке"},success:{control:{type:"text"},description:"Сообщение об успехе"},description:{control:{type:"text"},description:"Описание или подсказка"}}},b={args:{label:"Имя пользователя",id:"username",children:e.jsx(a,{id:"username",placeholder:"Введите имя пользователя"})}},x={args:{label:"Email адрес",id:"email",required:!0,children:e.jsx(a,{id:"email",type:"email",placeholder:"user@example.com"})}},y={args:{label:"Пароль",id:"password",required:!0,description:"Пароль должен содержать минимум 8 символов, включая цифры и буквы",children:e.jsx(a,{id:"password",type:"password",placeholder:"Введите пароль"})}},F={args:{label:"Email адрес",id:"email-error",required:!0,error:"Введите корректный email адрес",children:e.jsx(a,{id:"email-error",type:"email",value:"invalid-email",error:"Введите корректный email адрес"})}},g={args:{label:"Имя пользователя",id:"username-success",success:"Имя пользователя доступно",children:e.jsx(a,{id:"username-success",value:"john_doe",success:"Имя пользователя доступно"})}},w={args:{label:"Получать уведомления",id:"notifications",orientation:"horizontal",description:"Получать email уведомления о новых функциях",children:e.jsx("input",{id:"notifications",type:"checkbox",className:"rounded border-gray-300 text-primary focus:ring-primary"})}},j={args:{label:"Поиск",id:"search",hideLabel:!0,children:e.jsx(a,{id:"search",startIcon:e.jsx(f,{name:"fa-solid fa-search"}),placeholder:"Поиск..."})}},I={args:{label:"Поиск пользователей",id:"user-search",description:"Найти пользователя по имени или email",children:e.jsx(a,{id:"user-search",startIcon:e.jsx(f,{name:"fa-solid fa-search"}),placeholder:"Начните вводить имя..."})}},q={render:()=>e.jsxs("div",{className:"space-y-6 w-80",children:[e.jsx(s,{label:"Маленькое поле",id:"small",description:"Компактное поле ввода",children:e.jsx(a,{id:"small",size:"sm",placeholder:"Маленькое поле"})}),e.jsx(s,{label:"Среднее поле",id:"medium",description:"Стандартное поле ввода",children:e.jsx(a,{id:"medium",size:"md",placeholder:"Среднее поле"})}),e.jsx(s,{label:"Большое поле",id:"large",description:"Увеличенное поле ввода",children:e.jsx(a,{id:"large",size:"lg",placeholder:"Большое поле"})})]})},N={render:()=>e.jsxs("div",{className:"space-y-6 w-80",children:[e.jsx(s,{label:"Обычное поле",id:"normal",description:"Поле в обычном состоянии",children:e.jsx(a,{id:"normal",placeholder:"Введите текст"})}),e.jsx(s,{label:"Обязательное поле",id:"required-field",required:!0,description:"Это поле обязательно для заполнения",children:e.jsx(a,{id:"required-field",placeholder:"Обязательное поле"})}),e.jsx(s,{label:"Поле с ошибкой",id:"error-field",required:!0,error:"Это поле обязательно для заполнения",children:e.jsx(a,{id:"error-field",error:"Это поле обязательно для заполнения",placeholder:"Поле с ошибкой"})}),e.jsx(s,{label:"Успешное поле",id:"success-field",success:"Данные сохранены успешно",children:e.jsx(a,{id:"success-field",success:"Данные сохранены успешно",value:"Корректные данные"})})]})},v={render:()=>e.jsxs("div",{className:"space-y-6 w-96",children:[e.jsx(s,{label:"Имя",id:"first-name",required:!0,children:e.jsx(a,{id:"first-name",placeholder:"Введите имя"})}),e.jsx(s,{label:"Фамилия",id:"last-name",required:!0,children:e.jsx(a,{id:"last-name",placeholder:"Введите фамилию"})}),e.jsx(s,{label:"Email адрес",id:"reg-email",required:!0,description:"Мы используем email для входа в систему",children:e.jsx(a,{id:"reg-email",type:"email",startIcon:e.jsx(f,{name:"fa-solid fa-envelope"}),placeholder:"user@example.com"})}),e.jsx(s,{label:"Пароль",id:"reg-password",required:!0,description:"Минимум 8 символов, включая цифры и буквы",children:e.jsx(a,{id:"reg-password",type:"password",startIcon:e.jsx(f,{name:"fa-solid fa-lock"}),placeholder:"Создайте пароль"})}),e.jsx(s,{label:"Согласие на обработку данных",id:"consent",orientation:"horizontal",required:!0,description:"Я согласен на обработку персональных данных",children:e.jsx("input",{id:"consent",type:"checkbox",className:"rounded border-gray-300 text-primary focus:ring-primary"})})]})},L={render:()=>e.jsxs("div",{className:"space-y-6 w-80",children:[e.jsx(s,{label:"Текстовое поле",id:"text-field",children:e.jsx(a,{id:"text-field",type:"text",placeholder:"Введите текст"})}),e.jsx(s,{label:"Числовое поле",id:"number-field",description:"Введите число от 1 до 100",children:e.jsx(a,{id:"number-field",type:"number",min:"1",max:"100",placeholder:"42"})}),e.jsx(s,{label:"Телефон",id:"phone-field",children:e.jsx(a,{id:"phone-field",type:"tel",startIcon:e.jsx(f,{name:"fa-solid fa-phone"}),placeholder:"+7 (999) 123-45-67"})}),e.jsx(s,{label:"Веб-сайт",id:"url-field",children:e.jsx(a,{id:"url-field",type:"url",startIcon:e.jsx(f,{name:"fa-solid fa-globe"}),placeholder:"https://example.com"})}),e.jsx(s,{label:"Дата рождения",id:"date-field",children:e.jsx(a,{id:"date-field",type:"date"})})]})};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Имя пользователя',
    id: 'username',
    children: <Input id="username" placeholder="Введите имя пользователя" />
  }
}`,...b.parameters?.docs?.source},description:{story:"Базовое поле формы",...b.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email адрес',
    id: 'email',
    required: true,
    children: <Input id="email" type="email" placeholder="user@example.com" />
  }
}`,...x.parameters?.docs?.source},description:{story:"Обязательное поле",...x.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Пароль',
    id: 'password',
    required: true,
    description: 'Пароль должен содержать минимум 8 символов, включая цифры и буквы',
    children: <Input id="password" type="password" placeholder="Введите пароль" />
  }
}`,...y.parameters?.docs?.source},description:{story:"Поле с описанием",...y.parameters?.docs?.description}}};F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email адрес',
    id: 'email-error',
    required: true,
    error: 'Введите корректный email адрес',
    children: <Input id="email-error" type="email" value="invalid-email" error="Введите корректный email адрес" />
  }
}`,...F.parameters?.docs?.source},description:{story:"Поле с ошибкой",...F.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Имя пользователя',
    id: 'username-success',
    success: 'Имя пользователя доступно',
    children: <Input id="username-success" value="john_doe" success="Имя пользователя доступно" />
  }
}`,...g.parameters?.docs?.source},description:{story:"Поле с успешным состоянием",...g.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Получать уведомления',
    id: 'notifications',
    orientation: 'horizontal',
    description: 'Получать email уведомления о новых функциях',
    children: <input id="notifications" type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
  }
}`,...w.parameters?.docs?.source},description:{story:"Горизонтальная ориентация",...w.parameters?.docs?.description}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Поиск',
    id: 'search',
    hideLabel: true,
    children: <Input id="search" startIcon={<Icon name="fa-solid fa-search" />} placeholder="Поиск..." />
  }
}`,...j.parameters?.docs?.source},description:{story:"Скрытый label",...j.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Поиск пользователей',
    id: 'user-search',
    description: 'Найти пользователя по имени или email',
    children: <Input id="user-search" startIcon={<Icon name="fa-solid fa-search" />} placeholder="Начните вводить имя..." />
  }
}`,...I.parameters?.docs?.source},description:{story:"Поле с иконкой",...I.parameters?.docs?.description}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-6 w-80">\r
      <FormField label="Маленькое поле" id="small" description="Компактное поле ввода">\r
        <Input id="small" size="sm" placeholder="Маленькое поле" />\r
      </FormField>\r
      \r
      <FormField label="Среднее поле" id="medium" description="Стандартное поле ввода">\r
        <Input id="medium" size="md" placeholder="Среднее поле" />\r
      </FormField>\r
      \r
      <FormField label="Большое поле" id="large" description="Увеличенное поле ввода">\r
        <Input id="large" size="lg" placeholder="Большое поле" />\r
      </FormField>\r
    </div>
}`,...q.parameters?.docs?.source},description:{story:"Различные размеры полей",...q.parameters?.docs?.description}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-6 w-80">\r
      <FormField label="Обычное поле" id="normal" description="Поле в обычном состоянии">\r
        <Input id="normal" placeholder="Введите текст" />\r
      </FormField>\r
      \r
      <FormField label="Обязательное поле" id="required-field" required description="Это поле обязательно для заполнения">\r
        <Input id="required-field" placeholder="Обязательное поле" />\r
      </FormField>\r
      \r
      <FormField label="Поле с ошибкой" id="error-field" required error="Это поле обязательно для заполнения">\r
        <Input id="error-field" error="Это поле обязательно для заполнения" placeholder="Поле с ошибкой" />\r
      </FormField>\r
      \r
      <FormField label="Успешное поле" id="success-field" success="Данные сохранены успешно">\r
        <Input id="success-field" success="Данные сохранены успешно" value="Корректные данные" />\r
      </FormField>\r
    </div>
}`,...N.parameters?.docs?.source},description:{story:"Различные состояния полей",...N.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-6 w-96">\r
      <FormField label="Имя" id="first-name" required>\r
        <Input id="first-name" placeholder="Введите имя" />\r
      </FormField>\r
      \r
      <FormField label="Фамилия" id="last-name" required>\r
        <Input id="last-name" placeholder="Введите фамилию" />\r
      </FormField>\r
      \r
      <FormField label="Email адрес" id="reg-email" required description="Мы используем email для входа в систему">\r
        <Input id="reg-email" type="email" startIcon={<Icon name="fa-solid fa-envelope" />} placeholder="user@example.com" />\r
      </FormField>\r
      \r
      <FormField label="Пароль" id="reg-password" required description="Минимум 8 символов, включая цифры и буквы">\r
        <Input id="reg-password" type="password" startIcon={<Icon name="fa-solid fa-lock" />} placeholder="Создайте пароль" />\r
      </FormField>\r
      \r
      <FormField label="Согласие на обработку данных" id="consent" orientation="horizontal" required description="Я согласен на обработку персональных данных">\r
        <input id="consent" type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />\r
      </FormField>\r
    </div>
}`,...v.parameters?.docs?.source},description:{story:"Форма регистрации",...v.parameters?.docs?.description}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-6 w-80">\r
      <FormField label="Текстовое поле" id="text-field">\r
        <Input id="text-field" type="text" placeholder="Введите текст" />\r
      </FormField>\r
      \r
      <FormField label="Числовое поле" id="number-field" description="Введите число от 1 до 100">\r
        <Input id="number-field" type="number" min="1" max="100" placeholder="42" />\r
      </FormField>\r
      \r
      <FormField label="Телефон" id="phone-field">\r
        <Input id="phone-field" type="tel" startIcon={<Icon name="fa-solid fa-phone" />} placeholder="+7 (999) 123-45-67" />\r
      </FormField>\r
      \r
      <FormField label="Веб-сайт" id="url-field">\r
        <Input id="url-field" type="url" startIcon={<Icon name="fa-solid fa-globe" />} placeholder="https://example.com" />\r
      </FormField>\r
      \r
      <FormField label="Дата рождения" id="date-field">\r
        <Input id="date-field" type="date" />\r
      </FormField>\r
    </div>
}`,...L.parameters?.docs?.source},description:{story:"Различные типы полей",...L.parameters?.docs?.description}}};const de=["Default","Required","WithDescription","WithError","WithSuccess","Horizontal","HiddenLabel","WithIcon","Sizes","States","RegistrationForm","FieldTypes"];export{b as Default,L as FieldTypes,j as HiddenLabel,w as Horizontal,v as RegistrationForm,x as Required,q as Sizes,N as States,y as WithDescription,F as WithError,I as WithIcon,g as WithSuccess,de as __namedExportsOrder,ne as default};
