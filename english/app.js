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
    sessions: [],
    completedDates: [],
    settings: {accent:'adaptive', speechRate:'1.00', voiceQuality:'natural', sessionSize:10, speechRecognition:'auto'},
    lastContentVersion: CONTENT.contentVersion
  });

  let state = loadState();
  let session = null;
  let recognition = null;
  let speakingTimer = null;
  let speakingSeconds = 45;
  let speechTranscript = '';

  const $ = (id) => document.getElementById(id);
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const todayKey = () => new Date().toISOString().slice(0,10);
  const addDays = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
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
        sessions: Array.isArray(parsed.sessions)?parsed.sessions:[],
        completedDates: Array.isArray(parsed.completedDates)?parsed.completedDates:[],
        settings:migratedSettings,
        lastContentVersion:CONTENT.contentVersion
      };
    }catch(e){ return defaultState(); }
  }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

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
      const k = d.toISOString().slice(0,10);
      if(set.has(k)){ count++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); }
      else break;
    }
    return count;
  }

  function renderOverview(){
    const [rank] = rankInfo();
    $('rankValue').textContent = rank;
    $('xpSub').textContent = `${state.xp} XP`;
    $('streakValue').textContent = `${streak()} 天`;
    $('listeningLevelValue').textContent = `L${state.skills.listening.toFixed(1)}`;
    $('interviewLevelValue').textContent = `L${Math.max(state.skills.interview,state.skills.speaking).toFixed(1)}`;
    $('contentVersionBadge').textContent = `題庫 ${CONTENT.contentVersion}`;
    $('versionText').textContent = `${CONTENT.contentVersion} · ${CONTENT.questions.length} 題 · ${CONTENT.chunks.length} chunks`;
    renderSkills();
    renderHistory();
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

  function renderChunks(limit=null){
    let level = $('chunkLevelFilter').value;
    let arr = CONTENT.chunks.filter(c => level==='all' || String(c.level)===level);
    if(limit) arr = [...arr].sort(()=>Math.random()-.5).slice(0,limit);
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
      save(); renderChunks(limit);
    }));
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

  function buildSessionQuestions(mode,size){
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

  function startSession(mode){
    stopSpeakingTimer(); stopRecognition(); speechSynthesis.cancel();
    const size = clamp(parseInt(state.settings.sessionSize,10)||10,5,15);
    const titles={adaptive:'自適應挑戰',listening:'聽力特訓',wrong:'錯題複習',due:'今日複習'};
    session={mode,title:titles[mode]||'自適應挑戰',questions:buildSessionQuestions(mode,size),index:0,answers:[],startedAt:new Date().toISOString(),currentMeta:null};
    $('resultSection').classList.remove('show');
    $('challengeSection').classList.add('active');
    $('sessionTitle').textContent=session.title;
    $('challengeSection').scrollIntoView({behavior:'smooth',block:'start'});
    renderCurrentQuestion();
  }

  function renderCurrentQuestion(){
    stopSpeakingTimer(); stopRecognition(); speechSynthesis.cancel(); speechTranscript='';
    const q=session.questions[session.index];
    if(!q){ finishSession(); return; }
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
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge good">LISTEN FIRST</span><div class="question-title">先不要看文字，聽懂「他在問什麼」</div><div class="question-intent">L${q.level} · 每題都有北美＋印度兩種口音。每種口音第一次播放不算重播；重複同一口音才會影響熟練度判定。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playNorthAmericaBtn" type="button">▶ 北美口音</button><button class="btn secondary" id="playIndiaBtn" type="button">▶ 印度口音</button><button class="btn ghost" id="showTranscriptBtn" type="button">顯示文字</button><span class="audio-status" id="audioStatus">尚未播放 · 建議兩種都聽一次</span></div><div class="transcript" id="transcriptBox">${esc(q.text)}</div></div><div class="options">${q.options.map((o,i)=>`<button class="option" data-index="${i}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="feedbackBox"></div><div class="model-answer" id="modelAnswer"><strong>可以這樣回答</strong><br>${esc(q.model)}<div class="keywords">Keywords: ${esc((q.keywords||[]).join(' · '))}</div></div><div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
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
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge">QUICK CHECK</span><div class="question-title">${esc(q.text)}</div><div class="question-intent">L${q.level} · ${esc(skillLabels[q.skill]||q.skill)}</div></div></div><div class="options">${q.options.map((o,i)=>`<button class="option" data-index="${i}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="feedbackBox"></div><div class="model-answer" id="modelAnswer"><strong>推薦說法</strong><br>${esc(q.model)}<div class="keywords">Keywords: ${esc((q.keywords||[]).join(' · '))}</div></div><div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
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
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge warn">SPEAK OUT LOUD</span><div class="question-title" id="speakingQuestionText">${hideText?'先聽問題，再用 30–60 秒回答。':esc(q.text)}</div><div class="question-intent">L${q.level} · 不寫答案。先直接講，講完再看 model answer。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playSpeakNorthAmericaBtn" type="button">▶ 北美面試官</button><button class="btn secondary" id="playSpeakIndiaBtn" type="button">▶ 印度面試官</button>${hideText?'<button class="btn ghost" id="revealSpeakQBtn" type="button">顯示問題文字</button>':''}<span class="audio-status" id="speakAudioStatus">北美＋印度雙口音</span></div></div><div class="speaking-stage"><div class="timer" id="speakTimer">00:45</div><div class="support">建議結構：Direct answer → 2 個重點 → 停。卡住可以用「Let me think for a moment.」</div><div class="btn-row" style="margin-top:12px"><button class="btn secondary" id="startTimerBtn" type="button">開始 45 秒</button><button class="btn ghost" id="finishSpeakingBtn" type="button">我講完了</button>${recognitionAvailable?'<button class="btn ghost" id="recognitionBtn" type="button">🎙 語音轉文字（可選）</button>':''}</div><div class="speech-text ${recognitionAvailable?'':'hidden'}" id="speechText">${recognitionAvailable?'如果使用語音辨識，辨識結果會出現在這裡。':''}</div></div><div class="model-answer" id="modelAnswer"><strong>Model answer（講完才看）</strong><br>${esc(q.model)}<div class="keywords">Keywords: ${esc((q.keywords||[]).join(' · '))}</div></div><div class="feedback neutral" id="feedbackBox"><strong>自評這一次</strong>不要看文法完美度，只評「有沒有把意思完整講出去」。<div class="self-rate"><button class="good" data-quality="3" type="button">✓ 順暢 / 能說清楚</button><button class="mid" data-quality="2" type="button">△ 有卡，但能完成</button><button class="bad" data-quality="1" type="button">× 很卡 / 需要重練</button></div></div><div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button></div></article>`;
    $('playSpeakNorthAmericaBtn').addEventListener('click',()=>playQuestionAccent(q,'northAmerica',chooseVoiceLang(q.level),'speakAudioStatus'));
    $('playSpeakIndiaBtn').addEventListener('click',()=>playQuestionAccent(q,'india','en-IN','speakAudioStatus'));
    if(hideText) $('revealSpeakQBtn').addEventListener('click',()=>{session.currentMeta.hint=true;qstat(q.id).hints++;$('speakingQuestionText').textContent=q.text;$('revealSpeakQBtn').disabled=true;save();});
    $('startTimerBtn').addEventListener('click',()=>startSpeakingTimer(45));
    $('finishSpeakingBtn').addEventListener('click',()=>finishSpeakingStage(q));
    if(recognitionAvailable) $('recognitionBtn').addEventListener('click',()=>startRecognition(q));
    document.querySelectorAll('.self-rate button').forEach(b=>b.addEventListener('click',()=>{
      if(session.currentMeta.answered) return;
      session.currentMeta.answered=true;
      let quality=Number(b.dataset.quality);
      if(session.currentMeta.hint && quality===3) quality=2;
      document.querySelectorAll('.self-rate button').forEach(x=>x.disabled=true);
      b.style.outline='2px solid #516ce0';
      recordAnswer(q,quality,quality>=2,{listens:session.currentMeta.listens,hint:session.currentMeta.hint,transcript:speechTranscript});
      $('nextBtn').classList.remove('hidden'); $('nextBtn').addEventListener('click',nextQuestion,{once:true});
    }));
  }

  function finishSpeakingStage(q){
    stopSpeakingTimer(); stopRecognition();
    $('modelAnswer').classList.add('show'); $('feedbackBox').classList.add('show');
    if(speechTranscript){
      const coverage=keywordCoverage(speechTranscript,q.keywords||[]);
      $('speechText').innerHTML=`<strong>辨識內容：</strong> ${esc(speechTranscript)}<br><span class="support">關鍵字覆蓋：約 ${coverage}%（僅供參考，不等於英文分數）</span>`;
    }
  }

  function startSpeakingTimer(sec){
    stopSpeakingTimer(); speakingSeconds=sec; updateSpeakTimer();
    speakingTimer=setInterval(()=>{speakingSeconds--;updateSpeakTimer();if(speakingSeconds<=0){stopSpeakingTimer(); const q=session.questions[session.index]; finishSpeakingStage(q);}},1000);
  }
  function stopSpeakingTimer(){if(speakingTimer){clearInterval(speakingTimer);speakingTimer=null;}}
  function updateSpeakTimer(){const el=$('speakTimer');if(el)el.textContent=`00:${String(Math.max(0,speakingSeconds)).padStart(2,'0')}`;}

  function speechRecognitionCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function startRecognition(q){
    const SR=speechRecognitionCtor(); if(!SR)return;
    stopRecognition(); speechTranscript=''; recognition=new SR(); recognition.lang='en-US'; recognition.continuous=true; recognition.interimResults=true;
    recognition.onresult=(e)=>{let text='';for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript+' ';speechTranscript=text.trim();const el=$('speechText');if(el)el.textContent=speechTranscript||'正在聽…';};
    recognition.onerror=()=>{const el=$('speechText');if(el)el.textContent='此瀏覽器的語音辨識目前不可用，直接出聲回答再自評即可。';};
    recognition.onend=()=>{recognition=null;};
    try{recognition.start(); const el=$('speechText');if(el)el.textContent='正在聽你的回答…'; startSpeakingTimer(45);}catch(e){}
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
    session.answers.push({id:q.id,skill:q.skill,level:q.level,quality,correct,extra:extra||{},xp}); save(); renderOverview();
  }

  function nextQuestion(){session.index++;if(session.index>=session.questions.length)finishSession();else renderCurrentQuestion();}

  function finishSession(){
    stopSpeakingTimer();stopRecognition();speechSynthesis.cancel();$('challengeSection').classList.remove('active');$('sessionProgress').style.width='100%';
    if(!session || !session.answers.length){session=null;return;}
    const avg=session.answers.reduce((a,b)=>a+b.quality,0)/(session.answers.length*3); const score=Math.round(avg*100);
    const bySkill={};session.answers.forEach(a=>{bySkill[a.skill]=bySkill[a.skill]||[];bySkill[a.skill].push(a.quality);});
    const skillAvgs=Object.entries(bySkill).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]).sort((a,b)=>a[1]-b[1]);
    const weakest=skillAvgs[0]?.[0]||'listening';
    const rec={date:new Date().toLocaleString('zh-TW',{hour12:false}),title:session.title,count:session.answers.length,score,weakest:skillLabels[weakest]||weakest,answers:session.answers.slice()};
    state.sessions.push(rec); if(state.sessions.length>60)state.sessions=state.sessions.slice(-60);
    if(!state.completedDates.includes(todayKey()))state.completedDates.push(todayKey()); save();
    $('resultScore').textContent=`${score}%`;
    const low=session.answers.filter(a=>a.quality<=1).length; const strong=session.answers.filter(a=>a.quality===3).length; const hint=session.answers.filter(a=>a.extra?.hint).length; const repeats=session.answers.reduce((n,a)=>n+(Number.isFinite(a.extra?.repeats)?a.extra.repeats:Math.max(0,(a.extra?.listens||0)-1)),0);
    $('resultSummary').textContent=score>=80?'這輪很穩。系統會逐步增加問法變化與難度，但仍保留到期複習。':score>=60?'基礎已經能撐住。下一輪會繼續集中在弱項，不需要一次補很多新東西。':'這輪不要追求升級。先讓相同問題用不同問法出現，直到你能自然抓到意圖並講完整句。';
    $('resultGrid').innerHTML=`<div class="result-mini"><b>${strong}</b><span>高品質回答</span></div><div class="result-mini"><b>${low}</b><span>需要重練</span></div><div class="result-mini"><b>${hint}</b><span>使用文字提示</span></div><div class="result-mini"><b>${repeats}</b><span>額外重播次數</span></div>`;
    $('resultSection').classList.add('show');$('resultSection').scrollIntoView({behavior:'smooth',block:'start'}); session=null; renderOverview();
  }

  function quitSession(){if(!session)return;if(confirm('要結束這一回合嗎？已完成的題目仍會保留進度。'))finishSession();}

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
    const lines=[
      '# Edan English Learning Report',`- Exported: ${new Date().toLocaleString('zh-TW',{hour12:false})}`,`- Content version: ${CONTENT.contentVersion}`,`- XP: ${state.xp}`,`- Streak: ${streak()} days`,'',
      '## Skill profile',...skillKeys.map(k=>`- ${skillLabels[k]}: L${(state.skills[k]||1).toFixed(2)}`),'',
      '## Weak / review-priority questions',...(weakQuestions.length?weakQuestions.map(({q,s},i)=>`${i+1}. [${q.id}] L${q.level} ${q.text}\n   - seen=${s.seen}, correct=${s.correct}, wrong=${s.wrong}, hints=${s.hints}, listens=${s.listens}, lastQuality=${s.lastQuality}, due=${s.due}`):['- No answered questions yet.']),'',
      '## Recent sessions',...(recent.length?recent.map(s=>`- ${s.date} | ${s.title} | ${s.score}% | weakest: ${s.weakest}`):['- No completed sessions yet.']),'',
      '## Request for ChatGPT update','Please use this report to update my English Interview Lab question bank. Prioritize repeated weak areas, create paraphrased listening questions, add professional interview follow-ups, and increase difficulty only where my performance supports it. Keep the daily site practice within 15–20 minutes because my total English study limit is about one hour per day.'
    ];
    download(`edan-english-learning-report-${todayKey()}.md`,lines.join('\n'),'text/markdown');
  }

  function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

  function importProgress(file){
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed||typeof parsed!=='object')throw new Error('bad');state={...defaultState(),...parsed,skills:{...initialSkills,...(parsed.skills||{})},settings:{...defaultState().settings,...(parsed.settings||{})}};save();syncSettingsUI();renderOverview();renderChunks();alert('進度已匯入。');}catch(e){alert('這不是有效的進度 JSON。');}};reader.readAsText(file);
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
    document.querySelectorAll('.start-mode').forEach(b=>b.addEventListener('click',()=>startSession(b.dataset.mode)));
    $('quitBtn').addEventListener('click',quitSession);
    $('nextAdaptiveBtn').addEventListener('click',()=>startSession('adaptive'));
    $('backOverviewBtn').addEventListener('click',()=>{$('resultSection').classList.remove('show');$('overviewSection').scrollIntoView({behavior:'smooth'});});
    $('chunkLevelFilter').addEventListener('change',()=>renderChunks()); $('randomChunksBtn').addEventListener('click',()=>renderChunks(3));
    $('exportReportBtn').addEventListener('click',exportLearningReport); $('exportReportBtn2').addEventListener('click',exportLearningReport); $('exportProgressBtn').addEventListener('click',exportProgress);
    $('importProgressInput').addEventListener('change',(e)=>{const f=e.target.files[0];if(f)importProgress(f);e.target.value='';});
    $('settingsBtn').addEventListener('click',()=>{$('settingsSection').classList.toggle('hidden');$('settingsSection').scrollIntoView({behavior:'smooth',block:'start'});});
    $('accentSelect').addEventListener('change',e=>{state.settings.accent=e.target.value;save();});
    $('speechRateSelect').addEventListener('change',e=>{state.settings.speechRate=e.target.value;save();});
    $('voiceQualitySelect').addEventListener('change',e=>{state.settings.voiceQuality=e.target.value;save();});
    $('sessionSizeSelect').addEventListener('change',e=>{state.settings.sessionSize=Number(e.target.value);save();});
    $('speechRecognitionSelect').addEventListener('change',e=>{state.settings.speechRecognition=e.target.value;save();});
    $('resetAllBtn').addEventListener('click',()=>{if(confirm('確定清除這台瀏覽器的所有英文訓練進度？')){localStorage.removeItem(STORE_KEY);state=defaultState();save();syncSettingsUI();renderOverview();renderChunks();alert('已清除。');}});
    $('resetTodayBtn').addEventListener('click',()=>{renderOverview();renderChunks();alert('已依目前進度重新計算顯示。');});
  }

  function init(){
    syncSettingsUI();bindStaticEvents();renderOverview();renderChunks();
    if('speechSynthesis' in window) window.speechSynthesis.getVoices();
    if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  init();
})();