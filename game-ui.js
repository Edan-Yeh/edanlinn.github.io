/* Presentation and game rewards share the existing local quiz record. */
const gameIcons={
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 quiz:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
 'skill-map':'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>',
 examples:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M9 5V3h6v2M3 11h18m-12 0v3h6v-3"/>',
 glossary:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
 daily:'<path d="M8 3v4m8-4v4M3 10h18"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="m8 15 3 3 5-5"/>',
 trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 0h8"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>'
};
function gameIcon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(gameIcons[name]||gameIcons.quiz)+'</svg>';}
function gameState(s){return s.game||{xp:0,days:{},rewarded:{}};}
function gameDay(s){const g=gameState(s);return g.days[localDay()]||{objective:[],short:[],review:[]};}
function gameLevel(xp){return {level:Math.floor(xp/200)+1,progress:xp%200,remaining:200-xp%200};}
function gameStreak(g){let streak=0,t=new Date();if(!g.days[localDay(t)])t.setDate(t.getDate()-1);for(let i=0;i<3660;i++){const item=g.days[localDay(t)];if(!item||!(item.objective.length+item.short.length))break;streak++;t.setDate(t.getDate()-1);}return streak;}
function rewardPractice(q,ok,self,wasDue){
 const s=quizState(),g=gameState(s),today=localDay(),oldLevel=gameLevel(g.xp||0).level;g.days=g.days||{};g.rewarded=g.rewarded||{};
 const day=g.days[today]||{objective:[],short:[],review:[]};const list=self?day.short:day.objective;if(!list.includes(q.id))list.push(q.id);if(wasDue&&!day.review.includes(q.id))day.review.push(q.id);day.puzzle=day.puzzle||[];if(!self&&['combo','match','order'].includes(q.type)&&!day.puzzle.includes(q.id))day.puzzle.push(q.id);
 const key=today+':'+q.id,points=self?(ok?15:5):(ok?20:5),prior=g.rewarded[key]||0,earned=Math.max(0,points-prior);
 const newWeapons=typeof trackCorrectChain==='function'?trackCorrectChain(g,q,ok,self,today):[];
 g.xp=(g.xp||0)+earned;g.rewarded[key]=Math.max(prior,points);g.days[today]=day;s.game=g;saveQuizState(s);
 const banner=document.querySelector('#game-feedback');if(banner){banner.textContent=earned?'+'+earned+' XP · '+(ok?'完成一次練習':'練習已記錄，明天再挑戰'):'練習已記錄 · 同題同日獎勵已領取';banner.classList.remove('visible');void banner.offsetWidth;banner.classList.add('visible');banner.classList.toggle('success',ok);}
 renderGameDashboard();
 if(newWeapons.length&&banner){const role=availableRole(gameLevel(g.xp||0).level,g.role).id;banner.textContent='武器獲得！'+newWeapons.map(w=>w.names[role]).join('、')+' · '+g.chain+' 連擊';}
 const newLevel=gameLevel(g.xp||0).level;if(newLevel>oldLevel){if(banner)banner.textContent='升級！LV. '+newLevel+' · '+(newLevel===3?'解鎖資深稱號':newLevel===5?'解鎖精英稱號':'新的冒險里程碑');const hero=document.querySelector('.hero');if(hero){hero.classList.remove('level-up');void hero.offsetWidth;hero.classList.add('level-up');}}
}
function scoreChart(scores){
 const width=560,height=155,pad=28,min=50,max=100,x=i=>pad+i*(width-2*pad)/Math.max(1,scores.length-1),y=n=>height-pad-(n-min)/(max-min)*(height-2*pad);
 const points=scores.map((s,i)=>x(i)+','+y(s.score)).join(' '),line=scores.map((s,i)=>(i?'L':'M')+x(i)+' '+y(s.score)).join(' ');
 return '<svg class="score-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="每日訓練分數，50 至 100 分；詳細數值列於下方"><defs><linearGradient id="score-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1474c8" stop-opacity=".25"/><stop offset="1" stop-color="#1474c8" stop-opacity="0"/></linearGradient></defs>'+[60,80,100].map(n=>'<path d="M'+pad+' '+y(n)+'H'+(width-pad)+'" stroke="#d8e5f0" stroke-dasharray="3 6"/><text x="0" y="'+(y(n)+4)+'" fill="#526174" font-size="10">'+n+'</text>').join('')+'<path d="'+line+'L'+x(scores.length-1)+' '+(height-pad)+'L'+pad+' '+(height-pad)+'Z" fill="url(#score-fill)"/><polyline points="'+points+'" fill="none" stroke="#1474c8" stroke-width="2.5"/>'+scores.map((s,i)=>'<circle cx="'+x(i)+'" cy="'+y(s.score)+'" r="3.5" fill="#ffffff" stroke="#1474c8" stroke-width="2"><title>Day '+s.day+'：'+s.score+' 分</title></circle><text x="'+x(i)+'" y="'+(height-5)+'" text-anchor="middle" fill="#526174" font-size="10">'+s.day+'</text>').join('')+'</svg>';
}
function renderGameDashboard(){
 const s=quizState(),g=gameState(s),level=gameLevel(g.xp||0),day=gameDay(s),due=quizBank.filter(q=>dueQuestion(q,s)).length;
 const put=(id,value)=>{const el=document.querySelector('#'+id);if(el)el.textContent=value;};
 put('game-level','LV. '+String(level.level).padStart(2,'0'));put('game-xp',(g.xp||0)+' XP');put('game-xp-label',level.progress+' / 200 XP');put('game-xp-next','再 '+level.remaining+' XP 升級');
 const progress=document.querySelector('#game-xp-fill');if(progress)progress.style.width=level.progress/2+'%';
 const xpbar=document.querySelector('#game-xp-meter');if(xpbar)xpbar.setAttribute('aria-valuenow',level.progress);
 put('game-streak',gameStreak(g)+' 天');put('game-due',due+' 題');put('game-local-accuracy',s.attempts?Math.round(s.correct/s.attempts*100)+'%':'—');put('game-local-count',s.attempts+' 次客觀題作答');
 put('game-missed',Object.keys(s.missed).length+' 題');put('game-today',day.objective.length+day.short.length);put('game-date',new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'}));
 const unique=Object.keys(s.reviews).filter(id=>quizBank.some(q=>q.id===id)).length;put('game-coverage',unique+' / '+quizBank.length);const coverage=document.querySelector('#game-coverage-fill');if(coverage)coverage.style.width=unique/quizBank.length*100+'%';
 const dueIds=quizBank.filter(q=>dueQuestion(q,s)).map(q=>q.id),reviewTotal=new Set([...dueIds,...day.review]).size,target=Math.min(3,reviewTotal);
 const tasks=[{id:'objective',n:day.objective.length,total:5},{id:'review',n:day.review.length,total:target},{id:'puzzle',n:(day.puzzle||[]).length,total:1}];
 let complete=0;tasks.forEach(t=>{const done=t.total===0||t.n>=t.total;if(done)complete++;put('mission-'+t.id+'-count',t.total?Math.min(t.n,t.total)+' / '+t.total:'無到期題');const el=document.querySelector('#mission-'+t.id);if(el){el.classList.toggle('mission-done',done);el.querySelector('.mission-progress i').style.width=(t.total?Math.min(100,t.n/t.total*100):100)+'%';}});
 put('mission-complete',complete+' / 3');
 const weaknesses={};quizBank.forEach(q=>{if(s.missed[q.id])weaknesses[q.category]=(weaknesses[q.category]||0)+1;});const entries=Object.entries(weaknesses).sort((a,b)=>b[1]-a[1]).slice(0,3),weak=document.querySelector('#game-weakness');
 if(weak)weak.innerHTML=entries.length?entries.map(([name,count])=>'<div class="weak-row"><div><span>'+escapeQuiz(name)+'</span><b>'+count+' 題待修正</b></div><div class="weak-track"><i style="width:'+count/Math.max(...entries.map(x=>x[1]))*100+'%"></i></div></div>').join(''):'<div class="dashboard-empty">'+gameIcon('shield')+'<p>目前沒有待修正錯題</p><small>完成挑戰後，這裡會顯示優先複習的主題。</small></div>';
 const allDays=Object.values(g.days),totalPractice=allDays.reduce((n,t)=>n+t.objective.length+t.short.length,0),puzzleCount=allDays.reduce((n,t)=>n+(t.puzzle||[]).length,0);
 const badges=[{title:'啟程',desc:'完成第一題',ok:totalPractice>=1},{title:'架構解謎',desc:'完成一題配對或排序',ok:puzzleCount>=1},{title:'持續精進',desc:'連續練習 3 天',ok:gameStreak(g)>=3}];
 const badgeRoot=document.querySelector('#game-badges');if(badgeRoot)badgeRoot.innerHTML=badges.map(b=>'<div class="achievement '+(b.ok?'unlocked':'')+'"><span>'+gameIcon('trophy')+'</span><div><b>'+b.title+'</b><small>'+b.desc+'</small></div><em>'+(b.ok?'已解鎖':'待解鎖')+'</em></div>').join('');
 if(typeof renderFantasyGame==='function')renderFantasyGame();
 const session=document.querySelector('#game-session');if(session){const n=day.objective.length+day.short.length;session.innerHTML='<div><span class="live-dot"></span>今日訓練 <b>'+n+' 題</b></div><div class="session-steps">'+Array.from({length:5},(_,i)=>'<i class="'+(i<n?'filled':'')+'"></i>').join('')+'</div><span>'+Math.max(0,5-n)+' 題達成今日 5 題目標</span>';}
}
function startGamePractice(type='all',mode='all'){
 document.querySelector('#quiz-category').value='all';document.querySelector('#quiz-type').value=type;setQuizMode(mode);openOnlyModule('quiz',true);document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.section==='quiz'));
}
function initGameUI(){
 document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=gameIcon(el.dataset.icon));
 document.querySelectorAll('.module-code').forEach(el=>{const key=el.parentElement.dataset.targetModule;el.innerHTML=gameIcon(key);});
 document.querySelectorAll('.side-link').forEach(b=>b.onclick=()=>{document.querySelectorAll('.side-link').forEach(x=>x.classList.toggle('active',x===b));if(b.dataset.section==='dashboard'){window.scrollTo({top:0,behavior:'smooth'});}else openOnlyModule(b.dataset.section,true);});
 document.querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>startGamePractice(b.dataset.practice,b.dataset.mode||'all'));
 document.querySelector('#game-score-chart').innerHTML=scoreChart(d.scores);
 document.querySelector('#game-score-table').innerHTML='<summary>查看每日分數</summary><div class="score-values">'+d.scores.map(s=>'<span>Day '+s.day+'<b>'+s.score+'</b></span>').join('')+'</div>';
 document.querySelector('#game-trend-change').textContent=(d.scores.at(-1).score-d.scores[0].score>=0?'+':'')+(d.scores.at(-1).score-d.scores[0].score)+' 分 · 相較 Day 1';
 document.querySelector('#game-current-topic').textContent=d.currentTrack;
 const map=document.querySelector('#game-domain-path');map.innerHTML=d.skillMap.domains.filter(x=>x.status!=='next').map((x,i)=>'<button class="path-node '+x.status+'" data-path="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+escapeQuiz(x.name)+'</b><small>'+escapeQuiz(x.statusLabel)+'</small></div>'+gameIcon('arrow')+'</button>').join('');map.querySelectorAll('button').forEach(b=>b.onclick=()=>openOnlyModule('skill-map',true));
 document.querySelector('#quiz-card').insertAdjacentHTML('beforebegin','<div id="game-session" class="game-session"></div>');
 document.querySelector('#quiz-result').setAttribute('aria-live','polite');
 document.querySelector('#game-feedback').setAttribute('aria-live','polite');
 renderGameDashboard();
}
initGameUI();
