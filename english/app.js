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
    schemaVersion: 4,
    xp: 0,
    skills: {...initialSkills},
    qstats: {},
    chunkKnown: {},
    vocabKnown: {},
    vocabStats: {},
    weaknessCounts: {},
    errorMemory: {},
    littleEHistory: [],
    littleEMemory: [],
    sessions: [],
    retryHistory: [],
    quoteHistory: [],
    quoteFavorites: [],
    quoteWordBank: {},
    skillHistory: [],
    dailyMissionPlan: null,
    todayMissionOverride: null,
    completedDates: [],
    streakRepairs: [],
    clientUpdatedAt: null,
    settings: {accent:'adaptive', speechRate:'1.00', voiceQuality:'natural', sessionSize:10, speechRecognition:'auto', weeklyPlanDays:5},
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
  let mediaStopPromise = Promise.resolve();
  let mediaStopResolve = null;
  let recordingStartedAt = 0;
  let recordingDurationSec = 0;
  let whisperTranscriber = null;
  let whisperLoadingPromise = null;
  let speakingTimer = null;
  let speakingSeconds = 45;
  let speechTranscript = '';
  let vocabPracticeSession = null;
  let chunkUnitIds = null;
  let chunkUnitCounted = false;
  let englishVoiceCache = [];
  let modelPracticeRecorder = null;
  let modelPracticeStream = null;
  let modelPracticeChunks = [];
  let modelPracticeAudioUrl = '';
  let lastLittleEQuestion = null;
  let lastLittleEAnswer = null;
  let speakingRetryCycle = null;
  let learnerProfile = null;
  let progressAnalyticsRange = 7;
  let skillChartRange = 90;
  const publicQuestionIds = new Set((CONTENT.questions||[]).map(q=>q.id));
  const privateQuestionIds = new Set();
  const privateTranslationIds = new Set();
  let privatePackLabels = [];

  const $ = (id) => document.getElementById(id);
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const localDateKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayKey = () => localDateKey();
  const addDays = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return localDateKey(d); };
  const dateKeyDaysAgo = (days) => { const d=new Date(); d.setDate(d.getDate()-days); return localDateKey(d); };
  function resetPrivateQuestionPacks(){
    CONTENT.questions=(CONTENT.questions||[]).filter(q=>publicQuestionIds.has(q.id));
    for(const id of privateTranslationIds){delete CONTENT.answerTranslations?.[id];delete CONTENT.questionTranslations?.[id];}
    privateQuestionIds.clear();privateTranslationIds.clear();privatePackLabels=[];updatePrivatePackUI();
  }
  function applyPrivateQuestionPacks(packs=[]){
    resetPrivateQuestionPacks();
    const existing=new Set(CONTENT.questions.map(q=>q.id));
    for(const pack of (Array.isArray(packs)?packs:[])){
      privatePackLabels.push(pack.label||pack.pack_key||'Private Pack');
      for(const q of (Array.isArray(pack.questions)?pack.questions:[])){
        if(!q?.id)continue;privateQuestionIds.add(q.id);
        if(!existing.has(q.id)){CONTENT.questions.push({...q,privatePack:true});existing.add(q.id);}
      }
      for(const [id,value] of Object.entries(pack.answer_translations||{})){CONTENT.answerTranslations[id]=value;privateTranslationIds.add(id);}
      for(const [id,value] of Object.entries(pack.question_translations||{})){CONTENT.questionTranslations[id]=value;privateTranslationIds.add(id);}
    }
    updatePrivatePackUI();renderOverview();
  }
  function updatePrivatePackUI(){
    const section=$('privatePackSection'),summary=$('privatePackSummary'),badge=$('mockBadge'),title=$('mockTitle'),desc=$('mockDescription');
    if(privateQuestionIds.size){
      section?.classList.remove('hidden');
      if(summary)summary.textContent=`${privateQuestionIds.size} 題私人 Career Pack 已安全載入；公開題庫不包含這些內容。`;
      if(badge)badge.textContent='Private Pack';
      if(title)title.textContent='Personalized Interview Mock';
      if(desc)desc.textContent='使用你的私人 Career Pack，加上共用面試題，並優先補強最近較弱的口說能力。';
    }else{
      section?.classList.add('hidden');
      if(badge)badge.textContent='Interview';if(title)title.textContent='Interview Mock';
      if(desc)desc.textContent='使用共用面試題庫，並優先加入你較弱、較久沒練的口說題。';
    }
  }
  function profileAccentValue(profile){
    const accents=Array.isArray(profile?.accents)?profile.accents:[];
    if(accents.includes('northAmerica')&&accents.includes('india'))return 'both';
    if(accents.includes('india'))return 'india';return 'northAmerica';
  }
  function showOnboarding(profile=learnerProfile,editable=false){
    const modal=$('onboardingModal');if(!modal)return;
    $('onboardingGoal').value=profile?.goal||'work';$('onboardingRole').value=profile?.role_type||'other';
    $('onboardingLevel').value=profile?.self_level||'intermediate';$('onboardingMinutes').value=String(profile?.daily_minutes||15);
    $('onboardingAccents').value=profileAccentValue(profile);$('onboardingTarget').value=profile?.target_company||'';
    $('onboardingCloseBtn')?.classList.toggle('hidden',!editable&&!profile?.onboarding_completed);
    $('onboardingMessage').textContent=editable?'修改後會套用到之後的推薦與新回合。':'完成後系統會調整推薦題型與每回合題數。';
    modal.classList.remove('hidden');
  }
  function hideOnboarding(){$('onboardingModal')?.classList.add('hidden');}
  function applyLearnerProfilePreferences(profile,{newSetup=false}={}){
    if(!profile||!newSetup)return;
    state.settings.sessionSize=profile.daily_minutes>=60?15:profile.daily_minutes>=30?10:5;
    // Listening questions expose the learner-selected accents directly.
    // Keep the legacy accent select on a valid value so settings UI never becomes blank.
    state.settings.accent='adaptive';
    save();syncSettingsUI();
  }
  function enabledPracticeAccents(){
    const a=Array.isArray(learnerProfile?.accents)?learnerProfile.accents.filter(x=>x==='northAmerica'||x==='india'):[];
    return a.length?a:['northAmerica','india'];
  }
  function showDiagnosticIfNeeded(){
    const section=$('diagnosticSection');if(!section)return;
    section.classList.toggle('hidden',!learnerProfile?.onboarding_completed||!!learnerProfile?.diagnostic_completed);
  }
  async function loadLearnerExperience(){
    const cloud=window.EDAN_CLOUD;if(!cloud?.ready)return;
    resetPrivateQuestionPacks();
    try{
      const [profile,packs]=await Promise.all([cloud.getLearnerProfile?.(),cloud.getPrivateQuestionPacks?.()]);
      learnerProfile=profile||null;applyPrivateQuestionPacks(packs||[]);
      if(!learnerProfile?.onboarding_completed)showOnboarding(learnerProfile,false);else hideOnboarding();
      showDiagnosticIfNeeded();
    }catch(err){console.warn('Learner profile/private pack load failed',err);learnerProfile=null;showOnboarding(null,false);}
  }
  function bindLearnerExperienceUI(){
    $('onboardingCloseBtn')?.addEventListener('click',hideOnboarding);
    $('editLearnerProfileBtn')?.addEventListener('click',()=>showOnboarding(learnerProfile,true));
    $('onboardingForm')?.addEventListener('submit',async e=>{
      e.preventDefault();const cloud=window.EDAN_CLOUD,choice=$('onboardingAccents').value;
      const patch={goal:$('onboardingGoal').value,role_type:$('onboardingRole').value,self_level:$('onboardingLevel').value,daily_minutes:Number($('onboardingMinutes').value),accents:choice==='both'?['northAmerica','india']:[choice],target_company:$('onboardingTarget').value.trim(),onboarding_completed:true};
      const msg=$('onboardingMessage');if(msg)msg.textContent='儲存中…';
      try{
        learnerProfile=await cloud.saveLearnerProfile(patch);applyLearnerProfilePreferences(learnerProfile,{newSetup:true});state.dailyMissionPlan=null;save();hideOnboarding();showDiagnosticIfNeeded();renderWeeklyPlan();renderTodayMission();
        cloud.logEvent?.('learner_onboarding_completed',{goal:learnerProfile.goal,roleType:learnerProfile.role_type,dailyMinutes:learnerProfile.daily_minutes},'onboarding-v54');
        $('diagnosticSection')?.scrollIntoView({behavior:'smooth',block:'center'});
      }catch(err){console.warn(err);if(msg)msg.textContent='儲存失敗，請確認網路與登入狀態後重試。';}
    });
    $('startDiagnosticBtn')?.addEventListener('click',()=>startSession('diagnostic',5));
    $('diagnosticLaterBtn')?.addEventListener('click',()=>$('diagnosticSection')?.classList.add('hidden'));
  }
  function diagnosticLevel(answers,skill){
    const rows=answers.filter(a=>a.skill===skill);if(!rows.length)return null;
    const avg=rows.reduce((n,a)=>n+(a.quality||0),0)/(rows.length*3);return clamp(1+avg*3.2,1,4.2);
  }
  function completeDiagnostic(answers,score){
    const listening=diagnosticLevel(answers,'listening')||1;
    const practicalRows=answers.filter(a=>a.skill==='chunks'||a.skill==='rescue');
    const practical=practicalRows.length?clamp(1+(practicalRows.reduce((n,a)=>n+(a.quality||0),0)/(practicalRows.length*3))*3.2,1,4.2):1;
    const speakingAnswer=answers.find(a=>a.skill==='speaking');
    const speakingScore=Number.isFinite(speakingAnswer?.extra?.systemScore)?speakingAnswer.extra.systemScore:(speakingAnswer?.quality||0)/3*100;
    const speaking=clamp(1+(speakingScore/100)*3.2,1,4.2),interview=clamp((speaking+practical)/2,1,4.2);
    const levels={listening:Number(listening.toFixed(1)),speaking:Number(speaking.toFixed(1)),practical:Number(practical.toFixed(1)),interview:Number(interview.toFixed(1))};
    const weakest=Object.entries(levels).sort((a,b)=>a[1]-b[1])[0]?.[0]||'speaking';
    const recommendations={listening:'先從短句聽力與 Question Intent 開始。',speaking:'先練短回答與即時組句，再逐步增加長度。',practical:'先把高頻 Chunks 與救援句練成自然反應。',interview:'先用簡短結構練面試回答，再增加 follow-up。'};
    const diagnostic={source:'v54_five_question_diagnostic',score,levels,weakest,recommendation:recommendations[weakest],completedAt:new Date().toISOString()};
    const priorTraining=state.sessions.some(s=>!s.diagnostic);
    if(!priorTraining){
      state.skills.listening=levels.listening;state.skills.speaking=levels.speaking;state.skills.interview=levels.interview;state.skills.chunks=levels.practical;state.skills.rescue=levels.practical;
      captureSkillSnapshot('diagnostic');save();
    }
    learnerProfile={...(learnerProfile||{}),diagnostic_completed:true,diagnostic};
    window.EDAN_CLOUD?.saveLearnerProfile?.({diagnostic_completed:true,diagnostic}).then(p=>{learnerProfile=p||learnerProfile;showDiagnosticIfNeeded();}).catch(err=>console.warn('Diagnostic save failed',err));
    window.EDAN_CLOUD?.logEvent?.('diagnostic_completed',{score,levels,weakest},'diagnostic-v54');return diagnostic;
  }

  function repairRecentStreakGap(){
    const completed=new Set(Array.isArray(state.completedDates)?state.completedDates:[]);
    const repairs=Array.isArray(state.streakRepairs)?state.streakRepairs:[];
    const today=todayKey(),d1=dateKeyDaysAgo(1),d2=dateKeyDaysAgo(2),d3=dateKeyDaysAgo(3);
    let missing=null;
    if(completed.has(today)&&!completed.has(d1)&&completed.has(d2))missing=d1;
    else if(completed.has(today)&&completed.has(d1)&&!completed.has(d2)&&completed.has(d3))missing=d2;
    if(!missing||repairs.some(r=>r?.date===missing))return null;
    completed.add(missing);
    state.completedDates=[...completed].sort();
    state.streakRepairs=[...repairs,{date:missing,sourceDate:today,repairedAt:new Date().toISOString(),reason:'two_day_grace'}].slice(-20);
    return missing;
  }
  function skillSnapshotValues(){
    return Object.fromEntries(skillKeys.map(k=>[k,Number(clamp(state.skills?.[k]||1,1,5).toFixed(3))]));
  }

  function captureSkillSnapshot(source='practice'){
    const date=todayKey(),capturedAt=new Date().toISOString(),skills=skillSnapshotValues();
    const history=Array.isArray(state.skillHistory)?state.skillHistory:[];
    const idx=history.findIndex(x=>x?.date===date);
    const previous=idx>=0?history[idx]:null;
    const changed=!previous||skillKeys.some(k=>Number(previous.skills?.[k])!==Number(skills[k]));
    const entry={date,capturedAt,source,skills};
    if(idx>=0)history[idx]=entry;else history.push(entry);
    state.skillHistory=history
      .filter(x=>x?.date&&x?.skills)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
      .slice(-730);
    if(changed){
      window.EDAN_CLOUD?.logEvent?.('skill_snapshot_saved',{date,source,skills},'skill-snapshot-'+date);
    }
    return {entry,changed};
  }

  function ensureSkillBaseline(){
    if((state.skillHistory||[]).some(x=>x?.date===todayKey()))return false;
    captureSkillSnapshot('v58_baseline');
    save();
    return true;
  }

  function markPracticeDay(){
    const k=todayKey();
    if(!state.completedDates.includes(k)) state.completedDates.push(k);
    const repaired=repairRecentStreakGap();
    if(repaired)window.EDAN_CLOUD?.logEvent?.('streak_repaired',{date:repaired,sourceDate:k,policy:'single_gap_within_2_days'},'streak-repair-'+repaired);
    captureSkillSnapshot('practice_day');
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
  function todayMissionMinutes(){
    const override=state.todayMissionOverride;
    if(override?.date===todayKey()&&Number.isFinite(Number(override.minutes)))return clamp(Number(override.minutes),10,60);
    return clamp(Number(learnerProfile?.daily_minutes)||30,10,60);
  }

  function todayMissionTaskCount(minutes){
    if(minutes<=12)return 1;
    if(minutes<=35)return 2;
    return 3;
  }

  function sessionModeGuess(sess){
    if(sess?.mode)return sess.mode;
    const title=String(sess?.title||'');
    if(/今日複習/.test(title))return 'due';
    if(/錯題複習/.test(title))return 'wrong';
    if(/聽力特訓/.test(title))return 'listening';
    if(/口說快練/.test(title))return 'speaking';
    if(/Interview Mock|Personalized Interview Mock/.test(title))return 'mock';
    if(/自適應挑戰/.test(title))return 'adaptive';
    return null;
  }

  function todayCompletedSessions(){
    return (state.sessions||[]).filter(sess=>{
      if(sess?.completedUnit===false||sess?.diagnostic)return false;
      const d=parseLearningDate(sess.date);return d&&localDateKey(d)===todayKey();
    });
  }

  function todayMissionTaskDone(task){
    return todayCompletedSessions().some(sess=>sess.missionTaskKey===task.key||sessionModeGuess(sess)===task.mode);
  }

  function buildTodayMissionPlan(minutes=todayMissionMinutes()){
    const weekly=weeklyPlanSnapshot();
    const count=todayMissionTaskCount(minutes);
    const unique=[];const modes=new Set();
    for(const task of (weekly.tasks||[])){
      if(!task?.mode||modes.has(task.mode))continue;
      unique.push(task);modes.add(task.mode);
    }
    const fallbacks=[
      {key:'today-adaptive',mode:'adaptive',title:'綜合自適應挑戰',reason:'依目前熟悉度、弱點與近期曝光自動補齊。'},
      {key:'today-listening',mode:'listening',title:'雙口音聽力維持',reason:'維持北美與印度口音的問題意圖反應。'},
      {key:'today-speaking',mode:'speaking',title:'口說輸出',reason:'把知道的內容用短回答說完整。'}
    ];
    for(const task of fallbacks){if(!modes.has(task.mode)){unique.push(task);modes.add(task.mode);}}
    const shares=count===1?[1]:count===2?[.56,.44]:[.42,.33,.25];
    const tasks=unique.slice(0,count).map((task,i)=>{
      const budget=Math.max(5,Math.round(minutes*shares[i]));
      const size=weeklyPlanQuestionSize(task.mode,budget,weekly.dueReviews);
      const estimate=task.mode==='speaking'?Math.min(budget,Math.max(6,size*6))
        :task.mode==='mock'?Math.min(budget,Math.max(12,size*4))
        :Math.min(budget,Math.max(6,size*2.5));
      return {
        key:task.key||('today-'+task.mode+'-'+i),mode:task.mode,title:task.title,
        reason:task.reason||'依今天可用時間縮成最低有效訓練量。',
        size,estimate:Math.max(5,Math.round(estimate))
      };
    });
    return {date:todayKey(),minutes,createdAt:new Date().toISOString(),tasks};
  }

  function ensureTodayMissionPlan(force=false){
    const minutes=todayMissionMinutes();
    const current=state.dailyMissionPlan;
    const valid=!force&&current?.date===todayKey()&&Number(current.minutes)===minutes&&Array.isArray(current.tasks)&&current.tasks.length;
    if(valid)return current;
    state.dailyMissionPlan=buildTodayMissionPlan(minutes);
    save();
    return state.dailyMissionPlan;
  }

  function todayMissionSnapshot(){
    const plan=ensureTodayMissionPlan();
    const tasks=(plan.tasks||[]).map(task=>({...task,done:todayMissionTaskDone(task)}));
    const done=tasks.filter(x=>x.done).length;
    const remaining=tasks.filter(x=>!x.done).reduce((n,x)=>n+(Number(x.estimate)||0),0);
    return {...plan,tasks,done,total:tasks.length,remaining,complete:tasks.length>0&&done===tasks.length};
  }

  function renderTodayMission(){
    const host=$('todayMissionTasks');if(!host)return;
    const mission=todayMissionSnapshot();
    const label=$('todayMissionDate');if(label)label.textContent=todayKey();
    const time=$('todayMissionTime');if(time)time.textContent=`今天 ${mission.minutes} 分鐘 · ${mission.total} 個任務`;
    const progress=$('todayMissionProgressText');if(progress)progress.textContent=`${mission.done} / ${mission.total} 已完成`;
    const bar=$('todayMissionProgressBar');if(bar)bar.style.width=mission.total?`${Math.round(mission.done/mission.total*100)}%`:'0%';
    const summary=$('todayMissionSummary');
    if(summary){
      if(mission.complete)summary.textContent='今天的最低有效訓練已完成。想多練可以直接使用下方 Weekly Plan 或自由訓練。';
      else{
        const next=mission.tasks.find(x=>!x.done);
        summary.textContent=`接下來先做「${next?.title||'今日任務'}」；照目前配置，剩餘約 ${mission.remaining} 分鐘。`;
      }
    }
    const nextIndex=mission.tasks.findIndex(x=>!x.done);
    host.innerHTML=mission.tasks.map((task,i)=>`<article class="today-mission-task ${task.done?'done':''}"><div class="today-mission-check">${task.done?'✓':i+1}</div><div class="today-mission-copy"><div><strong>${esc(task.title)}</strong><span>約 ${task.estimate} 分鐘 · ${task.size} 題</span></div><p>${esc(task.reason)}</p></div><button class="btn ${!task.done&&i===nextIndex?'primary':'ghost'}" type="button" data-today-mission-mode="${task.mode}" data-today-mission-size="${task.size}" data-today-mission-key="${esc(task.key)}" ${task.done?'disabled':''}>${task.done?'已完成':'開始'}</button></article>`).join('');
    host.querySelectorAll('[data-today-mission-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      startSession(btn.dataset.todayMissionMode,Number(btn.dataset.todayMissionSize)||null,{missionTaskKey:btn.dataset.todayMissionKey,missionDate:todayKey()});
      window.EDAN_CLOUD?.logEvent?.('today_mission_started',{taskKey:btn.dataset.todayMissionKey,mode:btn.dataset.todayMissionMode,minutes:mission.minutes},'today-mission-start-'+todayKey()+'-'+btn.dataset.todayMissionKey);
    }));
    const profileMinutes=clamp(Number(learnerProfile?.daily_minutes)||30,10,60);
    const profileBtn=$('todayMissionProfileMinutes');if(profileBtn)profileBtn.textContent=`預設 ${profileMinutes} 分`;
    document.querySelectorAll('[data-today-minutes]').forEach(btn=>{
      const value=btn.dataset.todayMinutes;
      const override=state.todayMissionOverride?.date===todayKey()?Number(state.todayMissionOverride.minutes):null;
      const active=value==='profile'?override===null:Number(value)===override;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');
      btn.onclick=()=>{
        state.todayMissionOverride=value==='profile'?null:{date:todayKey(),minutes:clamp(Number(value)||profileMinutes,10,60)};
        state.dailyMissionPlan=null;save();renderTodayMission();
        window.EDAN_CLOUD?.logEvent?.('today_mission_time_changed',{minutes:todayMissionMinutes(),source:value==='profile'?'profile':'override'},'today-mission-time-'+todayKey());
      };
    });
  }

  function renderDailyCoach(){renderTodayMission();}
  const errorLabels={
    tense_current:'現在工作時態',
    fragment:'句子不完整',
    repetition:'重複／卡句',
    preposition:'介系詞搭配',
    plural:'單複數',
    incomplete:'資訊沒說完',
    pace_slow:'口說速度偏慢',
    pace_fast:'口說速度偏快',
    missing_content:'關鍵內容不足',
    structure:'回答結構'
  };
  function classifyCorrectionNote(note=''){
    const n=String(note);
    if(/現在進行式|will work|時態/.test(n)) return 'tense_current';
    if(/重複|破碎/.test(n)) return 'repetition';
    if(/介系詞|搭配 in|communicate with|depend on|公司前/.test(n)) return 'preposition';
    if(/複數/.test(n)) return 'plural';
    if(/不是完整句|資訊不完整|語意不完整/.test(n)) return 'incomplete';
    if(/完整句/.test(n)) return 'fragment';
    if(/結構/.test(n)) return 'structure';
    return 'fragment';
  }
  function rememberError(key,{example='',corrected='',note=''}={}){
    if(!key)return;
    const current=state.errorMemory[key]||{count:0,lastSeen:'',example:'',corrected:'',note:''};
    current.count++;
    current.lastSeen=todayKey();
    if(example) current.example=example;
    if(corrected) current.corrected=corrected;
    if(note) current.note=note;
    state.errorMemory[key]=current;
  }
  function rememberSpeakingErrors(q,transcript,analysis,correction){
    (correction?.notes||[]).forEach(note=>rememberError(classifyCorrectionNote(note),{example:transcript,corrected:correction.corrected,note}));
    if((analysis?.missing||[]).length) rememberError('missing_content',{example:transcript,corrected:correction?.natural||'',note:'回答缺少題目關鍵內容'});
    if((analysis?.structure||analysis?.breakdown?.structure||20)<12) rememberError('structure',{example:transcript,corrected:correction?.natural||'',note:'回答結構需要更清楚'});
    if(analysis?.wordsPerMinute && analysis.wordsPerMinute<65) rememberError('pace_slow',{example:transcript,note:`約 ${analysis.wordsPerMinute} WPM`});
    if(analysis?.wordsPerMinute && analysis.wordsPerMinute>180) rememberError('pace_fast',{example:transcript,note:`約 ${analysis.wordsPerMinute} WPM`});
  }
  function recentSpeakingAnswers(limit=12){
    return state.sessions.flatMap(s=>(s.answers||[]).map(a=>({...a,sessionDate:s.date}))).filter(a=>Number.isFinite(a.extra?.systemScore)).slice(-limit);
  }
  function interviewReadiness(){
    const answers=recentSpeakingAnswers(10);
    const scoreAvg=answers.length?answers.reduce((n,a)=>n+a.extra.systemScore,0)/answers.length:55;
    const skillAvg=((state.skills.interview||1)+(state.skills.speaking||1))/2;
    const skillScore=clamp(((skillAvg-1)/4)*100,0,100);
    const practice=Math.min(100,state.completedDates.slice(-30).length*8);
    return Math.round(clamp(scoreAvg*.62+skillScore*.28+practice*.10,20,95));
  }
  function topErrorEntries(limit=3){
    return Object.entries(state.errorMemory||{}).sort((a,b)=>(b[1]?.count||0)-(a[1]?.count||0)).slice(0,limit);
  }
  function coachRecommendation(){
    const weak=topWeakness();
    const err=topErrorEntries(1)[0]?.[0]||null;
    if(weak==='sound'||weak==='intent') return {mode:'listening',size:5,label:'先做 5 題聽力',reason:'目前最需要提升的是「聽到問題後快速抓意圖」。'};
    if(weak==='output'||weak==='structure'||weak==='fluency'||err==='pace_slow') return {mode:'speaking',size:3,label:'先做 3 題口說',reason:'目前最值得投資的是把你已經知道的內容更快、更完整地說出口。'};
    if(weak==='usage'||err==='preposition'||err==='tense_current') return {mode:'adaptive',size:5,label:'先做 5 題精準挑戰',reason:'今天優先修正常出現的句型與用法，同時保留少量聽力。'};
    return {mode:'mock',size:8,label:privateQuestionIds.size?'做一輪 Personalized Mock':'做一輪 Interview Mock',reason:'目前沒有單一弱點特別突出，直接用完整面試檢查最有效。'};
  }
  function renderCoachBrief(){
    const readiness=$('readinessValue');
    const readinessNote=$('readinessNote');
    const focus=$('coachFocusText');
    const errors=$('errorMemoryList');
    const rec=$('coachRecommendationText');
    if(readiness){
      const r=interviewReadiness();
      readiness.textContent=`${r}%`;
      readinessNote.textContent=r>=80?'可以開始追求自然度與更難 follow-up。':r>=65?'已能完成多數回答，下一步是穩定與速度。':r>=50?'內容有基礎，但面試時仍容易因英文讓實力打折。':'目前先把短回答、聽力與核心句型打穩。';
    }
    const weak=topWeakness();
    const topErr=topErrorEntries(1)[0];
    if(focus) focus.textContent=weak?`主要弱點：${weaknessLabels[weak]||weak}${topErr?`；常見錯誤：${errorLabels[topErr[0]]||topErr[0]}`:''}`:'完成更多錄音後，我會從你的真實表現找出最值得補強的地方。';
    if(errors){
      const entries=topErrorEntries(3);
      errors.innerHTML=entries.length?entries.map(([k,v])=>`<div class="coach-error-item"><b>${esc(errorLabels[k]||k)}</b><span>出現 ${v.count} 次${v.note?` · ${esc(v.note)}`:''}</span></div>`).join(''):'<div class="support">目前還沒有累積足夠的個人口說錯誤。完成幾題錄音後，這裡會開始只記你的錯誤。</div>';
    }
    const recommendation=coachRecommendation();
    if(rec) rec.textContent=recommendation.reason;
    const btn=$('coachStartBtn'); if(btn){btn.textContent=recommendation.label;btn.dataset.mode=recommendation.mode;btn.dataset.size=String(recommendation.size);}
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
        schemaVersion:4,
        skills:{...base.skills,...(parsed.skills||{})},
        qstats: parsed.qstats||{},
        chunkKnown: parsed.chunkKnown||{},
        vocabKnown: parsed.vocabKnown||{},
        vocabStats: parsed.vocabStats||{},
        weaknessCounts: parsed.weaknessCounts||{},
        errorMemory: parsed.errorMemory||{},
        littleEHistory: Array.isArray(parsed.littleEHistory)?parsed.littleEHistory.slice(-30):[],
        littleEMemory: Array.isArray(parsed.littleEMemory)?parsed.littleEMemory.slice(-60):[],
        sessions: Array.isArray(parsed.sessions)?parsed.sessions:[],
        retryHistory: Array.isArray(parsed.retryHistory)?parsed.retryHistory.slice(-80):[],
        quoteHistory: Array.isArray(parsed.quoteHistory)?parsed.quoteHistory.slice(-140):[],
        quoteFavorites: Array.isArray(parsed.quoteFavorites)?[...new Set(parsed.quoteFavorites)].slice(-100):[],
        quoteWordBank: parsed.quoteWordBank&&typeof parsed.quoteWordBank==='object'?parsed.quoteWordBank:{},
        skillHistory: Array.isArray(parsed.skillHistory)?parsed.skillHistory.slice(-730):[],
        dailyMissionPlan: parsed.dailyMissionPlan&&typeof parsed.dailyMissionPlan==='object'?parsed.dailyMissionPlan:null,
        todayMissionOverride: parsed.todayMissionOverride&&typeof parsed.todayMissionOverride==='object'?parsed.todayMissionOverride:null,
        completedDates: Array.isArray(parsed.completedDates)?parsed.completedDates:[],
        streakRepairs: Array.isArray(parsed.streakRepairs)?parsed.streakRepairs.slice(-20):[],
        clientUpdatedAt: parsed.clientUpdatedAt||null,
        settings:migratedSettings,
        lastContentVersion:CONTENT.contentVersion
      };
    }catch(e){ return defaultState(); }
  }
  function save(){
    state.clientUpdatedAt=new Date().toISOString();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    window.EDAN_CLOUD?.saveState?.(state);
  }
  function applyCloudState(incoming){
    if(!incoming || typeof incoming!=='object') return;
    const base=defaultState();
    state={
      ...base,
      ...incoming,
      schemaVersion:4,
      skills:{...base.skills,...(incoming.skills||{})},
      qstats:incoming.qstats||{},
      chunkKnown:incoming.chunkKnown||{},
      vocabKnown:incoming.vocabKnown||{},
      vocabStats:incoming.vocabStats||{},
      weaknessCounts:incoming.weaknessCounts||{},
      errorMemory:incoming.errorMemory||{},
      littleEHistory:Array.isArray(incoming.littleEHistory)?incoming.littleEHistory.slice(-30):[],
      littleEMemory:Array.isArray(incoming.littleEMemory)?incoming.littleEMemory.slice(-60):[],
      sessions:Array.isArray(incoming.sessions)?incoming.sessions:[],
      retryHistory:Array.isArray(incoming.retryHistory)?incoming.retryHistory.slice(-80):[],
      quoteHistory:Array.isArray(incoming.quoteHistory)?incoming.quoteHistory.slice(-140):[],
      quoteFavorites:Array.isArray(incoming.quoteFavorites)?[...new Set(incoming.quoteFavorites)].slice(-100):[],
      quoteWordBank:incoming.quoteWordBank&&typeof incoming.quoteWordBank==='object'?incoming.quoteWordBank:{},
      skillHistory:Array.isArray(incoming.skillHistory)?incoming.skillHistory.slice(-730):[],
      dailyMissionPlan:incoming.dailyMissionPlan&&typeof incoming.dailyMissionPlan==='object'?incoming.dailyMissionPlan:null,
      todayMissionOverride:incoming.todayMissionOverride&&typeof incoming.todayMissionOverride==='object'?incoming.todayMissionOverride:null,
      completedDates:Array.isArray(incoming.completedDates)?incoming.completedDates:[],
      streakRepairs:Array.isArray(incoming.streakRepairs)?incoming.streakRepairs.slice(-20):[],
      clientUpdatedAt:incoming.clientUpdatedAt||null,
      settings:{...base.settings,...(incoming.settings||{})},
      lastContentVersion:CONTENT.contentVersion
    };
    const repaired=repairRecentStreakGap();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if(repaired){
      window.EDAN_CLOUD?.saveState?.(state);
      window.EDAN_CLOUD?.logEvent?.('streak_repaired',{date:repaired,sourceDate:todayKey(),policy:'single_gap_within_2_days'},'streak-repair-'+repaired);
    }
    renderOverview();
    renderDailyQuote(false);
    renderChunks();
    renderVocabulary(12,true,false);
  }
  window.addEventListener('edan:cloud-state', e=>{
    applyCloudState(e.detail?.state);
    ensureSkillBaseline();
    renderSkillHistoryChart();
  });
  function answerTranslation(q){ return q?.modelZh || CONTENT.answerTranslations?.[q?.id] || ''; }
  function questionTranslation(q){ return q?.textZh || CONTENT.questionTranslations?.[q?.id] || ''; }
  function vocabExampleTranslation(v){ return v?.exampleZh || CONTENT.vocabExampleTranslations?.[v?.id] || ''; }
  const MODEL_CUE_ZH=Object.freeze({
    "English at work": "工作中使用英文",
    "technical documents": "技術文件",
    "international vendors": "國際供應商",
    "not the only PM": "不是唯一的 PM",
    "multiple PMs": "多位 PM",
    "own workstreams": "負責自己的工作流",
    "duration": "持續時間",
    "timeframe": "時程",
    "expected to run": "預計進行",
    "bank client": "銀行客戶",
    "stakeholders": "利害關係人",
    "delivery": "交付",
    "other experience": "其他經驗",
    "banking": "銀行業",
    "securities": "證券業",
    "IBM Taiwan": "IBM 台灣",
    "8+ years": "8 年以上",
    "financial IT": "金融 IT",
    "core banking": "核心銀行系統",
    "customer delivery": "客戶交付",
    "clarify intent": "釐清問題意圖",
    "PM scope": "PM 職責範圍",
    "slower": "慢一點",
    "repeat": "重複一次",
    "mainly handle": "主要負責",
    "cross-team": "跨團隊",
    "issue management": "議題管理",
    "technical coordination": "技術協調",
    "project delivery": "專案交付",
    "CTBC": "中國信託",
    "vendors": "供應商",
    "to what extent": "到什麼程度",
    "day-to-day responsibilities": "日常工作職責",
    "scope": "範圍",
    "workstreams": "工作流",
    "delivery timeframe": "交付時程",
    "overall": "整體而言",
    "started as software engineer": "從軟體工程師開始",
    "technical foundation": "技術基礎",
    "customer communication": "客戶溝通",
    "consulting": "顧問工作",
    "business impact": "業務影響",
    "risk": "風險",
    "decision": "決策",
    "timeline": "時程",
    "variable bonus": "浮動獎金",
    "equity": "股權／股票獎酬",
    "base salary": "底薪",
    "total compensation": "總薪酬",
    "expected range": "期望範圍",
    "overall package": "整體薪酬方案",
    "confirm meaning": "確認意思",
    "overall program manager": "整體 Program Manager",
    "testing": "測試",
    "dependencies": "相依關係",
    "unclear ownership": "責任歸屬不清",
    "facts": "事實",
    "owner": "負責人",
    "next actions": "下一步行動",
    "tracked": "持續追蹤",
    "impact": "影響",
    "evidence": "證據",
    "decision owner": "決策負責人",
    "escalate": "升級處理",
    "executive stakeholder": "高階利害關係人",
    "recovery plan": "復原計畫",
    "customer impact": "客戶影響",
    "criticality": "關鍵程度",
    "dependency": "相依關係",
    "adjust the level of detail": "調整資訊細節層級",
    "audience": "溝通對象",
    "multi-part question": "多段式問題",
    "remind me": "提醒我",
    "success": "成功",
    "delivered on time": "準時交付",
    "reliably": "可靠地",
    "no clear owner": "沒有明確負責人",
    "timeline at risk": "時程有風險",
    "decision needed": "需要做決策",
    "enterprise technology": "企業級技術",
    "customer engagement": "客戶互動",
    "modernize": "現代化",
    "learned a lot": "學到很多",
    "next stage": "下一個階段",
    "ownership": "責任承擔",
    "global technology product": "全球科技產品",
    "trade-off": "取捨",
    "technical risk": "技術風險",
    "reversibility": "可逆性",
    "milestone": "里程碑",
    "resource use": "資源使用",
    "milestones": "里程碑",
    "change requests": "變更需求",
    "commercial terms": "商務條件",
    "business urgency": "業務急迫性",
    "failure impact": "失敗影響",
    "rollback": "回復／回滾",
    "operational risk": "營運風險",
    "technical design": "技術設計",
    "delivery alignment": "交付對齊",
    "new scope": "新增範圍",
    "effort": "工作量",
    "options": "選項",
    "paraphrase": "換句話說",
    "confirm intent": "確認意圖",
    "trade-offs": "各種取捨",
    "explicit": "明確說明",
    "issue aging": "議題未解決時間",
    "resource utilization": "資源使用率",
    "customer satisfaction": "客戶滿意度",
    "critical path": "關鍵路徑",
    "parallel": "平行進行",
    "resource constraints": "資源限制",
    "migration risk": "移轉風險",
    "scenarios": "情境方案",
    "acknowledge objective": "先認同目標",
    "alternatives": "替代方案",
    "residual risk": "剩餘風險",
    "customer confidence": "客戶信心",
    "expectations": "期待",
    "visible outcomes": "可見成果",
    "predictable": "可預測",
    "gap": "能力缺口",
    "commercial metrics": "商務指標",
    "margin": "專案毛利",
    "billability": "可計費率",
    "engagement lifecycle": "客戶專案全生命週期",
    "technical depth": "技術深度",
    "customer-facing delivery": "客戶端交付",
    "customer outcomes": "客戶成果",
    "usually": "通常",
    "after work": "下班後",
    "relax": "放鬆",
    "how long": "多久",
    "usually take": "通常需要",
    "okay with that": "可以接受這樣嗎",
    "works for me": "我可以接受",
    "what do you mean": "你的意思是什麼",
    "explain": "說明",
    "weekends": "週末",
    "friends": "朋友",
    "exercise": "運動",
    "these days": "最近",
    "busy": "忙碌",
    "improving": "持續進步",
    "not sure yet": "還不確定",
    "check": "確認",
    "get back to you": "再回覆你",
    "getting used to": "逐漸習慣",
    "practice": "練習",
    "responding quickly": "快速回應",
    "would you rather": "你比較想要",
    "now": "現在",
    "tomorrow": "明天",
    "decided yet": "已經決定了嗎",
    "not yet": "還沒有",
    "took a while": "花了一段時間",
    "comfortable": "自在／習慣"
  });
  const MODEL_WORD_ZH=Object.freeze({
    "a": "一個／一位",
    "an": "一個／一位",
    "the": "這個／該",
    "i": "我",
    "my": "我的",
    "me": "我",
    "we": "我們",
    "our": "我們的",
    "you": "你／你們",
    "your": "你的／你們的",
    "they": "他們",
    "their": "他們的",
    "it": "它／這件事",
    "this": "這個",
    "that": "那個／這件事",
    "these": "這些",
    "those": "那些",
    "is": "是",
    "are": "是",
    "was": "是／曾經是",
    "were": "是／曾經是",
    "be": "是／成為",
    "been": "曾經是",
    "being": "處於",
    "have": "有",
    "has": "有",
    "had": "有／曾有",
    "do": "做",
    "does": "做",
    "did": "做了",
    "can": "可以／能夠",
    "could": "可以／能夠",
    "would": "會／將會",
    "should": "應該",
    "will": "會／將",
    "may": "可能",
    "might": "可能",
    "and": "和／以及",
    "or": "或",
    "but": "但是",
    "so": "所以",
    "because": "因為",
    "if": "如果",
    "when": "當…時",
    "while": "當…時／同時",
    "than": "比",
    "then": "接著／然後",
    "also": "也",
    "not": "不／不是",
    "no": "沒有／不",
    "yes": "是／有",
    "more": "更多／更",
    "much": "很多／多",
    "very": "非常",
    "just": "只是／剛剛",
    "still": "仍然／還",
    "already": "已經",
    "yet": "還／尚未",
    "in": "在…裡／在",
    "on": "在…上／關於",
    "at": "在",
    "for": "為了／對於",
    "with": "和／與",
    "from": "從",
    "by": "由／透過",
    "to": "到／向／去",
    "of": "的",
    "as": "作為／如同",
    "into": "進入／轉成",
    "over": "超過／在…之上",
    "about": "關於／大約",
    "within": "在…範圍內",
    "without": "沒有／不使用",
    "before": "之前",
    "after": "之後",
    "until": "直到",
    "across": "跨越／跨團隊",
    "package": "薪酬方案／整體方案",
    "includes": "包含",
    "include": "包含",
    "base": "基本的／基礎",
    "salary": "底薪／薪資",
    "bonus": "獎金",
    "stock": "股票／股票獎酬",
    "equity": "股權／股票獎酬",
    "plus": "加上",
    "project": "專案",
    "program": "計畫／大型專案",
    "manager": "經理",
    "management": "管理",
    "role": "職位／角色",
    "scope": "範圍",
    "workstream": "工作流",
    "workstreams": "工作流",
    "delivery": "交付",
    "timeline": "時程",
    "timeframe": "時程",
    "duration": "期間",
    "milestone": "里程碑",
    "milestones": "里程碑",
    "deadline": "截止日期",
    "customer": "客戶",
    "customers": "客戶",
    "client": "客戶",
    "stakeholder": "利害關係人",
    "stakeholders": "利害關係人",
    "team": "團隊",
    "teams": "團隊",
    "vendor": "供應商",
    "vendors": "供應商",
    "bank": "銀行",
    "banking": "銀行業",
    "financial": "金融的",
    "insurance": "保險",
    "securities": "證券",
    "business": "業務／商務",
    "technical": "技術的",
    "technology": "科技／技術",
    "system": "系統",
    "systems": "系統",
    "software": "軟體",
    "engineer": "工程師",
    "engineers": "工程師",
    "architect": "架構師",
    "design": "設計",
    "platform": "平台",
    "platforms": "平台",
    "core": "核心",
    "batch": "批次",
    "issue": "問題／議題",
    "issues": "問題／議題",
    "risk": "風險",
    "risks": "風險",
    "impact": "影響",
    "decision": "決策",
    "decisions": "決策",
    "owner": "負責人",
    "ownership": "責任歸屬",
    "dependency": "相依關係",
    "dependencies": "相依關係",
    "status": "狀態",
    "recovery": "復原",
    "rollback": "回復／回滾",
    "failure": "失敗",
    "communicate": "溝通",
    "communication": "溝通",
    "coordinate": "協調",
    "coordination": "協調",
    "align": "對齊／取得共識",
    "alignment": "對齊",
    "escalate": "升級處理",
    "prioritize": "排定優先順序",
    "manage": "管理",
    "handle": "處理",
    "track": "追蹤",
    "tracked": "已追蹤／持續追蹤",
    "confirm": "確認",
    "clarify": "釐清",
    "explain": "說明／解釋",
    "understand": "理解",
    "discuss": "討論",
    "compare": "比較",
    "summarize": "摘要",
    "experience": "經驗",
    "background": "背景",
    "responsibility": "責任",
    "responsibilities": "職責",
    "advantage": "優勢",
    "strength": "優勢／強項",
    "gap": "差距／能力缺口",
    "skills": "技能",
    "knowledge": "知識",
    "foundation": "基礎",
    "depth": "深度",
    "value": "價值",
    "outcomes": "成果",
    "success": "成功",
    "confidence": "信心",
    "expectations": "期待",
    "current": "目前的",
    "currently": "目前",
    "overall": "整體的／整體而言",
    "main": "主要的",
    "mainly": "主要地",
    "specific": "特定的",
    "major": "主要的／重大",
    "critical": "關鍵的／重大",
    "clear": "清楚的／明確的",
    "unclear": "不清楚的",
    "formal": "正式的",
    "professional": "專業的",
    "commercial": "商務的",
    "operational": "營運的",
    "strategic": "策略性的",
    "global": "全球的",
    "international": "國際的",
    "traditional": "傳統的",
    "modernization": "現代化",
    "work": "工作",
    "working": "工作的／運作中的",
    "worked": "曾工作／合作",
    "use": "使用",
    "used": "使用過／習慣於",
    "using": "使用",
    "start": "開始",
    "started": "開始了",
    "move": "轉移／轉換",
    "moved": "轉向／移動",
    "learn": "學習",
    "learned": "學到了",
    "practice": "練習",
    "improve": "改善／提升",
    "improving": "正在提升",
    "exercise": "運動",
    "relax": "放鬆",
    "watch": "看／觀看",
    "spend": "花費／度過",
    "study": "學習",
    "make": "做／讓",
    "made": "做了",
    "take": "花費／採取",
    "takes": "需要／花費",
    "took": "花了",
    "get": "得到／變得",
    "getting": "正在變得／正在習慣",
    "give": "給予",
    "giving": "給予／提供",
    "find": "找到",
    "found": "找到／發現",
    "keep": "保持／持續",
    "help": "幫助",
    "helps": "幫助",
    "protect": "保護",
    "protects": "保護",
    "create": "建立／造成",
    "creates": "建立／造成",
    "first": "首先／第一",
    "next": "下一個／接著",
    "last": "最後的／上一個",
    "one": "一個",
    "two": "兩個",
    "three": "三個",
    "few": "少數／幾個",
    "several": "數個／幾個",
    "multiple": "多個",
    "every": "每一個",
    "each": "每一個",
    "same": "相同的",
    "different": "不同的",
    "another": "另一個",
    "how": "如何／怎麼",
    "what": "什麼",
    "why": "為什麼",
    "where": "哪裡",
    "who": "誰",
    "which": "哪一個",
    "whether": "是否",
    "how much": "多少",
    "how long": "多久",
    "open": "願意／開放",
    "interested": "有興趣的",
    "comfortable": "自在的／舒服的",
    "familiar": "熟悉的",
    "ready": "準備好的",
    "simple": "簡單的",
    "strong": "強的／強項",
    "weaker": "較弱的",
    "safe": "安全的",
    "safer": "較安全的",
    "unacceptable": "無法接受的",
    "predictable": "可預測的",
    "visible": "可見的",
    "reliable": "可靠的",
    "reliably": "可靠地",
    "commit": "承諾",
    "commitments": "承諾",
    "cost": "成本",
    "resource": "資源",
    "resources": "資源",
    "margin": "毛利",
    "billability": "可計費率",
    "metrics": "指標",
    "quality": "品質",
    "effort": "工作量",
    "requirements": "需求",
    "request": "需求／請求",
    "requests": "需求／請求",
    "change": "變更",
    "changes": "變更",
    "solution": "方案／解決方案",
    "options": "選項",
    "alternative": "替代方案",
    "alternatives": "替代方案",
    "trade": "取捨",
    "offs": "取捨",
    "regularly": "固定地／經常",
    "actively": "積極地",
    "quickly": "快速地",
    "directly": "直接地",
    "closely": "密切地",
    "naturally": "自然地",
    "approximately": "大約",
    "especially": "尤其",
    "usually": "通常",
    "sometimes": "有時",
    "today": "今天",
    "tomorrow": "明天",
    "days": "天",
    "years": "年",
    "minutes": "分鐘",
    "english": "英文",
    "mandarin": "中文／華語",
    "language": "語言",
    "documents": "文件",
    "documentation": "文件／紀錄",
    "interview": "面試",
    "interviews": "面試",
    "consulting": "顧問工作",
    "consultant": "顧問",
    "career": "職涯",
    "ibm": "IBM",
    "mongodb": "MongoDB",
    "ctbc": "中國信託",
    "taiwan": "台灣"
  });
  const MODEL_CONTEXT_PHRASE_ZH=Object.freeze({
    "base salary": "底薪",
    "variable bonus": "浮動獎金",
    "stock options": "股票選擇權／股票獎酬",
    "total compensation": "總薪酬",
    "overall package": "整體薪酬方案",
    "project manager": "專案經理",
    "project management": "專案管理",
    "customer-facing delivery": "客戶端交付",
    "technical depth": "技術深度",
    "business impact": "業務影響",
    "core banking": "核心銀行系統",
    "delivery decision": "交付決策",
    "delivery decisions": "交付決策",
    "technical execution": "技術執行",
    "customer outcomes": "客戶成果",
    "technical risk": "技術風險",
    "stakeholder expectations": "利害關係人期待",
    "customer confidence": "客戶信心",
    "commercial metrics": "商務指標",
    "resource utilization": "資源使用率",
    "critical path": "關鍵路徑",
    "change requests": "變更需求",
    "operational risk": "營運風險",
    "executive stakeholder": "高階利害關係人",
    "issue management": "議題管理",
    "technical coordination": "技術協調",
    "project delivery": "專案交付",
    "day-to-day responsibilities": "日常工作職責",
    "delivery timeframe": "交付時程",
    "financial IT": "金融 IT",
    "international vendors": "國際供應商"
  });
  function modelWordMeaning(word,q){
    const raw=String(word||'').trim();
    const key=raw.toLowerCase().replace(/[’]/g,"'");
    const modelText=String(q?.model||'').toLowerCase().replace(/[’]/g,"'");
    const phraseEntries=[
      ...Object.entries(MODEL_CONTEXT_PHRASE_ZH),
      ...Object.entries(MODEL_CUE_ZH)
    ]
      .filter(([phrase])=>{
        const normalized=String(phrase).toLowerCase();
        const parts=normalized.split(/\s+/).filter(Boolean);
        return parts.length>1 && parts.includes(key) && modelText.includes(normalized);
      })
      .sort((a,b)=>b[0].split(/\s+/).length-a[0].split(/\s+/).length || b[0].length-a[0].length);
    if(phraseEntries.length){
      const [phrase,zh]=phraseEntries[0];
      return zh+'（'+phrase+'）';
    }

    const vocab=(CONTENT.vocabulary||[]).find(v=>String(v.word||'').toLowerCase()===key);
    if(vocab?.zh)return vocab.zh;
    if(MODEL_WORD_ZH[key])return MODEL_WORD_ZH[key];
    if(MODEL_CUE_ZH[raw])return MODEL_CUE_ZH[raw];

    const keywordPhrase=(q?.keywords||[])
      .filter(Boolean)
      .map(c=>String(c))
      .find(c=>c.toLowerCase().split(/\s+/).includes(key)&&MODEL_CUE_ZH[c]);
    if(keywordPhrase)return MODEL_CUE_ZH[keywordPhrase]+'（'+keywordPhrase+'）';
    return '中文意思待補';
  }

  function modelPracticeCues(q){
    const keys=(q.keywords||[]).filter(Boolean).slice(0,4);
    const source=keys.length?keys:meaningfulTokens(q.model||'').filter((w,i,a)=>a.indexOf(w)===i).slice(0,4);
    return source.map(en=>({
      en,
      zh:MODEL_CUE_ZH[en]
        || (CONTENT.vocabulary||[]).find(v=>String(v.word||'').toLowerCase()===String(en).toLowerCase())?.zh
        || (CONTENT.chunks||[]).find(c=>String(c.en||'').replace(/[….,!?]/g,'').trim().toLowerCase()===String(en).replace(/[….,!?]/g,'').trim().toLowerCase())?.zh
        || '中文意思待補'
    }));
  }
  function pronounceableEnglishHtml(text){
    const parts=String(text||'').match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+|\s+|[^A-Za-z\d\s]+/g)||[];
    return parts.map(part=>{
      if(/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(part)){
        return `<button class="pronounce-word" data-pronounce-word="${esc(part)}" type="button" title="點一下聽發音">${esc(part)}</button>`;
      }
      return esc(part);
    }).join('');
  }
  function modelAnswerHtml(q,label='推薦答案'){
    const zh=answerTranslation(q);
    const cues=modelPracticeCues(q);
    const practiceCount=qstat(q.id).modelPracticeCount||0;
    return `<div class="model-answer"><div class="model-answer-head"><strong>${esc(label)}</strong><div class="model-answer-audio"><button class="model-audio-btn" data-model-audio="northAmerica" type="button">▶ 北美朗讀</button><button class="model-audio-btn" data-model-audio="india" type="button">▶ 印度朗讀</button></div></div><div class="answer-en" data-model-answer-text>${pronounceableEnglishHtml(q.model)}</div><div class="model-word-hint">🔊 點任何英文單字：播放發音＋顯示中文意思</div><div class="model-audio-status" data-model-audio-status>點擊播放英文 Model answer</div>${zh?`<div class="answer-zh"><span>繁體中文</span>${esc(zh)}</div>`:''}<div class="keywords">Keywords: ${esc((q.keywords||[]).join(' · '))}</div>
      <div class="model-practice-box">
        <div class="model-practice-head"><div><strong>記憶＋口說練習</strong><span>不要背整段，先記骨架再說。</span></div><span class="model-practice-count" data-model-practice-count>已練 ${practiceCount} 次</span></div>
        <div class="model-memory-cues">${cues.map((c,i)=>`<button class="model-cue-pronounce" data-pronounce-cue="${esc(c.en)}" data-cue-zh="${esc(c.zh)}" type="button" title="點一下聽英文發音"><b>${i+1}</b><span class="model-cue-copy"><span class="model-cue-en">${esc(c.en)}</span><span class="model-cue-zh">${esc(c.zh)}</span></span></button>`).join('')}</div>
        <div class="model-practice-tip"><b>技巧：</b>先聽 1 次 → 點不熟的單字確認發音 → 看著 cue words 說 1 次 → 遮住英文再說 1 次。面試不用逐字一樣，重點是順序與意思能自己講出來。</div>
        <div class="btn-row model-practice-actions">
          <button class="btn ghost" data-model-practice="slow" type="button">▶ 0.88x 跟讀</button>
          <button class="btn ghost" data-model-practice="hide" type="button">🙈 遮住英文</button>
          <button class="btn secondary" data-model-practice="record" type="button">🎙 錄一遍</button>
          <button class="btn ghost hidden" data-model-practice="stop" type="button">■ 停止錄音</button>
        </div>
        <div class="model-practice-status" data-model-practice-status>建議先不要追求背起來；能看 cue words 自己重組句子，才是真正記住。</div>
        <div class="model-practice-playback hidden" data-model-practice-playback><strong>你的跟讀錄音</strong><audio controls preload="metadata" data-model-practice-audio></audio><span>聽完只比較兩件事：有沒有漏重點、能不能不停太久。</span></div>
      </div>
    </div>`;
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
    const streakSub=$('streakSub');
    if(streakSub){
      const latest=[...(state.streakRepairs||[])].sort((a,b)=>String(b.repairedAt||'').localeCompare(String(a.repairedAt||'')))[0];
      streakSub.textContent=latest&&[todayKey(),dateKeyDaysAgo(1),dateKeyDaysAgo(2)].includes(latest.date)
        ? `已補回 ${latest.date} · 僅允許 2 天內單一斷點`
        : '完成任一完整單元就記錄 1 天 · 單一斷點可在 2 天內補救';
    }
    $('listeningLevelValue').textContent = `L${state.skills.listening.toFixed(1)}`;
    $('interviewLevelValue').textContent = `L${Math.max(state.skills.interview,state.skills.speaking).toFixed(1)}`;
    $('contentVersionBadge').textContent = `題庫 ${CONTENT.contentVersion}`;
    $('versionText').textContent = `${CONTENT.contentVersion} · ${CONTENT.questions.length} 題 · ${CONTENT.chunks.length} chunks · ${(CONTENT.vocabulary||[]).length} words`;
    renderSkills();
    renderSkillHistoryChart();
    renderHistory();
    renderProgressAnalytics();
    renderWeeklyPlan();
    renderDailyCoach();
    renderCoachBrief();
  }

  function parseLearningDate(value){
    if(!value)return null;
    if(value instanceof Date)return Number.isNaN(value.getTime())?null:value;
    const text=String(value).trim();
    const m=text.match(/(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if(m){
      const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
      return Number.isNaN(d.getTime())?null:d;
    }
    const d=new Date(text);
    return Number.isNaN(d.getTime())?null:d;
  }

  function dayStart(value=new Date()){
    const d=parseLearningDate(value)||new Date();
    return new Date(d.getFullYear(),d.getMonth(),d.getDate());
  }

  function inAnalyticsWindow(value,days,offset=0){
    const d=dayStart(value),today=dayStart();
    const end=new Date(today);end.setDate(end.getDate()-offset);
    const start=new Date(end);start.setDate(start.getDate()-(days-1));
    return d>=start&&d<=end;
  }

  function avg(values){
    const nums=(values||[]).map(Number).filter(Number.isFinite);
    return nums.length?nums.reduce((n,v)=>n+v,0)/nums.length:null;
  }

  function progressAnalyticsSnapshot(days=7){
    const sessions=(state.sessions||[]).filter(s=>parseLearningDate(s.date));
    const currentSessions=sessions.filter(s=>inAnalyticsWindow(s.date,days,0));
    const previousSessions=sessions.filter(s=>inAnalyticsWindow(s.date,days,days));
    const currentSessionAvg=avg(currentSessions.map(s=>s.score));
    const previousSessionAvg=avg(previousSessions.map(s=>s.score));

    const speakingRows=sessions.flatMap(s=>(s.answers||[]).map(a=>({date:s.date,score:a.extra?.systemScore})))
      .filter(x=>Number.isFinite(x.score));
    const currentSpeaking=speakingRows.filter(x=>inAnalyticsWindow(x.date,days,0));
    const previousSpeaking=speakingRows.filter(x=>inAnalyticsWindow(x.date,days,days));
    const currentSpeakingAvg=avg(currentSpeaking.map(x=>x.score));
    const previousSpeakingAvg=avg(previousSpeaking.map(x=>x.score));

    const currentRetries=(state.retryHistory||[]).filter(r=>inAnalyticsWindow(r.completedAt,days,0)&&Number.isFinite(Number(r.delta)));
    const retryLift=avg(currentRetries.map(r=>r.delta));
    const improvedRetries=currentRetries.filter(r=>Number(r.delta)>0).length;

    const practiceDays=(state.completedDates||[]).filter(d=>inAnalyticsWindow(d,days,0)).length;
    const previousPracticeDays=(state.completedDates||[]).filter(d=>inAnalyticsWindow(d,days,days)).length;

    const today=todayKey();
    const questionDue=Object.values(state.qstats||{}).filter(st=>st?.seen>0&&st?.due&&String(st.due)<=today).length;
    const vocabDue=Object.values(state.vocabStats||{}).filter(st=>st?.attempts>0&&st?.due&&String(st.due)<=today).length;
    const dueReviews=questionDue+vocabDue;
    const learnedWords=Object.values(state.vocabKnown||{}).filter(Boolean).length;
    const quoteWords=Object.keys(state.quoteWordBank||{}).length;

    const scoreDelta=currentSessionAvg!==null&&previousSessionAvg!==null?currentSessionAvg-previousSessionAvg:null;
    const speakingDelta=currentSpeakingAvg!==null&&previousSpeakingAvg!==null?currentSpeakingAvg-previousSpeakingAvg:null;
    const weak=topWeakness();
    const recommendation=coachRecommendation();

    return {
      days,practiceDays,previousPracticeDays,
      sessions:currentSessions.length,sessionAvg:currentSessionAvg,previousSessionAvg,scoreDelta,
      speakingCount:currentSpeaking.length,speakingAvg:currentSpeakingAvg,previousSpeakingAvg,speakingDelta,
      retryCount:currentRetries.length,retryLift,improvedRetries,
      dueReviews,questionDue,vocabDue,learnedWords,quoteWords,weak,recommendation
    };
  }

  function analyticsDeltaLabel(delta,suffix=''){
    if(delta===null||delta===undefined||!Number.isFinite(delta))return '尚無前一期可比較';
    const rounded=Math.round(delta*10)/10;
    return `${rounded>0?'+':''}${rounded}${suffix} vs 前一期`;
  }

  function progressActivityHtml(){
    const completed=new Set(state.completedDates||[]);
    const repaired=new Set((state.streakRepairs||[]).map(x=>x.date));
    const rows=[];
    for(let i=13;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      const key=localDateKey(d),done=completed.has(key),isToday=i===0;
      rows.push(`<div class="progress-day ${done?'done':''} ${repaired.has(key)?'repaired':''} ${isToday?'today':''}" title="${key}${done?' · 已完成':''}"><span>${String(d.getDate()).padStart(2,'0')}</span><small>${['日','一','二','三','四','五','六'][d.getDay()]}</small></div>`);
    }
    return rows.join('');
  }

  function renderProgressAnalytics(){
    const host=$('progressAnalyticsSection');if(!host)return;
    const s=progressAnalyticsSnapshot(progressAnalyticsRange);
    const periodLabel=s.days===7?'近 7 天':'近 30 天';
    const practiceDelta=s.practiceDays-s.previousPracticeDays;
    const retryText=s.retryCount
      ? `重答 ${s.retryCount} 次 · ${s.improvedRetries} 次進步`
      : '本期尚無重答比較';
    const retryValue=s.retryLift===null?'—':`${s.retryLift>0?'+':''}${Math.round(s.retryLift*10)/10}`;
    const evidence=s.retryLift!==null&&s.retryLift>0
      ? `重答平均提升 ${retryValue} 分，代表「修正 → 重答」已開始產生可量化效果。`
      : s.scoreDelta!==null&&s.scoreDelta>0
        ? `回合平均比前一期提升 ${Math.round(s.scoreDelta*10)/10} 分，整體表現正在往上。`
        : s.speakingDelta!==null&&s.speakingDelta>0
          ? `口說平均比前一期提升 ${Math.round(s.speakingDelta*10)/10} 分，口說輸出有改善。`
          : s.practiceDays>0
            ? `${periodLabel}完成 ${s.practiceDays} 個學習日；目前先累積穩定資料，再判斷趨勢。`
            : '這個期間還沒有完整學習日，先完成一個小單元建立趨勢基線。';

    const focus=s.dueReviews>0
      ? `目前有 ${s.dueReviews} 個到期複習（題目 ${s.questionDue}、單字 ${s.vocabDue}），先清到期項目最有效。`
      : s.weak
        ? `目前累積最明顯的弱點是「${weaknessLabels[s.weak]||s.weak}」，建議下輪繼續針對它。`
        : '目前沒有單一弱點特別突出，可以用完整 Interview Mock 檢查穩定度。';

    $('analyticsRangeLabel').textContent=periodLabel;
    $('analyticsPracticeDays').textContent=String(s.practiceDays);
    $('analyticsPracticeSub').textContent=`${practiceDelta>0?'+':''}${practiceDelta} 天 vs 前一期`;
    $('analyticsSessionAvg').textContent=s.sessionAvg===null?'—':`${Math.round(s.sessionAvg)}%`;
    $('analyticsSessionSub').textContent=analyticsDeltaLabel(s.scoreDelta,' 分');
    $('analyticsSpeakingAvg').textContent=s.speakingAvg===null?'—':`${Math.round(s.speakingAvg)}`;
    $('analyticsSpeakingSub').textContent=analyticsDeltaLabel(s.speakingDelta,' 分');
    $('analyticsRetryLift').textContent=retryValue;
    $('analyticsRetrySub').textContent=retryText;
    $('analyticsEvidence').textContent=evidence;
    $('analyticsFocus').textContent=focus;
    $('analyticsDueCount').textContent=String(s.dueReviews);
    $('analyticsLearnedWords').textContent=String(s.learnedWords);
    $('analyticsQuoteWords').textContent=String(s.quoteWords);
    $('analyticsActivity').innerHTML=progressActivityHtml();

    const action=$('analyticsActionBtn');
    if(action){
      action.textContent=s.dueReviews>0?'先做今日複習':s.recommendation.label;
      action.onclick=()=>{
        if(s.dueReviews>0)startSession('due',Math.min(10,Math.max(3,s.dueReviews)));
        else startSession(s.recommendation.mode,s.recommendation.size);
      };
    }

    document.querySelectorAll('[data-analytics-range]').forEach(btn=>{
      const active=Number(btn.dataset.analyticsRange)===progressAnalyticsRange;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.onclick=()=>{
        progressAnalyticsRange=Number(btn.dataset.analyticsRange)||7;
        renderProgressAnalytics();
      };
    });
  }


  function weeklyPlanWeekBounds(){
    const start=dayStart();const offset=(start.getDay()+6)%7;start.setDate(start.getDate()-offset);
    const end=new Date(start);end.setDate(end.getDate()+6);
    return {start,end,startKey:localDateKey(start),endKey:localDateKey(end)};
  }

  function weeklyPlanDailyMinutes(){
    return clamp(Number(learnerProfile?.daily_minutes)||30,10,120);
  }

  function weeklyPlanQuestionSize(mode,minutes,dueReviews=0){
    const normal=clamp(Math.round(minutes/4),3,15);
    if(mode==='speaking')return clamp(Math.round(minutes/10),2,6);
    if(mode==='mock')return clamp(Math.round(minutes/7),4,10);
    if(mode==='due')return clamp(Math.min(Math.max(dueReviews,3),normal),3,15);
    return normal;
  }

  function weeklyPlanModeForSkill(skill){
    return skill==='listening'?'listening':skill==='speaking'?'speaking':skill==='interview'?'mock':'adaptive';
  }

  function weeklyPlanWeaknessMode(weak){
    if(weak==='sound'||weak==='intent')return 'listening';
    if(weak==='output'||weak==='structure'||weak==='fluency')return 'speaking';
    return 'adaptive';
  }

  function weeklyPlanTask({key,mode,title,reason,minutes,dueReviews=0}){
    const size=weeklyPlanQuestionSize(mode,minutes,dueReviews);
    const estimate=mode==='speaking'?Math.min(minutes,Math.max(8,size*7))
      :mode==='mock'?Math.min(minutes,Math.max(18,size*5))
      :Math.min(minutes,Math.max(10,size*3));
    return {key,mode,title,reason,size,estimate};
  }

  function weeklyPlanSnapshot(){
    const bounds=weeklyPlanWeekBounds();
    const dailyMinutes=weeklyPlanDailyMinutes();
    const targetDays=clamp(Number(state.settings.weeklyPlanDays)||5,3,7);
    const profileGoal=learnerProfile?.goal||'work';
    const completedDays=(state.completedDates||[]).filter(d=>String(d)>=bounds.startKey&&String(d)<=bounds.endKey);
    const sessions=(state.sessions||[]).filter(sess=>{
      const d=parseLearningDate(sess.date);return d&&d>=bounds.start&&d<=bounds.end&&sess.completedUnit!==false&&!sess.diagnostic;
    });
    const ranked=skillKeys.map(key=>({key,value:Number(state.skills?.[key]||1)})).sort((a,b)=>a.value-b.value);
    const focusSkill=ranked[0]?.key||'listening',secondarySkill=ranked[1]?.key||'speaking';
    const weak=topWeakness();
    const analytics=progressAnalyticsSnapshot(7);
    const dueReviews=analytics.dueReviews;
    const focusAnswers=sessions.flatMap(x=>x.answers||[]).filter(a=>a.skill===focusSkill).length;
    const speakingAnswers=sessions.flatMap(x=>x.answers||[]).filter(a=>a.skill==='speaking'||a.skill==='interview'||Number.isFinite(a.extra?.systemScore)).length;
    const focusTarget=Math.max(4,targetDays*2);
    const speakingTarget=(profileGoal==='interview'||learnerProfile?.target_company)?Math.max(4,targetDays):Math.max(2,Math.ceil(targetDays/2));
    const skillTask=(skill,slot)=>weeklyPlanTask({
      key:'skill-'+slot+'-'+skill,
      mode:weeklyPlanModeForSkill(skill),
      title:`${skillLabels[skill]||skill} 弱項補強`,
      reason:`目前 ${skillLabels[skill]||skill} 約 L${Number(state.skills?.[skill]||1).toFixed(2)}，安排一輪集中練習。`,
      minutes:dailyMinutes,dueReviews
    });
    const candidates=[];
    if(dueReviews>0)candidates.push(weeklyPlanTask({key:'due',mode:'due',title:'先清到期複習',reason:`目前有 ${dueReviews} 個到期項目；先處理它們，避免熟悉度繼續下滑。`,minutes:dailyMinutes,dueReviews}));
    candidates.push(skillTask(focusSkill,'primary'));
    if(weak)candidates.push(weeklyPlanTask({key:'weak-'+weak,mode:weeklyPlanWeaknessMode(weak),title:`${weaknessLabels[weak]||weak} 專項修正`,reason:'依最近真實錯誤與弱點計數安排，不用重複刷已熟題。',minutes:dailyMinutes,dueReviews}));
    candidates.push(skillTask(secondarySkill,'secondary'));
    if(profileGoal==='interview'||learnerProfile?.target_company){
      candidates.push(weeklyPlanTask({key:'speaking-interview',mode:'speaking',title:'面試口說輸出',reason:'用短回答與重答迴圈，把知道的內容更快說完整。',minutes:dailyMinutes,dueReviews}));
      candidates.push(weeklyPlanTask({key:'mock-checkpoint',mode:'mock',title:'Interview Mock 檢查',reason:'用整體情境確認內容、結構與即時反應是否穩定。',minutes:dailyMinutes,dueReviews}));
    }else{
      const rec=coachRecommendation();
      candidates.push(weeklyPlanTask({key:'coach-recommendation',mode:rec.mode,title:rec.label,reason:rec.reason,minutes:dailyMinutes,dueReviews}));
    }
    candidates.push(weeklyPlanTask({key:'listening-balance',mode:'listening',title:'雙口音聽力維持',reason:'維持北美與印度口音的辨音與問題意圖反應。',minutes:dailyMinutes,dueReviews}));
    candidates.push(weeklyPlanTask({key:'adaptive-balance',mode:'adaptive',title:'綜合自適應挑戰',reason:'讓題庫依熟悉度、錯題與近期曝光自動補齊。',minutes:dailyMinutes,dueReviews}));
    candidates.push(weeklyPlanTask({key:'wrong-repair',mode:'wrong',title:'錯題回收',reason:'把本週仍不穩的題目重新確認一次，不追求大量刷題。',minutes:dailyMinutes,dueReviews}));

    const tasks=[];const seen=new Set();
    for(const task of candidates){
      if(seen.has(task.key))continue;
      if(tasks.length<targetDays){tasks.push(task);seen.add(task.key);}
    }
    return {
      ...bounds,dailyMinutes,targetDays,practiceDays:new Set(completedDays).size,
      focusSkill,secondarySkill,weak,dueReviews,focusAnswers,focusTarget,speakingAnswers,speakingTarget,tasks
    };
  }

  function weeklyPlanProgress(current,target){
    const pct=target?clamp(Math.round((current/target)*100),0,100):0;
    return `<div class="weekly-plan-progress"><span style="width:${pct}%"></span></div><small>${current} / ${target}</small>`;
  }

  function renderWeeklyPlan(){
    const section=$('weeklyPlanSection');if(!section)return;
    const plan=weeklyPlanSnapshot();
    const title=$('weeklyPlanWindow');if(title)title.textContent=`${plan.startKey.slice(5)} → ${plan.endKey.slice(5)}`;
    const time=$('weeklyPlanTime');if(time)time.textContent=`每日可用 ${plan.dailyMinutes} 分鐘`;
    const note=$('weeklyPlanNote');
    if(note){
      note.textContent=plan.dueReviews>0
        ? `本週先清 ${plan.dueReviews} 個到期複習，再把 ${skillLabels[plan.focusSkill]||plan.focusSkill} 當第一弱項補強。`
        : `目前沒有到期複習；本週第一優先是 ${skillLabels[plan.focusSkill]||plan.focusSkill}，並保留口說／面試檢查。`;
    }
    const goals=$('weeklyPlanGoals');
    if(goals)goals.innerHTML=[
      {label:'完成學習日',current:plan.practiceDays,target:plan.targetDays},
      {label:`${skillLabels[plan.focusSkill]||plan.focusSkill} 有效作答`,current:plan.focusAnswers,target:plan.focusTarget},
      {label:'口說／面試輸出',current:plan.speakingAnswers,target:plan.speakingTarget}
    ].map(g=>`<article><span>${esc(g.label)}</span><b>${g.current}</b>${weeklyPlanProgress(g.current,g.target)}</article>`).join('');
    const tasks=$('weeklyPlanTasks');
    if(tasks)tasks.innerHTML=plan.tasks.map((task,i)=>`<article class="weekly-plan-task"><div class="weekly-plan-step">${i+1}</div><div class="weekly-plan-task-copy"><div><strong>${esc(task.title)}</strong><span>約 ${task.estimate} 分鐘 · ${task.size} 題</span></div><p>${esc(task.reason)}</p></div><button class="btn ${i===0?'primary':'ghost'}" type="button" data-weekly-plan-mode="${task.mode}" data-weekly-plan-size="${task.size}">${i===0?'從這裡開始':'開始'}</button></article>`).join('');
    tasks?.querySelectorAll('[data-weekly-plan-mode]').forEach(btn=>btn.addEventListener('click',()=>startSession(btn.dataset.weeklyPlanMode,Number(btn.dataset.weeklyPlanSize)||null)));
    document.querySelectorAll('[data-weekly-days]').forEach(btn=>{
      const active=Number(btn.dataset.weeklyDays)===plan.targetDays;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');
      btn.onclick=()=>{state.settings.weeklyPlanDays=Number(btn.dataset.weeklyDays)||5;save();renderWeeklyPlan();};
    });
    const edit=$('weeklyPlanEditTime');if(edit)edit.onclick=()=>showOnboarding(learnerProfile,true);
  }

  function skillHistoryPoints(days=90){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-(Math.max(1,days)-1));const cutoffKey=localDateKey(cutoff);
    return (state.skillHistory||[])
      .filter(x=>x?.date&&x?.skills&&String(x.date)>=cutoffKey)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }

  function skillHistoryChartSvg(points){
    const W=760,H=270,pad={l:42,r:18,t:18,b:34};
    const innerW=W-pad.l-pad.r,innerH=H-pad.t-pad.b;
    const dates=points.map(p=>p.date);
    const count=Math.max(1,points.length-1);
    const x=i=>pad.l+(i/count)*innerW;
    const y=v=>pad.t+((5-clamp(Number(v)||1,1,5))/4)*innerH;
    const grid=[1,2,3,4,5].map(level=>{
      const yy=y(level);
      return `<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" class="skill-chart-grid"/><text x="${pad.l-10}" y="${yy+4}" class="skill-chart-y" text-anchor="end">L${level}</text>`;
    }).join('');
    const series=skillKeys.map((k,idx)=>{
      const pts=points.map((p,i)=>`${x(i)},${y(p.skills?.[k])}`).join(' ');
      const dots=points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.skills?.[k])}" r="3" class="skill-line skill-line-${idx}" data-skill-point="${k}" data-date="${esc(p.date)}" data-level="${Number(p.skills?.[k]||1).toFixed(2)}"><title>${esc(skillLabels[k]||k)} · ${p.date} · L${Number(p.skills?.[k]||1).toFixed(2)}</title></circle>`).join('');
      return `<polyline points="${pts}" class="skill-chart-series skill-line-${idx}"/>${dots}`;
    }).join('');
    const first=dates[0]||'',last=dates[dates.length-1]||'';
    const labels=points.length?`<text x="${pad.l}" y="${H-8}" class="skill-chart-x">${esc(first.slice(5))}</text><text x="${W-pad.r}" y="${H-8}" class="skill-chart-x" text-anchor="end">${esc(last.slice(5))}</text>`:'';
    return `<svg class="skill-history-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="技能等級歷史曲線">${grid}${series}${labels}</svg>`;
  }

  function skillHistorySummary(points){
    if(!points.length)return {text:'從 v58 開始保存真實技能快照；完成下一次練習後會開始形成曲線。',changes:[]};
    const first=points[0],last=points[points.length-1];
    const changes=skillKeys.map(k=>({
      key:k,label:skillLabels[k]||k,
      from:Number(first.skills?.[k]||1),to:Number(last.skills?.[k]||1),
      delta:Number(last.skills?.[k]||1)-Number(first.skills?.[k]||1)
    })).sort((a,b)=>b.delta-a.delta);
    const best=changes[0],weakest=changes[changes.length-1];
    const text=points.length===1
      ? `目前只有 ${first.date} 的第一個真實快照；之後每天最多保留一個最新值。`
      : best.delta>0
        ? `${best.label} 在這段期間提升最多：L${best.from.toFixed(2)} → L${best.to.toFixed(2)}（+${best.delta.toFixed(2)}）。`
        : weakest.delta<0
          ? `目前沒有明顯上升；${weakest.label} 變化最大：${weakest.delta.toFixed(2)}。建議先看近期弱點與到期複習。`
          : '這段期間技能等級大致持平；可以搭配口說分數與重答提升一起判讀。';
    return {text,changes};
  }

  function renderSkillHistoryChart(){
    const host=$('skillHistoryChart'),note=$('skillHistoryNote'),legend=$('skillHistoryLegend');
    if(!host)return;
    const points=skillHistoryPoints(skillChartRange);
    host.innerHTML=points.length?skillHistoryChartSvg(points):'<div class="skill-history-empty">尚未有 v58 之後的技能快照。</div>';
    const summary=skillHistorySummary(points);
    if(note)note.textContent=summary.text;
    if(legend)legend.innerHTML=skillKeys.map((k,i)=>{
      const latest=points.at(-1)?.skills?.[k]??state.skills[k]??1;
      return `<span class="skill-legend-item skill-line-${i}"><i></i>${esc(skillLabels[k]||k)} <b>L${Number(latest).toFixed(2)}</b></span>`;
    }).join('');
    $('skillHistoryCount')?.replaceChildren(document.createTextNode(`${points.length} 個真實日快照`));
    document.querySelectorAll('[data-skill-range]').forEach(btn=>{
      const active=Number(btn.dataset.skillRange)===skillChartRange;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');
      btn.onclick=()=>{skillChartRange=Number(btn.dataset.skillRange)||90;renderSkillHistoryChart();};
    });
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
    document.querySelectorAll('.chunk-listen-na').forEach(b => b.addEventListener('click', async () => {
      const c = CONTENT.chunks.find(x=>x.id===b.dataset.id);
      if(!c) return;
      const rate=playbackRate(c.level,'chunk');
      const status=document.querySelector(`.chunk-audio-status[data-status-id="${CSS.escape(c.id)}"]`);
      if(status)status.textContent='North American English · 正在準備語音…';
      const resolved=await speakNorthAmerican(c.example,rate,p=>{if(status)status.textContent=northAmericanProgressText(p);});
      if(status)status.textContent='本次：'+northAmericanPlaybackStatus(resolved,rate);
    }));
    document.querySelectorAll('.chunk-listen-in').forEach(b => b.addEventListener('click', async () => {
      const c = CONTENT.chunks.find(x=>x.id===b.dataset.id);
      if(!c) return;
      const rate=playbackRate(c.level,'chunk');
      const status=document.querySelector(`.chunk-audio-status[data-status-id="${CSS.escape(c.id)}"]`);
      if(status)status.textContent='Indian English · 正在準備語音…';
      const resolved=await speakIndian(c.example,rate,p=>{if(status)status.textContent=indianProgressText(p);});
      if(status)status.textContent='本次：'+indianPlaybackStatus(resolved,rate);
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
  function quoteWordVocabEntries(){
    const baseWords=new Set((CONTENT.vocabulary||[]).map(v=>String(v.word||'').toLowerCase()));
    return Object.values(state.quoteWordBank||{})
      .filter(v=>v?.word&&!baseWords.has(String(v.word).toLowerCase()))
      .map(v=>({
        id:v.id||('dqv-'+String(v.word).toLowerCase().replace(/[^a-z0-9]+/g,'-')),
        word:v.word,zh:v.meaning||'',category:'Daily Quote',pos:'quote word',
        example:v.quoteText||'',exampleZh:v.quoteZh||'',fromDailyQuote:true
      }));
  }
  function allVocabulary(){return [...(CONTENT.vocabulary||[]),...quoteWordVocabEntries()];}

  function renderVocabulary(limit=12,randomize=false,learningOnly=false){
    const host=$('vocabGrid');
    if(!host || !Array.isArray(CONTENT.vocabulary)) return;
    const filter=$('vocabFilter')?.value||'all';
    let arr=allVocabulary().filter(v=>filter==='all'||v.category===filter);
    if(learningOnly) arr=arr.filter(v=>!state.vocabKnown[v.id]);
    if(randomize) arr=weightedVocabSample(arr,limit||arr.length);
    else if(limit) arr=arr.slice(0,limit);
    if(!arr.length){
      host.innerHTML='<div class="panel support">這個篩選目前沒有需要複習的單字。</div>';
      return;
    }
    host.innerHTML=arr.map(v=>`<article class="panel vocab-card">
      <div class="vocab-card-top"><span class="badge">${esc(v.category)}</span><span class="support">${esc(v.pos)}</span></div>
      <div class="vocab-word">${esc(v.word)}</div>
      <div class="vocab-meaning hidden" data-meaning-id="${v.id}"><b>${esc(v.zh)}</b><p class="vocab-example-en">${esc(v.example)}</p><p class="vocab-example-zh">${esc(vocabExampleTranslation(v))}</p></div>
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
    document.querySelectorAll('.vocab-listen-na').forEach(b=>b.addEventListener('click',async()=>{
      const v=allVocabulary().find(x=>x.id===b.dataset.id); if(!v)return;
      const rate=playbackRate(1,'chunk');
      const status=document.querySelector(`.vocab-audio-status[data-vocab-status-id="${CSS.escape(v.id)}"]`);
      if(status)status.textContent='North American English · 正在準備語音…';
      const resolved=await speakNorthAmerican(`${v.word}. ${v.example}`,rate,p=>{if(status)status.textContent=northAmericanProgressText(p);});
      if(status)status.textContent=northAmericanPlaybackStatus(resolved,rate);
    }));
    document.querySelectorAll('.vocab-listen-in').forEach(b=>b.addEventListener('click',async()=>{
      const v=allVocabulary().find(x=>x.id===b.dataset.id); if(!v)return;
      const rate=playbackRate(1,'chunk');
      const status=document.querySelector(`.vocab-audio-status[data-vocab-status-id="${CSS.escape(v.id)}"]`);
      if(status)status.textContent='Indian English · 正在準備語音…';
      const resolved=await speakIndian(`${v.word}. ${v.example}`,rate,p=>{if(status)status.textContent=indianProgressText(p);});
      if(status)status.textContent=indianPlaybackStatus(resolved,rate);
    }));
    document.querySelectorAll('.vocab-known').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.id;
      const next=!state.vocabKnown[id];
      state.vocabKnown[id]=next;
      const st=vocabStat(id);
      if(next){
        st.lastOutcome='correct';
        st.correctStreak=Math.max(3,st.correctStreak||0);
        st.interval=Math.max(7,st.interval||0);
        st.due=addDays(st.interval);
      }else if(st.attempts===0){
        st.lastOutcome=null;
        st.correctStreak=0;
        st.interval=0;
        st.due=todayKey();
      }
      save();
      renderVocabulary(limit,randomize,learningOnly);
    }));
  }

  function shuffle(arr){return [...arr].sort(()=>Math.random()-.5);}
  function vocabPool(){
    const filter=$('vocabFilter')?.value||'all';
    return allVocabulary().filter(v=>filter==='all'||v.category===filter);
  }
  function vocabStat(id){
    if(!state.vocabStats[id]) state.vocabStats[id]={attempts:0,correct:0,wrong:0,guessed:0,choice:0,sentence:0,listening:0,lastOutcome:null,correctStreak:0,interval:0,due:todayKey(),lastSeen:null};
    const st=state.vocabStats[id];
    if(!Number.isFinite(st.attempts))st.attempts=0;
    if(!Number.isFinite(st.correct))st.correct=0;
    if(!Number.isFinite(st.wrong))st.wrong=Math.max(0,(st.attempts||0)-(st.correct||0));
    if(!Number.isFinite(st.guessed))st.guessed=0;
    if(!Number.isFinite(st.correctStreak))st.correctStreak=0;
    if(!Number.isFinite(st.interval))st.interval=0;
    if(!st.due)st.due=todayKey();
    return st;
  }
  function vocabFamiliarity(v){
    const st=vocabStat(v.id);
    if(st.lastOutcome==='wrong')return 'wrong';
    if(st.lastOutcome==='guessed')return 'guessed';
    if(st.attempts===0 && !state.vocabKnown[v.id])return 'new';
    if(st.lastOutcome==='correct' || state.vocabKnown[v.id])return 'correct';
    if(st.wrong>0 && st.correct===0)return 'wrong';
    return st.attempts===0?'new':'correct';
  }
  function vocabPriorityWeight(v){
    const st=vocabStat(v.id);
    const type=vocabFamiliarity(v);
    let w={wrong:14,guessed:8,new:4,correct:1.15}[type]||1;
    if(type==='correct'){
      if((st.correctStreak||0)>=3)w*=.55;
      if((st.correctStreak||0)>=5)w*=.55;
    }
    if(st.due && st.due<=todayKey())w*=1.2;
    else if(type==='correct')w*=.45;
    return Math.max(.08,w);
  }
  function weightedVocabSample(pool,size){
    const source=[...pool];
    const selected=[];
    while(selected.length<size && source.length){
      const weights=source.map(v=>vocabPriorityWeight(v));
      const total=weights.reduce((a,b)=>a+b,0);
      let r=Math.random()*total;
      let pick=0;
      for(let i=0;i<source.length;i++){r-=weights[i];if(r<=0){pick=i;break;}}
      selected.push(source[pick]);
      source.splice(pick,1);
    }
    return selected;
  }
  function updateVocabResult(v,correct,mode){
    const st=vocabStat(v.id);
    st.attempts++;
    st[mode]=(st[mode]||0)+1;
    st.lastSeen=todayKey();
    if(correct){
      st.correct++;
      st.lastOutcome='correct';
      st.correctStreak=(st.correctStreak||0)+1;
      st.interval=st.correctStreak===1?2:Math.min(30,Math.max(3,Math.round((st.interval||2)*1.8)));
      st.due=addDays(st.interval);
      if(st.correctStreak>=3 && st.correct/st.attempts>=.8)state.vocabKnown[v.id]=true;
    }else{
      st.wrong=(st.wrong||0)+1;
      st.lastOutcome='wrong';
      st.correctStreak=0;
      st.interval=0;
      st.due=todayKey();
      state.vocabKnown[v.id]=false;
    }
    return st;
  }
  function markVocabGuessed(v){
    const st=vocabStat(v.id);
    st.guessed=(st.guessed||0)+1;
    st.lastOutcome='guessed';
    st.correctStreak=0;
    st.interval=1;
    st.due=addDays(1);
    st.lastSeen=todayKey();
    state.vocabKnown[v.id]=false;
    save();
    return st;
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
    if(pool.length<4) pool=allVocabulary().filter(v=>mode!=='sentence'||sentenceBlank(v));
    const queue=weightedVocabSample(pool,Math.min(size,pool.length));
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
    const familiarity=vocabFamiliarity(v);
    const familiarityLabel={wrong:'錯題優先',guessed:'猜對待複習',new:'新單字',correct:'已答對／降頻'}[familiarity]||'學習中';
    host.innerHTML=`<article class="vocab-practice-card panel"><div class="vocab-practice-top"><span class="badge">${s.mode==='choice'?'選擇題':s.mode==='sentence'?'句型':'聽力'}</span><span class="support">${progress} · 已答對 ${s.correct}</span></div><div class="vocab-familiarity-pill ${familiarity}">${familiarityLabel}</div><div class="vocab-practice-prompt">${prompt}</div><div class="support vocab-practice-sub">${sub}</div>${sentenceZhHtml}${audioHtml}<div class="options vocab-practice-options">${options.map(o=>`<button class="option vocab-option" data-value="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="vocabPracticeFeedback"></div><div class="vocab-answer-detail hidden" id="vocabAnswerDetail"><strong>${esc(v.word)}｜${esc(v.zh)}</strong><p>${esc(v.example)}</p><div class="btn-row"><button class="btn ghost" id="vocabAnswerNA" type="button">▶ 北美例句</button><button class="btn ghost" id="vocabAnswerIN" type="button">▶ 印度例句</button><button class="btn ghost hidden" id="vocabGuessBtn" type="button">🎯 其實我是猜的</button></div><div class="support hidden" id="vocabGuessStatus">已標成「猜對」，之後會比新單字更常出現。</div></div><button class="btn primary hidden vocab-next" id="vocabNextBtn" type="button">下一題 →</button></article>`;
    if(s.mode==='sentence'&&exampleZh){
      $('vocabSentenceZhBtn').addEventListener('click',()=>{
        const zh=$('vocabSentenceZhText'); zh.classList.toggle('hidden');
        $('vocabSentenceZhBtn').textContent=zh.classList.contains('hidden')?'顯示中文提示':'隱藏中文提示';
      });
    }

    if(s.mode==='listening'){
      $('vocabListenNA').addEventListener('click',async()=>{
        const rate=playbackRate(1,'chunk');
        $('vocabListenStatus').textContent='North American English · 正在準備語音…';
        const r=await speakNorthAmerican(v.word,rate,p=>{$('vocabListenStatus').textContent=northAmericanProgressText(p);});
        $('vocabListenStatus').textContent=northAmericanPlaybackStatus(r,rate);
      });
      $('vocabListenIN').addEventListener('click',async()=>{
        const rate=playbackRate(1,'chunk');
        $('vocabListenStatus').textContent='Indian English · 正在準備語音…';
        const r=await speakIndian(v.word,rate,p=>{$('vocabListenStatus').textContent=indianProgressText(p);});
        $('vocabListenStatus').textContent=indianPlaybackStatus(r,rate);
      });
    }
    document.querySelectorAll('.vocab-option').forEach(btn=>btn.addEventListener('click',()=>{
      if(s.answered)return;
      s.answered=true;
      const chosen=btn.dataset.value;
      const correct=chosen===answer;
      if(correct)s.correct++;
      const st=updateVocabResult(v,correct,s.mode);
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
      $('vocabAnswerNA').addEventListener('click',async()=>{await speakNorthAmerican(v.example,playbackRate(1,'chunk'));});
      $('vocabAnswerIN').addEventListener('click',async()=>{await speakIndian(v.example,playbackRate(1,'chunk'));});
      if(correct){
        const guessBtn=$('vocabGuessBtn');
        guessBtn?.classList.remove('hidden');
        guessBtn?.addEventListener('click',()=>{
          markVocabGuessed(v);
          guessBtn.disabled=true;
          guessBtn.textContent='✓ 已標成猜對';
          $('vocabGuessStatus')?.classList.remove('hidden');
        },{once:true});
      }
      $('vocabNextBtn').addEventListener('click',()=>{s.index++;renderVocabPracticeQuestion();scrollPracticeTop('vocabPracticeHost');},{once:true});
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
  function normalizeSpokenSentence(text){
    let t=String(text||'').replace(/\s+/g,' ').trim();
    t=t.replace(/\bi\b/g,'I');
    t=t.replace(/\b(\w+)\s+\1\b/gi,'$1');
    t=t.replace(/\s+([,.!?])/g,'$1');
    if(t) t=t.charAt(0).toUpperCase()+t.slice(1);
    if(t && !/[.!?]$/.test(t)) t+='.';
    return t;
  }
  function applyGrammarRules(text,q){
    let t=normalizeSpokenSentence(text);
    const notes=[];
    const rules=[
      [/\bexperience about\b/gi,'experience in','experience 通常搭配 in'],
      [/\bmany team\b/gi,'many teams','team 需要複數'],
      [/\bI responsible for\b/gi,'I am responsible for','responsible 前需要 be 動詞'],
      [/\bI am work\b/gi,'I am working','be 動詞後要接 V-ing'],
      [/\bdiscuss about\b/gi,'discuss','discuss 後面不需要 about'],
      [/\bcommunicate to\b/gi,'communicate with','與人溝通通常用 communicate with'],
      [/\bmore better\b/gi,'better','better 本身已是比較級'],
      [/\bdepend of\b/gi,'depend on','固定搭配是 depend on'],
      [/\bI have (\d+|eight) years experience\b/gi,'I have $1 years of experience','自然搭配是 years of experience'],
      [/\bin IBM\b/gi,'at IBM','公司前通常用 at'],
      [/\bwork in IBM\b/gi,'work at IBM','公司前通常用 at']
    ];
    rules.forEach(([re,to,note])=>{
      if(re.test(t)){re.lastIndex=0;t=t.replace(re,to);notes.push(note);}
    });

    if(/current|currently/i.test(q?.text||'') && /\bI will work on\b/i.test(t)){
      t=t.replace(/\bI will work on\b/i,"I'm currently working on");
      notes.push('題目問現在的工作，使用現在進行式比 will work 更正確');
    }

    if(q?.id==='mdb-l1-010'){
      if(/large banking transformation project/i.test(t)){
        t=t.replace(/large banking transformation project/i,'large core banking transformation project');
        notes.push('這題是在介紹目前核心銀行轉型專案，core banking 會更精準');
      }
      const lower=t.toLowerCase();
      if(lower.includes('analyze') && lower.includes('business') && lower.includes('system')){
        const parts=t.split(/(?<=[.!?])\s+/);
        const first=parts[0]||'';
        t=normalizeSpokenSentence(first+' I mainly analyze business requirements and system requirements.');
        notes.push('把重複、破碎的 analyze / business / system 重組成完整句');
      }
    }

    const incompletePatterns=[
      [/\s+(?:and\s+)?I have better\.?$/i,'','「I have better」不是完整句，需要補受詞或直接刪除'],
      [/\s+(?:and\s+)?I have\.?$/i,'','句尾「I have」資訊不完整，需要補上內容'],
      [/\s+(?:and\s+)?I am better\.?$/i,'','「I am better」在這裡語意不完整，需要說明 better at / better than / better in 什麼']
    ];
    incompletePatterns.forEach(([re,to,note])=>{
      if(re.test(t)){t=t.replace(re,to).trim();notes.push(note);}
    });

    t=normalizeSpokenSentence(t);
    return {text:t,notes:[...new Set(notes)]};
  }
  function naturalizeSpokenAnswer(corrected,original,q){
    let t=corrected;
    const notes=[];
    if(q?.id==='mdb-l1-010'){
      const lower=String(original||'').toLowerCase();
      const sentences=[];
      if(lower.includes('bank')||lower.includes('transformation')){
        sentences.push("I'm currently working on a large core banking transformation project.");
      }
      if(lower.includes('analy')||lower.includes('business')||lower.includes('system')){
        sentences.push('My main responsibility is analyzing business requirements and system-related issues.');
      }
      if(sentences.length){
        t=sentences.join(' ');
        notes.push('自然版保留你原本「專案＋主要工作」兩個重點，改成面試更順的兩句結構');
      }
    }else{
      t=t.replace(/^I work on\b/i,"I'm currently working on");
      t=t.replace(/\bI mainly analyze\b/i,'My main responsibility is to analyze');
      t=t.replace(/\bI mainly handle\b/i,'My main responsibility is handling');
      t=t.replace(/\bI want to\b/i,"I'm looking to");
      t=normalizeSpokenSentence(t);
    }
    return {text:t,notes};
  }
  function buildSpokenCorrection(text,q){
    const grammar=applyGrammarRules(text,q);
    const natural=naturalizeSpokenAnswer(grammar.text,text,q);
    const notes=[...new Set([...grammar.notes,...natural.notes])].slice(0,5);
    return {
      corrected:grammar.text,
      natural:natural.text,
      notes
    };
  }

  function qstat(id){
    if(!state.qstats[id]) state.qstats[id] = {seen:0,correct:0,wrong:0,hints:0,listens:0,lastQuality:null,interval:0,due:todayKey(),lastSeen:null,manualReview:false,guessCount:0,markedAt:null};
    const s=state.qstats[id];
    if(typeof s.manualReview!=='boolean') s.manualReview=false;
    if(!Number.isFinite(s.guessCount)) s.guessCount=0;
    if(!Number.isFinite(s.modelPracticeCount)) s.modelPracticeCount=0;
    if(!('lastOutcome' in s)) s.lastOutcome=null;
    if(!Number.isFinite(s.speakingLowScoreCount)) s.speakingLowScoreCount=0;
    if(!Number.isFinite(s.lastSystemScore)) s.lastSystemScore=null;
    return s;
  }

  function setManualReview(q,enabled,reason='manual'){
    const s=qstat(q.id);
    s.manualReview=!!enabled;
    s.markedAt=enabled?todayKey():null;
    if(enabled){
      if(reason==='guess'){
        s.guessCount=(s.guessCount||0)+1;
        s.lastOutcome='guessed';
      }
      s.interval=0;
      s.due=todayKey();
      if(s.lastQuality===null || s.lastQuality>1) s.lastQuality=1;
    }else if(reason==='guess' && s.lastOutcome==='guessed'){
      s.lastOutcome=s.seen>0?'correct':null;
    }
    save();
    window.EDAN_CLOUD?.logEvent?.(enabled?'question_marked_review':'question_unmarked_review',{
      questionId:q.id,
      reason,
      text:q.text,
      guessCount:s.guessCount||0
    }, q.id+'-'+todayKey());
  }

  function effectiveSkillForQuestion(q){
    if(q.skill==='interview') return (state.skills.interview + state.skills.speaking)/2;
    return state.skills[q.skill] || 1;
  }

  function candidatePool(mode){
    const today = todayKey();
    let qs = CONTENT.questions.filter(q=>!q.diagnosticOnly);
    if(mode==='listening') qs = qs.filter(q => q.skill==='listening' && q.type==='listening_intent');
    if(mode==='speaking') qs = qs.filter(q => q.type==='speaking');
    if(mode==='wrong'){
      const weak = qs.filter(q => { const s = state.qstats[q.id]; return s && (s.manualReview || s.wrong>0 || s.hints>0 || (s.lastQuality!==null && s.lastQuality<=1)); });
      if(weak.length) qs = weak;
    }
    if(mode==='due'){
      const due = qs.filter(q => { const s = state.qstats[q.id]; return s && s.due && s.due<=today; });
      if(due.length) qs = due;
    }
    return qs;
  }

  function questionFamiliarity(s){
    if(!s || !s.seen)return 'new';
    if(s.lastOutcome==='wrong')return 'wrong';
    if(s.lastOutcome==='guessed' || s.manualReview)return 'guessed';
    if(s.lastOutcome==='correct')return 'correct';
    if(s.lastQuality===0)return 'wrong';
    if(s.lastQuality===1)return 'guessed';
    return 'correct';
  }

  function recentSessionQuestionIds(sessionCount=3){
    const ids=new Set();
    (state.sessions||[]).slice(-sessionCount).forEach(s=>(s.answers||[]).forEach(a=>{if(a?.id)ids.add(a.id)}));
    return ids;
  }

  function questionSessionDistance(id,maxSessions=12){
    const sessions=(state.sessions||[]).slice(-maxSessions).reverse();
    for(let i=0;i<sessions.length;i++){
      if((sessions[i].answers||[]).some(a=>a?.id===id))return i;
    }
    return Number.POSITIVE_INFINITY;
  }

  function recentExposurePenalty(q,mode){
    const distance=questionSessionDistance(q.id,6);
    const deliberateReview=mode==='wrong'||mode==='due';
    if(!Number.isFinite(distance))return 1;
    const normal=[.08,.18,.38,.62,.82,.94];
    const review=[.42,.58,.72,.84,.92,.97];
    return (deliberateReview?review:normal)[Math.min(distance,5)]||1;
  }

  function questionSemanticFamily(q){
    const both=(String(q?.text||'')+' '+String(q?.intent||'')).toLowerCase();
    const rules=[
      ['value-proposition',/why should .*choose|why should .*hire|choose you|hire you|traditional project management/],
      ['background',/tell me about yourself|walk me through your background|career background|other experience/],
      ['responsibilities',/day-to-day|responsibilit|what do you (?:mainly )?handle|your role|pm scope/],
      ['timeline',/how long|duration|timeframe|timeline|expected to run|delivery timeframe/],
      ['english-usage',/english.*work|use english|spoken english|working language/],
      ['compensation',/salary|compensation|bonus|equity|overall package|expected range/],
      ['incident-escalation',/production issue|incident|escalat|recovery plan/],
      ['ownership-decision',/unclear ownership|clear owner|decision owner|decision needed|ownership/],
      ['tradeoff-risk',/trade-?off|technical risk|operational risk|residual risk|reversibility/],
      ['scope-change',/change request|new scope|scope change|effort|commercial terms/],
      ['stakeholder-communication',/stakeholder|customer communication|executive|audience|level of detail/],
      ['motivation',/why .*role|why .*company|why do you want|next stage|interested in this role/],
      ['delivery-management',/milestone|critical path|dependencies|resource constraints|project delivery/],
      ['clarification',/clarify|confirm meaning|what do you mean|paraphrase|repeat|slower/]
    ];
    for(const [family,re] of rules)if(re.test(both))return family;
    const keywords=(q?.keywords||[]).slice(0,2).map(x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-')).filter(Boolean);
    return keywords.length?'kw:'+keywords.join('|'):'id:'+String(q?.id||'');
  }
  function recentSemanticFamilies(sessionCount=2){
    const families=new Set();
    (state.sessions||[]).slice(-sessionCount).forEach(s=>(s.answers||[]).forEach(a=>{
      const q=CONTENT.questions.find(x=>x.id===a?.id); if(q)families.add(questionSemanticFamily(q));
    }));
    return families;
  }
  function semanticExposurePenalty(q,mode){
    if(mode==='wrong'||mode==='due')return 1;
    const family=questionSemanticFamily(q);
    if(recentSemanticFamilies(1).has(family))return .32;
    if(recentSemanticFamilies(2).has(family))return .58;
    return 1;
  }

  function diversifyCandidatePool(pool,mode,size){
    if(mode==='wrong'||mode==='due')return pool;
    for(const count of [4,3,2,1]){
      const recent=recentSessionQuestionIds(count);
      const filtered=pool.filter(q=>!recent.has(q.id));
      if(filtered.length>=size)return filtered;
    }
    return pool;
  }

  function withinSessionVarietyPenalty(q,selected,mode){
    if(mode==='wrong'||mode==='due')return 1;
    const last=selected[selected.length-1],prev=selected[selected.length-2];
    let penalty=1;
    if(mode!=='listening'&&mode!=='speaking'){
      if(last?.skill===q.skill&&prev?.skill===q.skill)penalty*=.38;
      else if(last?.skill===q.skill)penalty*=.68;
    }
    const family=questionSemanticFamily(q);
    if(last&&questionSemanticFamily(last)===family)penalty*=.20;
    else if(selected.some(x=>questionSemanticFamily(x)===family))penalty*=.48;
    return penalty;
  }

  function weightQuestion(q, mode){
    const s=state.qstats[q.id]||null;
    const familiarity=questionFamiliarity(s);
    let w={wrong:8,guessed:5.5,new:6,correct:1.05}[familiarity]||1;
    if(s?.due && s.due<=todayKey())w*=1.15;
    else if(familiarity==='correct')w*=.48;
    if(q.type==='speaking' && Number.isFinite(s?.lastSystemScore) && s.lastSystemScore<60){
      w*=1+Math.min(1.6,(s.speakingLowScoreCount||1)*.38);
    }
    if(familiarity==='correct' && (s?.correct||0)>=3)w*=.62;
    if(q.skill==='listening' && mode==='listening')w*=1.08;
    if(q.type==='speaking' && mode==='speaking')w*=1.08;
    if(learnerProfile?.goal==='interview' && (q.skill==='interview'||q.type==='speaking'))w*=1.12;
    if(learnerProfile?.goal==='work' && q.source==='Professional expansion')w*=1.08;
    if(learnerProfile?.goal==='daily' && q.source==='Everyday spoken English')w*=1.14;
    const skill=effectiveSkillForQuestion(q);
    const dist=Math.abs(q.level-skill);
    const fit=clamp(1.08-dist*.07,.88,1.08);
    w*=fit;
    const personalWeak=topWeakness();
    if((personalWeak==='sound'||personalWeak==='intent') && q.skill==='listening')w*=1.08;
    if((personalWeak==='output'||personalWeak==='structure'||personalWeak==='fluency') && q.type==='speaking')w*=1.08;
    if(personalWeak==='usage' && (q.skill==='chunks'||q.skill==='rescue'))w*=1.06;
    w*=recentExposurePenalty(q,mode);
    w*=semanticExposurePenalty(q,mode);
    return Math.max(.02,w);
  }

  function weightedPick(arr, mode, selected=[]){
    const weights = arr.map(q=>weightQuestion(q,mode)*withinSessionVarietyPenalty(q,selected,mode));
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<arr.length;i++){ r-=weights[i]; if(r<=0) return arr[i]; }
    return arr[arr.length-1];
  }

  const GENERAL_MOCK_ANCHORS=['gen-l1-001','gen-l2-001','gen-l2-002','gen-l3-002'];
  const DIAGNOSTIC_IDS=['diag-l1-001','diag-l1-002','diag-l1-003','diag-l2-001','diag-l2-002'];
  function buildInterviewMock(size){
    const privateSpeaking=CONTENT.questions.filter(q=>privateQuestionIds.has(q.id)&&q.type==='speaking').sort((a,b)=>questionSessionDistance(b.id)-questionSessionDistance(a.id));
    const publicAnchors=GENERAL_MOCK_ANCHORS.map(id=>CONTENT.questions.find(q=>q.id===id)).filter(Boolean);
    const source=privateSpeaking.length?privateSpeaking:publicAnchors;
    const anchorCount=Math.min(2,Math.max(1,Math.floor(size/4)));
    const anchors=source.slice(0,anchorCount);
    let pool=CONTENT.questions.filter(q=>q.type==='speaking'&&!q.diagnosticOnly&&!anchors.some(a=>a.id===q.id));
    pool=diversifyCandidatePool(pool,'mock',Math.max(0,size-anchors.length));const selected=[...anchors];
    while(selected.length<size&&pool.length){const q=weightedPick(pool,'mock',selected);selected.push(q);pool=pool.filter(x=>x.id!==q.id);}
    return selected.slice(0,size);
  }

  function buildSessionQuestions(mode,size){
    if(mode==='diagnostic')return DIAGNOSTIC_IDS.map(id=>CONTENT.questions.find(q=>q.id===id)).filter(Boolean);
    if(mode==='mock') return buildInterviewMock(size);
    let pool = diversifyCandidatePool(candidatePool(mode),mode,size);
    const selected=[];
    while(selected.length<size && pool.length){
      const q=weightedPick(pool,mode,selected); selected.push(q); pool=pool.filter(x=>x.id!==q.id);
    }
    if(selected.length<size){
      let fallback=diversifyCandidatePool(CONTENT.questions.filter(q=>!selected.some(s=>s.id===q.id)),'adaptive',size-selected.length);
      while(selected.length<size && fallback.length){
        const q=weightedPick(fallback,'adaptive',selected);
        selected.push(q);
        fallback=fallback.filter(x=>x.id!==q.id);
      }
    }
    return selected;
  }

  function scrollPracticeTop(target){
    const el=typeof target==='string'?$(target):target;
    if(!el)return;
    requestAnimationFrame(()=>{
      const topbar=document.querySelector('.topbar');
      const offset=(topbar?.offsetHeight||0)+10;
      const top=el.getBoundingClientRect().top+window.scrollY-offset;
      const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      window.scrollTo({top:Math.max(0,top),behavior:reduce?'auto':'smooth'});
    });
  }

  function speakingRetryAnswer(){
    const active=session?.currentMeta?.latestAnswer;
    if(active?.kind==='speaking'&&Number.isFinite(active.score))return active;
    if(lastLittleEAnswer?.kind==='speaking'&&Number.isFinite(lastLittleEAnswer.score))return lastLittleEAnswer;
    return null;
  }

  function beginSpeakingRetry(q,source='score_card'){
    const current=session?.questions?.[session?.index];
    const before=speakingRetryAnswer();
    if(!session||!q||current?.id!==q.id||q.type!=='speaking')return {ok:false,reason:'請先回到剛才那一題口說，再使用重新回答。'};
    if(!before)return {ok:false,reason:'目前還沒有可比較的口說分數；先完成一次錄音評分。'};
    speakingRetryCycle={
      questionId:q.id,source,startedAt:new Date().toISOString(),
      before:{transcript:String(before.transcript||''),score:Number(before.score),corrected:String(before.corrected||''),natural:String(before.natural||''),wordsPerMinute:Number.isFinite(before.wordsPerMinute)?before.wordsPerMinute:null}
    };
    window.EDAN_CLOUD?.logEvent?.('speaking_retry_started',{questionId:q.id,beforeScore:speakingRetryCycle.before.score,source},'retry-start-'+q.id+'-'+Date.now());
    renderCurrentQuestion();
    return {ok:true,beforeScore:speakingRetryCycle.before.score};
  }

  function finalizeSpeakingRetry(q,retryBaseline,answerSnapshot){
    if(!retryBaseline?.before||!Number.isFinite(retryBaseline.before.score)||!Number.isFinite(answerSnapshot?.score))return null;
    const before=Math.round(retryBaseline.before.score),after=Math.round(answerSnapshot.score),delta=after-before;
    const dueDays=after<60?0:after<80?1:3;
    const reviewDue=dueDays===0?todayKey():addDays(dueDays);
    const reviewLabel=dueDays===0?'今天會再排進複習':dueDays===1?'明天自動複習':'3 天後自動複習';
    const stat=qstat(q.id);
    stat.retryCount=(stat.retryCount||0)+1;stat.lastRetryDelta=delta;stat.lastRetryScore=after;stat.lastRetryAt=new Date().toISOString();
    stat.autoReviewReason='speaking_retry';stat.interval=dueDays;stat.due=reviewDue;
    const entry={questionId:q.id,question:q.text,beforeScore:before,afterScore:after,delta,source:retryBaseline.source||'score_card',reviewDue,reviewLabel,completedAt:new Date().toISOString()};
    state.retryHistory=[...(state.retryHistory||[]),entry].slice(-80);
    session.currentMeta.retryBaseline=null;speakingRetryCycle=null;save();
    window.EDAN_CLOUD?.logEvent?.('speaking_retry_completed',{questionId:q.id,beforeScore:before,afterScore:after,delta,source:entry.source,reviewDue,reviewLabel},'retry-complete-'+q.id+'-'+Date.now());
    return entry;
  }

  function startSession(mode,sizeOverride=null,meta={}){
    speakingRetryCycle=null;
    stopSpeakingTimer(); stopRecognition(); speechSynthesis.cancel();
    setMobileDockActive(mode==='listening'?'listening':'challenge');
    const requestedSize=sizeOverride===null?(mode==='mock'?8:mode==='diagnostic'?5:state.settings.sessionSize):sizeOverride;
    const size = clamp(parseInt(requestedSize,10)||10,2,15);
    const titles={adaptive:'自適應挑戰',listening:'聽力特訓',wrong:'錯題複習',due:'今日複習',mock:(privateQuestionIds.size?'Personalized Interview Mock':'Interview Mock'),diagnostic:'5 分鐘能力診斷',speaking:'口說快練'};
    session={mode,title:titles[mode]||'自適應挑戰',questions:buildSessionQuestions(mode,size),index:0,answers:[],startedAt:new Date().toISOString(),currentMeta:null,missionTaskKey:meta?.missionTaskKey||null,missionDate:meta?.missionDate||null};
    $('resultSection').classList.remove('show');
    $('challengeSection').classList.add('active');
    $('sessionTitle').textContent=session.title;
    renderCurrentQuestion();
  }

  function renderCurrentQuestion(){
    stopSpeakingTimer(); stopRecognition(); stopMediaRecording(true); cleanupRecordedAudio(); stopModelPracticeRecording(false); cleanupModelPracticeAudio(); speechSynthesis.cancel(); speechTranscript='';
    const q=session.questions[session.index];
    if(!q){ finishSession(true); return; }
    const retryBaseline=speakingRetryCycle?.questionId===q.id?speakingRetryCycle:null;
    lastLittleEQuestion=q;
    lastLittleEAnswer=retryBaseline?.before||null;
    session.currentMeta={listens:0,hint:false,answered:false,accentCounts:{northAmerica:0,india:0},latestAnswer:null,retryBaseline};
    $('questionCounter').textContent=`${session.index+1} / ${session.questions.length}`;
    $('questionLevelBadge').textContent=`L${q.level}`;
    $('questionSkillBadge').textContent=skillLabels[q.skill]||q.skill;
    $('sessionProgress').style.width=`${(session.index/session.questions.length)*100}%`;
    if(q.type==='listening_intent') renderListeningQuestion(q);
    else if(q.type==='speaking') renderSpeakingQuestion(q);
    else renderChoiceQuestion(q);
    scrollPracticeTop('challengeSection');
  }

  function renderListeningQuestion(q){
    const qZh=questionTranslation(q);
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge good">LISTEN FIRST</span><div class="question-title">先不要看文字，聽懂「他在問什麼」</div><div class="question-intent">L${q.level} · 每題都有北美＋印度兩種口音。每種口音第一次播放不算重播；重複同一口音才會影響熟練度判定。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playNorthAmericaBtn" type="button">▶ 北美口音</button><button class="btn secondary" id="playIndiaBtn" type="button">▶ 印度口音</button><button class="btn ghost" id="showTranscriptBtn" type="button">顯示文字＋繁中</button><span class="audio-status" id="audioStatus">尚未播放 · 建議兩種都聽一次</span></div><div class="transcript" id="transcriptBox"><div class="transcript-en">${esc(q.text)}</div>${qZh?`<div class="transcript-zh"><span>繁體中文</span>${esc(qZh)}</div>`:''}</div></div><div class="options">${q.options.map((o,i)=>`<button class="option" data-index="${i}" type="button">${esc(o)}</button>`).join('')}</div><div class="feedback" id="feedbackBox"></div>${modelAnswerHtml(q,'可以這樣回答').replace('<div class="model-answer">','<div class="model-answer" id="modelAnswer">')}<div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button><button class="btn ghost hidden" id="retrySameSpeakingBtn" type="button">↻ 再練這題</button></div></article>`;
    const enabledAccents=enabledPracticeAccents();
    $('playNorthAmericaBtn').classList.toggle('hidden',!enabledAccents.includes('northAmerica'));
    $('playIndiaBtn').classList.toggle('hidden',!enabledAccents.includes('india'));
    const audioStatus=$('audioStatus');
    if(audioStatus)audioStatus.textContent=enabledAccents.length===1
      ? (enabledAccents[0]==='india'?'目前偏好：印度口音':'目前偏好：北美口音')
      : '尚未播放 · 建議兩種都聽一次';
    $('playNorthAmericaBtn').addEventListener('click',()=>playQuestionAccent(q,'northAmerica',chooseVoiceLang(q.level),'audioStatus'));
    $('playIndiaBtn').addEventListener('click',()=>playQuestionAccent(q,'india','en-IN','audioStatus'));
    $('showTranscriptBtn').addEventListener('click',()=>{
      session.currentMeta.hint=true; qstat(q.id).hints++; $('transcriptBox').classList.add('show'); save();
    });
    bindOptionButtons(q,true);
  }

  async function playQuestionAccent(q,key,lang,statusId){
    session.currentMeta.listens++;
    session.currentMeta.accentCounts=session.currentMeta.accentCounts||{northAmerica:0,india:0};
    session.currentMeta.accentCounts[key]=(session.currentMeta.accentCounts[key]||0)+1;
    qstat(q.id).listens++;
    const rate=playbackRate(q.level,'question');
    const status=$(statusId);
    if(key==='india'&&status)status.textContent='Indian English · 正在準備語音…';
    if(key!=='india'&&status)status.textContent='North American English · 正在準備語音…';
    const resolved=key==='india'
      ? await speakIndian(q.text,rate,p=>{if(status)status.textContent=indianProgressText(p);})
      : await speakNorthAmerican(q.text,rate,p=>{if(status)status.textContent=northAmericanProgressText(p);});
    const c=session.currentMeta.accentCounts;
    const current=key==='india'
      ? indianPlaybackStatus(resolved,rate,'Indian English')
      : northAmericanPlaybackStatus(resolved,rate,'North American English');
    if(status)status.textContent=`北美 ${c.northAmerica||0} 次 · 印度 ${c.india||0} 次 · 本次 ${current}`;
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
      const answerSnapshot={kind:isListening?'listening_choice':'choice',selectedIndex:selected,selectedText:q.options?.[selected]||'',correct,correctText:q.options?.[q.answer]||'',quality,hint:!!session.currentMeta.hint,accentRepeats};
      session.currentMeta.latestAnswer=answerSnapshot; lastLittleEAnswer=answerSnapshot;
      const feedback=$('feedbackBox');
      const marked=qstat(q.id).manualReview;
      const reviewLabel=marked?'✓ 已標註複習（點擊取消）':(correct?'🎯 我是猜的，加入複習':'☆ 加入複習');
      feedback.className=`feedback show ${correct?'good':'bad'}`;
      feedback.innerHTML=`<strong>${correct?'答對了':'這題先記下來'}</strong>${esc(q.intent||'')} ${isListening?`<br><span class="support">北美 ${accentCounts.northAmerica||0} 次 · 印度 ${accentCounts.india||0} 次${session.currentMeta.hint?'，使用了 transcript':''}</span>`:''}<div class="review-mark-row"><button class="btn ghost review-mark-btn ${marked?'active':''}" id="manualReviewBtn" type="button">${reviewLabel}</button><span class="support" id="manualReviewHint">${marked?'這題會優先出現在錯題複習與自適應挑戰。':correct?'如果這題是猜中的，標註後系統會把它當成不熟題優先複習。':'答錯題本來就會進弱項複習，也可另外固定標註。'}</span></div>`;
      $('modelAnswer').classList.add('show'); $('nextBtn').classList.remove('hidden');
      recordAnswer(q,quality,correct,{listens:session.currentMeta.listens,hint:session.currentMeta.hint,accentCounts:{...accentCounts},repeats:accentRepeats});
      $('manualReviewBtn')?.addEventListener('click',()=>{
        const st=qstat(q.id);
        const next=!st.manualReview;
        setManualReview(q,next,correct?'guess':'manual');
        const btn=$('manualReviewBtn');
        const hint=$('manualReviewHint');
        if(btn){
          btn.classList.toggle('active',next);
          btn.textContent=next?'✓ 已標註複習（點擊取消）':(correct?'🎯 我是猜的，加入複習':'☆ 加入複習');
        }
        if(hint) hint.textContent=next?'這題會優先出現在錯題複習與自適應挑戰。':(correct?'如果這題是猜中的，標註後系統會把它當成不熟題優先複習。':'答錯題本來就會進弱項複習，也可另外固定標註。');
      });
      $('nextBtn').addEventListener('click',nextQuestion,{once:true});
    }));
  }

  function speakingFramework(q){
    const text=((q?.text||'')+' '+(q?.model||'')).toLowerCase();
    let title='四段聯想法';
    let mnemonic='一句回答 → 兩個重點 → 一個例子／結果 → 停';
    let steps=[
      ['1','先回答','直接回答問題','I would... / I usually...'],
      ['2','重點一','先說最重要的一點','The main point is...'],
      ['3','重點二／例子','補一個具體做法或案例','For example... / I also...'],
      ['4','收尾','用結果或目的結束','This helps... / As a result...']
    ];

    if(/tell me about yourself|introduce yourself|career|journey|background|current role|currently doing|what do you do/.test(text)){
      title='職涯／自我介紹：Now → Scope → Proof → Direction';
      mnemonic='現在是誰 → 負責什麼 → 用一個證據證明 → 往哪裡走';
      steps=[
        ['1','Now 現在','一句說現在角色／專案','Currently, I work on...'],
        ['2','Scope 範圍','說你真正負責的 2 個重點','My role mainly covers...'],
        ['3','Proof 證據','補一個具體成果／場景','For example, I...'],
        ['4','Direction 方向','連到下一個職涯目標','That is why I want to...']
      ];
    }else if(/why mongodb|why .*company|why are you leaving|why leave|why do you want|motivat/.test(text)){
      title='動機題：Reason → Fit → Evidence → Future';
      mnemonic='原因 → 為什麼適合 → 你有什麼證據 → 未來想做什麼';
      steps=[
        ['1','Reason 原因','先講真正動機，不繞圈','The main reason is...'],
        ['2','Fit 適配','公司／職位哪裡吸引你','What interests me is...'],
        ['3','Evidence 證據','用你的經驗證明不是空話','In my current role, I...'],
        ['4','Future 未來','說你希望下一步成長什麼','I want to build on that by...']
      ];
    }else if(/stakeholder|executive|communicat|status|production issue|critical issue|risk|update/.test(text)){
      title='高階溝通：Headline → Impact → Action → Next';
      mnemonic='先講結論 → 影響／風險 → 正在做什麼 → 下一個決策點';
      steps=[
        ['1','Headline 結論','先讓主管 10 秒知道發生什麼','The current situation is...'],
        ['2','Impact 影響','說客戶／時程／風險','The main impact is...'],
        ['3','Action 行動','說 owner、處理方式與進度','We are currently...'],
        ['4','Next 下一步','說下一個決策／時間點','The next step is...']
      ];
    }else if(/challenge|conflict|unclear ownership|incident|problem|difficult|example|tell me about a time/.test(text)){
      title='行為題：Situation → Ownership → Action → Result';
      mnemonic='背景一句 → 我負責什麼 → 我做了什麼 → 結果';
      steps=[
        ['1','Situation 情境','一句交代背景，不講太久','The situation was...'],
        ['2','Ownership 責任','清楚講「我」負責什麼','I was responsible for...'],
        ['3','Action 行動','只講 2–3 個關鍵動作','I first... Then I...'],
        ['4','Result 結果','數字、改善或學到什麼','As a result...']
      ];
    }else if(/scope|ownership|success|measure|project manager|project success|responsib/.test(text)){
      title='PM／Ownership：Scope → Criteria → Control → Outcome';
      mnemonic='範圍 → 怎樣算成功 → 如何控風險／責任 → 結果';
      steps=[
        ['1','Scope 範圍','先定義你負責的邊界','My scope includes...'],
        ['2','Criteria 標準','怎樣算做成功','Success means...'],
        ['3','Control 控制','風險、owner、時程怎麼管','I track... / I make sure...'],
        ['4','Outcome 結果','回到客戶／交付結果','The goal is to...']
      ];
    }

    return {title,mnemonic,steps};
  }
  function speakingFrameworkHtml(q){
    const fw=speakingFramework(q);
    return `<div class="speaking-framework"><div class="speaking-framework-head"><div><span class="badge">ANSWER MAP</span><h4>${esc(fw.title)}</h4></div><button class="btn ghost speaking-framework-toggle" type="button" data-framework-toggle>收起架構</button></div><div class="speaking-framework-body" data-framework-body><div class="speaking-framework-mnemonic">${esc(fw.mnemonic)}</div><div class="speaking-framework-steps">${fw.steps.map(step=>`<div class="speaking-framework-step"><b>${esc(step[0])}</b><div><strong>${esc(step[1])}</strong><span>${esc(step[2])}</span><em>${esc(step[3])}</em></div></div>`).join('')}</div><div class="support">先用中文想「每格要講什麼」，再用簡單英文填進去。你不用背 Model answer，只要記住順序。</div></div></div>`;
  }

  function renderSpeakingQuestion(q){
    const hideText=q.level>=3;
    const SR=speechRecognitionCtor();
    const recognitionAvailable=!!SR && state.settings.speechRecognition!=='off';
    const recorderAvailable=mediaRecorderAvailable();
    const recordLabel=recorderAvailable?'🎙 開始錄音回答':(recognitionAvailable?'🎙 開始語音辨識':'開始 45 秒');
    const recordClass=(recorderAvailable||recognitionAvailable)?'btn primary':'btn secondary';
    $('questionHost').innerHTML=`<article class="question-card"><div class="question-top"><div><span class="badge warn">SPEAK OUT LOUD</span><div class="question-title" id="speakingQuestionText">${hideText?'先聽問題，再用 30–60 秒回答。':esc(q.text)}</div><div class="question-intent">L${q.level} · 直接用英文回答。錄音完成後會先嘗試瀏覽器轉文字；若不可用，改用本機 Whisper，再提供 0–100 分與修正建議。</div></div></div><div class="audio-stage"><div class="audio-main"><button class="btn primary" id="playSpeakNorthAmericaBtn" type="button">▶ 北美面試官</button><button class="btn secondary" id="playSpeakIndiaBtn" type="button">▶ 印度面試官</button>${hideText?'<button class="btn ghost" id="revealSpeakQBtn" type="button">顯示問題文字</button>':''}<span class="audio-status" id="speakAudioStatus">北美＋印度雙口音</span></div></div><div class="speaking-stage">${speakingFrameworkHtml(q)}<div class="timer" id="speakTimer">00:45</div><div class="support">先照上面的 Answer Map 聯想，再直接用簡單英文講。錄音與轉文字是兩個不同功能。即使瀏覽器即時轉文字不可用，仍會保留錄音，並在講完後嘗試本機 Whisper 分析。</div><div class="btn-row" style="margin-top:12px"><button class="${recordClass}" id="recognitionBtn" type="button">${recordLabel}</button><button class="btn ghost" id="finishSpeakingBtn" type="button">■ 我講完了</button></div><div class="recorded-audio hidden" id="recordedAudioHost"><strong>你的錄音</strong><audio id="recordedAudioPlayer" controls preload="metadata"></audio><span class="support" id="recordedAudioStatus"></span></div><div class="speech-text" id="speechText">${recognitionAvailable?'按「開始錄音回答」後直接說，若轉文字可用，辨識內容會即時顯示。':(recorderAvailable?'這個瀏覽器目前無法自動轉文字，但仍可以錄音、播放回聽，再用自評完成題目。':'此瀏覽器目前無法使用錄音與語音辨識，可改用計時＋自評。')}</div></div><div class="speaking-score hidden" id="speakingScoreHost"></div>${modelAnswerHtml(q,'Model answer（講完才看）').replace('<div class="model-answer">','<div class="model-answer" id="modelAnswer">')}<div class="feedback neutral" id="feedbackBox"><strong id="feedbackTitle">${recognitionAvailable?'錄音後會自動評分':'錄音完成後可回聽'}</strong><span id="feedbackNote">${recognitionAvailable?'若即時轉文字失敗，系統會再嘗試本機 Whisper。':'完成錄音後會嘗試本機 Whisper 轉文字與評分；若仍失敗才改用自評。'}</span><div class="self-rate" id="selfRateBlock"><button class="good" data-quality="3" type="button">✓ 順暢 / 能說清楚</button><button class="mid" data-quality="2" type="button">△ 有卡，但能完成</button><button class="bad" data-quality="1" type="button">× 很卡 / 需要重練</button></div></div><div class="btn-row" style="margin-top:16px"><button class="btn primary hidden" id="nextBtn" type="button">下一題 →</button><button class="btn ghost hidden" id="retrySameSpeakingBtn" type="button">↻ 套用修正再答一次</button></div></article>`;
    $('playSpeakNorthAmericaBtn').addEventListener('click',()=>playQuestionAccent(q,'northAmerica',chooseVoiceLang(q.level),'speakAudioStatus'));
    $('playSpeakIndiaBtn').addEventListener('click',()=>playQuestionAccent(q,'india','en-IN','speakAudioStatus'));
    document.querySelector('[data-framework-toggle]')?.addEventListener('click',e=>{
      const body=document.querySelector('[data-framework-body]');
      if(!body)return;
      body.classList.toggle('hidden');
      e.currentTarget.textContent=body.classList.contains('hidden')?'展開架構':'收起架構';
    });
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

  function assessTranscriptReliability(text,q){
    const tokens=speakingTokens(text);
    const meaningful=meaningfulTokens(text);
    const reasons=[];
    let score=100;
    const duration=Math.max(0,recordingDurationSec||0);
    const wpm=duration>1?Math.round(tokens.length/(duration/60)):null;

    if(tokens.length<5){score-=40;reasons.push('辨識到的英文太短');}
    else if(tokens.length<9){score-=12;reasons.push('辨識字數偏少');}

    if(duration>=10 && wpm!==null){
      if(wpm<30){score-=38;reasons.push('錄音長度與辨識字數明顯不成比例');}
      else if(wpm<45){score-=20;reasons.push('錄音長度與辨識字數可能不成比例');}
      else if(wpm>220){score-=18;reasons.push('辨識出的語速異常偏快');}
    }

    const keywordHits=(q.keywords||[]).filter(k=>keywordHit(text,k)).length;
    const modelSet=new Set(meaningfulTokens(q.model||''));
    const overlap=meaningful.filter(w=>modelSet.has(w)).length;
    if(tokens.length<=12 && keywordHits===0 && overlap===0){
      score-=24;
      reasons.push('辨識內容和題目／參考回答幾乎沒有語意線索重疊');
    }

    const repeated=tokens.filter((w,i)=>i>0&&tokens[i-1]===w&&w.length>2).length;
    if(repeated>=3){score-=10;reasons.push('辨識結果有大量重複字');}

    score=clamp(score,0,100);
    return {
      score,
      level:score>=80?'high':score>=60?'medium':'low',
      reasons:[...new Set(reasons)],
      wordCount:tokens.length,
      meaningfulCount:meaningful.length,
      estimatedWpm:wpm
    };
  }

  function renderTranscriptReview(q,transcript,reliability){
    const host=$('speakingScoreHost');
    if(!host)return;
    session.currentMeta.pendingTranscript=transcript;
    const reasons=reliability.reasons.length
      ? '<ul>'+reliability.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>'
      : '<p>系統無法充分確認這份轉錄是否完整。</p>';
    host.className='speaking-score transcript-review';
    host.innerHTML=`<div class="transcript-review-head"><div><span class="badge warn">先確認轉錄</span><h3>這次先不自動評分</h3></div><div class="transcript-confidence">${reliability.score}<span>/100</span><small>轉錄可信度</small></div></div>
      <p class="support">這是「語音辨識可信度」，不是你的英文分數。避免 Whisper 聽錯後反過來扣你的英文能力。</p>
      <div class="transcript-review-reasons">${reasons}</div>
      <label class="transcript-edit-label" for="transcriptEditInput">請確認／修正你實際說的英文</label>
      <textarea id="transcriptEditInput" class="transcript-edit-input" rows="4">${esc(transcript)}</textarea>
      <div class="btn-row transcript-review-actions">
        <button class="btn primary" id="confirmTranscriptBtn" type="button">✓ 用這份文字評分</button>
        <button class="btn ghost" id="retryRecordingBtn" type="button">🎙 重新錄音</button>
      </div>
      <div class="support">如果只有少數辨識錯字，直接改成你真正說的內容再評分；如果整句辨識錯很多，重新錄音會更準。</div>`;

    $('speechText').innerHTML=`<strong>⚠️ 語音辨識可能有誤</strong><br><span class="support">目前先暫停文法、內容與 WPM 評分，等你確認文字後才寫入學習紀錄。</span>`;
    $('feedbackTitle').textContent='請先確認辨識文字';
    $('feedbackNote').textContent='這次結果不會先扣分，也不會寫入 Error Memory。';
    const self=$('selfRateBlock'); if(self)self.classList.add('hidden');

    $('confirmTranscriptBtn')?.addEventListener('click',()=>{
      const edited=String($('transcriptEditInput')?.value||'').trim();
      if(speakingTokens(edited).length<3){
        $('feedbackNote').textContent='文字太短，請修正後再評分，或重新錄音。';
        return;
      }
      speechTranscript=edited;
      session.currentMeta.transcriptionSource=(session.currentMeta.transcriptionSource||'browser')+'+confirmed';
      scoreSpeakingTranscript(q,edited,reliability,true);
    });

    $('retryRecordingBtn')?.addEventListener('click',()=>{
      const recognitionAvailable=!!speechRecognitionCtor() && state.settings.speechRecognition!=='off';
      startRecordedAnswer(q,recognitionAvailable);
    });

    const recognitionBtn=$('recognitionBtn');
    if(recognitionBtn){recognitionBtn.disabled=false;recognitionBtn.textContent='🎙 重新錄音';}
  }

  function scoreSpeakingTranscript(q,transcript,reliability,userConfirmed=false){
    if(!session || session.currentMeta.answered)return;
    const retryBaseline=session.currentMeta.retryBaseline;
    const analysis=analyzeSpeakingAnswer(transcript,q);
    analysis.transcriptReliability=reliability?.score??null;analysis.transcriptConfirmed=!!userConfirmed;
    applyRecordingMetrics(analysis);
    const correction=buildSpokenCorrection(transcript,q);
    rememberSpeakingErrors(q,transcript,analysis,correction);
    const answerSnapshot={kind:'speaking',transcript,score:analysis.score,corrected:correction.corrected||'',natural:correction.natural||'',notes:[...(correction.notes||[])],missing:[...(analysis.missing||[])],suggestions:[...(analysis.suggestions||[])],wordsPerMinute:analysis.wordsPerMinute||null};
    session.currentMeta.latestAnswer=answerSnapshot;lastLittleEAnswer=answerSnapshot;
    session.currentMeta.answered=true;session.currentMeta.scoringDone=true;session.currentMeta.processingScore=false;
    let quality=analysis.score>=80?3:analysis.score>=60?2:1;if(session.currentMeta.hint&&quality===3)quality=2;
    recordAnswer(q,quality,analysis.score>=60,{
      listens:session.currentMeta.listens,hint:session.currentMeta.hint,transcript,systemScore:analysis.score,scoreBreakdown:analysis.breakdown,
      suggestions:analysis.suggestions,recordedAudio:!!recordedAudioUrl,recordingDurationSec,wordsPerMinute:analysis.wordsPerMinute||null,
      transcriptionSource:session.currentMeta.transcriptionSource||'browser',transcriptReliability:reliability?.score??null,transcriptConfirmed:!!userConfirmed,
      retrySource:retryBaseline?.source||null,retryBeforeScore:Number.isFinite(retryBaseline?.before?.score)?retryBaseline.before.score:null
    });
    const retryComparison=retryBaseline?finalizeSpeakingRetry(q,retryBaseline,answerSnapshot):null;
    if(retryComparison)answerSnapshot.retryComparison=retryComparison;
    save();$('modelAnswer')?.classList.add('show');renderSpeakingScore(analysis,q,transcript,retryComparison);
    const nextBtn=$('nextBtn'),retryBtn=$('retrySameSpeakingBtn');
    nextBtn?.classList.remove('hidden');if(nextBtn)nextBtn.textContent='下一題 →';nextBtn?.addEventListener('click',nextQuestion,{once:true});
    if(analysis.score<80){
      retryBtn?.classList.remove('hidden');if(retryBtn)retryBtn.textContent='↻ 套用修正再答一次';
      retryBtn?.addEventListener('click',()=>beginSpeakingRetry(q,'score_card'),{once:true});
      if(analysis.score<60){
        $('feedbackTitle').textContent='這題會提高後續出現頻率';
        $('feedbackNote').textContent='目前低於 60 分。你可以直接下一題，或套用修正版再答一次；重答後會顯示 Before / After，並自動安排下一次複習。';
      }else{
        $('feedbackTitle').textContent=retryComparison?'已完成重答比較':'已完成評分';
        $('feedbackNote').textContent=retryComparison?retryComparison.reviewLabel+'。':'如果你想把 60–79 分的回答練穩，可以直接重答一次；系統會保留前後分數。';
      }
    }else{
      retryBtn?.classList.add('hidden');
      if(retryComparison){$('feedbackTitle').textContent='重答已達穩定標準';$('feedbackNote').textContent=retryComparison.reviewLabel+'。';}
    }
    const recognitionBtn=$('recognitionBtn');if(recognitionBtn){recognitionBtn.disabled=true;recognitionBtn.textContent='✓ 已完成評分';}
  }

  async function finishSpeakingStage(q){
    if(session.currentMeta.scoringDone || session.currentMeta.processingScore) return;
    session.currentMeta.processingScore=true;
    stopSpeakingTimer(); stopRecognition();
    const recognitionBtn=$('recognitionBtn');
    if(recognitionBtn){recognitionBtn.disabled=true;recognitionBtn.textContent='處理中…';}
    await stopMediaRecording(false);
    $('feedbackBox').classList.add('show');

    let transcript=(speechTranscript||'').trim();
    const enoughText=()=>speakingTokens(transcript).length>=3;

    if(!enoughText() && recordedAudioUrl && state.settings.speechRecognition!=='off'){
      $('feedbackTitle').textContent='正在分析你的錄音';
      $('feedbackNote').textContent='瀏覽器即時轉文字不可用，改用本機 Whisper。第一次使用需要下載語音模型，之後會由瀏覽器快取。';
      const el=$('speechText');
      if(el)el.innerHTML='<strong>本機 AI 轉文字中…</strong><br><span class="support">請保留此頁面開啟。完成後會先檢查轉錄可信度，再決定是否評分。</span>';
      transcript=await transcribeRecordedAudio(recordedAudioUrl);
      speechTranscript=transcript;
    }

    if(enoughText()){
      const reliability=assessTranscriptReliability(transcript,q);
      session.currentMeta.transcriptReliability=reliability.score;
      if(reliability.level==='high'){
        scoreSpeakingTranscript(q,transcript,reliability,false);
      }else{
        session.currentMeta.processingScore=false;
        renderTranscriptReview(q,transcript,reliability);
      }
    }else{
      session.currentMeta.processingScore=false;
      $('feedbackTitle').textContent='錄音已完成，但自動轉文字沒有成功';
      $('feedbackNote').textContent=session.currentMeta.mediaRecorderStarted?'你的錄音仍可播放。可以重新錄音再試一次，或用下方自評完成這題。':'請先確認網站麥克風權限後重試。';
      const el=$('speechText');
      if(el)el.textContent='沒有取得足夠的英文轉文字內容，因此這次無法做內容與文法評分。錄音播放器仍可正常使用。';
      if(recognitionBtn){recognitionBtn.disabled=false;recognitionBtn.textContent='🎙 重新錄音';}
    }
  }

  function applyRecordingMetrics(analysis){
    if(!(recordingDurationSec>1) || !analysis?.wordCount)return analysis;
    const wpm=Math.round(analysis.wordCount/(recordingDurationSec/60));
    analysis.wordsPerMinute=wpm;
    analysis.recordingDurationSec=Math.round(recordingDurationSec);
    if(wpm<65) analysis.suggestions.push(`口說速度約 ${wpm} WPM，整體偏慢；可以減少長停頓，先用短句連續說完重點。`);
    else if(wpm>180) analysis.suggestions.push(`口說速度約 ${wpm} WPM，偏快；面試時可以多留短停頓，讓重點更清楚。`);
    analysis.suggestions=analysis.suggestions.slice(0,4);
    return analysis;
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
  function renderSpeakingScore(analysis,q,transcript,retryComparison=null){
    const host=$('speakingScoreHost');
    if(!host)return;
    const b=analysis.breakdown;
    const correction=buildSpokenCorrection(transcript,q);
    const notesHtml=correction.notes.length?'<ul>'+correction.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>':'<p>目前沒有偵測到明顯的規則型文法錯誤；可以再看內容完整度與 Model answer 的差異。</p>';
    const fixHtml='<div class="language-fix-box"><strong>依據你剛剛說的內容修正</strong><div class="correction-version"><span>文法修正版</span><p>'+esc(correction.corrected)+'</p><button class="btn ghost" id="playCorrectedBtn" type="button">▶ 聽修正版</button></div><div class="correction-version natural"><span>更自然的面試說法</span><p>'+esc(correction.natural)+'</p><button class="btn ghost" id="playNaturalBtn" type="button">▶ 聽自然版</button></div><div class="correction-notes"><span>為什麼這樣改</span>'+notesHtml+'</div><div class="support">修正會盡量保留你的原意，不是直接拿 Model answer 取代你的回答。若語音轉文字有辨識錯字，也可能影響修正結果。</div></div>';
    const tone=analysis.score>=80?'good':analysis.score>=60?'mid':'low';
    const reliabilityHtml=analysis.transcriptReliability!==null&&analysis.transcriptReliability!==undefined
      ? `<div class="transcript-score-note">${analysis.transcriptConfirmed?'✓ 轉錄已由你確認':`轉錄可信度 ${analysis.transcriptReliability}/100`}</div>`
      : '';
    const paceHtml=analysis.wordsPerMinute?`<div class="speaking-pace"><b>${analysis.wordsPerMinute} WPM</b><span>錄音 ${analysis.recordingDurationSec}s · 語速參考</span></div>`:'';
    const retryHtml=retryComparison?(()=>{
      const delta=Number(retryComparison.delta)||0,deltaLabel=(delta>0?'+':'')+delta,deltaTone=delta>0?'up':delta<0?'down':'flat';
      return `<div class="speaking-retry-comparison ${deltaTone}"><div class="retry-comparison-head"><div><span class="badge good">RETRY LOOP</span><strong>重新回答成效</strong></div><span class="retry-review-label">${esc(retryComparison.reviewLabel)}</span></div><div class="retry-score-grid"><div><span>Before</span><b>${retryComparison.beforeScore}</b></div><div class="retry-arrow">→</div><div><span>After</span><b>${retryComparison.afterScore}</b></div><div class="retry-delta"><span>Δ</span><b>${deltaLabel}</b></div></div><p>${delta>0?'這次重答有進步，系統會保留前後分數並依新表現安排複習。':delta<0?'這次分數下降，系統會更快安排複習；先看修正再重組一次即可。':'分數持平，系統仍會依目前程度安排下一次複習。'}</p></div>`;
    })():'';
    host.className=`speaking-score ${tone}`;
    host.innerHTML=`<div class="speaking-score-head"><div><div class="support">回答比對分數</div><div class="speaking-score-number">${analysis.score}<span>/100</span></div></div><div class="speaking-score-summary">${analysis.score>=80?'內容完整，可以往更自然的表達前進。':analysis.score>=60?'主要意思有說到，再補齊缺少內容會更穩。':'目前回答和題目重點有落差，先把核心內容講完整。'}</div></div>
      <div class="score-breakdown">
        <div><b>${b.content}/45</b><span>內容切題</span></div>
        <div><b>${b.completeness}/20</b><span>完整度</span></div>
        <div><b>${b.structure}/20</b><span>回答結構</span></div>
        <div><b>${b.fluency}/15</b><span>流暢度線索</span></div>
      </div>
      ${reliabilityHtml}${paceHtml}${retryHtml}<div class="spoken-compare"><div><strong>你說的</strong><p>${esc(transcript)}</p></div><div><strong>需要調整</strong><ul>${analysis.suggestions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div></div>
      ${fixHtml}<div class="support score-disclaimer">此分數只會在轉錄可信度足夠，或你已確認／修正辨識文字後寫入紀錄；依內容、關鍵重點、長度、結構與 filler / 重複字計算。目前不評發音準確度或口音。</div>`;
    $('speechText').innerHTML=`<strong>辨識內容：</strong> ${esc(transcript)}<br><span class="support">關鍵內容覆蓋：約 ${analysis.keywordRatio}% · ${analysis.wordCount} words</span>`;
    $('feedbackTitle').textContent='系統已完成比對';
    $('feedbackNote').textContent='分數會直接納入這一題的訓練紀錄；Model answer 是參考，不需要逐字一樣。';
    $('playCorrectedBtn')?.addEventListener('click',async()=>{await speakNorthAmerican(correction.corrected,1.0);});
    $('playNaturalBtn')?.addEventListener('click',async()=>{await speakNorthAmerican(correction.natural,1.0);});
    const self=$('selfRateBlock'); if(self)self.classList.add('hidden');
  }

  function startSpeakingTimer(sec){
    stopSpeakingTimer(); speakingSeconds=sec; updateSpeakTimer();
    speakingTimer=setInterval(()=>{speakingSeconds--;updateSpeakTimer();if(speakingSeconds<=0){stopSpeakingTimer(); const q=session.questions[session.index]; finishSpeakingStage(q);}},1000);
  }
  function stopSpeakingTimer(){if(speakingTimer){clearInterval(speakingTimer);speakingTimer=null;}}
  function updateSpeakTimer(){const el=$('speakTimer');if(el)el.textContent=`00:${String(Math.max(0,speakingSeconds)).padStart(2,'0')}`;}

  function cleanupModelPracticeAudio(){
    if(modelPracticeAudioUrl){try{URL.revokeObjectURL(modelPracticeAudioUrl);}catch(e){}}
    modelPracticeAudioUrl='';
  }
  function releaseModelPracticeStream(){
    if(modelPracticeStream) modelPracticeStream.getTracks().forEach(t=>{try{t.stop();}catch(e){}});
    modelPracticeStream=null;
  }
  async function stopModelPracticeRecording(saveTake=true){
    if(modelPracticeRecorder && modelPracticeRecorder.state!=='inactive'){
      return new Promise(resolve=>{
        const recorder=modelPracticeRecorder;
        const previous=recorder.onstop;
        recorder.onstop=()=>{
          if(typeof previous==='function') previous();
          if(saveTake){
            const q=session?.questions?.[session.index];
            if(q){
              const stat=qstat(q.id); stat.modelPracticeCount=(stat.modelPracticeCount||0)+1; save();
              const count=document.querySelector('[data-model-practice-count]');
              if(count)count.textContent=`已練 ${stat.modelPracticeCount} 次`;
              window.EDAN_CLOUD?.logEvent?.('model_answer_practiced',{questionId:q.id,count:stat.modelPracticeCount},q.id+'-'+todayKey());
            }
          }
          resolve();
        };
        try{recorder.stop();}catch(e){releaseModelPracticeStream();resolve();}
      });
    }
    releaseModelPracticeStream();
  }
  async function startModelPracticeRecording(){
    if(!mediaRecorderAvailable())return false;
    await stopModelPracticeRecording(false);
    await stopMediaRecording(true);
    cleanupModelPracticeAudio();
    modelPracticeChunks=[];
    try{
      modelPracticeStream=await navigator.mediaDevices.getUserMedia({audio:true});
      modelPracticeRecorder=new MediaRecorder(modelPracticeStream);
      modelPracticeRecorder.ondataavailable=e=>{if(e.data&&e.data.size>0)modelPracticeChunks.push(e.data);};
      modelPracticeRecorder.onstop=()=>{
        const chunks=modelPracticeChunks.slice();
        modelPracticeChunks=[];
        releaseModelPracticeStream();
        modelPracticeRecorder=null;
        if(chunks.length){
          const blob=new Blob(chunks,{type:chunks[0].type||'audio/webm'});
          cleanupModelPracticeAudio();
          modelPracticeAudioUrl=URL.createObjectURL(blob);
          const box=document.querySelector('[data-model-practice-playback]');
          const audio=document.querySelector('[data-model-practice-audio]');
          if(box&&audio){audio.src=modelPracticeAudioUrl;box.classList.remove('hidden');}
        }
      };
      modelPracticeRecorder.start();
      return true;
    }catch(e){
      releaseModelPracticeStream();
      modelPracticeRecorder=null;
      return false;
    }
  }

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
      try{mediaRecorder.stop();}catch(e){releaseMediaStream();if(mediaStopResolve){mediaStopResolve();mediaStopResolve=null;}}
      return mediaStopPromise;
    }
    releaseMediaStream();
    if(discard)cleanupRecordedAudio();
    return Promise.resolve();
  }
  async function startMediaRecording(){
    if(!mediaRecorderAvailable())return false;
    try{
      await stopMediaRecording(true);
      cleanupRecordedAudio();
      mediaChunks=[];
      discardRecording=false;
      recordingDurationSec=0;
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder=new MediaRecorder(mediaStream);
      mediaStopPromise=new Promise(resolve=>{mediaStopResolve=resolve;});
      mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size>0)mediaChunks.push(e.data);};
      mediaRecorder.onstop=()=>{
        const chunks=mediaChunks.slice();
        mediaChunks=[];
        const shouldDiscard=discardRecording;
        if(recordingStartedAt)recordingDurationSec=Math.max(0,(performance.now()-recordingStartedAt)/1000);
        recordingStartedAt=0;
        releaseMediaStream();
        mediaRecorder=null;
        if(!shouldDiscard&&chunks.length){
          const blob=new Blob(chunks,{type:chunks[0].type||'audio/webm'});
          renderRecordedAudio(blob);
        }else if(shouldDiscard){
          cleanupRecordedAudio();
        }
        discardRecording=false;
        if(mediaStopResolve){mediaStopResolve();mediaStopResolve=null;}
      };
      recordingStartedAt=performance.now();
      mediaRecorder.start();
      return true;
    }catch(e){
      releaseMediaStream();
      if(mediaStopResolve){mediaStopResolve();mediaStopResolve=null;}
      const host=$('recordedAudioHost');
      const status=$('recordedAudioStatus');
      if(host)host.classList.remove('hidden');
      if(status)status.textContent='無法啟用麥克風錄音。請確認瀏覽器已允許此網站使用麥克風。';
      return false;
    }
  }
  async function getWhisperTranscriber(){
    if(whisperTranscriber)return whisperTranscriber;
    if(whisperLoadingPromise)return whisperLoadingPromise;
    whisperLoadingPromise=(async()=>{
      const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0');
      const make=async(device)=>{
        const opts=device?{device}:{};
        return mod.pipeline('automatic-speech-recognition','onnx-community/whisper-tiny.en',opts);
      };
      try{
        whisperTranscriber=await make(navigator.gpu?'webgpu':null);
      }catch(e){
        whisperTranscriber=await make(null);
      }
      return whisperTranscriber;
    })();
    try{return await whisperLoadingPromise;}
    finally{whisperLoadingPromise=null;}
  }
  async function transcribeRecordedAudio(audioUrl){
    try{
      const transcriber=await getWhisperTranscriber();
      const result=await transcriber(audioUrl,{return_timestamps:false});
      const text=String(result?.text||'').trim();
      if(text && session?.currentMeta)session.currentMeta.transcriptionSource='local-whisper';
      return text;
    }catch(e){
      const el=$('speechText');
      if(el)el.innerHTML='<strong>本機 Whisper 無法完成轉文字。</strong><br><span class="support">錄音仍保留，可播放回聽或改用自評。</span>';
      return '';
    }
  }
  function startRecognition(q,startTimer=true){
    const SR=speechRecognitionCtor(); if(!SR)return false;
    stopRecognition(); speechTranscript=''; session.currentMeta.scoringDone=false; session.currentMeta.answered=false;
    recognition=new SR(); recognition.lang='en-US'; recognition.continuous=true; recognition.interimResults=true;
    recognition.onresult=(e)=>{let text='';for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript+' ';speechTranscript=text.trim();if(speechTranscript&&session?.currentMeta)session.currentMeta.transcriptionSource='browser';const el=$('speechText');if(el)el.textContent=speechTranscript||'正在聽…';};
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
    session.currentMeta.scoringDone=false; session.currentMeta.answered=false; session.currentMeta.processingScore=false; session.currentMeta.pendingTranscript=null;
    const scoreHost=$('speakingScoreHost'); if(scoreHost){scoreHost.className='speaking-score hidden';scoreHost.innerHTML='';}
    const model=$('modelAnswer'); if(model)model.classList.remove('show');
    const btn=$('recognitionBtn');
    if(btn){btn.disabled=true;btn.textContent='● 啟動麥克風…';}
    const recorded=await startMediaRecording();
    session.currentMeta.mediaRecorderStarted=recorded;
    const recognized=recognitionAvailable?startRecognition(q,false):false;
    const el=$('speechText');
    if(el){
      if(recognized) el.textContent='● 正在錄音；若自動轉文字可用，內容會顯示在這裡。';
      else if(recorded) el.textContent='● 正在錄音。講完後會改用本機 Whisper 轉文字，再進行評分與修正。';
      else el.textContent='無法啟用麥克風。請確認網站權限；你仍可用計時＋自評完成這題。';
    }
    if(btn){btn.textContent=(recorded||recognized)?'● 錄音中':'開始 45 秒';btn.disabled=recorded||recognized;}
    startSpeakingTimer(45);
  }
  function stopRecognition(){if(recognition){try{recognition.stop();}catch(e){} recognition=null;}}
  function keywordCoverage(text,keywords){if(!text||!keywords.length)return 0;const t=text.toLowerCase();let hit=0;keywords.forEach(k=>{const pieces=k.toLowerCase().split(/\s+/).filter(w=>w.length>3);if(pieces.some(p=>t.includes(p)))hit++;});return Math.round(hit/keywords.length*100);}

  function recordAnswer(q,quality,correct,extra){
    const s=qstat(q.id); s.seen++; if(correct)s.correct++;else s.wrong++; s.lastQuality=quality;s.lastSeen=todayKey();
    s.lastOutcome=!correct?'wrong':(quality<=1?'guessed':'correct');
    if(q.type==='speaking' && Number.isFinite(extra?.systemScore)){
      s.lastSystemScore=extra.systemScore;
      if(extra.systemScore<60){
        s.speakingLowScoreCount=(s.speakingLowScoreCount||0)+1;
        s.lastOutcome='wrong';
        s.interval=0;
        s.due=todayKey();
      }else{
        s.speakingLowScoreCount=Math.max(0,(s.speakingLowScoreCount||0)-1);
      }
    }
    const lowSpeaking=q.type==='speaking' && Number.isFinite(extra?.systemScore) && extra.systemScore<60;
    if(!lowSpeaking){
      if(quality>=3){s.interval=s.interval?Math.min(30,Math.max(2,Math.round(s.interval*2))):2;}
      else if(quality===2){s.interval=s.interval?Math.max(2,Math.round(s.interval*1.3)):2;}
      else if(quality===1){s.interval=1;} else {s.interval=0;}
      s.due=addDays(s.interval);
    }
    const k=q.skill; const current=state.skills[k]||1; const delta={3:.09,2:.035,1:-.025,0:-.07}[quality]||0;
    state.skills[k]=clamp(current+delta*(1+Math.max(0,q.level-current)*.12),1,5);
    if(q.type==='speaking') state.skills.speaking=clamp((state.skills.speaking||1)+delta*.85,1,5);
    const xp=Math.max(2,Math.round(q.level*({3:12,2:8,1:4,0:2}[quality]||2))); state.xp+=xp;
    const answerExtra={...(extra||{})};
    answerExtra.weakness=diagnoseWeakness(q,quality,correct,answerExtra);
    addWeakness(answerExtra.weakness);
    session.answers.push({id:q.id,skill:q.skill,level:q.level,quality,correct,extra:answerExtra,xp});
    captureSkillSnapshot('answer');
    save(); renderOverview();
  }

  function nextQuestion(){speakingRetryCycle=null;session.index++;if(session.index>=session.questions.length)finishSession(true);else renderCurrentQuestion();}

  function finishSession(completedUnit=true){
    stopSpeakingTimer();stopRecognition();stopMediaRecording(true);cleanupRecordedAudio();stopModelPracticeRecording(false);cleanupModelPracticeAudio();speechSynthesis.cancel();$('challengeSection').classList.remove('active');$('sessionProgress').style.width='100%';
    if(!session || !session.answers.length){session=null;return;}
    const sessionMode=session.mode;
    const avg=session.answers.reduce((a,b)=>a+b.quality,0)/(session.answers.length*3); const score=Math.round(avg*100);
    const bySkill={};session.answers.forEach(a=>{bySkill[a.skill]=bySkill[a.skill]||[];bySkill[a.skill].push(a.quality);});
    const skillAvgs=Object.entries(bySkill).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]).sort((a,b)=>a[1]-b[1]);
    const weakest=skillAvgs[0]?.[0]||'listening';
    const trainingCompleted=completedUnit&&sessionMode!=='diagnostic';
    const rec={date:new Date().toLocaleString('zh-TW',{hour12:false}),title:session.title+(!completedUnit&&sessionMode!=='diagnostic'?'（未完成）':''),mode:sessionMode,missionTaskKey:session.missionTaskKey||null,missionDate:session.missionDate||null,count:session.answers.length,score,weakest:skillLabels[weakest]||weakest,answers:session.answers.slice(),completedUnit:trainingCompleted,diagnostic:sessionMode==='diagnostic'};
    state.sessions.push(rec); if(state.sessions.length>60)state.sessions=state.sessions.slice(-60);
    if(trainingCompleted) markPracticeDay();
    captureSkillSnapshot(sessionMode==='diagnostic'?'diagnostic_completed':'session_completed');
    save();
    window.EDAN_CLOUD?.logEvent?.('session_completed',{
      title:rec.title,
      score:rec.score,
      count:rec.count,
      weakest:rec.weakest,
      completedUnit:rec.completedUnit,
      mode:rec.mode,
      missionTaskKey:rec.missionTaskKey,
      answers:rec.answers.map(a=>({
        id:a.id,skill:a.skill,level:a.level,quality:a.quality,correct:a.correct,
        systemScore:a.extra?.systemScore??null,
        weakness:a.extra?.weakness??null,
        wordsPerMinute:a.extra?.wordsPerMinute??null
      }))
    }, rec.title+'-'+todayKey());
    $('resultScore').textContent=`${score}%`;
    const low=session.answers.filter(a=>a.quality<=1).length; const strong=session.answers.filter(a=>a.quality===3).length; const hint=session.answers.filter(a=>a.extra?.hint).length; const repeats=session.answers.reduce((n,a)=>n+(Number.isFinite(a.extra?.repeats)?a.extra.repeats:Math.max(0,(a.extra?.listens||0)-1)),0);
    let diagnostic=null;if(sessionMode==='diagnostic'&&completedUnit)diagnostic=completeDiagnostic(session.answers,score);
    $('resultSummary').textContent=diagnostic?`診斷完成：Listening L${diagnostic.levels.listening.toFixed(1)} · Speaking L${diagnostic.levels.speaking.toFixed(1)} · Practical L${diagnostic.levels.practical.toFixed(1)}。下一步：${diagnostic.recommendation}`:score>=80?'這輪很穩。下一輪會優先換新題，已熟題目進入冷卻，只在到期時回來複習。':score>=60?'基礎已經能撐住。下一輪仍會照顧弱項，但會避開最近幾回合剛出現過的相同題目。':'這輪先補弱點，但不會連續洗同一題；弱題會間隔後再回來確認是否真的學會。';
    const weaknessThis={}; session.answers.forEach(a=>{const w=a.extra?.weakness;if(w)weaknessThis[w]=(weaknessThis[w]||0)+1;});
    const topThis=Object.entries(weaknessThis).sort((a,b)=>b[1]-a[1])[0]?.[0];
    $('resultGrid').innerHTML=diagnostic?`<div class="result-mini"><b>L${diagnostic.levels.listening.toFixed(1)}</b><span>Listening</span></div><div class="result-mini"><b>L${diagnostic.levels.speaking.toFixed(1)}</b><span>Speaking</span></div><div class="result-mini"><b>L${diagnostic.levels.practical.toFixed(1)}</b><span>Practical English</span></div><div class="result-mini"><b>${score}%</b><span>Diagnostic score</span></div>`:`<div class="result-mini"><b>${strong}</b><span>高品質回答</span></div><div class="result-mini"><b>${low}</b><span>需要重練</span></div><div class="result-mini"><b>${hint}</b><span>使用文字提示</span></div><div class="result-mini"><b>${repeats}</b><span>額外重播次數</span></div>${topThis?`<div class="result-mini"><b>→</b><span>主要弱點：${esc(weaknessLabels[topThis]||topThis)}</span></div>`:''}`;
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
    return 'en-US';
  }
  function accentLabel(lang){
    if(lang==='en-CA')return 'Canadian English';
    if(lang==='en-US')return 'North American English';
    if(lang==='en-IN')return 'Indian English';
    return lang;
  }
  function voiceDisplay(level){const lang=chooseVoiceLang(level);return `${accentLabel(lang)} · ${playbackRate(level,'question').toFixed(2)}x`;}
  function refreshVoiceCache(){
    if(!('speechSynthesis' in window))return [];
    const voices=speechSynthesis.getVoices()||[];
    if(voices.length) englishVoiceCache=voices.filter(v=>(v.lang||'').toLowerCase().startsWith('en'));
    return englishVoiceCache;
  }
  function indianVoiceIdentity(v){
    const name=(v?.name||'').toLowerCase();
    const lang=(v?.lang||'').toLowerCase().replace('_','-');
    return lang==='en-in'
      || /english\s*\(india\)|english[- ]india|india[- ]english|indian english|\ben-in\b/.test(name)
      || /\b(neerja|prabhat|heera|ravi|rishi|veena)\b/.test(name);
  }

  function voiceScore(v,targetLang){
    const name=(v.name||'').toLowerCase();
    const lang=(v.lang||'').toLowerCase().replace('_','-');
    const target=String(targetLang||'en-US').toLowerCase();
    let score=0;

    if(target==='en-in'){
      if(!indianVoiceIdentity(v))return -10000;
      if(lang==='en-in')score+=500;
      if(/neerja|prabhat|heera|ravi|rishi|veena/.test(name))score+=180;
      if(/english\s*\(india\)|english[- ]india|indian english/.test(name))score+=130;
    }else{
      if(lang===target.toLowerCase())score+=150;
      else if(target.toLowerCase()==='en-us' && lang==='en-ca')score+=55;
      else if(lang.startsWith('en'))score+=30;
    }

    if(/natural|neural|premium|enhanced|online/.test(name))score+=130;
    if(target!=='en-in' && /aria|jenny|guy|ava|andrew|emma|brian|sonia|ryan/.test(name))score+=70;
    if(target!=='en-in' && /google.*us english|google us english/.test(name))score+=60;
    if(/microsoft/.test(name))score+=38;
    if(/google/.test(name))score+=28;
    if(v.localService===false)score+=18;
    if(/compact|espeak|eloquence|classic|default/.test(name))score-=90;
    return score;
  }

  function bestVoice(candidates,targetLang){
    if(!candidates.length)return null;
    if((state.settings.voiceQuality||'natural')==='system')return candidates[0];
    return [...candidates].sort((a,b)=>voiceScore(b,targetLang)-voiceScore(a,targetLang))[0];
  }

  function resolveVoice(lang){
    const voices=refreshVoiceCache();
    const requested=String(lang||'en-US').toLowerCase().replace('_','-');

    if(requested==='en-in'){
      const indianCandidates=voices.filter(indianVoiceIdentity);
      const voice=bestVoice(indianCandidates,'en-IN');
      if(!voice){
        return {
          voice:null,
          actualLang:'en-IN',
          actualLabel:'Indian English',
          voiceName:'原生 en-IN voice 未安裝',
          naturalLike:false,
          fallback:false,
          strictIndian:true,
          unavailable:true
        };
      }
      const qualityName=(voice.name||'').toLowerCase();
      return {
        voice,
        actualLang:voice.lang||'en-IN',
        actualLabel:'Indian English',
        voiceName:voice.name||'Indian English voice',
        naturalLike:/natural|neural|premium|enhanced|online/.test(qualityName),
        fallback:false,
        strictIndian:true,
        unavailable:false
      };
    }

    let candidates=voices.filter(v=>(v.lang||'').toLowerCase().replace('_','-')===requested);
    if(!candidates.length && requested==='en-us') candidates=voices.filter(v=>{
      const l=(v.lang||'').toLowerCase().replace('_','-');
      return l==='en-us'||l==='en-ca'||l==='en-gb'||l.startsWith('en');
    });
    if(!candidates.length && requested==='en-ca') candidates=voices.filter(v=>{
      const l=(v.lang||'').toLowerCase().replace('_','-');
      return l==='en-ca'||l==='en-us'||l.startsWith('en');
    });
    if(!candidates.length)candidates=voices;

    const voice=bestVoice(candidates,lang);
    const actualLang=voice?.lang||lang;
    const qualityName=(voice?.name||'').toLowerCase();
    const naturalLike=!!voice && (/natural|neural|premium|enhanced|online|aria|jenny|guy|ava|andrew|google.*us english/.test(qualityName));
    return {
      voice,
      actualLang,
      actualLabel:accentLabel(actualLang),
      voiceName:voice?.name||'System default',
      naturalLike,
      fallback:!!voice && actualLang.toLowerCase()!==String(lang).toLowerCase(),
      unavailable:false
    };
  }

  function stopIndianLocalAiAudio(){
    try{window.EDAN_INDIAN_TTS?.stop?.();}catch(e){}
  }

  function stopNorthAmericanLocalAiAudio(){
    try{window.EDAN_NORTH_AMERICA_TTS?.stop?.();}catch(e){}
  }

  function indianProgressText(info,prefix='Indian English'){
    if(!info)return prefix+' · Local AI 正在準備…';
    if(info.phase==='engine')return prefix+' · 正在載入 Local AI 語音引擎…';
    if(info.phase==='model'){
      const pct=Number.isFinite(info.percent)?' '+info.percent+'%':'';
      return prefix+' · 首次下載 Indian English AI 模型'+pct+'…';
    }
    if(info.phase==='synth')return prefix+' · Local AI 正在即時產生語音…';
    return prefix+' · Local AI 正在準備…';
  }

  function northAmericanProgressText(info,prefix='North American English'){
    if(!info)return prefix+' · Local AI 正在準備…';
    if(info.phase==='engine')return prefix+' · 正在載入 Local AI 語音引擎…';
    if(info.phase==='model'){
      const pct=Number.isFinite(info.percent)?' '+info.percent+'%':'';
      return prefix+' · 首次下載 North American AI 模型'+pct+'…';
    }
    if(info.phase==='synth')return prefix+' · Local AI 正在即時產生語音…';
    return prefix+' · Local AI 正在準備…';
  }

  async function speakNorthAmerican(text,rate=1,onProgress=null){
    speechSynthesis?.cancel?.();
    stopIndianLocalAiAudio();
    stopNorthAmericanLocalAiAudio();
    const normalized=normalizeTtsText(text);
    const safeRate=clamp(Number(rate)||1,.72,1.22);
    const engine=window.EDAN_NORTH_AMERICA_TTS;

    if(engine?.speak){
      try{
        const result=await engine.speak(normalized,{rate:safeRate,onStatus:onProgress});
        return {
          ...result,
          voice:null,
          actualLang:'en-US',
          actualLabel:'North American English',
          voiceName:result?.voiceName||'Piper · Lessac US English',
          naturalLike:true,
          fallback:false,
          unavailable:false,
          played:result?.played!==false,
          localAi:true,
          source:'local-ai'
        };
      }catch(error){
        const code=error?.code||error?.message||'local_ai_failed';
        const played=speak(normalized,safeRate,'en-US');
        return {
          ...played,
          actualLang:'en-US',
          actualLabel:'North American English',
          source:'device-fallback',
          localAi:false,
          fallback:true,
          errorCode:code,
          errorMessage:error?.message||''
        };
      }
    }

    const played=speak(normalized,safeRate,'en-US');
    return {
      ...played,
      actualLang:'en-US',
      actualLabel:'North American English',
      source:'device-fallback',
      localAi:false,
      fallback:true,
      errorCode:'local_ai_engine_missing'
    };
  }

  function northAmericanPlaybackStatus(resolved,rate,prefix='North American English'){
    const speed=Number(rate||1).toFixed(2)+'x';
    if(resolved?.played&&resolved?.source==='local-ai'){
      return prefix+' · Local AI · '+(resolved.voiceName||'Piper Lessac')+(resolved.cachedModel?' · 模型已快取':'')+' · '+speed;
    }
    if(resolved?.played&&resolved?.source==='device-fallback'){
      return prefix+' · 系統語音備援 · '+(resolved.voiceName||'US English voice')+' · '+speed;
    }
    if(resolved?.errorCode==='model_download_failed')return prefix+' · ⚠ North American AI 模型下載失敗，請確認網路後重試 · '+speed;
    if(resolved?.errorCode==='ort_load_failed')return prefix+' · ⚠ Local AI 引擎載入失敗，請重新整理後重試 · '+speed;
    if(resolved?.errorCode==='phonemizer_failed')return prefix+' · ⚠ 英文發音引擎載入失敗，請重新整理後重試 · '+speed;
    return prefix+' · ⚠ Local AI 北美語音暫不可用'+(resolved?.errorCode?' ('+resolved.errorCode+')':'')+' · '+speed;
  }

  async function speakIndian(text,rate=1,onProgress=null){
    speechSynthesis?.cancel?.();
    stopIndianLocalAiAudio();
    const normalized=normalizeTtsText(text);
    const safeRate=clamp(Number(rate)||1,.72,1.22);
    const engine=window.EDAN_INDIAN_TTS;

    if(engine?.speak){
      try{
        const result=await engine.speak(normalized,{rate:safeRate,onStatus:onProgress});
        return {
          ...result,
          voice:null,
          actualLang:'en-IN',
          actualLabel:'Indian English',
          voiceName:result?.voiceName||'Piper · SPICOR Indian English',
          naturalLike:true,
          fallback:false,
          strictIndian:true,
          unavailable:false,
          played:result?.played!==false,
          localAi:true,
          source:'local-ai'
        };
      }catch(error){
        const code=error?.code||error?.message||'local_ai_failed';
        const local=resolveVoice('en-IN');
        if(!local.unavailable){
          const played=speak(normalized,safeRate,'en-IN');
          return {
            ...played,
            source:'device-fallback',
            localAi:false,
            fallback:true,
            strictIndian:true,
            errorCode:code
          };
        }
        return {
          voice:null,
          actualLang:'en-IN',
          actualLabel:'Indian English',
          voiceName:'Local AI 語音暫不可用',
          naturalLike:false,
          fallback:false,
          strictIndian:true,
          unavailable:true,
          played:false,
          localAi:true,
          errorCode:code,
          errorMessage:error?.message||'',
          source:'local-ai'
        };
      }
    }

    const local=resolveVoice('en-IN');
    if(!local.unavailable){
      const played=speak(normalized,safeRate,'en-IN');
      return {...played,source:'device-fallback',localAi:false,fallback:true,strictIndian:true,errorCode:'local_ai_engine_missing'};
    }
    return {
      voice:null,
      actualLang:'en-IN',
      actualLabel:'Indian English',
      voiceName:'Local AI 引擎未載入',
      naturalLike:false,
      fallback:false,
      strictIndian:true,
      unavailable:true,
      played:false,
      localAi:true,
      errorCode:'local_ai_engine_missing',
      source:'local-ai'
    };
  }

  function indianPlaybackStatus(resolved,rate,prefix='Indian English'){
    const speed=Number(rate||1).toFixed(2)+'x';
    if(resolved?.played&&resolved?.source==='local-ai'){
      return prefix+' · Local AI · '+(resolved.voiceName||'Piper SPICOR')+(resolved.cachedModel?' · 模型已快取':'')+' · '+speed;
    }
    if(resolved?.played&&resolved?.source==='device-fallback'){
      return prefix+' · 本機 en-IN 備援 · '+(resolved.voiceName||'Indian English voice')+' · '+speed;
    }
    if(resolved?.errorCode==='local_ai_unsupported')return prefix+' · ⚠ 此瀏覽器不支援 Local AI，且沒有 en-IN voice · '+speed;
    if(resolved?.errorCode==='model_download_failed')return prefix+' · ⚠ Indian AI 模型下載失敗，請確認網路後重試 · '+speed;
    if(resolved?.errorCode==='ort_load_failed')return prefix+' · ⚠ Local AI 引擎載入失敗，請重新整理後重試 · '+speed;
    if(resolved?.errorCode==='phonemizer_failed')return prefix+' · ⚠ Indian 發音引擎載入失敗，請重新整理後重試 · '+speed;
    return prefix+' · ⚠ Local AI 印度語音暫不可用'+(resolved?.errorCode?' ('+resolved.errorCode+')':'')+' · '+speed;
  }

  function normalizeTtsText(text){
    return String(text||'')
      .normalize('NFKC')
      .replace(/[’‘‛]/g,"'")
      .replace(/[“”]/g,'"')
      .replace(/…/g,'...')
      .replace(/\s*[—–]\s*/g,', ')
      .replace(/\s*\/\s*/g,', ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function speak(text,rate=1,lang='en-US'){
    if(!('speechSynthesis' in window))return null;
    stopIndianLocalAiAudio();
    stopNorthAmericanLocalAiAudio();
    speechSynthesis.cancel();
    const resolved=resolveVoice(lang);
    const spokenText=normalizeTtsText(text);

    // Indian English is strict: never let Web Speech silently reuse a US/Canadian voice.
    if(String(lang).toLowerCase().replace('_','-')==='en-in' && resolved.unavailable){
      return {...resolved,spokenText,played:false};
    }

    const u=new SpeechSynthesisUtterance(spokenText);
    u.lang=resolved.voice?.lang||lang;
    u.rate=clamp(Number(rate)||1,0.70,1.25);
    u.pitch=String(lang).toLowerCase().replace('_','-')==='en-in'?1:.98;
    u.volume=1;
    if(resolved.voice)u.voice=resolved.voice;
    speechSynthesis.speak(u);
    return {...resolved,spokenText,played:true};
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
      '## Career interview readiness',`- Readiness: ${interviewReadiness()}%`,'',
      '## Weakness profile',...Object.entries(state.weaknessCounts||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${weaknessLabels[k]||k}: ${v}`),'',
      '## Personal error memory',...topErrorEntries(10).map(([k,v])=>`- ${errorLabels[k]||k}: ${v.count} times | last=${v.lastSeen||''} | note=${v.note||''} | example=${v.example||''} | corrected=${v.corrected||''}`),'',
      '## Weak / review-priority questions',...(weakQuestions.length?weakQuestions.map(({q,s},i)=>`${i+1}. [${q.id}] L${q.level} ${q.text}\n   - seen=${s.seen}, correct=${s.correct}, wrong=${s.wrong}, hints=${s.hints}, listens=${s.listens}, lastQuality=${s.lastQuality}, due=${s.due}`):['- No answered questions yet.']),'',
      '## Recent sessions',...(recent.length?recent.map(s=>`- ${s.date} | ${s.title} | ${s.score}% | weakest: ${s.weakest}`):['- No completed sessions yet.']),'',
      '## Recent speaking auto-scores',...(speakingRecent.length?speakingRecent.map(a=>`- ${a.sessionDate} | [${a.id}] ${a.extra.systemScore}/100 | transcript: ${a.extra.transcript||''} | suggestions: ${(a.extra.suggestions||[]).join(' / ')}`):['- No auto-scored speaking answers yet.']),'',
      '## Request for ChatGPT update','Please use this report to update my English Interview Lab question bank. Prioritize repeated weak areas, create paraphrased listening questions, add professional interview follow-ups, and increase difficulty only where my performance supports it. Keep the daily site practice within 15–20 minutes because my total English study limit is about one hour per day.'
    ];
    download(`edan-english-learning-report-${todayKey()}.md`,lines.join('\n'),'text/markdown');
  }

  function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

  function learningReportData(){
    const questions=(CONTENT.questions||[]).map(q=>{
      const st=state.qstats[q.id]||{};
      return {
        ID:q.id,
        題型:q.type||'',
        技能:skillLabels[q.skill]||q.skill||'',
        等級:`L${q.level||1}`,
        熟悉度:questionFamiliarity(state.qstats[q.id]||null),
        題目:q.text||'',
        作答次數:st.seen||0,
        答對:st.correct||0,
        答錯:st.wrong||0,
        猜題:st.guessCount||0,
        提示次數:st.hints||0,
        最近品質:st.lastQuality??'',
        最近口說分數:Number.isFinite(st.lastSystemScore)?st.lastSystemScore:'',
        低於60分次數:st.speakingLowScoreCount||0,
        下次複習:st.due||'',
        最近作答:st.lastSeen||''
      };
    });

    const vocabulary=allVocabulary().map(v=>{
      const st=state.vocabStats[v.id]||{};
      return {
        單字:v.word,
        中文:v.zh,
        分類:v.category||'',
        詞性:v.pos||'',
        熟悉度:vocabFamiliarity(v),
        作答次數:st.attempts||0,
        答對:st.correct||0,
        答錯:st.wrong||0,
        猜對:st.guessed||0,
        連續答對:st.correctStreak||0,
        下次複習:st.due||'',
        最近作答:st.lastSeen||'',
        例句:v.example||''
      };
    });

    const speaking=state.sessions.flatMap(sess=>(sess.answers||[]).map(a=>({
      日期:sess.date||'',
      回合:sess.title||'',
      題目ID:a.id||'',
      分數:Number.isFinite(a.extra?.systemScore)?a.extra.systemScore:'',
      WPM:Number.isFinite(a.extra?.wordsPerMinute)?a.extra.wordsPerMinute:'',
      弱點:a.extra?.weakness?weaknessLabels[a.extra.weakness]||a.extra.weakness:'',
      轉錄:a.extra?.transcript||'',
      建議:(a.extra?.suggestions||[]).join(' / ')
    }))).filter(x=>x.分數!=='');

    const errors=Object.entries(state.errorMemory||{}).map(([key,val])=>({
      類型:errorLabels[key]||key,
      次數:val.count||0,
      最近出現:val.lastSeen||'',
      說明:val.note||'',
      原句:val.example||'',
      修正:val.corrected||''
    })).sort((a,b)=>b.次數-a.次數);

    const sessions=(state.sessions||[]).map(sess=>({
      日期:sess.date||'',
      回合:sess.title||'',
      題數:sess.count||0,
      分數:sess.score??'',
      最弱技能:sess.weakest||'',
      完成: sess.completedUnit===false?'否':'是'
    })).reverse();

    const skills=skillKeys.map(k=>({
      技能:skillLabels[k]||k,
      等級:Number((state.skills[k]||1).toFixed(2))
    }));

    const skillHistory=(state.skillHistory||[]).map(snap=>({
      日期:snap.date||'',
      擷取時間:snap.capturedAt||'',
      來源:snap.source||'',
      Listening:Number(snap.skills?.listening||1).toFixed(2),
      Speaking:Number(snap.skills?.speaking||1).toFixed(2),
      Interview:Number(snap.skills?.interview||1).toFixed(2),
      Chunks:Number(snap.skills?.chunks||1).toFixed(2),
      Rescue:Number(snap.skills?.rescue||1).toFixed(2)
    })).reverse();

    const weaknesses=Object.entries(state.weaknessCounts||{}).map(([k,v])=>({
      弱點:weaknessLabels[k]||k,
      次數:v
    })).sort((a,b)=>b.次數-a.次數);

    const weekly=progressAnalyticsSnapshot(7);
    const plan=weeklyPlanSnapshot();
    const weeklyPlan=plan.tasks.map((task,i)=>({步驟:i+1,訓練:task.title,模式:task.mode,題數:task.size,預估分鐘:task.estimate,原因:task.reason}));
    const summary=[
      {項目:'匯出時間',值:new Date().toLocaleString('zh-TW',{hour12:false})},
      {項目:'內容版本',值:CONTENT.contentVersion},
      {項目:'XP',值:state.xp},
      {項目:'連續學習天數',值:streak()},
      {項目:'Interview Readiness',值:`${interviewReadiness()}%`},
      {項目:'完成學習日',值:(state.completedDates||[]).length},
      {項目:'累積回合',值:(state.sessions||[]).length},
      {項目:'近7天學習日',值:weekly.practiceDays},
      {項目:'近7天回合平均',值:weekly.sessionAvg===null?'—':Math.round(weekly.sessionAvg)+'%'},
      {項目:'近7天口說平均',值:weekly.speakingAvg===null?'—':Math.round(weekly.speakingAvg)},
      {項目:'近7天重答平均提升',值:weekly.retryLift===null?'—':(weekly.retryLift>0?'+':'')+(Math.round(weekly.retryLift*10)/10)},
      {項目:'目前到期複習',值:weekly.dueReviews},
      {項目:'本週目標學習日',值:plan.targetDays},
      {項目:'每日可用時間',值:plan.dailyMinutes+' 分鐘'},
      {項目:'本週第一弱項',值:skillLabels[plan.focusSkill]||plan.focusSkill}
    ];

    return {summary,skills,skillHistory,weeklyPlan,weaknesses,errors,questions,vocabulary,speaking,sessions};
  }

  function setExportStatus(text,tone=''){
    const el=$('exportReportStatus');
    if(!el)return;
    el.textContent=text;
    el.dataset.tone=tone;
  }

  function loadExternalScript(src,globalCheck){
    if(globalCheck?.())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(x=>x.src===src);
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('load failed')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('無法載入匯出元件'));
      document.head.appendChild(script);
    });
  }

  function addWorkbookSheet(wb,name,rows,widths=[]){
    const ws=window.XLSX.utils.json_to_sheet(rows.length?rows:[{訊息:'目前沒有資料'}]);
    if(widths.length)ws['!cols']=widths.map(w=>({wch:w}));
    window.XLSX.utils.book_append_sheet(wb,ws,name);
  }

  async function exportLearningExcel(){
    try{
      setExportStatus('正在整理 Excel…','loading');
      await loadExternalScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',()=>!!window.XLSX);
      const data=learningReportData();
      const wb=window.XLSX.utils.book_new();
      addWorkbookSheet(wb,'總覽',data.summary,[22,34]);
      addWorkbookSheet(wb,'能力',data.skills,[24,12]);
      addWorkbookSheet(wb,'能力歷史',data.skillHistory,[14,22,20,12,12,12,12,12]);
      addWorkbookSheet(wb,'週計畫',data.weeklyPlan,[8,28,16,10,12,58]);
      addWorkbookSheet(wb,'弱點',data.weaknesses,[28,12]);
      addWorkbookSheet(wb,'錯誤記憶',data.errors,[24,10,16,34,48,48]);
      addWorkbookSheet(wb,'單字熟悉度',data.vocabulary,[20,20,16,12,14,12,10,10,10,12,16,16,52]);
      addWorkbookSheet(wb,'題目熟悉度',data.questions,[18,16,18,8,14,56,12,10,10,10,12,12,16,16,16,16]);
      addWorkbookSheet(wb,'口說紀錄',data.speaking,[18,26,18,10,10,20,58,58]);
      addWorkbookSheet(wb,'最近回合',data.sessions,[20,28,10,10,20,10]);
      window.XLSX.writeFile(wb,`edan-english-learning-${todayKey()}.xlsx`,{compression:true});
      setExportStatus('✓ Excel 已匯出','success');
    }catch(err){
      console.error(err);
      setExportStatus('Excel 匯出失敗，請確認網路後重試。','error');
    }
  }

  function reportTableHtml(title,rows,columns,maxRows=12){
    const list=(rows||[]).slice(0,maxRows);
    if(!list.length)return `<section><h2>${esc(title)}</h2><p>目前沒有資料。</p></section>`;
    return `<section><h2>${esc(title)}</h2><table><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${list.map(row=>`<tr>${columns.map(c=>`<td>${esc(row[c.key]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
  }

  function buildPdfReportElement(){
    const data=learningReportData();
    const root=document.createElement('div');
    root.className='pdf-export-report';
    root.innerHTML=`
      <div class="pdf-report-title"><div><span>EDAN'S ENGLISH COACH</span><h1>學習狀況報告</h1></div><div class="pdf-report-date">${esc(new Date().toLocaleString('zh-TW',{hour12:false}))}</div></div>
      <div class="pdf-report-metrics">
        <div><b>${state.xp}</b><span>XP</span></div>
        <div><b>${streak()}</b><span>Streak days</span></div>
        <div><b>${interviewReadiness()}%</b><span>Interview Readiness</span></div>
        <div><b>${(state.sessions||[]).length}</b><span>Sessions</span></div>
      </div>
      ${reportTableHtml('能力輪廓',data.skills,[{key:'技能',label:'技能'},{key:'等級',label:'目前等級'}],10)}
      ${reportTableHtml('本週學習計畫',data.weeklyPlan,[{key:'步驟',label:'#'},{key:'訓練',label:'訓練'},{key:'題數',label:'題數'},{key:'預估分鐘',label:'分鐘'}],7)}
      ${reportTableHtml('目前弱點',data.weaknesses,[{key:'弱點',label:'弱點'},{key:'次數',label:'累積次數'}],8)}
      ${reportTableHtml('Personal Error Memory',data.errors,[{key:'類型',label:'錯誤類型'},{key:'次數',label:'次數'},{key:'說明',label:'說明'},{key:'修正',label:'修正'}],8)}
      ${reportTableHtml('優先複習題目',data.questions.filter(x=>x.作答次數>0).sort((a,b)=>(b.答錯+b.猜題+b.低於60分次數)-(a.答錯+a.猜題+a.低於60分次數)),[{key:'題目',label:'題目'},{key:'熟悉度',label:'熟悉度'},{key:'答錯',label:'錯'},{key:'猜題',label:'猜'},{key:'最近口說分數',label:'口說'}],12)}
      ${reportTableHtml('最近口說紀錄',[...data.speaking].reverse(),[{key:'日期',label:'日期'},{key:'題目ID',label:'題目'},{key:'分數',label:'分數'},{key:'WPM',label:'WPM'},{key:'弱點',label:'弱點'}],10)}
      ${reportTableHtml('最近回合',data.sessions,[{key:'日期',label:'日期'},{key:'回合',label:'回合'},{key:'分數',label:'分數'},{key:'最弱技能',label:'最弱技能'}],10)}
      <div class="pdf-report-foot">Content version: ${esc(CONTENT.contentVersion)} · 此報告依帳號目前同步的學習紀錄產生。</div>`;
    document.body.appendChild(root);
    return root;
  }

  async function exportLearningPdf(){
    let report=null;
    try{
      setExportStatus('正在產生 PDF…','loading');
      await Promise.all([
        loadExternalScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>!!window.html2canvas),
        loadExternalScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF)
      ]);
      report=buildPdfReportElement();
      const canvas=await window.html2canvas(report,{scale:1.5,backgroundColor:'#ffffff',useCORS:true,logging:false});
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      const pageWidth=210;
      const pageHeight=297;
      const margin=8;
      const usableWidth=pageWidth-margin*2;
      const imgHeight=canvas.height*usableWidth/canvas.width;
      const img=canvas.toDataURL('image/jpeg',.9);
      let y=margin;
      let remaining=imgHeight;
      pdf.addImage(img,'JPEG',margin,y,usableWidth,imgHeight,undefined,'FAST');
      remaining-=pageHeight-margin*2;
      while(remaining>0){
        pdf.addPage();
        y=margin-(imgHeight-remaining);
        pdf.addImage(img,'JPEG',margin,y,usableWidth,imgHeight,undefined,'FAST');
        remaining-=pageHeight-margin*2;
      }
      pdf.save(`edan-english-learning-${todayKey()}.pdf`);
      setExportStatus('✓ PDF 已匯出','success');
    }catch(err){
      console.error(err);
      setExportStatus('PDF 匯出失敗，請確認網路後重試。','error');
    }finally{
      report?.remove();
    }
  }

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
    $('questionHost')?.addEventListener('click',async e=>{
      const q=session?.questions?.[session.index];
      if(!q?.model)return;

      const audioBtn=e.target.closest?.('[data-model-audio]');
      if(audioBtn){
        const kind=audioBtn.dataset.modelAudio;
        const lang=kind==='india'?'en-IN':chooseVoiceLang(q.level||1);
        const rate=playbackRate(q.level||1,'question');
        const status=audioBtn.closest('.model-answer')?.querySelector('[data-model-audio-status]');
        if(kind==='india'&&status)status.textContent='Indian English · 正在準備語音…';
        if(kind!=='india'&&status)status.textContent='North American English · 正在準備語音…';
        const resolved=kind==='india'
          ? await speakIndian(q.model,rate,p=>{if(status)status.textContent=indianProgressText(p);})
          : await speakNorthAmerican(q.model,rate,p=>{if(status)status.textContent=northAmericanProgressText(p);});
        if(status){
          status.textContent=kind==='india'
            ? indianPlaybackStatus(resolved,rate)
            : northAmericanPlaybackStatus(resolved,rate);
        }
        return;
      }

      const wordBtn=e.target.closest?.('[data-pronounce-word]');
      if(wordBtn){
        const word=wordBtn.dataset.pronounceWord;
        const meaning=modelWordMeaning(word,q);
        const status=wordBtn.closest('.model-answer')?.querySelector('[data-model-practice-status]');
        if(status)status.textContent=`🔊 ${word}｜${meaning} · 正在準備北美發音…`;
        const resolved=await speakNorthAmerican(word,.84,p=>{if(status)status.textContent=`${northAmericanProgressText(p,'North American English')} · ${word}｜${meaning}`;});
        wordBtn.classList.add('pronounce-word-active');
        setTimeout(()=>wordBtn.classList.remove('pronounce-word-active'),750);
        if(status)status.textContent=`🔊 ${word}｜${meaning} · ${resolved?.voiceName||'Piper · Lessac US English'}。可重複點擊再聽一次。`;
        return;
      }

      const cueBtn=e.target.closest?.('[data-pronounce-cue]');
      if(cueBtn){
        const cue=cueBtn.dataset.pronounceCue;
        const cueZh=cueBtn.dataset.cueZh||'';
        const status=cueBtn.closest('.model-answer')?.querySelector('[data-model-practice-status]');
        if(status)status.textContent='North American English · 正在準備 Cue 發音…';
        const resolved=await speakNorthAmerican(cue,.88,p=>{if(status)status.textContent=northAmericanProgressText(p,'North American English');});
        cueBtn.classList.add('model-cue-active');
        setTimeout(()=>cueBtn.classList.remove('model-cue-active'),650);
        if(status)status.textContent=`🔊 ${cue}${cueZh?'｜'+cueZh:''} · ${resolved?.voiceName||'Piper · Lessac US English'}`;
        return;
      }

      const practiceBtn=e.target.closest?.('[data-model-practice]');
      if(!practiceBtn)return;
      const action=practiceBtn.dataset.modelPractice;
      const model=practiceBtn.closest('.model-answer');
      const status=model?.querySelector('[data-model-practice-status]');
      const answer=model?.querySelector('[data-model-answer-text]');
      const recordBtn=model?.querySelector('[data-model-practice="record"]');
      const stopBtn=model?.querySelector('[data-model-practice="stop"]');

      if(action==='slow'){
        if(status)status.textContent='North American English · 正在準備 0.88x 跟讀…';
        const resolved=await speakNorthAmerican(q.model,.88,p=>{if(status)status.textContent=northAmericanProgressText(p,'North American English');});
        if(status)status.textContent=`0.88x 跟讀中 · ${resolved?.voiceName||'Piper · Lessac US English'}。先模仿節奏，不要急著背。`;
      }else if(action==='hide'){
        const hidden=answer?.classList.toggle('model-answer-hidden');
        practiceBtn.textContent=hidden?'👁 顯示英文':'🙈 遮住英文';
        if(status)status.textContent=hidden?'現在只看 cue words 自己說；卡住 3 秒再把全文打開。':'英文已顯示。看一遍後再遮住重說一次。';
      }else if(action==='record'){
        speechSynthesis.cancel();
        const ok=await startModelPracticeRecording();
        if(ok){
          if(recordBtn){recordBtn.disabled=true;recordBtn.textContent='● 錄音中';}
          stopBtn?.classList.remove('hidden');
          if(status)status.textContent='正在錄你的 Model answer 練習。講完按「停止錄音」，再回聽自己有沒有漏重點。';
        }else if(status)status.textContent='無法啟用麥克風，請確認網站的麥克風權限。';
      }else if(action==='stop'){
        await stopModelPracticeRecording(true);
        if(recordBtn){recordBtn.disabled=false;recordBtn.textContent='🎙 再錄一遍';}
        stopBtn?.classList.add('hidden');
        if(status)status.textContent='已錄好。先播放自己的版本，再播放北美朗讀，比較內容順序與停頓。';
      }
    });
    $('quitBtn').addEventListener('click',quitSession);
    $('nextAdaptiveBtn').addEventListener('click',()=>startSession('adaptive'));
    $('backOverviewBtn').addEventListener('click',()=>{$('resultSection').classList.remove('show');$('overviewSection').scrollIntoView({behavior:'smooth'});});
    $('chunkLevelFilter').addEventListener('change',()=>renderChunks()); $('randomChunksBtn').addEventListener('click',()=>renderChunks(3));
    $('coachStartBtn')?.addEventListener('click',e=>startSession(e.currentTarget.dataset.mode||'adaptive',Number(e.currentTarget.dataset.size)||5));
    $('vocabFilter')?.addEventListener('change',()=>{if(vocabPracticeSession)startVocabPractice(vocabPracticeSession.mode,8);else renderVocabulary(12);});
    $('randomVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(8,true,false);});
    $('learningVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(12,true,true);});
    $('allVocabBtn')?.addEventListener('click',()=>{showVocabCards();renderVocabulary(null,false,false);});
    document.querySelectorAll('.vocab-mode-btn').forEach(btn=>btn.addEventListener('click',()=>{
      const mode=btn.dataset.vocabMode;
      if(mode==='cards')showVocabCards(); else startVocabPractice(mode,8);
    }));
    $('exportReportBtn').addEventListener('click',exportLearningReport);
    $('exportReportBtn2').addEventListener('click',exportLearningReport);
    $('exportPdfBtn')?.addEventListener('click',exportLearningPdf);
    $('exportExcelBtn')?.addEventListener('click',exportLearningExcel);
    $('exportProgressBtn').addEventListener('click',exportProgress);
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

  window.EDAN_APP_BRIDGE={
    context(){
      const active=session?.questions?.[session.index]||null;
      const q=active||lastLittleEQuestion||null;
      const fw=q&&q.type==='speaking'?speakingFramework(q):null;
      const stat=q?qstat(q.id):null;
      return {
        contentVersion:CONTENT.contentVersion,
        question:q?{
          id:q.id,
          type:q.type,
          skill:q.skill,
          level:q.level,
          text:q.text,
          intent:q.intent||'',
          model:q.model||'',
          modelZh:answerTranslation(q)||'',
          keywords:[...(q.keywords||[])],
          framework:fw,
          active:!!active
        }:null,
        transcript:speechTranscript||'',
        latestAnswer:session?.currentMeta?.latestAnswer||lastLittleEAnswer||null,
        lastSystemScore:stat?.lastSystemScore??null,
        topWeakness:topWeakness(),
        errorMemory:topErrorEntries(5).map(([key,val])=>({key,label:errorLabels[key]||key,count:val.count||0,note:val.note||''})),
        interviewReadiness:interviewReadiness(),
        retryComparison:session?.currentMeta?.latestAnswer?.retryComparison||lastLittleEAnswer?.retryComparison||null,
        learnerProfile:learnerProfile?{goal:learnerProfile.goal,role_type:learnerProfile.role_type,self_level:learnerProfile.self_level,daily_minutes:learnerProfile.daily_minutes,target_company:learnerProfile.target_company||''}:null
      };
    },
    getMemory(){return Array.isArray(state.littleEMemory)?state.littleEMemory.slice(-60):[];},
    remember(entry){
      if(!entry||typeof entry!=='object')return;
      const kind=String(entry.kind||'general').slice(0,40);
      const text=String(entry.text||'').trim().slice(0,220);
      if(!text)return;
      const key=(kind+'|'+text.toLowerCase()).slice(0,260);
      const list=Array.isArray(state.littleEMemory)?state.littleEMemory:[];
      const found=list.find(x=>x.key===key);
      if(found){
        found.count=(found.count||1)+1;
        found.lastSeen=todayKey();
      }else{
        list.push({key,kind,text,count:1,lastSeen:todayKey()});
      }
      state.littleEMemory=list.slice(-60);
      save();
    },
    getHistory(){return [];},
    saveHistory(){},
    speakEnglish(text,rate=.94){return speakNorthAmerican(text,rate);},
    retryLatestSpeaking(source='little_e'){
      const q=session?.questions?.[session.index]||lastLittleEQuestion;
      return beginSpeakingRetry(q,source);
    },
    clearHistory(){},
    clearCurrentQuestion(){lastLittleEQuestion=null;lastLittleEAnswer=null;}
  };

  function favoriteQuoteCategoryCounts(){
    const deck=window.EDAN_DAILY_QUOTES,counts={};
    for(const id of (state.quoteFavorites||[])){
      const q=deck?.getById?.(id);if(q)counts[q.category]=(counts[q.category]||0)+1;
    }
    return counts;
  }

  function selectDailyQuote(persist=false){
    const deck=window.EDAN_DAILY_QUOTES;
    if(!deck?.quotes?.length)return null;
    const date=todayKey();
    const history=Array.isArray(state.quoteHistory)?state.quoteHistory:[];
    const existing=history.find(x=>x?.date===date);
    if(existing){
      const q=deck.getById(existing.quoteId);if(q)return q;
    }
    if(!persist)return deck.today(new Date());

    const seen=new Set(history.slice(-deck.quotes.length).map(x=>x?.quoteId).filter(Boolean));
    let candidates=deck.quotes.filter(q=>!seen.has(q.id));
    if(!candidates.length)candidates=[...deck.quotes];

    const likes=favoriteQuoteCategoryCounts();
    candidates.sort((a,b)=>{
      const pref=(likes[b.category]||0)-(likes[a.category]||0);
      if(pref)return pref;
      return deck.rankForDate(date,a.id)-deck.rankForDate(date,b.id);
    });
    const quote=candidates[0]||deck.today(new Date());
    state.quoteHistory=[...history.filter(x=>x?.date!==date),{date,quoteId:quote.id,category:quote.category}]
      .sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-140);
    save();
    window.EDAN_CLOUD?.logEvent?.('daily_quote_shown',{quoteId:quote.id,category:quote.category,author:quote.author},'daily-quote-'+date);
    return quote;
  }

  function dailyQuoteWordMeaning(word,quote){
    const deck=window.EDAN_DAILY_QUOTES;
    const direct=deck?.wordMeaning?.(word);
    if(direct)return direct;
    const viaModel=modelWordMeaning(word,{model:quote?.en||'',keywords:[]});
    return viaModel==='中文意思待補'?'依整句語境理解':viaModel;
  }

  function dailyQuoteEnglishHtml(quote){
    const parts=String(quote?.en||'').match(/[A-Za-z]+(?:['’][A-Za-z]+)?|\d+|\s+|[^A-Za-z\d\s]+/g)||[];
    return parts.map(part=>{
      if(/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(part)){
        const meaning=dailyQuoteWordMeaning(part,quote);
        return `<button class="daily-quote-word" data-daily-quote-word="${esc(part)}" data-daily-quote-meaning="${esc(meaning)}" type="button" title="${esc(meaning)}">${esc(part)}</button>`;
      }
      return esc(part);
    }).join('');
  }

  function updateDailyQuoteFavorite(quote){
    const btn=$('dailyQuoteFavorite');if(!btn||!quote)return;
    const active=(state.quoteFavorites||[]).includes(quote.id);
    btn.classList.toggle('active',active);
    btn.textContent=active?'♥ 已收藏':'♡ 收藏';
    btn.setAttribute('aria-pressed',active?'true':'false');
  }

  function addDailyQuoteWord(word,meaning,quote){
    const key=String(word||'').toLowerCase().replace(/[’]/g,"'").trim();
    if(!key||!meaning||!quote)return null;
    const existing=(CONTENT.vocabulary||[]).find(v=>String(v.word||'').toLowerCase()===key);
    const id=existing?.id||('dqv-'+key.replace(/[^a-z0-9]+/g,'-'));
    state.quoteWordBank=state.quoteWordBank||{};
    const previous=state.quoteWordBank[key]||{};
    state.quoteWordBank[key]={
      ...previous,id,word,meaning,quoteId:quote.id,quoteText:quote.en,quoteZh:quote.zh,category:quote.category,
      addedAt:previous.addedAt||new Date().toISOString(),lastSeen:todayKey(),count:(previous.count||0)+1
    };
    state.vocabKnown[id]=false;
    const st=vocabStat(id);st.interval=0;st.due=todayKey();if(st.lastOutcome==='correct')st.lastOutcome='guessed';
    save();
    renderVocabulary(12,true,false);
    window.EDAN_CLOUD?.logEvent?.('daily_quote_word_added',{quoteId:quote.id,word,meaning,vocabId:id},'quote-word-'+quote.id+'-'+key);
    return id;
  }

  function renderDailyQuote(persist=false){
    const deck=window.EDAN_DAILY_QUOTES;
    const quote=selectDailyQuote(persist);
    if(!deck||!quote)return;

    const d=new Date();
    const dateLabel=new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',weekday:'short'}).format(d);
    if($('dailyQuoteDate'))$('dailyQuoteDate').textContent=dateLabel;
    if($('dailyQuoteKind'))$('dailyQuoteKind').textContent=quote.kind||'DAILY THOUGHT';
    if($('dailyQuoteCategory'))$('dailyQuoteCategory').textContent=(deck.categoryZh?.[quote.category]||quote.category)+' · '+quote.category;
    if($('dailyQuoteCycle'))$('dailyQuoteCycle').textContent=`${deck.quotes.length} 句輪替 · 本輪不重複`;
    if($('dailyQuoteEn'))$('dailyQuoteEn').innerHTML=dailyQuoteEnglishHtml(quote);
    if($('dailyQuoteZh'))$('dailyQuoteZh').textContent=quote.zh;
    if($('dailyQuoteAuthor'))$('dailyQuoteAuthor').textContent=quote.author;
    if($('dailyQuoteSourceLabel'))$('dailyQuoteSourceLabel').textContent=quote.source||'';
    $('dailyQuoteWordInfo')?.classList.add('hidden');

    const link=$('dailyQuoteSource');
    if(link){
      if(quote.sourceUrl){link.href=quote.sourceUrl;link.classList.remove('hidden');}
      else{link.removeAttribute('href');link.classList.add('hidden');}
    }

    const speak=$('dailyQuoteSpeak');
    if(speak){speak.dataset.quoteText=quote.en;speak.dataset.quoteId=quote.id;speak.textContent='▶ 聽英文';}
    const favorite=$('dailyQuoteFavorite');
    if(favorite)favorite.dataset.quoteId=quote.id;
    updateDailyQuoteFavorite(quote);
  }

  function bindDailyQuote(){
    $('dailyQuoteSpeak')?.addEventListener('click',async e=>{
      const btn=e.currentTarget,text=btn.dataset.quoteText||$('dailyQuoteEn')?.textContent||'';
      if(!text)return;
      btn.disabled=true;btn.textContent='準備發音…';
      try{await speakNorthAmerican(text,.9);btn.textContent='▶ 再聽一次';}
      catch(e){btn.textContent='播放失敗 · 重試';}
      finally{btn.disabled=false;}
    });

    $('dailyQuoteFavorite')?.addEventListener('click',e=>{
      const deck=window.EDAN_DAILY_QUOTES,id=e.currentTarget.dataset.quoteId,quote=deck?.getById?.(id);
      if(!quote)return;
      const set=new Set(state.quoteFavorites||[]);
      const active=set.has(id);if(active)set.delete(id);else set.add(id);
      state.quoteFavorites=[...set].slice(-100);save();updateDailyQuoteFavorite(quote);
      window.EDAN_CLOUD?.logEvent?.(active?'daily_quote_unfavorited':'daily_quote_favorited',{quoteId:id,category:quote.category},'quote-favorite-'+id+'-'+Date.now());
    });

    $('dailyQuoteEn')?.addEventListener('click',async e=>{
      const btn=e.target.closest?.('[data-daily-quote-word]');if(!btn)return;
      const deck=window.EDAN_DAILY_QUOTES,quote=deck?.getById?.($('dailyQuoteSpeak')?.dataset.quoteId);
      const word=btn.dataset.dailyQuoteWord,meaning=btn.dataset.dailyQuoteMeaning||dailyQuoteWordMeaning(word,quote);
      const info=$('dailyQuoteWordInfo');
      if(info){info.classList.remove('hidden');$('dailyQuoteWord')?.replaceChildren(document.createTextNode(word));$('dailyQuoteWordMeaning')?.replaceChildren(document.createTextNode(meaning));}
      const add=$('dailyQuoteAddWord');
      if(add){
        add.dataset.word=word;add.dataset.meaning=meaning;add.dataset.quoteId=quote?.id||'';
        const key=String(word||'').toLowerCase().replace(/[’]/g,"'");
        add.textContent=state.quoteWordBank?.[key]?'✓ 已加入學習':'＋ 加入學習';
      }
      try{await speakNorthAmerican(word,.88);}catch(err){}
    });

    $('dailyQuoteAddWord')?.addEventListener('click',e=>{
      const btn=e.currentTarget,quote=window.EDAN_DAILY_QUOTES?.getById?.(btn.dataset.quoteId);
      if(!quote)return;
      addDailyQuoteWord(btn.dataset.word,btn.dataset.meaning,quote);
      btn.textContent='✓ 已加入學習';
    });
  }

  function voiceModelStatusText(engine,label){
    const s=engine?.getStatus?.()||{state:'idle'};
    if(s.state==='ready')return label+'：✓ 已快取並預熱';
    if(s.state==='not-cached')return label+'：首次播放時下載模型';
    if(s.state==='loading'||s.state==='checking')return label+'：檢查 Local AI…';
    if(s.state==='error')return label+'：⚠ Local AI 預熱失敗，播放時會重試';
    return label+'：待檢查';
  }
  function renderVoiceModelStatus(){
    const host=$('voiceModelStatus'); if(!host)return;
    host.textContent=[voiceModelStatusText(window.EDAN_NORTH_AMERICA_TTS,'北美'),voiceModelStatusText(window.EDAN_INDIAN_TTS,'印度')].join(' · ');
  }
  async function warmCachedTtsModels(){
    renderVoiceModelStatus();
    const run=async engine=>{try{await engine?.warmup?.();}catch(e){}};
    await Promise.all([run(window.EDAN_NORTH_AMERICA_TTS),run(window.EDAN_INDIAN_TTS)]);
    renderVoiceModelStatus();
  }

  function init(){
    syncSettingsUI();bindStaticEvents();bindLearnerExperienceUI();renderDailyQuote();bindDailyQuote();
    ensureSkillBaseline();
    renderOverview();renderVocabulary(12);renderChunks();renderVoiceModelStatus();
    window.addEventListener('edan:tts-status',renderVoiceModelStatus);
    window.addEventListener('edan:auth-ready',()=>{loadLearnerExperience();renderDailyQuote(true);const warm=()=>warmCachedTtsModels();if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:2500});else setTimeout(warm,700);});
    window.addEventListener('edan:auth-signed-out',()=>{learnerProfile=null;resetPrivateQuestionPacks();hideOnboarding();$('diagnosticSection')?.classList.add('hidden');});
    if('speechSynthesis' in window){
      refreshVoiceCache();
      window.speechSynthesis.onvoiceschanged=()=>refreshVoiceCache();
      setTimeout(refreshVoiceCache,250);
      setTimeout(refreshVoiceCache,900);
    }
  }
  init();
})();