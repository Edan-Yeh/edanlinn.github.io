const d = window.CLOUD_SA_DATA;
const avg = Math.round(d.scores.reduce((a,b)=>a+b.score,0)/d.scores.length);
document.querySelector('#completed').textContent=d.completedDays;
document.querySelector('#avg').textContent=avg;
document.querySelector('#track').textContent=d.currentTrack;
document.querySelector('#updated').textContent=d.updatedAt;

const roadmap=document.querySelector('#roadmap');
roadmap.innerHTML=d.roadmap.map((x,i)=>`<span class="${i<5?'done':''}">${x}</span>`).join('');

const moduleConfig={
  'skill-map':{code:'MAP',title:'能力地圖',desc:'掌握範圍、易混淆概念與架構思維'},
  'examples':{code:'CASE',title:'實際案例',desc:'用銀行與企業情境對應 AWS 服務'},
  'glossary':{code:'DOC',title:'名詞搜尋',desc:'快速查定義、例子與容易混淆'},
  'quiz':{code:'QUIZ',title:'累積題庫',desc:'隨機練習、錯題複習與解析'},
  'daily':{code:'DAY',title:'每日訓練紀錄',desc:'每日分數、錯題與必背觀念'}
};
const moduleStateKey='edan-cloud-sa-module-state-v1';
const sections=[...document.querySelectorAll('[data-module-section]')];

function decorateModules(){
  sections.forEach(section=>{
    const id=section.dataset.moduleSection;
    const cfg=moduleConfig[id];
    if(!cfg||section.querySelector(':scope > .module-togglebar')) return;
    const children=[...section.children];
    const content=document.createElement('div');
    content.className='module-content';
    children.forEach(node=>content.appendChild(node));
    const bar=document.createElement('div');
    bar.className='module-togglebar';
    bar.innerHTML=`
      <div class="module-togglebar-left">
        <span class="module-togglemark">${cfg.code}</span>
        <div class="module-togglecopy"><b>${cfg.title}</b><span>${cfg.desc}</span></div>
      </div>
      <button class="module-togglebtn" type="button">展開 <span class="chev">⌄</span></button>`;
    section.appendChild(bar);
    section.appendChild(content);
    section.classList.add('module-collapsed');
    bar.querySelector('.module-togglebtn').addEventListener('click',()=>toggleModule(id));
  });
}

