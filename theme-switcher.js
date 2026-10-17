/* Cloud × AI appearance preferences. Presentation only; learning records are untouched. */
(()=>{'use strict';
 const allowed=new Set(['graphite','pearl','ocean','titanium']);
 const key='cloud-ai-site-theme-v1';
 const root=document.documentElement;
 const select=document.getElementById('site-theme');
 let chosen='graphite';
 try{const saved=localStorage.getItem(key);if(allowed.has(saved))chosen=saved}catch(_){}
 function apply(theme,persist){
   if(!allowed.has(theme))return;
   root.setAttribute('data-site-theme',theme);
   if(select)select.value=theme;
   const meta=document.querySelector('meta[name="theme-color"]');
   if(meta)meta.setAttribute('content',({graphite:'#11151c',pearl:'#f4f6fa',ocean:'#0b1728',titanium:'#191a1d'})[theme]);
   if(persist)try{localStorage.setItem(key,theme)}catch(_){}
 }
 apply(chosen,false);
 if(select)select.addEventListener('change',()=>apply(select.value,true));
})();