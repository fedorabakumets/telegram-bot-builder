/** @fileoverview Изолированный замер браузерного пакета Glide со всеми зависимостями, кроме общего React. */
const { build } = require('esbuild');
const { gzipSync } = require('node:zlib');
const fs = require('node:fs');
/** Собирает реальный экспорт компонента, не позволяя удалить его оптимизацией. */
async function main() {
 const result = await build({ stdin: {contents: "export { default } from '@glideapps/glide-data-grid'; import '@glideapps/glide-data-grid/dist/index.css';",resolveDir:process.cwd(),loader:'tsx'}, bundle:true, minify:true,format:'esm',platform:'browser',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},external:['react','react-dom','react/jsx-runtime'],write:false,outdir:'output/glide-measure',metafile:true });
 const files = result.outputFiles.map(f=>({name:f.path.split(/[\\/]/).pop(),bytes:f.contents.length,gzipBytes:gzipSync(f.contents).length}));
 const inputs = Object.keys(result.metafile.inputs);
 const output = {version:JSON.parse(fs.readFileSync('node_modules/@glideapps/glide-data-grid/package.json','utf8')).version,reactExcluded:true,files,dependencyFiles:inputs.length};
 fs.writeFileSync('output/glide-bundle-size.json',JSON.stringify(output,null,2)); console.log(JSON.stringify(output));
}
main();

