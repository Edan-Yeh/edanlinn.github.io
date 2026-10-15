(() => {
  'use strict';
  const CONTENT = window.EDAN_ENGLISH_CONTENT;
  if (!CONTENT) {
    document.body.innerHTML = '<p style="padding:24px">題庫載入失敗。請確認 question-bank.js 與 challenge.html 在同一個資料夾。</p>';
    return;
  }

  const STORE_KEY = 'edanEnglishAdaptiveLabV2';
  const skillKeys = ['listening','speaking','chunks','interview','rescue'];
  const skillLabels = CONTENT.skillLabels;
  const initialSkills = {listening:1.0,speaking:1.1,chunks:1.2,interview:1.2,rescue:1.0};
  const defaultState = () => ({
    schemaVersion: 3,
    xp: 0,
    skills: {...initialSkills},
    qstats: {},
    chunkKnown: {},
    vocabKnown: {},
    vocabStats: {},
    weaknessCounts: {},
    sessions: [],
    completedDates: [],
    settings: {accent:'adaptive', speechRate:'1.00', voiceQuality:'natural', sessionSize:10, speechRecognition:'auto'},
    lastContentVersion: CONTENT.contentVersion
  });

  let state = loadState();
  let session = null;
  let recognition = null;
  let mediaRecorder = null;
  let mediaStream = null;
  let mediaChunks = [];
  let recordedAudioUrl = '';
  let discardRecording = false;
  let speakingTimer = null;
  let speakingSeconds = 45;
  let speechTranscript = '';
  let vocabPracticeSession = null;
  let chunkUnitIds = null;
  let chunkUnitCounted = false;

  const $ = (id) => document.getElementById(id);
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const localDateKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayKey = () => localDateKey();
  const addDays = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return localDateKey(d); };
  function markPracticeDay(){
    const k=todayKey();
    if(!state.completedDates.includes(k)) state.completedDates.push(k);
  }
  const weaknessLabels={sound:'聽力辨音',intent:'問題意圖',output:'即時輸出',structure:'回答結構',fluency:'口說流暢度',usage:'句型／用法'};
  function topWeakness(){
    const entries=Object.entries(state.weaknessCounts||{}).sort((a,b)=>b[1]-a[1]);
    return entries[0]?.[0]||null;
  }
  function recommendedVocabMode(){
    const w=topWeakness();
    return (w==='sound'||w==='intent')?'listening':(w==='output'||w==='structure'||w==='usage'?'sentence':'choice');
  }
  function renderDailyCoach(){
    const focus=$('dailyFocusText');
    const status=$('dailyStatusText');
    if(focus){
      const key=topWeakness();
      focus.textContent=key?'目前優先：'+(weaknessLabels[key]||key)+'。':'目前先建立基線，完成一個小單元後會開始找弱點。';
    }
    if(status) status.textContent=state.completedDates.includes(todayKey())?'✓ 今天已完成至少 1 個完整單元':'今天尚未完成完整單元';
  }
  const esc = (s='') => String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function loadState(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const migratedSettings={...base.settings,...(parsed.settings||{})};
      if((parsed.schemaVersion||0)<3 && migratedSettings.speechRate==='adaptive')migratedSettings.speechRate='1.00';
      return {
        ...base,
        ...parsed,
        schemaVersion:3,
        skills:{...base.skills,...(parsed.skills||{})},
        qstats: parsed.qstats||{},
        chunkKnown: parsed.chunkKnown||{},
        vocabKnown: parsed.vocabKnown||{},
        vocabStats: parsed.vocabStats||{},
        weaknessCounts: parsed.weaknessCounts||{},
        sessions: Array.isArray(parsed.sessions)?parsed.sessions:[],
        completedDates: Array.isArray(parsed.completedDates)?parsed.completedDates:[],
        settings:migratedSettings,
        lastContentVersion:CONTENT.contentVersion
      };
    }catch(e){ return defaultState(); }
  }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  function answerTranslation(q){ return q?.modelZh || CONTENT.answerTranslations?.[q?.id] || ''; }
  function modelAnswerHtml(q,label='推薦答案'){
    const zh=answerTranslation(q);
    return `<div class="model-answer"><strong>${esc(label)}</strong><div class="answer-en">${esc(q.model)}</div>${zh?`<div class="answer-zh"><span>繁體中文</span>${esc(zh)}</div>`:''}<div class="keywords">Keywords: ${esc((q.keywords||[]).join(' · '))}</div></div>`;
  }

  function rankInfo(){
    const x = state.xp;
    if(x>=4000) return ['Global Interviewer','L5'];
    if(x>=2200) return ['Professional Communicator','L4'];
    if(x>=1100) return ['Interview Builder','L3'];
    if(x>=400) return ['Conversation Survivor','L2'];
    return ['English Starter','L1'];
  }

  function streak(){
    const set = new Set(state.completedDates);
    let d = new Date();
    let count = 0;
    for(let i=0;i<366;i++){
      const k = localDateKey(d);
      if(set.has(k)){ count++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); }
      else break;
    }
    return count;
  }

  function setMobileDockActive(key){
    const buttons=[...document.querySelectorAll('.mobile-dock-btn[data-nav]')];
    buttons.forEach(btn=>{
      const active=btn.dataset.nav===key;
      btn.classList.toggle('active',active);
      if(active) btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
    });
  }

  function renderOverview(){
    const [rank] = rankInfo();
    $('rankValue').textContent = rank;
    $('xpSub').textContent = `${state.xp} XP`;
    $('streakValue').textContent = `${streak()} 天`;
    $('listeningLevelValue').textContent = `L${state.skills.listening.toFixed(1)}`;
    $('interviewLevelValue').textContent = `L${Math.max(state.skills.interview,state.skills.speaking).toFixed(1)}`;
    $('contentVersionBadge').textContent = `題庫 ${CONTENT.contentVersion}`;
    $('versionText').textContent = `${CONTENT.contentVersion} · ${CONTENT.questions.length} 題 · ${CONTENT.chunks.length} chunks · ${(CONTENT.vocabulary||[]).length} words`;
    renderSkills();
    renderHistory();
    renderDailyCoach();
  }

  function renderSkills(){
    $('skillPanel').innerHTML = skillKeys.map(k => {
      const v = clamp(state.skills[k]||1,1,5);
      return `<div class="skill-row"><label>${esc(skillLabels[k]||k)}</label><div class="bar"><span style="width:${(v/5)*100}%"></span></div><div class="skill-score">L${v.toFixed(1)}</div></div>`;
    }).join('') + `<div class="support" style="margin-top:12px">升級規則：第一次就聽懂 / 答對 / 能順暢完成口說會上升；需要多次播放、看 transcript、答錯或口說很卡，系統會把相似題目排進更近期複習。每個技能獨立調整。</div>`;
  }

  function renderHistory(){
    const list = state.sessions.slice(-6).reverse();
    $('historyList').innerHTML = list.length ? list.map(s => `<div class="history-item"><div><b>${esc(s.title)}</b><small>${esc(s.date)} · ${s.count} 題 · ${esc(s.weakest||'—')}</small></div><span class="badge ${s.score>=80?'good':s.score<60?'bad':'warn'}">${s.score}%</span></div>`).join('') : '<div class="support">還沒有完成的回合。做完第一輪後，這裡會留下趨勢。</div>';
  }

  function renderChunks(limit=null,fixedIds=null){
    let level = $('chunkLevelFilter').value;
    let arr = CONTENT.chunks.filter(c => level==='all' || String(c.level)===level);
    if(fixedIds) arr=fixedIds.map(id=>CONTENT.chunks.find(c=>c.id===id)).filter(Boolean);
    else if(limit) arr = [...arr].sort(()=>Math.random()-.5).slice(0,limit);
    $('chunkGrid').innerHTML = arr.map(c => `<article class="panel"><span class="badge">L${c.level}</span><h3 style="margin:10px 0 5px">${esc(c.en)}</h3><div class="support">${esc(c.zh)}</div><p style="line-height:1.6;margin:12px 0">${esc(c.example)}</p><div class="btn-row"><button class="btn ghost chunk-listen-na" data-id="${c.id}" type="button">▶ 北美</button><button class="btn ghost chunk-listen-in" data-id="${c.id}" type="button">▶ 印度</button><button class="btn ${state.chunkKnown[c.id]?'good':'secondary'} chunk-known" data-id="${c.id}" type="button">${state.chunkKnown[c.id]?'✓ 已熟':'我會用了'}</button></div><div class="support chunk-audio-status" data-status-id="${c.id}" style="margin-top:8px">北美＋印度雙口音</div></article>`).join('');
    document.querySelectorAll('.chunk-listen-na').forEach(b => b.addEventListener('click', () => {
      const c = CONTENT.chunks.find(x=>x.id===b.dataset.id);
      if(!c) return;
      const lang=chooseVoiceLang(c.level);
      const resolved=speak(c.example, playbackRate(c.level,'chunk'), lang);
      const status=document.querySelector(`.chunk-audio-status[data-status-id="${CSS.escape(c.id)}"]`);
      if(status){
        const fallback=resolved && resolved.fallback ? ` · fallback: ${resolved.actualLabel}` : ''; const voiceName=resolved?.voiceName ? ` · ${resolved.voiceName}` : '';
        status.textContent=`本次：${accentLabel(lang)}${fallback}${voiceName} · ${playbackRate(c.level,'chunk').toFixed(2)}x`;
      }
    }));
    document.querySelectorAll('.chunk-listen-in').forEach(b => b.addEventListener('click', () => {
      const c = CONTENT.chunks.find(x=>x.id===b.dataset.id);
      if(!c) return;
      const resolved=speak(c.example, playbackRate(c.level,'chunk'), 'en-IN');
      const status=document.querySelector(`.chunk-audio-status[data-status-id="${CSS.escape(c.id)}"]`);
      if(status){
        const fallback=resolved && resolved.fallback ? ` · fallback: ${resolved.actualLabel}` : ''; const voiceName=resolved?.voiceName ? ` · ${resolved.voiceName}` : '';
        status.textContent=`本次：Indian English${fallback}${voiceName} · ${playbackRate(c.level,'chunk').toFixed(2)}x`;
      }
    }));
    document.querySelectorAll('.chunk-known').forEach(b => b.addEventListener('click', () => {
      state.chunkKnown[b.dataset.id] = !state.chunkKnown[b.dataset.id];
      if(fixedIds && chunkUnitIds && chunkUnitIds.includes(b.dataset.id) && chunkUnitIds.every(id=>state.chunkKnown[id]) && !chunkUnitCounted){
        chunkUnitCounted=true; markPracticeDay();
      }
      save(); renderOverview(); renderChunks(limit,fixedIds);
    }));
  }

  function startChunkUnit(){
    const unknown=CONTENT.chunks.filter(c=>!state.chunkKnown[c.id]);
    const source=unknown.length>=3?unknown:CONTENT.chunks;
    chunkUnitIds=[...source].sort(()=>Math.random()-.5).slice(0,3).map(c=>c.id);
    chunkUnitCounted=false;
    renderChunks(3,chunkUnitIds);
    $('chunkGrid')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function renderVocabulary(limit=12,randomize=false,learningOnly=false){
    const host=$('vocabGrid');
    if(!host || !Array.isArray(CONTENT.vocabulary)) return;
    const filter=$('vocabFilter')?.value||'all';
    let arr=CONTENT.vocabulary.filter(v=>filter==='all'||v.category===filter);
    if(learningOnly) arr=arr.filter(v=>!state.vocabKnown[v.id]);
    if(randomize) arr=[...arr].sort(()=>Math.random()-.5);
    if(limit) arr=arr.slice(0,limit);
    if(!arr.length){
      host.innerHTML='<div class="panel support">這個篩選目前沒有需要複習的單字。</div>';
      return;
    }
    host.innerHTML=arr.map(v=>`<article class="panel vocab-card">
      <div class="vocab-card-top"><span class="badge">${esc(v.category)}</span><span class="support">${esc(v.pos)}</span></div>
      <div class="vocab-word">${esc(v.word)}</div>
      <div class="vocab-meaning hidden" data-meaning-id="${v.id}"><b>${esc(v.zh)}</b><p>${esc(v.example)}</p></div>
      <div class="btn-row vocab-audio-row">
        <button class="btn ghost vocab-listen-na" data-id="${v.id}" type="button">▶ 北美</button>
        <button class="btn ghost vocab-listen-in" data-id="${v.id}" type="button">▶ 印度</button>
      </div>
      <div class="btn-row">
        <button class="btn secondary vocab-reveal" data-id="${v.id}" type="button">看意思</button>
        <button class="btn ${state.vocabKnown[v.id]?'good':'ghost'} vocab-known" data-id="${v.id}" type="button">${state.vocabKnown[v.id]?'✓ 已會':'我會了'}</button>
      </div>
      <div class="support vocab-audio-status" data-vocab-status-id="${v.id}">先自己想意思，再聽發音。</div>
    </article>`).join('');

    document.querySelectorAll('.vocab-reveal').forEach(b=>b.addEventListener('click',()=>{
      const box=document.querySelector(`.vocab-meaning[data-meaning-id="${CSS.escape(b.dataset.id)}"]`);
      if(!box)return;
      box.classList.toggle('hidden');
      b.textContent=box.classList.contains('hidden')?'看意思':'收起意思';
    }));
    document.querySelectorAll('.vocab-listen-na').forEach(b=>b.addEventListener('click',()=>{
      const v=CONTENT.vocabulary.find(x=>x.id===b.dataset.id); if(!v)return;
      const lang=chooseVoiceLang(1);
      const resolved=speak(`${v.word}. ${v.example}`,playbackRate(1,'chunk'),lang);
      const status=document.querySelector(`.vocab-audio-status[data-vocab-status-id="${CSS.escape(v.id)}"]`);
      if(status) status.textContent=`${accentLabel(lang)} · ${resolved?.voiceName||'System voice'} · ${playbackRate(1,'chunk').toFixed(2)}x`;
    }));
    document.querySelectorAll('.vocab-listen-in').forEach(b=>b.addEventListener('click',()=>{
      const v=CONTENT.vocabulary.find(x=>x.id===b.dataset.id); if(!v)return;
      const resolved=speak(`${v.word}. ${v.example}`,playbackRate(1,'chunk'),'en-IN');
      const status=document.querySelector(`.vocab-audio-status[data-vocab-status-id="${CSS.escape(v.id)}"]`);
      if(status){
        const fallback=resolved?.fallback?` · fallback: ${resolved.actualLabel}`:'';
        status.textContent=`Indian English${fallback} · ${resolved?.voiceName||'System voice'} · ${playbackRate(1,'chunk').toFixed(2)}x`;
      }
    }));
    document.querySelectorAll('.vocab-known').forEach(b=>b.addEventListener('click',()=>{
      state.vocabKnown[b.dataset.id]=!state.vocabKnown[b.dataset.id];
      save();
      renderVocabulary(limit,randomize,learningOnly);
    }));
  }

  function shuffle(arr){return [...arr].sort(()=>Math.random()-.5);}
  function vocabPool(){
    const filter=$('vocabFilter')?.value||'all';
    return (CONTENT.vocabulary||[]).filter(v=>filter==='all'||v.category===filter);
  }
  function vocabStat(id){
    if(!state.vocabStats[id]) state.vocabStats[id]={attempts:0,correct:0,choice:0,sentence:0,listening:0};
    return state.vocabStats[id];
  }
  function vocabExampleTranslation(v){return v?.exampleZh || CONTENT.vocabExampleTranslations?.[v?.id] || '';}
  function escapeRegExpText(s){
    const specials='^$.*+?()[]{}|';
    return String(s).split('').map(ch=>(specials.includes(ch)||ch.charCodeAt(0)===92)?String.fromCharCode(92)+ch:ch).join('');
  }
  function sentenceBlank(v){
    const irregular={
      choose:['chose','chosen'],
      mean:['meant'],
      feel:['felt'],
      forget:['forgot','forgotten'],
      'find out':['found out'],
      'get back to':['got back to'],
      'get used to':['got used to'],
      'make sure':['made sure']
    };
    const forms=[v.word,...(irregular[v.word.toLowerCase()]||[])];
    if(!v.word.includes(' ')){
      const w=v.word.toLowerCase();
      forms.push(w+'s',w+'ed',w+'ing');
      if(w.endsWith('e')) forms.push(w.slice(0,-1)+'ing',w+'d');
      if(w.endsWith('y')) forms.push(w.slice(0,-1)+'ied',w.slice(0,-1)+'ies');
    }
    for(const form of [...new Set(forms)].sort((a,b)=>b.length-a.length)){
      const re=new RegExp('\\b'+escapeRegExpText(form)+'\\b','i');
      if(re.test(v.example)) return v.example.replace(re,'_____');
    }
    return null;
  }
  function vocabDistractors(current,field,count=3,poolOverride=null){
    const pool=(poolOverride||CONTENT.vocabulary||[]).filter(v=>v.id!==current.id);
    const values=[];
    for(const v of shuffle(pool)){
      const val=field==='word'?v.word:v.zh;
      if(!values.includes(val)){values.push(val);if(values.length>=count)break;}
    }
    return values;
  }
  function setVocabModeActive(mode){
    document.querySelectorAll('.vocab-mode-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.vocabMode===mode));
  }
  function showVocabCards(){
    vocabPracticeSession=null;
    setVocabModeActive('cards');
    $('vocabPracticeHost')?.classList.add('hidden');
    $('vocabGrid')?.classList.remove('hidden');
    renderVocabulary(12,true,false);
  }
  function startVocabPractice(mode,size=8){
    setMobileDockActive('vocab');
    setVocabModeActive(mode);
    let pool=vocabPool();
    if(mode==='sentence') pool=pool.filter(v=>sentenceBlank(v));
    if(pool.length<4) pool=(CONTENT.vocabulary||[]).filter(v=>mode!=='sentence'||sentenceBlank(v));
    const queue=shuffle(pool).slice(0,Math.min(size,pool.length));
    vocabPracticeSession={mode,queue,index:0,correct:0,answered:false};
    $('vocabGrid')?.classList.add('hidden');
    $('vocabPracticeHost')?.classList.remove('hidden');
    renderVocabPracticeQuestion();
    $('vocabPracticeHost')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function renderVocabPracticeQuestion(){
    const host=$('vocabPracticeHost');
    const s=vocabPracticeSession;
    if(!host||!s)return;
    if(s.index>=s.queue.length){
      const pct=s.queue.length?Math.round(s.correct/s.queue.length*100):0;
      markPracticeDay(); save(); renderOverview();
      host.innerHTML=`<article class="vocab-practice-card panel"><div class="badge good">SESSION COMPLETE</div><div class="vocab-practice-score">${pct}%</div><h3>這輪 ${s.correct} / ${s.queue.length} 題答對</h3><p class="support">✓ 已完成 1 個完整單元，今天已記錄為練習日。答錯的字會保留在學習紀錄裡。</p><div class="btn-row"><button class="btn primary" id="vocabRetryBtn" type="button">同模式再 8 題</button><button class="btn ghost" id="vocabCardsBtn2" type="button">回單字卡</button></div></article>`;
      $('vocabRetryBtn').addEventListener('click',()=>startVocabPractice(s.mode,8));
      $('vocabCardsBtn2').addEventListener('click',showVocabCards);
      return;
    }
    s.answered=false;
    const v=s.queue[s.index];
    const progress=`${s.index+1} / ${s.queue.length}`;
    let prompt='',sub='',answer='',options=[],audioHtml='';
    if(s.mode==='choice'){
      prompt=esc(v.word); sub='選出最接近的中文意思'; answer=v.zh;
      options=shuffle([answer,...vocabDistractors(v,'zh',3)]);
    }else if(s.mode==='sentence'){
      prompt=esc(sentenceBlank(v)||v.example); sub='哪個單字最適合放進句子？'; answer=v.word;
      options=shuffle([answer,...vocabDistractors(v,'word',3)]);
    }else{
      prompt='先聽，不看單字'; sub='聽完選出正確意思'; answer=v.zh;
      options=shuffle([answer,...vocabDistractors(v,'zh',3)]);
      audioHtml=`<div class="vocab-listening-box"><button class="btn primary" id="vocabListenNA" type="button">▶ 北美</button><button class="btn secondary" id="vocabListenIN" type="button">▶ 印度</button><span class="support" id="vocabListenStatus">單字文字會在作答後顯示</span></div>`;
    }
    const exampleZh=vocabExampleTranslation(v);
    const sentenceZhHtml=s.mode==='sentence'&&exampleZh?`<div class="sentence-zh-hint"><button class="btn ghost" id="vocabSentenceZhBtn" type="button">顯示中文提示</button><div class="sentence-zh-text hidden" id="vocabSentenceZhText">${esc(exampleZh)}</div></div>`:'';
    host.innerHTML=`<article class="vocab-practice-card panel"><div class="vocab-practice-top"><span class="badge">${s.mode==='choice'?'選擇題':s.mode==='sentence'?'句型':'聽力'}</span><span class="support">${progress} · 已答對 ${s.correct}</span></div><div class="vocab-practice-prompt">${prompt}</div><div class="support vocab-practice-sub">${sub}</div>${sentenceZhHtml}${audioHtml}<div class="options vocab-practice-options">${options.map(o=>`<button class="option vocab-option" data-value="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="vocabPracticeFeedback"></div><div class="vocab-answer-detail hidden" id="vocabAnswerDetail"><strong>${esc(v.word)}｜${esc(v.zh)}</strong><p>${esc(v.example)}</p><div class="btn-row"><button class="btn ghost" id="vocabAnswerNA" type="button">▶ 北美例句</button><button class="btn ghost" id="vocabAnswerIN" type="button">▶ 印度例句</button></div></div><button class="btn primary hidden vocab-next" id="vocabNextBtn" type="button">下一題 →</button></article>`;
    if(s.mode==='sentence'&&exampleZh){
      $('vocabSentenceZhBtn').addEventListener('click',()=>{
        const zh=$('vocabSentenceZhText'); zh.classList.toggle('hidden');
        $('vocabSentenceZhBtn').textContent=zh.classList.contains('hidden')?'顯示中文提示':'隱藏中文提示';
      });
    }

    if(s.mode==='listening'){
      $('vocabListenNA').addEventListener('click',()=>{
        const lang=chooseVoiceLang(1); const r=speak(v.word,playbackRate(1,'chunk'),lang);
        $('vocabListenStatus').textContent=`${accentLabel(lang)} · ${r?.voiceName||'System voice'}`;
      });
      $('vocabListenIN').addEventListener('click',()=>{
        const r=speak(v.word,playbackRate(1,'chunk'),'en-IN');
        $('vocabListenStatus').textContent=`Indian English${r?.fallback?` · fallback: ${r.actualLabel}`:''} · ${r?.voiceName||'System voice'}`;
      });
    }
    document.querySelectorAll('.vocab-option').forEach(btn=>btn.addEventListener('click',()=>{
      if(s.answered)return;
      s.answered=true;
      const chosen=btn.dataset.value;
      const correct=chosen===answer;
      if(correct)s.correct++;
      const st=vocabStat(v.id); st.attempts++; if(correct)st.correct++; st[s.mode]=(st[s.mode]||0)+1;
      if(st.attempts>=3 && st.correct/st.attempts>=.8) state.vocabKnown[v.id]=true;
      save();
      document.querySelectorAll('.vocab-option').forEach(b=>{
        b.disabled=true;
        if(b.dataset.value===answer)b.classList.add('correct');
        if(b===btn&&!correct)b.classList.add('wrong');
      });
      const fb=$('vocabPracticeFeedback');fb.className=`feedback show ${correct?'good':'bad'}`;
      fb.innerHTML=`<strong>${correct?'答對了':'再記一次'}</strong>${s.mode==='sentence'?`答案：${esc(v.word)}`:`答案：${esc(v.zh)}`}`;
      $('vocabAnswerDetail').classList.remove('hidden');
      $('vocabNextBtn').classList.remove('hidden');
      $('vocabAnswerNA').addEventListener('click',()=>speak(v.example,playbackRate(1,'chunk'),chooseVoiceLang(1)));
      $('vocabAnswerIN').addEventListener('click',()=>speak(v.example,playbackRate(1,'chunk'),'en-IN'));
      $('vocabNextBtn').addEventListener('click',()=>{s.index++;renderVocabPracticeQuestion();},{once:true});
    }));
  }

  function diagnoseWeakness(q,quality,correct,extra={}){
    if(q.type==='listening_intent'){
      if(!correct) return 'intent';
      if(extra.hint || (extra.repeats||0)>=1) return 'sound';
      return null;
    }
    if(q.type==='speaking'){
      const b=extra.scoreBreakdown;
      if(b){
        if(b.content<27) return 'intent';
        if(b.completeness<12) return 'output';
        if(b.structure<12) return 'structure';
        if(b.fluency<10) return 'fluency';
      }
      if(quality<=1) return 'output';
      return null;
    }
    if(!correct && (q.skill==='chunks'||q.skill==='rescue')) return 'usage';
    return null;
  }
  function addWeakness(key){
    if(!key)return;
    state.weaknessCounts[key]=(state.weaknessCounts[key]||0)+1;
  }
  function languageFixes(text){
    const rules=[
      [/\bexperience about\b/gi,'experience in','experience 通常搭配 in'],
      [/\bmany team\b/gi,'many teams / multiple teams','team 需要複數'],
      [/\bI responsible for\b/gi,'I am responsible for','responsible 前需要 be 動詞'],
      [/\bI am work\b/gi,'I work / I am working','work 的時態要完整'],
      [/\bdiscuss about\b/gi,'discuss','discuss 後面不需要 about'],
      [/\bcommunicate to\b/gi,'communicate with','與人溝通通常用 communicate with'],
      [/\bmore better\b/gi,'better','better 本身已是比較級'],
      [/\bdepend of\b/gi,'depend on','固定搭配是 depend on'],
      [/\bI have (\d+|eight) years experience\b/gi,'I have X years of experience','years of experience 是自然搭配'],
      [/\bin IBM\b/gi,'at IBM','公司前通常用 at']
    ];
    const out=[];
    rules.forEach(([re,to,note])=>{if(re.test(text)){re.lastIndex=0;out.push({to,note});}});
    return out.slice(0,3);
  }
  function qstat(id){
    if(!state.qstats[id]) state.qstats[id] = {seen:0,correct:0,wrong:0,hints:0,listens:0,lastQuality:null,interval:0,due:todayKey(),lastSeen:null};
    return state.qstats[id];
  }

  function effectiveSkillForQuestion(q){
    if(q.skill==='interview') return (state.skills.interview + state.skills.speaking)/2;
    return state.skills[q.skill] || 1;
  }

  function candidatePool(mode){
    const today = todayKey();
    let qs = CONTENT.questions.slice();
    if(mode==='listening') qs = qs.filter(q => q.skill==='listening' || (q.type==='speaking' && q.level>=2));
    if(mode==='speaking') qs = qs.filter(q => q.type==='speaking');
    if(mode==='wrong'){
      const weak = qs.filter(q => { const s = state.qstats[q.id]; return s && (s.wrong>0 || s.hints>0 || (s.lastQuality!==null && s.lastQuality<=1)); });
      if(weak.length) qs = weak;
    }
    if(mode==='due'){
      const due = qs.filter(q => { const s = state.qstats[q.id]; return s && s.due && s.due<=today; });
      if(due.length) qs = due;
    }
    return qs;
  }

  function weightQuestion(q, mode){
    const s = state.qstats[q.id] || {wrong:0,hints:0,seen:0,due:todayKey(),lastQuality:null};
    const skill = effectiveSkillForQuestion(q);
    const dist = Math.abs(q.level - skill);
    let w = 6 / (1 + dist*1.7);
    if(q.skill==='listening') w *= 1.45;
    if(q.skill==='speaking' || q.type==='speaking') w *= 1.22;
    if(s.wrong) w *= 1 + Math.min(2,s.wrong*.4);
    if(s.hints) w *= 1 + Math.min(1.5,s.hints*.25);
    if(s.lastQuality!==null && s.lastQuality<=1) w *= 1.45;
    if(s.due && s.due<=todayKey()) w *= 1.55;
    if(s.seen===0) w *= 1.15;
    if(q.level > skill + 1.15) w *= .25;
    if(q.level < skill - 1.65) w *= .45;
    if(mode==='listening' && q.skill==='listening') w *= 1.4;
    return Math.max(.05,w);
  }

  function weightedPick(arr, mode){
    const weights = arr.map(q=>weightQuestion(q,mode));
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<arr.length;i++){ r-=weights[i]; if(r<=0) return arr[i]; }
    return arr[arr.length-1];
  }

  const MOCK_SEQUENCE_IDS=['mdb-l1-006','mdb-l1-010','mdb-l2-010','mdb-l2-004','mdb-l2-005','pro-l3-001','pro-l3-009','pro-l3-010'];
  function buildSessionQuestions(mode,size){
    if(mode==='mock') return MOCK_SEQUENCE_IDS.map(id=>CONTENT.questions.find(q=>q.id===id)).filter(Boolean).slice(0,size);
    let pool = candidatePool(mode);
    const selected=[];
    while(selected.length<size && pool.length){
      const q=weightedPick(pool,mode); selected.push(q); pool=pool.filter(x=>x.id!==q.id);
    }
    if(selected.length<size){
      let fallback=CONTENT.questions.filter(q=>!selected.some(s=>s.id===q.id));
      while(selected.length<size && fallback.length){ const q=weightedPick(fallback,'adaptive'); selected.push(q); fallback=fallback.filter(x=>x.id!==q.id); }
    }
    return selected;
  }

  function startSession(mode,sizeOverride=null){
    stopSpeakingTimer(); stopRecognition(); speechSynthesis.cancel();
    setMobileDockActive(mode==='listening'?'listening':'challenge');
    const requestedSize=sizeOverride===null?(mode==='mock'?8:state.settings.sessionSize):sizeOverride;
    const size = clamp(parseInt(requestedSize,10)||10,2,15);
    const titles={adaptive:'自適應挑戰',listening:'聽力特訓',wrong:'錯題複習',due:'今日複習',mock:'MongoDB Mock Interview',speaking:'口說快練'};
    session={mode,title:titles[mode]||'自適應挑戰',questions:buildSessionQuestions(mode,size),index:0,answers:[],startedAt:new Date().toISOString(),currentMeta:null};
    $('resultSection').classList.remove('show');
    $('challengeSection').classList.add('active');
    $('sessionTitle').textContent=session.title;
    $('challengeSection').scrollIntoView({behavior:'smooth',block:'start'});
    renderCurrentQuestion();
  }

  function renderCurrentQuestion(){
    stopSpeakingTimer(); stopRecognition(); stopMediaRecording(true); cleanupRecordedAudio(); speechSynthesis.cancel(); speechTranscript='';
    const q=session.questions[session.index];
    if(!q){ finishSession(true); return; }
    session.currentMeta={listens:0,hint:false,answered:false,accentCounts:{northAmerica:0,india:0}};
    $('questionCounter').textContent=`${session.index+1} / ${session.questions.length}`;
    $('questionLevelBadge').textContent=`L${q.level}`;
    $('questionSkillBadge').textContent=skillLabels[q.skill]||q.skill;
    $('sessionProgress').style.width=`${(session.index/session.questions.length)*100}%`;
    if(q.type==='listening_intent') renderListeningQuestion(q);
    else if(q.type==='speaking') renderSpeakingQuestion(q);
    else renderChoiceQuestion(q);
  }

  function renderListeningQuestion(q){
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge good">LISTEN FIRST</span><div class="question-title">先不要看文字，聽懂「他在問什麼」</div><div class="question-intent">L${q.level} · 每題都有北美＋印度兩種口音。每種口音第一次播放不算重播；重複同一口音才會影響熟練度判定。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playNorthAmericaBtn" type="button">▶ 北美口音</button><button class="btn secondary" id="playIndiaBtn" type="button">▶ 印度口音</button><button class="btn ghost" id="showTranscriptBtn" type="button">顯示文字</button><span class="audio-status" id="audioStatus">尚未播放 · 建議兩種都聽一次</span></div><div class="transcript" id="transcriptBox">${esc(q.text)}</div></div><div class="options">${q.options.map((o,i)=>`<button class="option" data-index="${i}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="feedbackBox"></div>${modelAnswerHtml(q,'可以這樣回答').replace('<div class="model-answer">','<div class="model-answer" id="modelAnswer">')}<div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
    $('playNorthAmericaBtn').addEventListener('click',()=>playQuestionAccent(q,'northAmerica',chooseVoiceLang(q.level),'audioStatus'));
    $('playIndiaBtn').addEventListener('click',()=>playQuestionAccent(q,'india','en-IN','audioStatus'));
    $('showTranscriptBtn').addEventListener('click',()=>{
      session.currentMeta.hint=true; qstat(q.id).hints++; $('transcriptBox').classList.add('show'); save();
    });
    bindOptionButtons(q,true);
  }

  function playQuestionAccent(q,key,lang,statusId){
    session.currentMeta.listens++;
    session.currentMeta.accentCounts=session.currentMeta.accentCounts||{northAmerica:0,india:0};
    session.currentMeta.accentCounts[key]=(session.currentMeta.accentCounts[key]||0)+1;
    qstat(q.id).listens++;
    const resolved=speak(q.text,playbackRate(q.level,'question'),lang);
    const c=session.currentMeta.accentCounts;
    const requested=key==='india'?'Indian English':accentLabel(lang);
    const fallback=resolved && resolved.fallback ? ` · 裝置 fallback: ${resolved.actualLabel}` : ''; const voiceName=resolved?.voiceName ? ` · ${resolved.voiceName}` : '';
    $(statusId).textContent=`北美 ${c.northAmerica||0} 次 · 印度 ${c.india||0} 次 · 本次 ${requested}${fallback}${voiceName} · ${playbackRate(q.level,'question').toFixed(2)}x`;
    save();
  }

  function renderChoiceQuestion(q){
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge">QUICK CHECK</span><div class="question-title">${esc(q.text)}</div><div class="question-intent">L${q.level} · ${esc(skillLabels[q.skill]||q.skill)}</div></div></div><div class="options">${q.options.map((o,i)=>`<button class="option" data-index="${i}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="feedbackBox"></div>${modelAnswerHtml(q,'推薦說法').replace('<div class="model-answer">','<div class="model-answer" id="modelAnswer">')}<div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
    bindOptionButtons(q,false);
  }

  function bindOptionButtons(q,isListening){
    const buttons=[...document.querySelectorAll('.option')];
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      if(session.currentMeta.answered) return;
      session.currentMeta.answered=true;
      const selected=Number(btn.dataset.index); const correct=selected===q.answer;
      buttons.forEach((b,i)=>{ b.disabled=true; if(i===q.answer)b.classList.add('correct'); if(i===selected&&i!==q.answer)b.classList.add('wrong'); });
      const accentCounts=session.currentMeta.accentCounts||{northAmerica:0,india:0};
      const accentRepeats=Math.max(0,(accentCounts.northAmerica||0)-1)+Math.max(0,(accentCounts.india||0)-1);
      let quality;
      if(correct){
        if(isListening && (session.currentMeta.hint || accentRepeats>=2)) quality=1;
        else if(isListening && accentRepeats===1) quality=2;
        else quality=3;
      } else quality=0;
      const feedback=$('feedbackBox'); feedback.className=`feedback show ${correct?'good':'bad'}`; feedback.innerHTML=`<strong>${correct?'答對了':'這題先記下來'}</strong>${esc(q.intent||'')} ${isListening?`<br><span class="support">北美 ${accentCounts.northAmerica||0} 次 · 印度 ${accentCounts.india||0} 次${session.currentMeta.hint?'，使用了 transcript':''}</span>`:''}`;
      $('modelAnswer').classList.add('show'); $('nextBtn').classList.remove('hidden');
      recordAnswer(q,quality,correct,{listens:session.currentMeta.listens,hint:session.currentMeta.hint,accentCounts:{...accentCounts},repeats:accentRepeats});
      $('nextBtn').addEventListener('click',nextQuestion,{once:true});
    }));
  }

  function renderSpeakingQuestion(q){
    const hideText=q.level>=3;
    const SR=speechRecognitionCtor();
    const recognitionAvailable=!!SR && state.settings.speechRecognition!=='off';
    const recorderAvailable=mediaRecorderAvailable();
    const recordLabel=recorderAvailable?'🎙 開始錄音回答':(recognitionAvailable?'🎙 開始語音辨識':'開始 45 秒');
    const recordClass=(recorderAvailable||recognitionAvailable)?'btn primary':'btn secondary';
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge warn">SPEAK OUT LOUD</span><div class="question-title" id="speakingQuestionText">${hideText?'先聽問題，再用 30–60 秒回答。':esc(q.text)}</div><div class="question-intent">L${q.level} · 直接用英文回答。錄音完成後可回放；若瀏覽器支援語音轉文字，系統會再提供 0–100 分與調整建議。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playSpeakNorthAmericaBtn" type="button">▶ 北美面試官</button><button class="btn secondary" id="playSpeakIndiaBtn" type="button">▶ 印度面試官</button>${hideText?'<button class="btn ghost" id="revealSpeakQBtn" type="button">顯示問題文字</button>':''}<span class="audio-status" id="speakAudioStatus">北美＋印度雙口音</span></div></div><div class="speaking-stage"><div class="timer" id="speakTimer">00:45</div><div class="support">建議結構：Direct answer → 2 個重點 → 停。錄音與自動轉文字是兩個不同功能；即使無法轉文字，只要麥克風權限正常仍可錄音並回放。</div><div class="btn-row" style="margin-top:12px"><button class="${recordClass}" id="recognitionBtn" type="button">${recordLabel}</button><button class="btn ghost" id="finishSpeakingBtn" type="button">■ 我講完了</button></div><div class="recorded-audio hidden" id="recordedAudioHost"><strong>你的錄音</strong><audio id="recordedAudioPlayer" controls preload="metadata"></audio><span class="support" id="recordedAudioStatus"></span></div><div class="speech-text" id="speechText">${recognitionAvailable?'按「開始錄音回答」後直接說，若轉文字可用，辨識內容會即時顯示。':(recorderAvailable?'這個瀏覽器目前無法自動轉文字，但仍可以錄音、播放回聽，再用自評完成題目。':'此瀏覽器目前無法使用錄音與語音辨識，可改用計時＋自評。')}</div></div><div class="speaking-score hidden" id="speakingScoreHost"></div>${modelAnswerHtml(q,'Model answer（講完才看）').replace('<div class="model-answer">','<div class="model-answer" id="modelAnswer">')}<div class="feedback neutral" id="feedbackBox"><strong id="feedbackTitle">${recognitionAvailable?'錄音後會自動評分':'錄音完成後可回聽'}</strong><span id="feedbackNote">${recognitionAvailable?'若自動轉文字失敗，仍可播放自己的錄音並用下方自評。':'目前無法自動轉文字，所以完成錄音後請回聽，再用下方自評。'}</span><div class="self-rate" id="selfRateBlock"><button class="good" data-quality="3" type="button">✓ 順暢 / 能說清楚</button><button class="mid" data-quality="2" type="button">△ 有卡，但能完成</button><button class="bad" data-quality="1" type="button">× 很卡 / 需要重練</button></div></div><div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
    $('playSpeakNorthAmericaBtn').addEventListener('click',()=>playQuestionAccent(q,'northAmerica',chooseVoiceLang(q.level),'speakAudioStatus'));
    $('playSpeakIndiaBtn').addEventListener('click',()=>playQuestionAccent(q,'india','en-IN','speakAudioStatus'));
    if(hideText) $('revealSpeakQBtn').addEventListener('click',()=>{session.currentMeta.hint=true;qstat(q.id).hints++;$('speakingQuestionText').textContent=q.text;$('revealSpeakQBtn').disabled=true;save();});
    $('recognitionBtn').addEventListener('click',()=>startRecordedAnswer(q,recognitionAvailable));
    $('finishSpeakingBtn').addEventListener('click',()=>finishSpeakingStage(q));
    document.querySelectorAll('.self-rate button').forEach(b=>b.addEventListener('click',()=>{
      if(session.currentMeta.answered) return;
      session.currentMeta.answered=true;
      let quality=Number(b.dataset.quality);
      if(session.currentMeta.hint && quality===3) quality=2;
      document.querySelectorAll('.self-rate button').forEach(x=>x.disabled=true);
      b.style.outline='2px solid #516ce0';
      recordAnswer(q,quality,quality>=2,{listens:session.currentMeta.listens,hint:session.currentMeta.hint,transcript:speechTranscript,manualRating:true,recordedAudio:!!recordedAudioUrl});
      $('nextBtn').classList.remove('hidden'); $('nextBtn').addEventListener('click',nextQuestion,{once:true});
    }));
  }

  function finishSpeakingStage(q){
    if(session.currentMeta.scoringDone) return;
    stopSpeakingTimer(); stopRecognition(); stopMediaRecording(false);
    $('modelAnswer').classList.add('show'); $('feedbackBox').classList.add('show');
    const recognitionBtn=$('recognitionBtn'); if(recognitionBtn){recognitionBtn.disabled=true;recognitionBtn.textContent='🎙 錄音完成';}
    setTimeout(()=>{
      const transcript=(speechTranscript||'').trim();
      if(transcript.split(/\s+/).filter(Boolean).length>=3){
        const analysis=analyzeSpeakingAnswer(transcript,q);
        renderSpeakingScore(analysis,q,transcript);
        if(!session.currentMeta.answered){
          session.currentMeta.answered=true;
          session.currentMeta.scoringDone=true;
          let quality=analysis.score>=80?3:analysis.score>=60?2:1;
          if(session.currentMeta.hint && quality===3) quality=2;
          recordAnswer(q,quality,analysis.score>=60,{listens:session.currentMeta.listens,hint:session.currentMeta.hint,transcript,systemScore:analysis.score,scoreBreakdown:analysis.breakdown,suggestions:analysis.suggestions});
          $('nextBtn').classList.remove('hidden');
          $('nextBtn').addEventListener('click',nextQuestion,{once:true});
        }
      }else{
        $('feedbackTitle').textContent='錄音已完成，但沒有取得足夠的轉文字內容';
        $('feedbackNote').textContent=session.currentMeta.mediaRecorderStarted?'可以先播放「你的錄音」回聽，再用下方自評；若要重錄，也可以直接重新錄音。':'如果麥克風錄音也沒有成功，請確認網站的麥克風權限後重試。';
        const recognitionBtn=$('recognitionBtn'); if(recognitionBtn){recognitionBtn.disabled=false;recognitionBtn.textContent='🎙 重新錄音';}
      }
    },320);
  }

  const SPEAKING_STOPWORDS=new Set('a an the and or but to of in on at for with from by as is are was were be been being i you we they he she it my your our their this that these those do does did have has had can could would should will just very really about into over after before than then so if when where what how why who which'.split(' '));
  function speakingTokens(text){return (String(text||'').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[]);}
  function meaningfulTokens(text){return speakingTokens(text).filter(w=>w.length>2&&!SPEAKING_STOPWORDS.has(w));}
  function keywordHit(text,keyword){
    const norm=String(text||'').toLowerCase();
    const phrase=String(keyword||'').toLowerCase().replace(/[^a-z0-9+ ]/g,' ').replace(/\s+/g,' ').trim();
    if(phrase && norm.includes(phrase)) return true;
    const parts=meaningfulTokens(keyword);
    if(!parts.length) return false;
    const answerSet=new Set(speakingTokens(text));
    const hits=parts.filter(p=>answerSet.has(p)).length;
    return hits>=Math.max(1,Math.ceil(parts.length*.55));
  }
  function countFillers(text){
    const t=' '+String(text||'').toLowerCase().replace(/[^a-z' ]/g,' ')+' ';
    const phrases=[' um ',' uh ',' er ',' you know ',' i mean ',' kind of ',' sort of '];
    return phrases.reduce((n,p)=>n+(t.split(p).length-1),0);
  }
  function analyzeSpeakingAnswer(text,q){
    const tokens=speakingTokens(text);
    const keywordChecks=(q.keywords||[]).map(k=>({keyword:k,hit:keywordHit(text,k)}));
    const hits=keywordChecks.filter(x=>x.hit).length;
    const keywordRatio=keywordChecks.length?hits/keywordChecks.length:.65;

    const modelSet=new Set(meaningfulTokens(q.model||''));
    const answerSet=new Set(meaningfulTokens(text));
    const overlap=[...answerSet].filter(w=>modelSet.has(w)).length;
    const modelRatio=modelSet.size?Math.min(1,overlap/Math.max(3,Math.min(10,modelSet.size)*.55)):.6;
    const contentScore=Math.round(45*(keywordRatio*.78+modelRatio*.22));

    const targets=[0,16,24,32,40,48];
    const target=targets[clamp(q.level||1,1,5)];
    const completenessScore=Math.round(20*Math.min(1,tokens.length/target));

    const connectorRe=/\b(because|also|first|second|another|for example|for instance|however|so|therefore|mainly|especially|while|when|which|that means|my role|my responsibility|one example)\b/gi;
    const connectors=(text.match(connectorRe)||[]).length;
    let structureScore=4;
    if(tokens.length>=8) structureScore+=4;
    if(tokens.length>=16) structureScore+=3;
    structureScore+=Math.min(9,connectors*3);
    structureScore=Math.min(20,structureScore);

    const fillers=countFillers(text);
    let repeats=0;
    for(let i=1;i<tokens.length;i++) if(tokens[i]===tokens[i-1]&&tokens[i].length>2) repeats++;
    const fluencyScore=clamp(Math.round(15-fillers*2-repeats*1.5),4,15);

    const score=clamp(contentScore+completenessScore+structureScore+fluencyScore,0,100);
    const missing=keywordChecks.filter(x=>!x.hit).map(x=>x.keyword);
    const suggestions=[];
    if(missing.length) suggestions.push(`補上關鍵內容：${missing.slice(0,3).join(' / ')}。`);
    if(tokens.length<target*.7) suggestions.push(`回答偏短（目前約 ${tokens.length} words）；再補一個重點或具體例子，目標約 ${target} words。`);
    if(connectors===0&&tokens.length>=10) suggestions.push('句子有內容但連接較弱；加入 because / also / for example，讓回答更像完整口說。');
    if(fillers>=2) suggestions.push(`偵測到約 ${fillers} 個 filler；卡住時寧可停 1 秒，再繼續說。`);
    if(repeats>=2) suggestions.push('有明顯重複字；先停頓再重新起句，比連續重複同一個字更自然。');
    if(!suggestions.length) suggestions.push('內容與結構已經完整；下一步可專注自然停頓、語調與更精簡的表達。');

    return {
      score,
      breakdown:{content:contentScore,completeness:completenessScore,structure:structureScore,fluency:fluencyScore},
      keywordRatio:Math.round(keywordRatio*100),
      missing,
      suggestions:suggestions.slice(0,3),
      wordCount:tokens.length,
      fillers,
      repeats
    };
  }
  function renderSpeakingScore(analysis,q,transcript){
    const host=$('speakingScoreHost');
    if(!host)return;
    const b=analysis.breakdown;
    const fixes=languageFixes(transcript);
    const fixHtml='<div class="language-fix-box"><strong>英文修正</strong>'+(fixes.length?'<ul>'+fixes.map(f=>'<li><b>'+esc(f.to)+'</b> — '+esc(f.note)+'</li>').join('')+'</ul>':'<p>沒有偵測到目前規則庫中的常見錯法；優先依上面的內容與結構建議調整。</p>')+'<div class="support">更自然的完整版本請看下方 Model answer；不需要逐字背誦。</div></div>';
    const tone=analysis.score>=80?'good':analysis.score>=60?'mid':'low';
    host.className=`speaking-score ${tone}`;
    host.innerHTML=`<div class="speaking-score-head"><div><div class="support">回答比對分數</div><div class="speaking-score-number">${analysis.score}<span>/100</span></div></div><div class="speaking-score-summary">${analysis.score>=80?'內容完整，可以往更自然的表達前進。':analysis.score>=60?'主要意思有說到，再補齊缺少內容會更穩。':'目前回答和題目重點有落差，先把核心內容講完整。'}</div></div>
      <div class="score-breakdown">
        <div><b>${b.content}/45</b><span>內容切題</span></div>
        <div><b>${b.completeness}/20</b><span>完整度</span></div>
        <div><b>${b.structure}/20</b><span>回答結構</span></div>
        <div><b>${b.fluency}/15</b><span>流暢度線索</span></div>
      </div>
      <div class="spoken-compare"><div><strong>你說的</strong><p>${esc(transcript)}</p></div><div><strong>需要調整</strong><ul>${analysis.suggestions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div></div>
      ${fixHtml}<div class="support score-disclaimer">此分數依語音轉文字後的內容、關鍵重點、長度、結構與 filler / 重複字計算；目前不評發音準確度或口音。</div>`;
    $('speechText').innerHTML=`<strong>辨識內容：</strong> ${esc(transcript)}<br><span class="support">關鍵內容覆蓋：約 ${analysis.keywordRatio}% · ${analysis.wordCount} words</span>`;
    $('feedbackTitle').textContent='系統已完成比對';
    $('feedbackNote').textContent='分數會直接納入這一題的訓練紀錄；Model answer 是參考，不需要逐字一樣。';
    const self=$('selfRateBlock'); if(self)self.classList.add('hidden');
  }

  function startSpeakingTimer(sec){
    stopSpeakingTimer(); speakingSeconds=sec; updateSpeakTimer();
    speakingTimer=setInterval(()=>{speakingSeconds--;updateSpeakTimer();if(speakingSeconds<=0){stopSpeakingTimer(); const q=session.questions[session.index]; finishSpeakingStage(q);}},1000);
  }
  function stopSpeakingTimer(){if(speakingTimer){clearInterval(speakingTimer);speakingTimer=null;}}
  function updateSpeakTimer(){const el=$('speakTimer');if(el)el.textContent=`00:${String(Math.max(0,speakingSeconds)).padStart(2,'0')}`;}

  function speechRecognitionCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function mediaRecorderAvailable(){return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);}
  function cleanupRecordedAudio(){
    if(recordedAudioUrl){try{URL.revokeObjectURL(recordedAudioUrl);}catch(e){}}
    recordedAudioUrl='';
  }
  function releaseMediaStream(){
    if(mediaStream){mediaStream.getTracks().forEach(t=>{try{t.stop();}catch(e){}});}
    mediaStream=null;
  }
  function renderRecordedAudio(blob){
    cleanupRecordedAudio();
    recordedAudioUrl=URL.createObjectURL(blob);
    const host=$('recordedAudioHost');
    const player=$('recordedAudioPlayer');
    const status=$('recordedAudioStatus');
    if(host&&player){
      player.src=recordedAudioUrl;
      host.classList.remove('hidden');
      if(status)status.textContent='已錄好，可直接播放回聽。這段音訊只保留在目前頁面，不會上傳。';
    }
  }
  function stopMediaRecording(discard=false){
    discardRecording=discard;
    if(mediaRecorder && mediaRecorder.state!=='inactive'){
      try{mediaRecorder.stop();}catch(e){releaseMediaStream();}
    }else{
      releaseMediaStream();
      if(discard){cleanupRecordedAudio();}
    }
  }
  async function startMediaRecording(){
    if(!mediaRecorderAvailable())return false;
    try{
      stopMediaRecording(true);
      cleanupRecordedAudio();
      mediaChunks=[];
      discardRecording=false;
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder=new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size>0)mediaChunks.push(e.data);};
      mediaRecorder.onstop=()=>{
        const chunks=mediaChunks.slice();
        mediaChunks=[];
        const shouldDiscard=discardRecording;
        releaseMediaStream();
        mediaRecorder=null;
        if(!shouldDiscard&&chunks.length){
          const blob=new Blob(chunks,{type:chunks[0].type||'audio/webm'});
          renderRecordedAudio(blob);
        }else if(shouldDiscard){
          cleanupRecordedAudio();
        }
        discardRecording=false;
      };
      mediaRecorder.start();
      return true;
    }catch(e){
      releaseMediaStream();
      const host=$('recordedAudioHost');
      const status=$('recordedAudioStatus');
      if(host)host.classList.remove('hidden');
      if(status)status.textContent='無法啟用麥克風錄音。請確認瀏覽器已允許此網站使用麥克風。';
      return false;
    }
  }
  function startRecognition(q,startTimer=true){
    const SR=speechRecognitionCtor(); if(!SR)return false;
    stopRecognition(); speechTranscript=''; session.currentMeta.scoringDone=false; session.currentMeta.answered=false;
    recognition=new SR(); recognition.lang='en-US'; recognition.continuous=true; recognition.interimResults=true;
    recognition.onresult=(e)=>{let text='';for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript+' ';speechTranscript=text.trim();const el=$('speechText');if(el)el.textContent=speechTranscript||'正在聽…';};
    recognition.onerror=()=>{
      const el=$('speechText');if(el)el.textContent='自動轉文字目前不可用，但錄音仍會保留。講完後可播放回聽並用自評完成。';
      const fb=$('feedbackBox');if(fb)fb.classList.add('show');
    };
    recognition.onend=()=>{recognition=null;};
    try{
      recognition.start();
      const el=$('speechText');if(el)el.textContent='● 正在錄音；若自動轉文字可用，內容會顯示在這裡。';
      if(startTimer)startSpeakingTimer(45);
      return true;
    }catch(e){recognition=null;return false;}
  }
  async function startRecordedAnswer(q,recognitionAvailable){
    stopSpeakingTimer(); stopRecognition(); stopMediaRecording(true); cleanupRecordedAudio(); speechTranscript='';
    session.currentMeta.scoringDone=false; session.currentMeta.answered=false;
    const btn=$('recognitionBtn');
    if(btn){btn.disabled=true;btn.textContent='● 啟動麥克風…';}
    const recorded=await startMediaRecording();
    session.currentMeta.mediaRecorderStarted=recorded;
    const recognized=recognitionAvailable?startRecognition(q,false):false;
    const el=$('speechText');
    if(el){
      if(recognized) el.textContent='● 正在錄音；若自動轉文字可用，內容會顯示在這裡。';
      else if(recorded) el.textContent='● 正在錄音。此瀏覽器無法自動轉文字，但你講完後可以直接播放回聽。';
      else el.textContent='無法啟用麥克風。請確認網站權限；你仍可用計時＋自評完成這題。';
    }
    if(btn){btn.textContent=(recorded||recognized)?'● 錄音中':'開始 45 秒';btn.disabled=recorded||recognized;}
    startSpeakingTimer(45);
  }
  function stopRecognition(){if(recognition){try{recognition.stop();}catch(e){} recognition=null;}}
  function keywordCoverage(text,keywords){if(!text||!keywords.length)return 0;const t=text.toLowerCase();let hit=0;keywords.forEach(k=>{const pieces=k.toLowerCase().split(/\s+/).filter(w=>w.length>3);if(pieces.some(p=>t.includes(p)))hit++;});return Math.round(hit/keywords.length*100);}

  function recordAnswer(q,quality,correct,extra){
    const s=qstat(q.id); s.seen++; if(correct)s.correct++;else s.wrong++; s.lastQuality=quality;s.lastSeen=todayKey();
    if(quality>=3){s.interval=s.interval?Math.min(30,Math.max(2,Math.round(s.interval*2))):2;}
    else if(quality===2){s.interval=s.interval?Math.max(2,Math.round(s.interval*1.3)):2;}
    else if(quality===1){s.interval=1;} else {s.interval=0;}
    s.due=addDays(s.interval);
    const k=q.skill; const current=state.skills[k]||1; const delta={3:.09,2:.035,1:-.025,0:-.07}[quality]||0;
    state.skills[k]=clamp(current+delta*(1+Math.max(0,q.level-current)*.12),1,5);
    if(q.type==='speaking') state.skills.speaking=clamp((state.skills.speaking||1)+delta*.85,1,5);
    const xp=Math.max(2,Math.round(q.level*({3:12,2:8,1:4,0:2}[quality]||2))); state.xp+=xp;
    const answerExtra={...(extra||{})};
    answerExtra.weakness=diagnoseWeakness(q,quality,correct,answerExtra);
    addWeakness(answerExtra.weakness);
    session.answers.push({id:q.id,skill:q.skill,level:q.level,quality,correct,extra:answerExtra,xp}); save(); renderOverview();
  }

  function nextQuestion(){session.index++;if(session.index>=session.questions.length)finishSession(true);else renderCurrentQuestion();}

  function finishSession(completedUnit=true){
    stopSpeakingTimer();stopRecognition();stopMediaRecording(true);cleanupRecordedAudio();speechSynthesis.cancel();$('challengeSection').classList.remove('active');$('sessionProgress').style.width='100%';
    if(!session || !session.answers.length){session=null;return;}
    const avg=session.answers.reduce((a,b)=>a+b.quality,0)/(session.answers.length*3); const score=Math.round(avg*100);
    const bySkill={};session.answers.forEach(a=>{bySkill[a.skill]=bySkill[a.skill]||[];bySkill[a.skill].push(a.quality);});
    const skillAvgs=Object.entries(bySkill).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]).sort((a,b)=>a[1]-b[1]);
    const weakest=skillAvgs[0]?.[0]||'listening';
    const rec={date:new Date().toLocaleString('zh-TW',{hour12:false}),title:session.title+(completedUnit?'':'（未完成）'),count:session.answers.length,score,weakest:skillLabels[weakest]||weakest,answers:session.answers.slice(),completedUnit};
    state.sessions.push(rec); if(state.sessions.length>60)state.sessions=state.sessions.slice(-60);
    if(completedUnit) markPracticeDay();
    save();
    $('resultScore').textContent=`${score}%`;
    const low=session.answers.filter(a=>a.quality<=1).length; const strong=session.answers.filter(a=>a.quality===3).length; const hint=session.answers.filter(a=>a.extra?.hint).length; const repeats=session.answers.reduce((n,a)=>n+(Number.isFinite(a.extra?.repeats)?a.extra.repeats:Math.max(0,(a.extra?.listens||0)-1)),0);
    $('resultSummary').textContent=score>=80?'這輪很穩。系統會逐步增加問法變化與難度，但仍保留到期複習。':score>=60?'基礎已經能撐住。下一輪會繼續集中在弱項，不需要一次補很多新東西。':'這輪不要追求升級。先讓相同問題用不同問法出現，直到你能自然抓到意圖並講完整句。';
    const weaknessThis={}; session.answers.forEach(a=>{const w=a.extra?.weakness;if(w)weaknessThis[w]=(weaknessThis[w]||0)+1;});
    const topThis=Object.entries(weaknessThis).sort((a,b)=>b[1]-a[1])[0]?.[0];
    $('resultGrid').innerHTML=`<div class="result-mini"><b>${strong}</b><span>高品質回答</span></div><div class="result-mini"><b>${low}</b><span>需要重練</span></div><div class="result-mini"><b>${hint}</b><span>使用文字提示</span></div><div class="result-mini"><b>${repeats}</b><span>額外重播次數</span></div>${topThis?`<div class="result-mini"><b>→</b><span>主要弱點：${esc(weaknessLabels[topThis]||topThis)}</span></div>`:''}`;
    $('resultSection').classList.add('show');$('resultSection').scrollIntoView({behavior:'smooth',block:'start'}); session=null; renderOverview();
  }

  function quitSession(){if(!session)return;if(confirm('要結束這一回合嗎？已完成的題目仍會保留進度，但未完成整個單元不會計入今日連續訓練。'))finishSession(false);}

  function rateForLevel(level){return [0,.80,.90,1.0,1.04,1.08][clamp(level,1,5)];}
  function playbackRate(level,context='question'){
    const pref=state.settings.speechRate||'adaptive';
    if(pref!=='adaptive'){
      const n=Number(pref);
      return clamp(Number.isFinite(n)?n:1,0.70,1.25);
    }
    return context==='chunk' ? Math.min(1.0,.84+level*.04) : rateForLevel(level);
  }
  function chooseVoiceLang(level){
    const pref=state.settings.accent;
    if(pref!=='adaptive')return pref;
    const pool=['en-US','en-CA'];
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function accentLabel(lang){
    if(lang==='en-CA')return 'Canadian English';
    if(lang==='en-US')return 'North American English';
    if(lang==='en-IN')return 'Indian English';
    return lang;
  }
  function voiceDisplay(level){const lang=chooseVoiceLang(level);return `${accentLabel(lang)} · ${playbackRate(level,'question').toFixed(2)}x`;}
  function voiceScore(v,targetLang){
    const name=(v.name||'').toLowerCase();
    const lang=(v.lang||'').toLowerCase();
    const target=targetLang.toLowerCase();
    let score=0;
    if(lang===target)score+=120;
    else if(lang.startsWith(target.slice(0,2)))score+=25;
    if(/natural|neural|premium|enhanced/.test(name))score+=80;
    if(/online/.test(name))score+=45;
    if(/microsoft/.test(name))score+=30;
    if(/google/.test(name))score+=22;
    if(v.localService===false)score+=8;
    return score;
  }
  function bestVoice(candidates,targetLang){
    if(!candidates.length)return null;
    if((state.settings.voiceQuality||'natural')==='system')return candidates[0];
    return [...candidates].sort((a,b)=>voiceScore(b,targetLang)-voiceScore(a,targetLang))[0];
  }
  function resolveVoice(lang){
    const voices=speechSynthesis.getVoices();
    const byLang=(code)=>voices.filter(v=>(v.lang||'').toLowerCase()===code.toLowerCase());
    let candidates=byLang(lang);
    if(!candidates.length && lang==='en-IN')candidates=voices.filter(v=>/india|indian/i.test(v.name||''));
    if(!candidates.length && lang==='en-CA')candidates=byLang('en-US');
    if(!candidates.length && lang==='en-US')candidates=byLang('en-CA');
    if(!candidates.length)candidates=voices.filter(v=>(v.lang||'').toLowerCase().startsWith('en'));
    const voice=bestVoice(candidates,lang);
    const actualLang=voice?.lang||lang;
    return {
      voice,
      actualLang,
      actualLabel:accentLabel(actualLang),
      voiceName:voice?.name||'System default',
      fallback:!!voice && actualLang.toLowerCase()!==lang.toLowerCase()
    };
  }
  function speak(text,rate=1,lang='en-US'){
    if(!('speechSynthesis' in window))return null;
    speechSynthesis.cancel();
    const resolved=resolveVoice(lang);
    const u=new SpeechSynthesisUtterance(text);
    u.lang=resolved.voice?.lang||lang;
    u.rate=clamp(Number(rate)||1,0.70,1.25);
    u.pitch=1;
    u.volume=1;
    if(resolved.voice)u.voice=resolved.voice;
    speechSynthesis.speak(u);
    return resolved;
  }

  function exportProgress(){
    download(`edan-english-progress-${todayKey()}.json`,JSON.stringify(state,null,2),'application/json');
  }

  function exportLearningReport(){
    const weakQuestions=CONTENT.questions.map(q=>({q,s:state.qstats[q.id]})).filter(x=>x.s&&x.s.seen>0).sort((a,b)=>((a.s.lastQuality??3)+(a.s.correct/(a.s.seen||1)))-((b.s.lastQuality??3)+(b.s.correct/(b.s.seen||1)))).slice(0,12);
    const recent=state.sessions.slice(-8).reverse();
    const speakingRecent=state.sessions.flatMap(s=>(s.answers||[]).map(a=>({...a,sessionDate:s.date}))).filter(a=>Number.isFinite(a.extra?.systemScore)).slice(-12).reverse();
    const lines=[
      '# Edan English Learning Report',`- Exported: ${new Date().toLocaleString('zh-TW',{hour12:false})}`,`- Content version: ${CONTENT.contentVersion}`,`- XP: ${state.xp}`,`- Streak: ${streak()} days`,'',
      '## Skill profile',...skillKeys.map(k=>`- ${skillLabels[k]}: L${(state.skills[k]||1).toFixed(2)}`),'',
      '## Weakness profile',...Object.entries(state.weaknessCounts||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${weaknessLabels[k]||k}: ${v}`),'',
      '## Weak / review-priority questions',...(weakQuestions.length?weakQuestions.map(({q,s},i)=>`${i+1}. [${q.id}] L${q.level} ${q.text}\n   - seen=${s.seen}, correct=${s.correct}, wrong=${s.wrong}, hints=${s.hints}, listens=${s.listens}, lastQuality=${s.lastQuality}, due=${s.due}`):['- No answered questions yet.']),'',
      '## Recent sessions',...(recent.length?recent.map(s=>`- ${s.date} | ${s.title} | ${s.score}% | weakest: ${s.weakest}`):['- No completed sessions yet.']),'',
      '## Recent speaking auto-scores',...(speakingRecent.length?speakingRecent.map(a=>`- ${a.sessionDate} | [${a.id}] ${a.extra.systemScore}/100 | transcript: ${a.extra.transcript||''} | suggestions: ${(a.extra.suggestions||[]).join(' / ')}`):['- No auto-scored speaking answers yet.']),'',
      '## Request for ChatGPT update','Please use this report to update my English Interview Lab question bank. Prioritize repeated weak areas, create paraphrased listening questions, add professional interview follow-ups, and increase difficulty only where my performance supports it. Keep the daily site practice within 15–20 minutes because my total English study limit is about one hour per day.'
    ];
    download(`edan-english-learning-report-${todayKey()}.md`,lines.join('\n'),'text/markdown');
  }

  function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

  function importProgress(file){
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed||typeof parsed!=='object')throw new Error('bad');state={...defaultState(),...parsed,skills:{...initialSkills,...(parsed.skills||{})},settings:{...defaultState().settings,...(parsed.settings||{})}};save();syncSettingsUI();renderOverview();renderVocabulary(12);renderChunks();alert('進度已匯入。');}catch(e){alert('這不是有效的進度 JSON。');}};reader.readAsText(file);
  }

  function syncSettingsUI(){
    const allowedAccents=new Set(['adaptive','en-US','en-CA']);
    const allowedRates=new Set(['adaptive','0.75','0.85','0.90','0.95','1.00','1.05','1.10','1.15','1.20']);
    const allowedQualities=new Set(['natural','system']);
    if(!allowedAccents.has(state.settings.accent))state.settings.accent='adaptive';
    if(!allowedRates.has(String(state.settings.speechRate)))state.settings.speechRate='1.00';
    if(!allowedQualities.has(state.settings.voiceQuality))state.settings.voiceQuality='natural';
    $('accentSelect').value=state.settings.accent||'adaptive';
    $('speechRateSelect').value=String(state.settings.speechRate||'1.00');
    $('voiceQualitySelect').value=state.settings.voiceQuality||'natural';
    $('sessionSizeSelect').value=String(state.settings.sessionSize||10);
    $('speechRecognitionSelect').value=state.settings.speechRecognition||'auto';
    save();
  }

  function bindStaticEvents(){
    document.querySelectorAll('.start-mode').forEach(b=>b.addEventListener('click',()=>startSession(b.dataset.mode,b.dataset.size?Number(b.dataset.size):null)));
    $('quitBtn').addEventListener('click',quitSession);
    $('nextAdaptiveBtn').addEventListener('click',()=>startSession('adaptive'));
    $('backOverviewBtn').addEventListener('click',()=>{$('resultSection').classList.remove('show');$('overviewSection').scrollIntoView({behavior:'smooth'});});
    $('chunkLevelFilter').addEventListener('change',()=>renderChunks()); $('randomChunksBtn').addEventListener('click',()=>renderChunks(3));
    $('dailyListeningBtn')?.addEventListener('click',()=>startSession('listening',5));
    $('dailyVocabBtn')?.addEventListener('click',()=>{setMobileDockActive('vocab');startVocabPractice(recommendedVocabMode(),8);});
    $('dailyChunksBtn')?.addEventListener('click',()=>{setMobileDockActive('chunks');startChunkUnit();});
    $('dailySpeakingBtn')?.addEventListener('click',()=>startSession('speaking',2));
    $('vocabFilter')?.addEventListener('change',()=>{if(vocabPracticeSession)startVocabPractice(vocabPracticeSession.mode,8);else renderVocabulary(12);});
    $('randomVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(8,true,false);});
    $('learningVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(12,true,true);});
    $('allVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(null,false,false);});
    document.querySelectorAll('.vocab-mode-btn').forEach(btn=>btn.addEventListener('click',()=>{
      const mode=btn.dataset.vocabMode;
      if(mode==='cards')showVocabCards(); else startVocabPractice(mode,8);
    }));
    $('exportReportBtn').addEventListener('click',exportLearningReport); $('exportReportBtn2').addEventListener('click',exportLearningReport); $('exportProgressBtn').addEventListener('click',exportProgress);
    $('importProgressInput').addEventListener('change',(e)=>{const f=e.target.files[0];if(f)importProgress(f);e.target.value='';});
    $('settingsBtn').addEventListener('click',()=>{$('settingsSection').classList.toggle('hidden');$('settingsSection').scrollIntoView({behavior:'smooth',block:'start'});});
    $('jumpVocabBtn')?.addEventListener('click',()=>{setMobileDockActive('vocab');$('vocabularySection')?.scrollIntoView({behavior:'smooth',block:'start'});});
    $('mobileVocabBtn')?.addEventListener('click',()=>{setMobileDockActive('vocab');$('vocabularySection')?.scrollIntoView({behavior:'smooth',block:'start'});});
    $('mobileChunksBtn')?.addEventListener('click',()=>{setMobileDockActive('chunks');$('chunkGrid').scrollIntoView({behavior:'smooth',block:'center'});});
    document.querySelectorAll('.mobile-dock-btn[data-nav]').forEach(btn=>btn.addEventListener('click',()=>setMobileDockActive(btn.dataset.nav)));
    $('accentSelect').addEventListener('change',e=>{state.settings.accent=e.target.value;save();});
    $('speechRateSelect').addEventListener('change',e=>{state.settings.speechRate=e.target.value;save();});
    $('voiceQualitySelect').addEventListener('change',e=>{state.settings.voiceQuality=e.target.value;save();});
    $('sessionSizeSelect').addEventListener('change',e=>{state.settings.sessionSize=Number(e.target.value);save();});
    $('speechRecognitionSelect').addEventListener('change',e=>{state.settings.speechRecognition=e.target.value;save();});
    $('resetAllBtn').addEventListener('click',()=>{if(confirm('確定清除這台瀏覽器的所有英文訓練進度？')){localStorage.removeItem(STORE_KEY);state=defaultState();save();syncSettingsUI();renderOverview();renderVocabulary(12);renderChunks();alert('已清除。');}});
    $('resetTodayBtn').addEventListener('click',()=>{renderOverview();renderChunks();alert('已依目前進度重新計算顯示。');});
  }

  function init(){
    syncSettingsUI();bindStaticEvents();renderOverview();renderVocabulary(12);renderChunks();
    if('speechSynthesis' in window) window.speechSynthesis.getVoices();
    if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  init();
})();