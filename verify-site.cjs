#!/usr/bin/env node
'use strict';
// Dependency-free, read-only release gate. Run: node verify-site.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const errors=[],warnings=[];const check=(condition,message)=>{if(!condition)errors.push(message)};
const refs=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!/^https?:|^#|^data:/.test(x));
for(const ref of refs){const filename=ref.split('?')[0].split('#')[0];check(fs.existsSync(path.join(root,filename)),'Missing referenced asset: '+ref)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),seen=new Set();
for(const id of ids){check(!seen.has(id),'Duplicate id: '+id);seen.add(id)}
for(const id of ['start-here','dashboard','portfolio','learning-method','modules','skill-map','quiz','daily','site-theme'])check(seen.has(id),'Missing required UI anchor: '+id);
for(const [name,ext] of [['CSS','.css'],['JavaScript','.js']]){const list=refs.filter(x=>x.split('?')[0].endsWith(ext));console.log(name+' assets: '+list.length);if(name==='CSS'&&list.length>12)warnings.push('CSS layering debt: '+list.length+' stylesheets; consolidate only after visual regression baseline')}
for(const ref of refs.filter(x=>x.split('?')[0].endsWith('.js'))){const src=fs.readFileSync(path.join(root,ref.split('?')[0]),'utf8');check(!/\b(?:eval|new Function)\s*\(/.test(src),'Dynamic code execution pattern: '+ref)}
const data=fs.readFileSync(path.join(root,'data.js'),'utf8');
check(data.includes('CLOUD_SA_DATA'),'Learning history source missing');
const completed=/[\"']?completedDays[\"']?\s*:\s*(\d+)/.exec(data);check(!!completed&&Number(completed[1])>=23,'Learning history dropped below established 23 completed days');
const css=refs.filter(x=>x.split('?')[0].endsWith('.css')).map(x=>x.split('?')[0]);
const declarations=new Map();
for(const file of css){const src=fs.readFileSync(path.join(root,file),'utf8');const rules=[...src.matchAll(/([^{}]+)\{([^{}]+)\}/g)];for(const [,selector,body] of rules){const normalized=selector.replace(/\/\*[\s\S]*?\*\//g,'').trim();if(!normalized||normalized.startsWith('@'))continue;const props=[...body.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)].map(m=>m[1]);for(const prop of props){const key=normalized+' | '+prop;const old=declarations.get(key)||new Set();old.add(file);declarations.set(key,old)}}}
const overlap=[...declarations].filter(([,files])=>files.size>1).sort((a,b)=>b[1].size-a[1].size);
console.log('Cross-file exact selector/property overlaps: '+overlap.length);
console.log('Top overlapping declarations:',overlap.slice(0,12).map(([key,files])=>key+' ('+[...files].join(', ')+')').join('\n')||'none');
for(const w of warnings)console.warn('WARN:',w);
if(errors.length){for(const e of errors)console.error('FAIL:',e);process.exitCode=1}else console.log('PASS: asset paths, IDs, key sections, baseline learning history, JS safety heuristic.');
