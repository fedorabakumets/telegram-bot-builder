import{r as e}from"./iframe-C_0L0_58.js";import{c as g,a as c}from"./utils-DjgfDMXY.js";const y=c("text-foreground",{variants:{variant:{h1:"scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",h2:"scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",h3:"scroll-m-20 text-2xl font-semibold tracking-tight",h4:"scroll-m-20 text-xl font-semibold tracking-tight",h5:"scroll-m-20 text-lg font-semibold tracking-tight",h6:"scroll-m-20 text-base font-semibold tracking-tight",body:"leading-7","body-large":"text-lg leading-7","body-small":"text-sm leading-6",label:"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",caption:"text-xs text-muted-foreground leading-4",overline:"text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-4",code:"relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold","code-block":"font-mono text-sm leading-6",lead:"text-xl text-muted-foreground",large:"text-lg font-semibold",small:"text-sm font-medium leading-none",muted:"text-sm text-muted-foreground"},weight:{thin:"font-thin",extralight:"font-extralight",light:"font-light",normal:"font-normal",medium:"font-medium",semibold:"font-semibold",bold:"font-bold",extrabold:"font-extrabold",black:"font-black"},align:{left:"text-left",center:"text-center",right:"text-right",justify:"text-justify"},color:{default:"text-foreground",muted:"text-muted-foreground",primary:"text-primary",secondary:"text-secondary-foreground",success:"text-green-600 dark:text-green-400",warning:"text-yellow-600 dark:text-yellow-400",error:"text-red-600 dark:text-red-400",info:"text-blue-600 dark:text-blue-400"}},defaultVariants:{variant:"body",color:"default"}}),h={h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",body:"p","body-large":"p","body-small":"p",label:"span",caption:"span",overline:"span",code:"code","code-block":"pre",lead:"p",large:"div",small:"small",muted:"p"},r=e.memo(e.forwardRef(({className:o,variant:t="body",weight:a,align:n,color:l,as:i,children:d,...s},p)=>{const m=i||h[t||"body"]||"div";return e.createElement(m,{ref:p,className:g(y({variant:t,weight:a,align:n,color:l}),o),...s},d)}));r.displayName="Typography";r.__docgenInfo={description:`Typography component for consistent text styling across the application\r
\r
Automatically selects semantic HTML elements based on variant, but allows override via 'as' prop.\r
Supports all typography scales from the design system with proper accessibility.\r
\r
@example\r
\`\`\`tsx\r
// Semantic headings\r
<Typography variant="h1">Main Page Title</Typography>\r
<Typography variant="h2">Section Heading</Typography>\r
\r
// Body text with custom styling\r
<Typography variant="body" color="muted" align="center">\r
  This is centered, muted body text\r
</Typography>\r
\r
// Override semantic element while keeping visual style\r
<Typography variant="h2" as="h1">\r
  Visually h2, semantically h1\r
</Typography>\r
\r
// UI elements\r
<Typography variant="label">Form Label</Typography>\r
<Typography variant="caption">Helper text</Typography>\r
\r
// Code\r
<Typography variant="code">inline code</Typography>\r
\`\`\``,methods:[],displayName:"Typography",props:{as:{required:!1,tsType:{name:"JSX.IntrinsicElements"},description:`Override the default HTML element for this variant\r
Useful for semantic HTML while maintaining visual styling`},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Content to render inside the typography element"},variant:{defaultValue:{value:'"body"',computed:!1},required:!1}},composes:["Omit","VariantProps"]};export{r as T};
