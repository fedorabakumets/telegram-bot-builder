import{j as n}from"./jsx-runtime-ikxUOHmY.js";import{r as a}from"./iframe-C_0L0_58.js";import{c as r,a as x}from"./utils-DjgfDMXY.js";const d=x("inline-flex items-center justify-center shrink-0",{variants:{size:{xs:"w-3 h-3",sm:"w-4 h-4",md:"w-5 h-5",lg:"w-6 h-6",xl:"w-8 h-8","2xl":"w-12 h-12"},color:{default:"text-foreground",muted:"text-muted-foreground",primary:"text-primary",secondary:"text-secondary-foreground",success:"text-green-600 dark:text-green-400",warning:"text-yellow-600 dark:text-yellow-400",error:"text-red-600 dark:text-red-400",info:"text-blue-600 dark:text-blue-400"}},defaultVariants:{size:"md",color:"default"}}),f=a.memo(a.forwardRef(({className:s,size:o,color:t,name:m,children:e,decorative:u=!1,"aria-label":p,...i},c)=>{const l=u?{"aria-hidden":!0}:{"aria-label":p,role:"img"};return e?n.jsx("span",{ref:c,className:r(d({size:o,color:t}),s),...l,...i,children:a.isValidElement(e)?a.cloneElement(e,{className:r("w-full h-full",e.props?.className)}):e}):m?n.jsx("span",{ref:c,className:r(d({size:o,color:t}),s),...l,...i,children:n.jsx("i",{className:r(m,"w-full h-full flex items-center justify-center")})}):n.jsx("span",{ref:c,className:r(d({size:o,color:t}),s),...l,...i})}));f.displayName="Icon";f.__docgenInfo={description:`Universal Icon component with support for Font Awesome and custom SVG icons\r
\r
@example\r
\`\`\`tsx\r
// Font Awesome icon\r
<Icon name="fa-solid fa-user" size="lg" color="primary" aria-label="User profile" />\r
\r
// Custom SVG icon\r
<Icon size="md" color="success" aria-label="Success">\r
  <svg viewBox="0 0 24 24" fill="currentColor">\r
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>\r
  </svg>\r
</Icon>\r
\r
// Decorative icon (hidden from screen readers)\r
<Icon name="fa-solid fa-star" decorative />\r
\`\`\``,methods:[],displayName:"Icon",props:{name:{required:!1,tsType:{name:"string"},description:`Icon name for Font Awesome icons (e.g., "fa-solid fa-user")\r
If provided, will render a Font Awesome icon`},children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`Custom SVG element or React component to render\r
Takes precedence over name prop`},"aria-label":{required:!1,tsType:{name:"string"},description:`Accessible label for screen readers\r
Required for icons without text content`},decorative:{required:!1,tsType:{name:"boolean"},description:`Whether the icon is decorative (hidden from screen readers)\r
Use when icon is purely decorative and has accompanying text`,defaultValue:{value:"false",computed:!1}}},composes:["VariantProps"]};export{f as I};
