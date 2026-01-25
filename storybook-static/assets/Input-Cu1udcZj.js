import{j as a}from"./jsx-runtime-ikxUOHmY.js";import{r as i}from"./iframe-C_0L0_58.js";import{c as x,a as I}from"./utils-DjgfDMXY.js";const w=I("flex w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",{variants:{variant:{default:"border-input",error:"border-red-500 focus-visible:ring-red-500",success:"border-green-500 focus-visible:ring-green-500"},size:{sm:"h-8 px-2 py-1 text-xs",md:"h-10 px-3 py-2",lg:"h-12 px-4 py-3 text-base"}},defaultVariants:{variant:"default",size:"md"}}),N=(e,t)=>!(e.variant!==t.variant||e.size!==t.size||e.error!==t.error||e.success!==t.success||e.loading!==t.loading||e.disabled!==t.disabled||e.className!==t.className||e.value!==t.value||e.placeholder!==t.placeholder||e.type!==t.type||e.onChange!==t.onChange||e.onFocus!==t.onFocus||e.onBlur!==t.onBlur||e.startIcon!==t.startIcon||e.endIcon!==t.endIcon),y=i.memo(()=>a.jsxs("svg",{className:"animate-spin h-4 w-4 text-muted-foreground",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[a.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),a.jsx("path",{className:"opacity-75",fill:"currentColor",d:"m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}));y.displayName="InputSpinner";const b=i.memo(i.forwardRef(({className:e,variant:t,size:l,error:c,success:u,startIcon:r,endIcon:s,loading:n=!1,disabled:d,type:m="text",...f},p)=>{const h=i.useMemo(()=>c?"error":u?"success":t,[c,u,t]),o=r||s||n,g=i.useMemo(()=>a.jsx("input",{type:m,className:x(w({variant:h,size:l}),o&&"pl-10 pr-10",r&&!s&&!n&&"pr-3",!r&&(s||n)&&"pl-3",e),ref:p,disabled:d||n,...f}),[h,l,o,r,s,n,e,m,d,f,p]);return o?a.jsxs("div",{className:"relative",children:[r&&a.jsx("div",{className:"absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",children:r}),g,a.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",children:n?a.jsx(y,{}):s})]}):g}),N);b.displayName="Input";b.__docgenInfo={description:`Enhanced Input component with performance optimizations and extended functionality\r
\r
Features:\r
- Multiple variants (default, error, success) and sizes\r
- Icon support (start and end positions)\r
- Loading state with spinner\r
- Error and success message integration\r
- Performance optimized with React.memo and custom prop comparison\r
- Full accessibility support\r
\r
@example\r
\`\`\`tsx\r
// Basic input\r
<Input placeholder="Enter your name" />\r
\r
// Input with error\r
<Input error="This field is required" placeholder="Email" />\r
\r
// Input with icons\r
<Input \r
  startIcon={<Icon name="fa-solid fa-search" />}\r
  placeholder="Search..."\r
/>\r
\r
// Loading input\r
<Input loading placeholder="Searching..." />\r
\`\`\``,methods:[],displayName:"Input",props:{error:{required:!1,tsType:{name:"string"},description:`Error message to display\r
When provided, automatically sets variant to "error"`},success:{required:!1,tsType:{name:"string"},description:`Success message to display\r
When provided, automatically sets variant to "success"`},startIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display at the start of the input"},endIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display at the end of the input"},loading:{required:!1,tsType:{name:"boolean"},description:"Whether the input is in a loading state",defaultValue:{value:"false",computed:!1}},type:{defaultValue:{value:'"text"',computed:!1},required:!1}},composes:["Omit","VariantProps"]};export{b as I};
