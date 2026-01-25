import{j as t}from"./jsx-runtime-ikxUOHmY.js";import{r as a}from"./iframe-C_0L0_58.js";import{S as b}from"./index-BMwarh5Z.js";import{c as y,a as v}from"./utils-DjgfDMXY.js";const x=v("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{primary:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{sm:"h-9 rounded-md px-3",md:"h-10 px-4 py-2",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"primary",size:"md"}}),w=(e,n)=>!(e.variant!==n.variant||e.size!==n.size||e.asChild!==n.asChild||e.loading!==n.loading||e.disabled!==n.disabled||e.className!==n.className||e.children!==n.children||e.onClick!==n.onClick||e.icon!==n.icon||e.iconRight!==n.iconRight),c=a.memo(()=>t.jsxs("svg",{className:"animate-spin h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[t.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),t.jsx("path",{className:"opacity-75",fill:"currentColor",d:"m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}));c.displayName="LoadingSpinner";const d=a.memo(a.forwardRef(({className:e,variant:n,size:l,asChild:u=!1,loading:r=!1,icon:o,iconRight:i,disabled:m,children:s,...f},p)=>{const h=u?b:"button",g=a.useMemo(()=>t.jsxs(t.Fragment,{children:[r&&t.jsx(c,{}),!r&&o&&o,s,!r&&i&&i]}),[r,o,i,s]);return t.jsx(h,{className:y(x({variant:n,size:l,className:e})),ref:p,disabled:m||r,...f,children:g})}),w);d.displayName="Button";d.__docgenInfo={description:`Enhanced Button component with performance optimizations and extended functionality\r
\r
Features:\r
- Multiple variants and sizes from design system\r
- Loading state with spinner\r
- Icon support (before and after text)\r
- Polymorphic rendering via asChild prop\r
- Performance optimized with React.memo and custom prop comparison\r
- Full accessibility support\r
\r
@example\r
\`\`\`tsx\r
// Basic button\r
<Button variant="primary" size="md">\r
  Click me\r
</Button>\r
\r
// Button with icon\r
<Button icon={<Icon name="fa-solid fa-plus" />}>\r
  Add Item\r
</Button>\r
\r
// Loading button\r
<Button loading disabled>\r
  Saving...\r
</Button>\r
\r
// Render as link\r
<Button asChild>\r
  <a href="/profile">Go to Profile</a>\r
</Button>\r
\`\`\``,methods:[],displayName:"Button",props:{asChild:{required:!1,tsType:{name:"boolean"},description:`Render as a different element or component\r
Useful for rendering buttons as links or other interactive elements`,defaultValue:{value:"false",computed:!1}},loading:{required:!1,tsType:{name:"boolean"},description:`Show loading state with spinner\r
Disables the button and shows loading indicator`,defaultValue:{value:"false",computed:!1}},icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`Icon to display before the button text\r
Can be any React node (typically an Icon component)`},iconRight:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`Icon to display after the button text\r
Can be any React node (typically an Icon component)`}},composes:["VariantProps"]};export{d as B};