function saveModuleState(id){
  try{localStorage.setItem(moduleStateKey,id||'');}catch(e){}
}
function lastModule(){
  try{return localStorage.getItem(moduleStateKey)||'daily';}catch(e){return 'daily';}
}
function setModule(id,open,scroll=false){
  const section=document.querySelector('[data-module-section="'+id+'"]');
  if(!section)return;
  section.classList.toggle('module-collapsed',!open);
  const btn=section.querySelector(':scope > .module-togglebar .module-togglebtn');
  if(btn) btn.innerHTML=(open?'收合':'展開')+' <span class="chev">⌄</span>';
  document.querySelectorAll('.module-card').forEach(card=>card.classList.toggle('active',open&&card.dataset.targetModule===id));
  if(open){
    document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
    saveModuleState(id);
    if(scroll){
      section.scrollIntoView({behavior:'smooth',block:'start'});
      section.classList.remove('module-focus');
      void section.offsetWidth;
      section.classList.add('module-focus');
    }
  }
}
function toggleModule(id,forceOpen=false,scroll=false){
  const section=document.querySelector('[data-module-section="'+id+'"]');
  if(!section)return;
  const willOpen=forceOpen||section.classList.contains('module-collapsed');
  setModule(id,willOpen,scroll);
}
function openOnlyModule(id,scroll=true){
  sections.forEach(s=>setModule(s.dataset.moduleSection,s.dataset.moduleSection===id,false));
  if(scroll){
    const section=document.querySelector('[data-module-section="'+id+'"]');
    if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
decorateModules();

document.querySelectorAll('[data-target-module]').forEach(btn=>btn.addEventListener('click',()=>openOnlyModule(btn.dataset.targetModule,true)));
document.querySelectorAll('[data-open-module]').forEach(link=>link.addEventListener('click',e=>{
  e.preventDefault();openOnlyModule(link.dataset.openModule,true);
}));
document.querySelector('#open-last-module').addEventListener('click',()=>openOnlyModule(lastModule(),true));

document.querySelector('#module-case-count').textContent=(d.practicalExamples?.length||0)+' 個案例';
document.querySelector('#module-glossary-count').textContent=(d.glossary?.length||0)+' 個名詞';
document.querySelector('#module-quiz-count').textContent=(d.quizBank?.length||0)+' 題';
document.querySelector('#module-day-count').textContent=(d.days?.length||0)+' 天紀錄';

document.querySelector('#expand').onclick=()=>sections.forEach(s=>setModule(s.dataset.moduleSection,true,false));
document.querySelector('#collapse').onclick=()=>sections.forEach(s=>setModule(s.dataset.moduleSection,false,false));

if(location.hash){
  const id=location.hash.slice(1);
  if(moduleConfig[id]) setTimeout(()=>openOnlyModule(id,false),0);
}

const backTop=document.createElement('button');
backTop.className='back-top';backTop.type='button';backTop.setAttribute('aria-label','回到頂部');backTop.textContent='↑';
document.body.appendChild(backTop);
backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
window.addEventListener('scroll',()=>backTop.classList.toggle('show',window.scrollY>700));

function renderSkillMap(){
  const s=d.skillMap;
  document.querySelector('#skill-summary').innerHTML=s.summary.map(x=>`
    <div class="skill-summary-card"><span>${x.label}</span><b>${x.value}</b></div>`).join('');

  document.querySelector('#skill-domains').innerHTML=s.domains.map((x,i)=>`
    <div class="skill-domain">
      <div class="skill-domain-head">
        <h3>${String(i+1).padStart(2,'0')}｜${x.name}</h3>
        <span class="status-pill status-${x.status}">${x.statusLabel}</span>
      </div>
      <ul>${x.items.map(y=>`<li>${y}</li>`).join('')}</ul>
    </div>`).join('');

  const groups=[
    {key:'mastered',title:'已掌握',className:'mastered'},
    {key:'confused',title:'容易混淆',className:'confused'},
    {key:'upcoming',title:'尚未深入',className:'upcoming'}
  ];
  document.querySelector('#skill-status-groups').innerHTML=groups.map(g=>`
    <div class="skill-state-card ${g.className}">
      <h3>${g.title}</h3>
      <ul>${s[g.key].map(x=>`<li>${x}</li>`).join('')}</ul>
    </div>`).join('');

  const flow=(items,currentIndex=-1)=>items.map((x,i)=>
    `<span class="flow-node ${i===currentIndex?'current':'done'}">${x}</span>${i<items.length-1?'<span class="flow-arrow">→</span>':''}`
  ).join('');
  document.querySelector('#architecture-flow').innerHTML=flow(s.architectureFlow,s.architectureCurrentIndex);
  document.querySelector('#thinking-flow').innerHTML=flow(s.thinkingFlow,-1);
}
renderSkillMap();

function renderExamples(){
  const root=document.querySelector('#example-cases');
  root.innerHTML=d.practicalExamples.map(c=>`
    <article class="example-card">
      <div class="example-head">
        <div><h3>${c.title}</h3><div class="muted">${c.subtitle}</div></div>
        <span class="tag">${c.tag}</span>
      </div>
      <div class="example-desc">${c.description}</div>
      <div class="example-flow">
        ${c.steps.map((s,i)=>`
          <div class="example-step">
            <span class="aws">${s.aws}</span>
            <span class="real">${s.real}</span>
          </div>
          ${i<c.steps.length-1?'<div class="example-arrow">→</div>':''}
        `).join('')}
      </div>
      ${c.compare ? `
        <div class="example-compare">
          <div><b>${c.compare[0].title}</b><div class="muted">${c.compare[0].text}</div></div>
          <div><b>${c.compare[1].title}</b><div class="muted">${c.compare[1].text}</div></div>
        </div>` : ''}
      <div class="example-note"><b>你要聯想到：</b> ${c.memory}</div>
    </article>
  `).join('');
}
renderExamples();



const escapeQuiz=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderGlossary(query=''){
  const root=document.querySelector('#glossary-results');
  document.querySelector('#glossary-count').textContent=d.glossary.length+' 個';
  const q=query.trim().toLowerCase();
  let items=d.glossary.filter(item=>{
    if(!q) return true;
    const hay=[item.term,item.fullName,item.category,item.definition,item.example,item.confusion,...(item.cloudCompare?Object.values(item.cloudCompare):[]),...(item.aliases||[]),...(item.related||[])].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if(!q) items=items.slice(0,8);
  if(!items.length){
    root.innerHTML='<div class="glossary-empty">找不到這個名詞。可以試試英文縮寫、完整名稱或中文關鍵字。</div>';
    return;
  }
  root.innerHTML=items.map(item=>`
    <article class="glossary-card">
      <div class="glossary-title-row">
        <div>
          <div class="glossary-title">${item.term}</div>
          <div class="glossary-full">${item.fullName||''}</div>
        </div>
        <span class="glossary-category">${item.category}</span>
      </div>
      <div class="glossary-definition">${item.definition}</div>
      ${item.cloudCompare?`<div class="cloud-compare"><div class="cloud-compare-heading">跨雲服務對照｜以 AWS 為基準</div><div class="cloud-compare-grid"><div class="cloud-compare-cell"><b>AWS</b><span>${escapeQuiz(item.cloudCompare.aws)}</span></div><div class="cloud-compare-cell"><b>Azure</b><span>${escapeQuiz(item.cloudCompare.azure)}</span></div><div class="cloud-compare-cell"><b>GCP</b><span>${escapeQuiz(item.cloudCompare.gcp)}</span></div></div><div class="cloud-compare-detail"><strong>關鍵差異：</strong>${escapeQuiz(item.cloudCompare.difference)}</div><div class="cloud-compare-detail"><strong>銀行情境：</strong>${escapeQuiz(item.cloudCompare.scenario)}</div></div>`:''}
      <div class="glossary-grid">
        <div class="glossary-box"><b>實際例子</b>${item.example}</div>
        <div class="glossary-box"><b>容易混淆</b>${item.confusion}</div>
      </div>
      ${item.related&&item.related.length?'<div class="glossary-related">'+item.related.map(x=>'<span>'+x+'</span>').join('')+'</div>':''}
      ${item.aliases&&item.aliases.length?'<div class="glossary-alias">也可搜尋：'+item.aliases.join('、')+'</div>':''}
    </article>
  `).join('');
}
const glossarySearch=document.querySelector('#glossary-search');
glossarySearch.addEventListener('input',e=>renderGlossary(e.target.value));
document.querySelector('#glossary-clear').addEventListener('click',()=>{
  glossarySearch.value='';renderGlossary('');glossarySearch.focus();
});
document.querySelectorAll('[data-glossary-query]').forEach(btn=>btn.addEventListener('click',()=>{
  glossarySearch.value=btn.dataset.glossaryQuery;renderGlossary(btn.dataset.glossaryQuery);
  document.querySelector('#glossary').scrollIntoView({behavior:'smooth',block:'start'});
}));
renderGlossary();

// Mixed practice extends the existing bank without replacing daily records.
const extendedQuizBank = [
  {id:'MIX-M01',type:'multi',category:'Database',difficulty:'中階',question:'傳統 RDS Multi-AZ DB instance deployment 有哪些特性？請選出所有正確敘述。',options:['Primary 與 Standby 跨兩個 AZ','Standby 平常承接報表查詢','使用同步複寫','可自動故障切換','可以救回已同步的誤刪資料'],answer:[0,2,3],explanation:'傳統 DB instance 的 Standby 用於 HA，不能承接一般查詢。誤刪通常也會複寫，需用 Backup / PITR 復原。'},
  {id:'MIX-M02',type:'multi',category:'Database',difficulty:'中階',question:'Aurora Replica 可以做哪些事？請選出所有正確敘述。',options:['承接唯讀查詢','在 Writer 故障時成為 Failover Target','每台 Reader 都使用獨立的完整 Cluster Storage','只要有同 Region Replica 就能應付整個 Region 故障'],answer:[0,1],explanation:'Aurora Replica 可分攤讀取並接手 Writer；同一 Aurora Cluster 共用邏輯 Cluster Volume。同 Region HA 不等於跨 Region DR。'},
  {id:'MIX-M03',type:'multi',category:'Database',difficulty:'進階',question:'Business RPO ≤ 5 min，採用 Aurora Global Database 後，哪些工作仍然必要？',options:['監控預定接手區域的 RPO Lag','將非同步複寫直接視為 RPO=0','在 5 分鐘之前設定預警與處理流程','以成功交易紀錄核對 DR 演練後的資料','將沒有監控資料當作 Lag=0'],answer:[0,2,3],explanation:'監控評估當前風險、告警通知處理、演練核對實際損失；三者不能互相取代。缺少監控資料不代表沒有落差。'},
  {id:'MIX-M04',type:'multi',category:'Security / IAM',difficulty:'中階',question:'Private EC2 需要讀取指定 S3 bucket，哪些設計符合最小權限？',options:['使用 EC2 IAM Role 提供暫時憑證','將長期 Access Key 寫入程式','Policy 只允許需要的 bucket / prefix 與 actions','確認 S3 有網路路徑，例如 S3 Gateway Endpoint','開放 EC2 的全部 Inbound Ports 才能讀 S3'],answer:[0,2,3],explanation:'IAM 授權和網路可達性都要具備；Role 避免長期金鑰。EC2 主動存取 S3 不需要開放全部入站連接埠。'},
  {id:'MIX-C01',type:'combo',category:'Database',difficulty:'中階',question:'放款交易、報表與故障各該怎麼處理？請逐項配對（答案可重複）。',fields:[{label:'交易 INSERT / UPDATE',options:['Aurora Writer Endpoint','Aurora Reader Endpoint','Backup / PITR'],answer:0},{label:'BI 唯讀報表（可接受短暫落差）',options:['Aurora Writer Endpoint','Aurora Reader Endpoint','Backup / PITR'],answer:1},{label:'誤 DELETE，還原到事故前',options:['Aurora Writer Endpoint','Aurora Reader Endpoint','Backup / PITR'],answer:2}],explanation:'寫入找 Writer，唯讀報表可用 Reader；誤刪需要時間點復原，而不是單純切換 Writer。'},
  {id:'MIX-C02',type:'combo',category:'Database',difficulty:'中階',question:'依故障模式選擇方案。',fields:[{label:'單一 DB instance 或 AZ 故障，需要自動接手',options:['傳統 RDS Multi-AZ DB instance','Read Replica 分攤讀取','跨 Region DR','Backup / PITR'],answer:0},{label:'查詢量過大，交易主庫負載高',options:['傳統 RDS Multi-AZ DB instance','Read Replica 分攤讀取','跨 Region DR','Backup / PITR'],answer:1},{label:'整個 Primary Region 無法使用',options:['傳統 RDS Multi-AZ DB instance','Read Replica 分攤讀取','跨 Region DR','Backup / PITR'],answer:2},{label:'程式誤更新大量資料',options:['傳統 RDS Multi-AZ DB instance','Read Replica 分攤讀取','跨 Region DR','Backup / PITR'],answer:3}],explanation:'先判斷要處理的 failure mode：基礎設施故障、讀取容量、Region 災難或人為錯誤。'},
  {id:'MIX-C03',type:'combo',category:'Database',difficulty:'進階',question:'14:00 發生災難，復原資料完整到 13:57；14:18 恢復服務。需求 RPO ≤ 5 min、RTO ≤ 30 min。請組合答案。',fields:[{label:'實際資料損失窗口',options:['3 分鐘','18 分鐘','21 分鐘'],answer:0},{label:'實際恢復時間',options:['3 分鐘','18 分鐘','21 分鐘'],answer:1},{label:'需求判斷',options:['只有 RPO 符合','只有 RTO 符合','兩者皆符合','兩者皆不符合'],answer:2}],explanation:'資料損失窗口是 14:00−13:57＝3 分鐘；服務中斷是 14:18−14:00＝18 分鐘。'},
  {id:'MIX-C04',type:'combo',category:'Database',difficulty:'進階',question:'區分兩種 RDS Multi-AZ 部署。',fields:[{label:'1 Primary + 1 不可讀 Standby，2 AZ',options:['Multi-AZ DB instance','Multi-AZ DB cluster'],answer:0},{label:'1 Writer + 2 可讀 Readers，3 AZ',options:['Multi-AZ DB instance','Multi-AZ DB cluster'],answer:1},{label:'同時提供 HA 與額外讀取容量',options:['Multi-AZ DB instance','Multi-AZ DB cluster'],answer:1}],explanation:'傳統 DB instance 使用同步複寫且備援不可讀；DB cluster 使用半同步複寫且兩個 Readers 可承接讀取。不要將兩者混寫。'},
  {id:'MIX-O01',type:'order',category:'Database',difficulty:'中階',question:'按照需求到驗證的順序，排列 RPO 設計流程。',items:['設定告警與處理流程','用 DR 演練核對復原資料','定義 Business RPO ≤ 5 min','確認跨 Region 非同步的損失風險','選定並監控接手區域的 RPO Lag'],answer:[2,3,4,0,1],explanation:'先有業務需求，再分析架構風險，建立監控與處理機制，最後以演練驗證。'},
  {id:'MIX-O02',type:'order',category:'Database',difficulty:'中階',question:'DBA 誤刪資料後，依復原作業的先後排列（事故時間及還原點已知）。',items:['驗證復原資料與 Application 功能','依切換計畫將流量導向復原 DB','暫停受影響的寫入並保存事故證據','用 PITR 建立事故前時間點的新 DB'],answer:[2,3,0,1],explanation:'先控制影響，再建立復原 DB，驗證後才切換。PITR 建立新 DB，並非直接倒轉原 DB。'},
  {"id":"MIX-S01","type":"multi","category":"Database","difficulty":"進階","question":"放款系統要求 RPO ≤ 5 min、RTO ≤ 30 min，並須應付整個 Region 故障。哪些設計與驗證工作正確？選出所有正確答案。","options":["Aurora Global Database 搭配 Secondary Region 的應用接手環境","只部署同 Region Multi-AZ 就能處理整個 Region 故障","監控接手區域的 RPO Lag，設定早於 5 分鐘的預警門檻","用成功交易紀錄與 DR 演練驗證 RPO／RTO","只要 DB 恢復即可，不必準備 Application、DNS、網路與 IAM"],"answer":[0,2,3],"explanation":"跨 Region DR 不只恢復資料庫。Global Database 為非同步複寫，仍可能損失未複寫資料；應用、DNS、網路與權限也要在 RTO 內恢復。監控與演練都需要。"},
  {"id":"MIX-S02","type":"match","category":"Database","difficulty":"中階","question":"Aurora Writer 故障後，將詞彙配到對應的處理責任。每個詞彙使用一次。","items":["Writer / Cluster Endpoint","Aurora Replica","重新連線與 DNS / Connection Pool 處理","冪等性與安全重試"],"labels":["Application 的穩定寫入入口","Writer 故障時可升任 Writer 的角色","故障切換後既有連線中斷的處理","避免重試交易造成重複放款"],"answer":[0,1,2,3],"explanation":"Application 通常使用 Writer / Cluster Endpoint，不手動綁定新的 DB instance hostname。Replica 可接手 Writer；應用仍要處理斷線與重試，並避免重複執行交易。"},
  {"id":"MIX-S03","type":"multi","category":"Database","difficulty":"進階","question":"CloudWatch 顯示 Lag 很低，且 Switchover 測試沒有掉資料。下列判斷哪些正確？選出所有正確答案。","options":["當前低 Lag 不能保證所有災難情境都符合 RPO","必須考慮尖峰、複寫異常、指標缺失與告警延遲","Switchover 成功就代表不必測非預期 Failover","非預期 Failover 可能損失尚未複寫的交易","DR 演練應以獨立的成功交易紀錄核對復原資料"],"answer":[0,1,3,4],"explanation":"監控是當前風險訊號。計畫 Switchover 與非預期 Failover 的條件不同；前者的零資料損失結果不能取代後者的災難驗證。"},
  {"id":"MIX-S04","type":"match","category":"Security / IAM","difficulty":"中階","question":"Private EC2 讀取 S3 失敗。將錯誤情境配到優先檢查的項目，每個詞彙使用一次。","items":["IAM / Bucket Policy 與 Explicit Deny","DNS 解析","路由、S3 Endpoint / NAT 與 SG / NACL","KMS 解密權限"],"labels":["S3 回應 AccessDenied（一般授權問題）","S3 hostname 無法解析","hostname 能解析，但連線 timeout","物件使用 SSE-KMS，錯誤指出 kms:Decrypt 被拒絕"],"answer":[0,1,2,3],"explanation":"依錯誤型態判斷檢查方向。IAM Allow 不會建立網路路徑，也不會自動取得 KMS 解密權限；仍需檢查實際路由、解析、Policy 與明確 Deny。"}
];
const quizBank = [...d.quizBank, ...extendedQuizBank];
const quizStateKey='edan-cloud-sa-quiz-progress-v1';
const reviewIntervals=[1,3,7,14];
let quizMode='all', currentQuestion=null, answered=false;

function localDay(time=Date.now()){const t=new Date(time);return [t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');}
function nextReviewDay(days){const t=new Date();t.setDate(t.getDate()+days);return localDay(t);}
function loadQuizState(){
  try{const s=JSON.parse(localStorage.getItem(quizStateKey));if(s&&typeof s==='object'&&!Array.isArray(s))return {...s,attempts:Number(s.attempts)||0,correct:Number(s.correct)||0,missed:s.missed||{},reviews:s.reviews||{},drafts:s.drafts||{}};}catch(e){}
  return {attempts:0,correct:0,missed:{},reviews:{},drafts:{},selfAttempts:0};
}
function saveQuizState(s){try{localStorage.setItem(quizStateKey,JSON.stringify(s));}catch(e){document.querySelector('.quiz-device-note').textContent='目前瀏覽器無法儲存紀錄；本次練習在關閉頁面後可能遺失。';}}
const quizState=loadQuizState;
function dueQuestion(q,s){return s.reviews[q.id]?s.reviews[q.id].due<=localDay():Boolean(s.missed[q.id]);}
function renderQuizStats(){
  const s=quizState();
  document.querySelector('#quiz-bank-count').textContent=quizBank.length+' 題';
  document.querySelector('#module-quiz-count').textContent=quizBank.length+' 題';
  document.querySelector('#quiz-attempts').textContent=s.attempts;
  document.querySelector('#quiz-accuracy').textContent=s.attempts?Math.round(s.correct/s.attempts*100)+'%':'-';
  document.querySelector('#quiz-missed').textContent=Object.keys(s.missed).length;
  document.querySelector('#quiz-difficulty').textContent=currentQuestion?currentQuestion.difficulty:'-';
  document.querySelector('#quiz-due').textContent='今日複習（'+quizBank.filter(q=>dueQuestion(q,s)).length+'）';
  document.querySelector('#quiz-review-note').textContent='客觀題累計 '+s.attempts+' 次。答錯隔天重練；按 1、3、7、14 天安排複習，重複刷同一天不推進間隔。';
}
function setupQuizCategories(){
  const controls=document.querySelector('.quiz-controls');
  controls.insertAdjacentHTML('beforeend','<select id="quiz-type" aria-label="題型"><option value="all">全部題型</option><option value="multi">多選題</option><option value="combo">選擇配對題</option><option value="order">拖曳排序題</option><option value="match">拖曳詞彙題</option><option value="single">單選題</option></select><button id="quiz-due" class="quiz-action">今日複習</button>');
  document.querySelector('#quiz-card').insertAdjacentHTML('beforebegin','<p id="quiz-review-note" class="quiz-device-note"></p>');
  document.querySelector('#quiz-options').insertAdjacentHTML('afterend','<button id="quiz-submit" class="quiz-next" type="button" hidden>提交答案</button>');
  document.querySelector('#daily .daily-title').insertAdjacentHTML('afterend','<p class="quiz-device-note">建議每天 15 分鐘：3 分鐘到期複習 → 7 分鐘混合情境題 → 5 分鐘詞彙配對與流程排序。</p><button id="daily-practice" class="quiz-action" type="button">開始今日複習與混合訓練</button>');
  document.querySelector('#daily-practice').onclick=()=>{openOnlyModule('quiz',true);document.querySelector('#quiz-category').value='all';document.querySelector('#quiz-type').value='all';setQuizMode(quizBank.some(q=>dueQuestion(q,quizState()))?'due':'all');};
  document.querySelector('#quiz-category').innerHTML='<option value="all">全部主題</option>';
  [...new Set(quizBank.map(q=>q.category))].forEach(c=>{const op=document.createElement('option');op.value=c;op.textContent=c;document.querySelector('#quiz-category').appendChild(op);});
  ['quiz-category','quiz-type'].forEach(id=>document.querySelector('#'+id).onchange=nextQuizQuestion);
  document.querySelector('#quiz-submit').onclick=submitQuiz;
  document.querySelector('#quiz-due').onclick=()=>setQuizMode('due');
  const css=document.createElement('style');css.textContent='.quiz-field{display:grid;gap:8px;margin:12px 0}.quiz-field select,.quiz-short{width:100%;box-sizing:border-box;padding:12px;border:1px solid #b8c7ca;border-radius:10px;font:inherit;background:#fff;color:#182c31}.quiz-short{min-height:160px;resize:vertical}.quiz-check{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #c9d4d6;border-radius:10px;cursor:pointer}.quiz-check input{margin-top:4px;flex-shrink:0}.quiz-rubric{display:grid;gap:10px;margin:16px 0}.quiz-answer-text{white-space:pre-wrap;overflow-wrap:anywhere}.quiz-controls{flex-wrap:wrap}#quiz-submit[hidden]{display:none}#quiz-submit{margin:16px 0}#quiz-options .quiz-option{overflow-wrap:anywhere}';document.head.appendChild(css);
}
function quizCandidates(){const s=quizState(),cat=document.querySelector('#quiz-category').value,type=document.querySelector('#quiz-type').value;return quizBank.filter(q=>(cat==='all'||q.category===cat)&&(type==='all'||(q.type||'single')===type)&&(quizMode!=='missed'||s.missed[q.id])&&(quizMode!=='due'||dueQuestion(q,s)));}
function nextQuizQuestion(){
  const items=quizCandidates(),result=document.querySelector('#quiz-result'),options=document.querySelector('#quiz-options'),submit=document.querySelector('#quiz-submit');
  result.className='quiz-result';result.innerHTML='';document.querySelector('#quiz-next').disabled=true;answered=false;submit.hidden=true;
  if(!items.length){currentQuestion=null;document.querySelector('#quiz-category-label').textContent='';document.querySelector('#quiz-number').textContent='';document.querySelector('#quiz-question').textContent=quizMode==='due'?'目前篩選條件沒有到期複習。可改成「隨機出題」練新題。':quizMode==='missed'?'目前篩選條件沒有錯題。':'這個分類 / 題型目前沒有題目。';options.innerHTML='';renderQuizStats();return;}
  let pool=items.filter(q=>!currentQuestion||q.id!==currentQuestion.id);if(!pool.length)pool=items;
  currentQuestion=pool[Math.floor(Math.random()*pool.length)];const q=currentQuestion,type=q.type||'single';
  document.querySelector('#quiz-category-label').textContent=q.category+' · '+({single:'單選',multi:'多選',combo:'配對組合',order:'拖曳排序',match:'拖曳詞彙'}[type]);
  document.querySelector('#quiz-number').textContent='題號 '+q.id;document.querySelector('#quiz-question').textContent=q.question;
  submit.textContent='提交答案';submit.hidden=type==='single';
  if(type==='single'){options.innerHTML=q.options.map((o,i)=>'<button class="quiz-option" data-index="'+i+'"><span class="letter">'+String.fromCharCode(65+i)+'.</span> '+escapeQuiz(o)+'</button>').join('');options.querySelectorAll('button').forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.index)));}
  if(type==='multi')options.innerHTML=q.options.map((o,i)=>'<label class="quiz-check"><input type="checkbox" value="'+i+'"><span>'+String.fromCharCode(65+i)+'. '+escapeQuiz(o)+'</span></label>').join('');
  if(type==='combo'){const fields=q.fields;options.innerHTML=fields.map((f,i)=>'<label class="quiz-field">'+escapeQuiz(f.label)+'<select data-field="'+i+'"><option value="">請選擇</option>'+f.options.map((o,j)=>'<option value="'+j+'">'+escapeQuiz(o)+'</option>').join('')+'</select></label>').join('');}
  if(type==='match'||type==='order')renderDragQuestion(q,options);
  renderQuizStats();
}
function gradeObjective(q,value){if(!q.type)return value===q.answer;const expected=q.type==='combo'?q.fields.map(f=>f.answer):q.answer;const actual=q.type==='multi'?[...value].sort((a,b)=>a-b):value;return actual.length===expected.length&&actual.every((x,i)=>x===expected[i]);}
function recordQuizResult(q,ok,self=false){
  const s=quizState(),today=localDay(),wasDue=dueQuestion(q,s),r=s.reviews[q.id]||{stage:0,streak:0};
  if(self)s.selfAttempts=(s.selfAttempts||0)+1;else{s.attempts++;if(ok)s.correct++;}
  if(!ok){s.missed[q.id]=(s.missed[q.id]||0)+1;r.stage=0;r.streak=0;r.due=nextReviewDay(1);r.lastSuccess=null;}
  else if(r.lastSuccess!==today){r.streak++;if(r.streak>=2)delete s.missed[q.id];if(!r.due||r.due<=today){r.due=nextReviewDay(reviewIntervals[Math.min(r.stage,3)]);r.stage=Math.min(r.stage+1,3);}r.lastSuccess=today;}
  s.reviews[q.id]=r;saveQuizState(s);if(typeof rewardPractice==='function')rewardPractice(q,ok,self,wasDue);return r;
}
function submitQuiz(){
  if(answered||!currentQuestion)return;const q=currentQuestion,type=q.type;
  let value;if(type==='multi'){value=[...document.querySelectorAll('#quiz-options input:checked')].map(x=>Number(x.value));if(!value.length)return;}
  else if(type==='match'||type==='order'){const fields=[...document.querySelectorAll('#quiz-options [data-drop-slot]')];if(fields.some(x=>x.dataset.answer==='')){document.querySelector('#drag-status').textContent='請先填滿每個位置，再提交答案。';fields.find(x=>x.dataset.answer==='').focus();return;}value=fields.map(x=>Number(x.dataset.answer));}
  else{const fields=[...document.querySelectorAll('#quiz-options select')];if(fields.some(x=>x.value==='')){fields.find(x=>x.value==='').focus();return;}value=fields.map(x=>Number(x.value));if(type==='order'&&new Set(value).size!==value.length){const result=document.querySelector('#quiz-result');result.className='quiz-result show';result.textContent='每個步驟只能使用一次，請檢查重複選項。';return;}}
  answerQuiz(value);
}
function answerQuiz(value){
  if(answered||!currentQuestion)return;answered=true;const q=currentQuestion,ok=gradeObjective(q,value),r=recordQuizResult(q,ok);
  document.querySelectorAll('#quiz-options input,#quiz-options select,#quiz-options button').forEach(x=>{x.disabled=true;x.draggable=false;});document.querySelector('#quiz-submit').hidden=true;
  if(q.type==='match'||q.type==='order')document.querySelectorAll('#quiz-options [data-drop-slot]').forEach((b,i)=>b.classList.add(value[i]===q.answer[i]?'slot-correct':'slot-wrong'));
  let correctText,extra='';
  if(!q.type){correctText=q.options[q.answer];document.querySelectorAll('#quiz-options button').forEach((b,i)=>{if(i===q.answer)b.classList.add('correct');else if(i===value)b.classList.add('wrong');});}
  if(q.type==='multi'){correctText=q.answer.map(i=>String.fromCharCode(65+i)+'. '+q.options[i]).join('；');const omitted=q.answer.filter(i=>!value.includes(i)),wrong=value.filter(i=>!q.answer.includes(i));extra='<p>漏選：'+(omitted.map(i=>String.fromCharCode(65+i)).join('、')||'無')+'；誤選：'+(wrong.map(i=>String.fromCharCode(65+i)).join('、')||'無')+'</p>';}
  if(q.type==='combo'){correctText=q.fields.map(f=>f.label+' → '+f.options[f.answer]).join('\n');extra='<p>答對 '+q.fields.filter((f,i)=>f.answer===value[i]).length+' / '+q.fields.length+' 項；全部正確才計為答對。</p>';}
  if(q.type==='match'){correctText=q.labels.map((label,i)=>label+' → '+q.items[q.answer[i]]).join('\n');extra='<p>答對 '+q.answer.filter((v,i)=>v===value[i]).length+' / '+q.answer.length+' 項；全部正確才計為答對。</p>';}
  if(q.type==='order')correctText=q.answer.map((v,i)=>(i+1)+'. '+q.items[v]).join('\n');
  const result=document.querySelector('#quiz-result');result.className='quiz-result show '+(ok?'correct':'wrong');result.innerHTML='<div class="quiz-result-title">'+(ok?'答對了':'需要複習')+'</div>'+extra+'<p class="quiz-answer-text"><b>正確答案：</b><br>'+escapeQuiz(correctText)+'</p><p class="quiz-explain"><b>解析：</b>'+escapeQuiz(q.explanation)+'</p>'+(q.memory?'<p><b>記憶點：</b>'+escapeQuiz(q.memory)+'</p>':'')+'<p class="quiz-device-note">下次複習：'+r.due+'。錯題需在不同日期答對兩次才移出錯題清單。</p>';document.querySelector('#quiz-next').disabled=false;renderQuizStats();
}
function setQuizMode(mode){quizMode=mode;[['quiz-random','all'],['quiz-missed-only','missed'],['quiz-due','due']].forEach(([id,m])=>document.querySelector('#'+id).classList.toggle('active',mode===m));nextQuizQuestion();}
setupQuizCategories();
document.querySelector('#quiz-next').onclick=nextQuizQuestion;
document.querySelector('#quiz-random').onclick=()=>setQuizMode('all');
document.querySelector('#quiz-missed-only').onclick=()=>setQuizMode('missed');
document.querySelector('#quiz-reset').onclick=()=>{if(confirm('清除這台裝置的答題、複習、XP、武器與成就紀錄？每日訓練內容仍保留。')){try{localStorage.removeItem(quizStateKey);}catch(e){}setQuizMode('all');if(typeof renderGameDashboard==='function')renderGameDashboard();}};
nextQuizQuestion();


const dailyControls=document.createElement('div');
dailyControls.className='daily-controls';
dailyControls.innerHTML='<label>排序方式<select id="daily-sort"><option value="desc">學習日：新到舊</option><option value="asc">學習日：舊到新</option></select></label><label>指定學習日<select id="daily-day"><option value="all">全部學習日</option></select></label><button type="button" id="daily-show-all" class="quiz-action">顯示全部</button><span id="daily-count" role="status" aria-live="polite"></span>';
document.querySelector('#daily .toolbar').before(dailyControls);
const dailyDay=document.querySelector('#daily-day');
[...d.days].sort((a,b)=>Number(b.day)-Number(a.day)).forEach(day=>{
  const option=document.createElement('option');
  option.value=String(day.day);option.textContent='Day '+day.day+' · '+day.date+' · '+day.topic;
  dailyDay.appendChild(option);
});
const dailyStyle=document.createElement('style');
dailyStyle.textContent='.daily-controls{display:flex;flex-wrap:wrap;align-items:end;gap:14px;margin:22px 0 16px;padding:18px;background:#eef7ff;border:1px solid #c9e3f6;border-radius:16px}.daily-controls label{display:grid;gap:7px;font-size:13px;font-weight:600;color:#34566e;min-width:0}.daily-controls label:nth-child(2){flex:1;min-width:220px}.daily-controls select{width:100%;max-width:100%;font:inherit;color:#24465e;background:#fff;border:1px solid #b9d7ed;border-radius:10px;padding:11px 32px 11px 12px;min-height:44px}.daily-controls select:focus-visible{outline:3px solid #8dc5ec;outline-offset:2px}#daily-count{font-size:12px;color:#536f82;padding-bottom:12px}@media(max-width:600px){.daily-controls{padding:14px;gap:12px}.daily-controls label,.daily-controls label:nth-child(2){flex:1 1 100%;min-width:0}.daily-controls button{min-height:44px}}';
document.head.appendChild(dailyStyle);
const root=document.querySelector('#days');
function render(filter='all',q=''){
  const query=q.trim().toLowerCase();
  const selectedDay=dailyDay.value;
  const sortDirection=document.querySelector('#daily-sort').value;
  const items=d.days.filter(day=>{
    const txt=JSON.stringify(day).toLowerCase();
    const filterOk=filter==='all' || (filter==='mistakes'&&day.corrections.length) || (filter==='mastered'&&day.mastered.length);
    return filterOk && (selectedDay==='all'||String(day.day)===selectedDay) && (!query || txt.includes(query));
  }).sort((a,b)=>sortDirection==='asc'?Number(a.day)-Number(b.day):Number(b.day)-Number(a.day));
  document.querySelector('#daily-count').textContent='顯示 '+items.length+' / '+d.days.length+' 天';
  root.innerHTML=items.map(day=>`
    <article class="day ${selectedDay!=='all'?'open':''}" data-day="${day.day}">
      <div class="day-head" tabindex="0">
        <div class="day-num">DAY<b>${day.day}</b></div>
        <div><h2>${day.topic}</h2><div class="muted">${day.date} · ${day.status==='completed'?'已完成':'進行中'}</div></div>
        <div class="score ${day.score>=90?'high':'mid'}">${day.score}/100</div>
      </div>
      <div class="day-body">
        <div class="chips">${day.mastered.map(x=>`<span class="chip">已掌握 · ${x}</span>`).join('')}</div>
        ${day.reinforcement?`<section class="reinforcement-panel" style="margin:16px 0;padding:16px;border:1px solid #b9d8c4;border-radius:12px;background:#f1faf4;color:#193e2b"><h3 style="margin:0 0 8px;color:#17623c">補強練習 · ${day.reinforcement.status==='passed'?'已通過':'待完成'}</h3><p><b>${day.reinforcement.title}</b> · ${day.reinforcement.score}</p><p><b>情境：</b>${day.reinforcement.question}</p><ul>${day.reinforcement.options.map(v=>`<li>${v}</li>`).join('')}</ul><p><b>你的答案：</b>${day.reinforcement.answer}　<b>正解：</b>${day.reinforcement.correct}</p><p><b>解析：</b>${day.reinforcement.explanation}</p><p><b>處理步驟：</b></p><ol>${day.reinforcement.steps.map(v=>`<li>${v}</li>`).join('')}</ol><p><b>重點：</b>${day.reinforcement.concepts.join('；')}</p><small>補強練習不重新計入正式 Day 分數。</small></section>`:''}
        <h3>需要持續修正</h3>
        ${day.corrections.map(c=>`<div class="correction"><div class="box bad"><b>容易混淆</b><div>${c[0]}</div></div><div class="box good"><b>正確 SA 思維</b><div>${c[1]}</div></div></div>`).join('')}
        <div class="memory"><b>必背</b><ul>${day.memory.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        ${day.archive?`<p class="archive-link"><a href="docs/reader.html?file=${encodeURIComponent(day.archive.split("/").pop())}" target="_blank" rel="noopener noreferrer">閱讀 Day ${day.day} 課程紀錄 ↗</a><small>Day 1–21 依現存紀錄補檔；未核實原題不冒充原題</small></p>`:''}
      </div>
    </article>`).join('');
  document.querySelector('#empty').style.display=items.length?'none':'block';
  bindDays();
}
function bindDays(){
  document.querySelectorAll('.day-head').forEach(h=>{
    const toggle=()=>h.parentElement.classList.toggle('open');
    h.onclick=toggle;h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};
  });
}
render();

document.querySelector('#search').addEventListener('input',e=>render(document.querySelector('.filter .active').dataset.filter,e.target.value));
document.querySelectorAll('.filter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filter button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter,document.querySelector('#search').value);
}));

function refreshDaily(){render(document.querySelector('.filter .active').dataset.filter,document.querySelector('#search').value);}
document.querySelector('#daily-sort').addEventListener('change',refreshDaily);
dailyDay.addEventListener('change',refreshDaily);
document.querySelector('#daily-show-all').addEventListener('click',()=>{
  dailyDay.value='all';document.querySelector('#search').value='';
  document.querySelectorAll('.filter button').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));
  refreshDaily();
});
