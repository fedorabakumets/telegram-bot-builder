import{j as r}from"./jsx-runtime-ikxUOHmY.js";import{r as m}from"./iframe-C_0L0_58.js";import{c as w,a as v}from"./utils-DjgfDMXY.js";import"./preload-helper-PPVm8Dsz.js";const u=v("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),e=m.forwardRef(({className:n,variant:o,...i},x)=>r.jsx("div",{ref:x,role:"alert",className:w(u({variant:o}),n),...i}));e.displayName="Alert";const s=m.forwardRef(({className:n,...o},i)=>r.jsx("h5",{ref:i,className:w("mb-1 font-medium leading-none tracking-tight",n),...o}));s.displayName="AlertTitle";const t=m.forwardRef(({className:n,...o},i)=>r.jsx("div",{ref:i,className:w("text-sm [&_p]:leading-relaxed",n),...o}));t.displayName="AlertDescription";e.__docgenInfo={description:"",methods:[],displayName:"Alert"};s.__docgenInfo={description:"",methods:[],displayName:"AlertTitle"};t.__docgenInfo={description:"",methods:[],displayName:"AlertDescription"};const L={title:"UI/Alert",component:e,parameters:{layout:"centered",docs:{description:{component:`
Компонент уведомлений для отображения важных сообщений с поддержкой:
- Различных вариантов (default, destructive)
- Заголовка (AlertTitle)
- Описания (AlertDescription)
- Иконок для визуального усиления
- Семантической разметки с role="alert"

## Использование

\`\`\`tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

<Alert>
  <AlertTitle>Внимание!</AlertTitle>
  <AlertDescription>
    Это важное уведомление для пользователя.
  </AlertDescription>
</Alert>
\`\`\`
        `}}},tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["default","destructive"],description:"Вариант оформления уведомления"}}},l={render:()=>r.jsxs(e,{className:"w-[400px]",children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"})}),r.jsx(s,{children:"Информация"}),r.jsx(t,{children:"Ваши изменения были успешно сохранены в системе."})]})},a={render:()=>r.jsxs(e,{variant:"destructive",className:"w-[400px]",children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"})}),r.jsx(s,{children:"Ошибка!"}),r.jsx(t,{children:"Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз."})]})},c={render:()=>r.jsxs(e,{className:"w-[400px]",children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),r.jsx(t,{children:"Операция выполнена успешно."})]})},d={render:()=>r.jsxs(e,{className:"w-[400px]",children:[r.jsx(s,{children:"Обновление системы"}),r.jsx(t,{children:"Система будет недоступна с 02:00 до 04:00 по московскому времени для планового обновления."})]})},p={render:()=>r.jsxs("div",{className:"space-y-4 w-[400px]",children:[r.jsxs(e,{children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4 text-green-600",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),r.jsx(s,{children:"Успех"}),r.jsx(t,{children:"Файл успешно загружен на сервер."})]}),r.jsxs(e,{children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4 text-yellow-600",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"})}),r.jsx(s,{children:"Предупреждение"}),r.jsx(t,{children:"Ваша подписка истекает через 3 дня."})]}),r.jsxs(e,{variant:"destructive",children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})}),r.jsx(s,{children:"Ошибка"}),r.jsx(t,{children:"Не удалось подключиться к серверу."})]}),r.jsxs(e,{children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4 text-blue-600",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"})}),r.jsx(s,{children:"Информация"}),r.jsx(t,{children:"Новая версия приложения доступна для скачивания."})]})]})},h={render:()=>r.jsxs(e,{className:"w-[500px]",children:[r.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor",className:"h-4 w-4",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"})}),r.jsx(s,{children:"Важное обновление политики конфиденциальности"}),r.jsxs(t,{children:[r.jsx("p",{className:"mb-2",children:"Мы обновили нашу политику конфиденциальности в соответствии с новыми требованиями законодательства. Изменения вступают в силу с 1 января 2024 года."}),r.jsx("p",{children:'Основные изменения касаются обработки персональных данных, сроков их хранения и ваших прав как субъекта данных. Рекомендуем ознакомиться с полным текстом документа в разделе "Правовая информация".'})]})]})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Alert className="w-[400px]">\r
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">\r
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />\r
      </svg>\r
      <AlertTitle>Информация</AlertTitle>\r
      <AlertDescription>\r
        Ваши изменения были успешно сохранены в системе.\r
      </AlertDescription>\r
    </Alert>
}`,...l.parameters?.docs?.source},description:{story:"Базовое уведомление",...l.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <Alert variant="destructive" className="w-[400px]">\r
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">\r
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />\r
      </svg>\r
      <AlertTitle>Ошибка!</AlertTitle>\r
      <AlertDescription>\r
        Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.\r
      </AlertDescription>\r
    </Alert>
}`,...a.parameters?.docs?.source},description:{story:"Деструктивное уведомление для ошибок",...a.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Alert className="w-[400px]">\r
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">\r
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\r
      </svg>\r
      <AlertDescription>\r
        Операция выполнена успешно.\r
      </AlertDescription>\r
    </Alert>
}`,...c.parameters?.docs?.source},description:{story:"Уведомление только с описанием",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Alert className="w-[400px]">\r
      <AlertTitle>Обновление системы</AlertTitle>\r
      <AlertDescription>\r
        Система будет недоступна с 02:00 до 04:00 по московскому времени для планового обновления.\r
      </AlertDescription>\r
    </Alert>
}`,...d.parameters?.docs?.source},description:{story:"Уведомление без иконки",...d.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-[400px]">\r
      {/* Успех */}\r
      <Alert>\r
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-green-600">\r
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\r
        </svg>\r
        <AlertTitle>Успех</AlertTitle>\r
        <AlertDescription>\r
          Файл успешно загружен на сервер.\r
        </AlertDescription>\r
      </Alert>\r
\r
      {/* Предупреждение */}\r
      <Alert>\r
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-yellow-600">\r
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />\r
        </svg>\r
        <AlertTitle>Предупреждение</AlertTitle>\r
        <AlertDescription>\r
          Ваша подписка истекает через 3 дня.\r
        </AlertDescription>\r
      </Alert>\r
\r
      {/* Ошибка */}\r
      <Alert variant="destructive">\r
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">\r
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />\r
        </svg>\r
        <AlertTitle>Ошибка</AlertTitle>\r
        <AlertDescription>\r
          Не удалось подключиться к серверу.\r
        </AlertDescription>\r
      </Alert>\r
\r
      {/* Информация */}\r
      <Alert>\r
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-blue-600">\r
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />\r
        </svg>\r
        <AlertTitle>Информация</AlertTitle>\r
        <AlertDescription>\r
          Новая версия приложения доступна для скачивания.\r
        </AlertDescription>\r
      </Alert>\r
    </div>
}`,...p.parameters?.docs?.source},description:{story:"Различные типы уведомлений",...p.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Alert className="w-[500px]">\r
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">\r
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />\r
      </svg>\r
      <AlertTitle>Важное обновление политики конфиденциальности</AlertTitle>\r
      <AlertDescription>\r
        <p className="mb-2">\r
          Мы обновили нашу политику конфиденциальности в соответствии с новыми требованиями законодательства. \r
          Изменения вступают в силу с 1 января 2024 года.\r
        </p>\r
        <p>\r
          Основные изменения касаются обработки персональных данных, сроков их хранения и ваших прав как субъекта данных. \r
          Рекомендуем ознакомиться с полным текстом документа в разделе "Правовая информация".\r
        </p>\r
      </AlertDescription>\r
    </Alert>
}`,...h.parameters?.docs?.source},description:{story:"Длинное уведомление с большим количеством текста",...h.parameters?.docs?.description}}};const f=["Default","Destructive","DescriptionOnly","WithoutIcon","Types","LongContent"];export{l as Default,c as DescriptionOnly,a as Destructive,h as LongContent,p as Types,d as WithoutIcon,f as __namedExportsOrder,L as default};
