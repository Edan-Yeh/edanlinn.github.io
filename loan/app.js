function moduleIcon(name){const paths={'知識庫':'M4 4h6a3 3 0 0 1 2 2 3 3 0 0 1 2-2h6v15h-6a3 3 0 0 0-2 2 3 3 0 0 0-2-2H4zM12 6v15','SSR':'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5','FSD':'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5','需求清單':'M4 4h16v16H4zM4 9h16M9 4v16M4 14h16','L6':'m5 7 2 2 4-4M13 7h7M5 15l2 2 4-4M13 15h7','L7':'M4 6h5v5H4zM15 13h5v5h-5zM9 8h8v5M6 11v5h9','撰寫爭議':'M4 4h16v13H9l-5 4zM12 7v4M12 14h.01','更新紀錄':'M4 11a8 8 0 1 1 2 7M4 4v7h7M12 7v5l3 2'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths['知識庫'])+'"/></svg>'; }

let data,documents={},records=[],active='全部',selected=null,view='work',category='知識庫',manifest={},page=0;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cls=s=>s==='已取消'?'cancel':s==='有效'?'valid':s==='移交其他主題'?'transfer':'pending';
const list=xs=>'<ul>'+xs.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
const section=(title,body)=>'<section class="section"><h3>'+esc(title)+'</h3>'+body+'</section>';
async function decodeCatalog(r){const x=await r.json();if(Array.isArray(x))return x;if(x.encoding!=='gzip-base64')throw Error('未知案例格式');const bytes=Uint8Array.from(atob(x.payload),c=>c.charCodeAt(0));return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());}
async function init(){
 const responses=await Promise.all([fetch('./data.json',{cache:'no-store'}),fetch('./documents.json',{cache:'no-store'}),fetch('./modules.json',{cache:'no-store'})]);if(responses.some(r=>!r.ok))throw Error('資料讀取失敗');[data,documents,manifest]=await Promise.all(responses.map(r=>r.json()));records=data.records.map(r=>({...r}));rememberKnowledge(records);const ur=await fetch('./knowledge-updates.json',{cache:'no-store'});if(!ur.ok)throw Error('更新紀錄載入失敗');knowledgeUpdates=await ur.json();applyPublishedKnowledge();
 const paths=Object.values(manifest.datasets).flat();const imports=await Promise.all(paths.map(async p=>{const r=await fetch('./'+p,{cache:'no-store'});if(!r.ok)throw Error('案例檔載入失敗');return decodeCatalog(r)}));records=records.concat(imports.flat().map(importRecord));
 manifest.classification.push({id:'待分類',business:'其他／CR',process:'原圖未涵蓋，歸屬待確認',ssr:[],note:'保留原始主題代碼；不自行指定放_XX。'});
 for(const r of records){const codes=new Set((JSON.stringify(r.requirement_ids||[])+' '+(r.document_key||'')+' '+(r.imported?.code||'')).match(/B2-\d{3}/g)||[]);if(!r.groups)r.groups=manifest.classification.filter(g=>g.ssr.some(c=>codes.has(c))).map(g=>g.id);if(r.imported)r.related_ids=[...codes].flatMap(c=>['LN-DOC-SSR-'+c,'LN-DOC-FSD-'+c]).filter(id=>data.records.some(x=>x.id===id));r.search_text=(r.imported?[r.imported.key,r.title,r.imported.source,r.imported.requirement,r.imported.ticket,...r.imported.fields.map(f=>f.value)].join('\n'):JSON.stringify(r)).toLowerCase();}
 $('#group').innerHTML='<option value="">全部流程分類</option>'+manifest.classification.map(g=>'<option value="'+g.id+'">'+esc(g.id+' · '+g.business+' · '+g.process)+'</option>').join('');$('#group').onchange=()=>{page=0;selected=null;render()};
 records.forEach(r=>{if(!r.groups?.length)r.groups=['待分類']});
 $('#updated').textContent='介面 2026-10-06 · 資料 '+manifest.updated_at.slice(0,16).replace('T',' ');$('#coverage').textContent=manifest.scope_note;
 for(const [id,values] of [['topic',[...new Set(records.map(r=>r.topic))]],['source',[...new Set(records.flatMap(r=>r.source_types||[r.source_type]))]]]){
  $( '#'+id).innerHTML='<option value="">全部'+(id==='topic'?'主題':'來源')+'</option>'+values.map(v=>'<option>'+esc(v)+'</option>').join('');
  $('#'+id).onchange=()=>{selected=null;render()};
 }
 const hash=decodeURIComponent(location.hash.slice(1));if(records.some(r=>r.id===hash))selected=hash;
 publishedRecords=records.slice();applyLocalKnowledge();if(selected){category='全部';}drawFilters();drawCategories();render();
}
function importRecord(c){return {id:c.id,title:c.key+'｜'+c.title,topic:c.group||c.code,category:c.kind==='requirements'?'需求清單':c.kind.toUpperCase(),plain_language:c.title,goal:c.title,trigger:c.action||'依原始案例',result:c.expected||'來源未填寫預期結果',conditions:[],exceptions:[],codes:[],currency:[],rule_status:c.version_status==='已取代'?'已取代':'歷史參考',evidence_status:'待確認',source_type:'其他待註明：'+(c.kind==='requirements'?'需求清單原檔':'測試案例原檔'),sources:[{document:c.source,location:c.sheet+' 第'+c.row+'列'}],requirement_ids:c.kind==='requirements'?[c.key]:c.requirement?[c.requirement]:[],l6_ids:c.kind!=='requirements'?[c.key]:[],product:c.group||c.code,system:'CTBC／TCS BaNCS',period:'原檔版本；執行狀態請回查測試平台',updated_at:manifest.updated_at,verification:'原始列完整轉錄；未逐條重新驗收規則與來源',change_summary:'完整案例與需求列匯入',sync_status:'網站索引更新；原檔未修改',notes:[c.key_derived?'Key原欄為公式或空值；網站依原檔L3分類及情境流水號產生查詢索引，未改寫原檔。':'情境編號沿用原檔',c.status],related_ids:[],groups:c.groups,imported:c};}
function drawCategories(){
 const modules=['知識庫','SSR','FSD','需求清單','L6','L7','撰寫爭議','更新紀錄','全部'];
 $('#categories').innerHTML=modules.map(x=>'<button class="chip '+(x===category?'active':'')+'" data-category="'+esc(x)+'">'+esc(x)+'</button>').join('');
 $('#module-nav').innerHTML=modules.filter(x=>x!=='全部').map(x=>'<a href="#module-'+encodeURIComponent(x)+'" class="side-link '+(x===category?'active':'')+'" data-module="'+esc(x)+'">'+moduleIcon(x)+'<span>'+esc(x)+'</span></a>').join('')+'<a class="side-link" href="./challenge.html">'+moduleIcon('L6')+'<span>業務知識挑戰</span></a>';
 document.querySelectorAll('[data-category],[data-module]').forEach(b=>b.onclick=e=>{e.preventDefault();setModule(b.dataset.category||b.dataset.module)});
}
function setModule(x){category=x;page=0;selected=null;active='全部';$('#q').value='';$('#topic').value='';$('#source').value='';drawFilters();drawCategories();render();}
function inCategory(r){return category==='全部'||(category==='知識庫'&&!r.imported&&!r.document_key)||(['SSR','FSD'].includes(category)&&r.document_key?.startsWith(category))||(category==='L6'&&r.category==='L6')||(category==='L7'&&r.category==='L7')||(category==='撰寫爭議'&&r.category==='L6案例依據')||r.category===category;}
function drawFilters(){
 $('#filters').innerHTML=['全部','有效','已取消','移交其他主題','歷史參考','待確認／衝突'].map(x=>'<button class="chip '+(x===active?'active':'')+'" data-f="'+x+'">'+x+'</button>').join('');
 document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{active=b.dataset.f;page=0;selected=null;drawFilters();render()});
}
function filtered(){
 const q=$('#q').value.trim().toLowerCase(),topic=$('#topic').value,source=$('#source').value,group=$('#group').value;
 const norm=s=>s.toLowerCase().replace(/[\s_-]/g,'');
 const exactScenario=/^放[\s_-]*\d+[\s_-]+\d+(?:[\s_-]+\d+)*$/.test(q)&&records.some(r=>norm(r.imported?.key||'')===norm(q));
 return records.filter(r=>inCategory(r)&&(!group||r.groups?.includes(group))&&(active==='全部'||r.rule_status===active||(active==='待確認／衝突'&&['待確認','衝突','待後續定案'].includes(r.evidence_status)))&&(!topic||r.topic===topic)&&(!source||(r.source_types||[r.source_type]).includes(source))&&(!q||(exactScenario?(norm(r.imported?.key||'')===norm(q)||(!r.imported&&r.l6_ids?.some(id=>norm(id)===norm(q)))):(r.search_text.includes(q)||(r.imported?.key&&norm(r.imported.key).includes(norm(q)))||(r.document_key&&documents[r.document_key]?.text.toLowerCase().includes(q)))))).sort((a,b)=>Number(norm(b.imported?.key||'')===norm(q)&&!!q)-Number(norm(a.imported?.key||'')===norm(q)&&!!q));
}
function render(){
 renderWorkspaceTools();document.querySelector('.layout').classList.toggle('sheet-layout',category==='需求清單');
 $('#module-title').textContent=category==='全部'?'全部內容':category;
 if(category==='更新紀錄'){renderUpdates();return;}
 const rs=filtered();if(category==='需求清單')rs.sort((a,b)=>String(a.imported[reqSort.column]||'').localeCompare(String(b.imported[reqSort.column]||''),'zh-Hant',{numeric:true})*reqSort.direction);if(!rs.some(r=>r.id===selected))selected=rs[0]?.id||null;
 $('#summary').innerHTML=[['L6案例',manifest.counts.l6],['L7步驟列',manifest.counts.l7],['需求清單列',manifest.counts.requirements],['SSR／FSD文件',Object.keys(documents).length]].map(([a,b])=>'<div class="metric"><i class="metric-icon" aria-hidden="true">'+moduleIcon(a==='L6案例'?'L6':a==='L7步驟列'?'L7':a==='需求清單列'?'需求清單':'SSR')+'</i><span>'+a+'</span><strong>'+b.toLocaleString()+'</strong><small>已收錄 · 可查詢追溯</small></div>').join('');
 const totalPages=Math.ceil(rs.length/100);page=Math.min(page,Math.max(0,totalPages-1));
 if(!selected||!rs.some(r=>r.id===selected)||(!$('#q').value&&page&&!rs.slice(page*100,(page+1)*100).some(r=>r.id===selected)))selected=rs[page*100]?.id||null;
 $('#list').innerHTML=rs.length?rs.slice(page*100,(page+1)*100).map(r=>'<button class="item '+(r.id===selected?'active':'')+'" data-id="'+esc(r.id)+'"><div class="item-id">'+esc(r.imported?.key||r.id)+' · '+esc(r.category)+(r.imported?.kind==='l7'?' · '+esc(r.imported.action):'')+'</div><div class="item-title">'+esc(r.title)+'</div><div class="tags"><span class="tag '+cls(r.rule_status)+'">'+esc(r.rule_status)+'</span><span class="tag">'+esc(r.evidence_status)+'</span><span class="tag">'+esc(r.topic)+'</span></div></button>').join(''):'<div class="empty">'+(category==='L6'||category==='L7'?'此分類尚未取得原始案例檔；請見更新紀錄的來源範圍。':'找不到符合條件的內容')+'</div>';
 $('#pagination').innerHTML=rs.length>100?'<button class="chip" id="prev-page" '+(!page?'disabled':'')+'>上一頁</button><span>第 '+(page+1)+'／'+totalPages+' 頁 · 每頁100筆</span><button class="chip" id="next-page" '+(page+1>=totalPages?'disabled':'')+'>下一頁</button>':'';
 if($('#prev-page')){$('#prev-page').onclick=()=>{page--;selected=null;render()};$('#next-page').onclick=()=>{page++;selected=null;render()};}
 if(category==='需求清單')renderRequirementTable(rs.slice(page*100,(page+1)*100));
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>show(b.dataset.id));$('#result-count').textContent=rs.length+' 筆結果';
 if(selected)show(selected);else $('#detail').innerHTML='<div class="empty">沒有符合條件的知識，請調整搜尋或篩選。</div>';
}
function show(id){
 selected=id;const r=records.find(x=>x.id===id);if(!r)return;history.replaceState(null,'','#'+encodeURIComponent(id));
 document.querySelectorAll('[data-id]').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
 const kv=rows=>'<div class="kv">'+rows.map(([a,b])=>'<div class="k">'+esc(a)+'</div><div>'+esc(b)+'</div>').join('')+'</div>';
 const provenance=section('來源與追溯',r.sources.map(s=>'<div class="source"><b>'+esc(s.document)+'</b>'+esc(s.location)+(s.url&&/^https:\/\//.test(s.url)?'<br><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">閱讀官方來源 ↗</a>':'')+(s.retrieved_at?'<br>查核日期：'+esc(s.retrieved_at.slice(0,10)):'')+'</div>').join('')+kv([['本次核讀',r.verification],['Requirement',r.requirement_ids?.join('、')||'尚未核實對應；不代表不存在'],['L6',r.l6_ids?.join('、')||'尚未核實對應；不代表不存在']]));
 let body='';
 if(view==='learn'){
  body=section('白話理解','<p>'+esc(r.plain_language)+'</p>')+section('條件判斷',kv([['什麼時候',r.trigger],['需要條件',r.conditions.join('；')],['得到結果',r.result],['例外／邊界',r.exceptions?.join('；')||'來源未載明']]))+section('易錯觀念與待確認',list(r.notes||[]))+provenance;
 }else if(view==='review'){
  body=section('本次變更',kv([['更新時間',r.updated_at],['變更摘要',r.change_summary],['原狀態',r.legacy_rule_status||'未改規則狀態／新增項目'],['同步狀態',r.sync_status],['相關知識',r.related_ids?.join('、')||'—']]))+section('複核事項',list(r.notes||[]))+provenance;
 }else{
  body=section('條件與結果',kv([['業務目的',r.goal],['觸發事件',r.trigger],['處理結果',r.result],['代碼',r.codes?.join('、')||'—'],['適用產品',r.product],['幣別',r.currency?.join('、')||'来源未限定／未確認'],['系統',r.system],['適用期間',r.period]]))+section('適用條件',list(r.conditions))+section('例外與邊界',list(r.exceptions||[]))+provenance+section('易錯觀念與待確認',list(r.notes||[]));
 }
 let appendix='';
 if(r.imported){const c=r.imported;const matches=records.filter(x=>x.imported&&x.imported.kind!==c.kind&&((c.kind==='requirements'&&x.imported.requirement?.includes(c.key))||(c.kind!=='requirements'&&(x.imported.key===c.key||(x.imported.kind==='requirements'&&c.requirement?.includes(x.imported.key))))));const issue=records.filter(x=>x.case&&x.l6_ids?.includes(c.key));appendix=section(c.kind==='requirements'?'需求原始欄位':'測試案例原始欄位',kv([['情境／需求編號',c.key],['來源版本',c.source],['工作表／列',c.sheet+'／'+c.row],['Requirement',c.requirement||'來源未填寫'],['操作步驟',c.action||'依L6情境'],['輸入／前置案例',c.input||'請見完整原始欄位'],['預期結果',c.expected||'來源未填寫'],['編號取得方式',c.key_derived?'依原檔L3分類及流水號產生查詢索引；Key欄原公式保留下方':'原檔實體編號']]))+section('跨模組追溯',matches.concat(issue).slice(0,80).map(x=>'<p><a href="#'+encodeURIComponent(x.id)+'">'+esc(x.category+' · '+(x.imported?.key||x.title)+(x.imported?.kind==='requirements'?' · '+x.imported.version_status+' · '+x.imported.source:''))+'</a></p>').join('')||'<p>未取得對應的原始案例／Requirement。</p>')+section('完整非空欄位','<details><summary>展開 '+c.fields.length+' 個原始欄位（含 Not Apply 與原公式）</summary>'+kv(c.fields.map(f=>[f.column+' · '+f.label,f.value+(f.cache_missing?'\n（原公式沒有快取值，未代算）':'')]))+'</details>');}
 if(r.case){const c=r.case;appendix=section('L6撰寫與依據',kv([['Requirement實體對應',c.trace_verified?'編號對應已核實；業務覆蓋仍依下列判斷':'對應待確認'],['一致性',c.comparison_status],['Requirement內容',c.requirement_description],['最終方案／comply',String(c.solution||'待確認')+'／'+String(c.requirement_comply||'待確認')],['L6實體情境',c.scenario],['L6預期結果',c.expected||'來源未填寫'],['關鍵公式／數值',c.formula],['SSR依據',c.ssr_evidence],['FSD／其他依據',c.fsd_evidence],['判斷理由',c.reason],['原L6待確認內容',c.original_notes||'—']]))}
 if(r.document_key&&documents[r.document_key]){const d=documents[r.document_key],q=$('#q').value.trim();let lines=d.text.split('\n');if(q){const hits=lines.map((t,i)=>t.toLowerCase().includes(q.toLowerCase())?i:-1).filter(i=>i>=0);if(hits.length)appendix+=section('原文搜尋命中',hits.slice(0,12).map(i=>'<div class="source">'+esc(lines.slice(Math.max(0,i-1),i+3).join('\n'))+'</div>').join(''));}appendix+=section('收錄文件文字','<p>'+esc(d.extraction_note)+'</p><details><summary>展開 '+esc(d.kind)+' '+esc(d.version)+' 收錄文字</summary><pre class="document-text">'+esc(d.text)+'</pre></details>');}
 if(r.related_ids?.length)appendix+=section('相關知識與文件',r.related_ids.filter(id=>records.some(x=>x.id===id)).map(id=>'<p><a href="#'+encodeURIComponent(id)+'">'+esc(records.find(x=>x.id===id).title)+'</a></p>').join(''));
 if(r.document_key&&documents[r.document_key]){renderDocumentReader(r,body);return;}
 $('#detail').innerHTML='<div class="item-id">'+esc(r.id)+' · '+esc(r.topic)+' · '+esc(r.category)+'</div><h2>'+esc(r.title)+'</h2><div class="tags"><span class="tag '+cls(r.rule_status)+'">規則：'+esc(r.rule_status)+'</span><span class="tag">確認：'+esc(r.evidence_status)+'</span><span class="tag">'+esc(r.source_type)+'</span></div><p class="lead">'+esc(r.plain_language)+'</p>'+appendix+body;
 if(!r.imported&&!r.document_key&&!r.case)renderKnowledgeActions(r);
}
function renderUpdates(){
 $('#result-count').textContent=manifest.sources.length+' 份匯入來源';$('#pagination').innerHTML='';$('#list').innerHTML=manifest.classification.map(g=>{const l6=records.filter(r=>r.category==='L6'&&r.groups.includes(g.id)).length,l7=records.filter(r=>r.category==='L7'&&r.groups.includes(g.id)).length;return '<div class="source"><b>'+esc(g.id+' · '+g.process)+'</b>L6 '+l6+' 筆 · L7 '+l7+' 步驟列<br>'+esc(g.ssr.join('、'))+(l6===0?'\nL6缺來源':'')+(l7===0?'\nL7缺來源':'')+'</div>'}).join('');$('#detail').innerHTML='<h2>來源與持續更新</h2><p>'+esc(manifest.scope_note)+'</p><p>原檔新增或修訂後，依來源版本、檔案SHA-256與情境編號比對。更新保留原編號、版本與待確認標示，不自行補造缺少的L6／L7。</p>'+section('圖片流程分類',manifest.classification.map(g=>'<div class="source"><b>'+esc(g.id+' · '+g.business)+'</b>'+esc(g.process)+'<br>'+esc(g.ssr.join('、'))+'<br>'+esc(g.note)+'</div>').join(''))+section('本次來源盤點',manifest.sources.map(s=>'<div class="source"><b>'+esc(s.name)+'</b>'+esc(s.kind.toUpperCase())+' · '+s.count+' 列\n匯入 '+esc(s.imported_at)+'\nSHA-256 '+esc(s.sha256)+'</div>').join(''));}
$('#q').addEventListener('input',()=>{page=0;selected=null;if(/^放[\s_-]*\d+[\s_-]+\d+/i.test($('#q').value.trim())){category='全部';drawCategories()}render()});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));if(selected)show(selected)});
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(records.some(r=>r.id===id)){active='全部';category='全部';$('#q').value='';$('#topic').value='';$('#source').value='';$('#group').value='';selected=id;page=0;drawFilters();drawCategories();render()}});
init().catch(e=>$('#detail').innerHTML='<div class="empty">資料載入失敗：'+esc(e.message)+'。請重新整理。</div>');

