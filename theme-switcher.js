/* Cloud × AI appearance preferences. Presentation only; learning records are untouched. */
(()=>{'use strict';
 const allowed=new Set(['graphite','pearl','ocean','titanium','apple-frost','pixel-dynamic','future-titanium','ai-aurora']);
 const key='cloud-ai-site-theme-v1';
 const root=document.documentElement;
 const select=document.getElementById('site-theme');
 let chosen='future-titanium';
 try{const saved=localStorage.getItem(key);if(allowed.has(saved))chosen=saved}catch(_){}
 function apply(theme,persist){
   if(!allowed.has(theme))return;
   root.setAttribute('data-site-theme',theme);
   if(select)select.value=theme;
   const meta=document.querySelector('meta[name="theme-color"]');
   if(meta)meta.setAttribute('content',({graphite:'#11151c',pearl:'#f4f6fa',ocean:'#0b1728',titanium:'#191a1d','apple-frost':'#f5f7fa','pixel-dynamic':'#f2f0f8','future-titanium':'#181b20','ai-aurora':'#0b1724'})[theme]);
   if(persist)try{localStorage.setItem(key,theme)}catch(_){}
 }
 apply(chosen,false);
 if(select)select.addEventListener('change',()=>apply(select.value,true));
})();