(() => {
  'use strict';

  const cfg = window.EDAN_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) {
    console.warn('Supabase auth is not available.');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const STORE_KEY = 'edanEnglishAdaptiveLabV2';
  let currentUser = null;
  let cloudReady = false;
  let saveTimer = null;
  let pendingState = null;
  let currentFactorId = null;
  let currentChallengeId = null;
  let enrollingFactorId = null;

  const $ = id => document.getElementById(id);
  const esc = (s='') => String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function setAuthMessage(message, tone='neutral') {
    const el = $('authMessage');
    if (!el) return;
    el.className = 'auth-message show ' + tone;
    el.textContent = message;
  }

  function clearAuthMessage() {
    const el = $('authMessage');
    if (!el) return;
    el.className = 'auth-message';
    el.textContent = '';
  }

  function showAuthView(view) {
    document.querySelectorAll('[data-auth-view]').forEach(el => el.classList.add('hidden'));
    const target = document.querySelector('[data-auth-view="' + view + '"]');
    target?.classList.remove('hidden');
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === view));
    clearAuthMessage();
  }

  function lockApp() {
    document.body.classList.add('auth-locked');
    $('authGate')?.classList.remove('hidden');
  }

  function unlockApp() {
    document.body.classList.remove('auth-locked');
    $('authGate')?.classList.add('hidden');
  }

  async function getAAL() {
    const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    return data;
  }

  async function listVerifiedTotp() {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) throw error;
    return (data?.totp || []).filter(f => f.status === 'verified');
  }

  async function ensureMFA() {
    const factors = await listVerifiedTotp();
    const aal = await getAAL();

    if (factors.length && aal.currentLevel !== 'aal2') {
      currentFactorId = factors[0].id;
      showAuthView('mfa-challenge');
      lockApp();
      $('mfaChallengeHint').textContent = '請輸入 Authenticator App 的 6 位數驗證碼。';
      return false;
    }

    if (!factors.length) {
      showAuthView('mfa-enroll');
      lockApp();
      $('mfaEnrollIntro')?.classList.remove('hidden');
      $('mfaEnrollSetup')?.classList.add('hidden');
      return false;
    }

    return true;
  }

  async function fetchCloudState() {
    if (!currentUser) return null;
    const { data, error } = await client
      .from('learning_state')
      .select('state,updated_at,state_version')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertCloudState(state) {
    if (!currentUser || !state) return;
    const payload = JSON.parse(JSON.stringify(state));
    if(!payload.clientUpdatedAt)payload.clientUpdatedAt=new Date().toISOString();
    const { error } = await client.from('learning_state').upsert({
      user_id: currentUser.id,
      state: payload,
      state_version: 1
    }, { onConflict: 'user_id' });
    if (error) throw error;
    const sync = $('cloudSyncStatus');
    if (sync) sync.textContent = '已同步 ' + new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
  }


  function isoTime(value){const n=Date.parse(value||'');return Number.isFinite(n)?n:0;}
  function uniqueStrings(a=[],b=[]){return [...new Set([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].filter(Boolean))];}
  function sessionKey(s){return [s?.date||'',s?.title||'',s?.count??'',s?.score??'',s?.completedUnit===false?'0':'1'].join('|');}
  function mergeSessions(a=[],b=[]){const m=new Map();[...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(s=>{if(s&&typeof s==='object')m.set(sessionKey(s),s)});return [...m.values()].slice(-80);}
  function statTimestamp(s){return Math.max(isoTime(s?.lastSeen),isoTime(s?.markedAt));}
  function mergeStat(a,b){
    if(!a)return b||{}; if(!b)return a||{};
    const newer=statTimestamp(b)>=statTimestamp(a)?b:a,older=newer===b?a:b,out={...older,...newer};
    ['seen','correct','wrong','hints','listens','guessCount','modelPracticeCount','speakingLowScoreCount','attempts','guessed','correctStreak'].forEach(k=>{const av=Number(a?.[k]),bv=Number(b?.[k]);if(Number.isFinite(av)||Number.isFinite(bv))out[k]=Math.max(Number.isFinite(av)?av:0,Number.isFinite(bv)?bv:0);});
    return out;
  }
  function mergeStatMap(a={},b={}){const out={};new Set([...Object.keys(a||{}),...Object.keys(b||{})]).forEach(k=>out[k]=mergeStat(a?.[k],b?.[k]));return out;}
  function mergeBoolMap(a={},b={}){const out={...a,...b};new Set([...Object.keys(a||{}),...Object.keys(b||{})]).forEach(k=>out[k]=!!(a?.[k]||b?.[k]));return out;}
  function mergeCountMap(a={},b={}){const out={};new Set([...Object.keys(a||{}),...Object.keys(b||{})]).forEach(k=>out[k]=Math.max(Number(a?.[k])||0,Number(b?.[k])||0));return out;}
  function mergeErrorMemory(a={},b={}){const out={};new Set([...Object.keys(a||{}),...Object.keys(b||{})]).forEach(k=>{const av=a?.[k],bv=b?.[k];if(!av)out[k]=bv;else if(!bv)out[k]=av;else{const newer=isoTime(bv.lastSeen)>=isoTime(av.lastSeen)?bv:av;out[k]={...newer,count:Math.max(Number(av.count)||0,Number(bv.count)||0)}}});return out;}
  function mergeMemory(a=[],b=[],keyField='key',limit=60){const m=new Map();[...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(item=>{if(!item||typeof item!=='object')return;const key=String(item[keyField]||item.text||item.en||JSON.stringify(item)).slice(0,500),prev=m.get(key);m.set(key,prev?{...prev,...item,count:Math.max(Number(prev.count)||0,Number(item.count)||0)}:item)});return [...m.values()].slice(-limit);}
  function mergeRepairs(a=[],b=[]){const m=new Map();[...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(r=>{if(r?.date)m.set(r.date,r)});return [...m.values()].sort((x,y)=>String(x.date).localeCompare(String(y.date))).slice(-20);}
  function mergeQuoteHistory(older=[],newer=[]){const m=new Map();[...(Array.isArray(older)?older:[]),...(Array.isArray(newer)?newer:[])].forEach(r=>{if(r?.date&&r?.quoteId)m.set(r.date,r)});return [...m.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-140);}
  function mergeQuoteWordBank(older={},newer={}){const out={...(older||{})};for(const [k,v] of Object.entries(newer||{})){const prev=out[k]||{},next=v||{};out[k]={...prev,...next,count:Math.max(Number(prev.count)||0,Number(next.count)||0)}}return out;}
  function mergeSkillHistory(older=[],newer=[]){
    const map=new Map();
    for(const snap of [...(Array.isArray(older)?older:[]),...(Array.isArray(newer)?newer:[])]){
      if(!snap?.date||!snap?.skills)continue;
      const prev=map.get(snap.date);
      if(!prev||String(snap.capturedAt||'')>=String(prev.capturedAt||''))map.set(snap.date,snap);
    }
    return [...map.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-730);
  }
  function mergeDailyMissionHistory(older=[],newer=[]){
    const map=new Map();
    for(const item of [...(Array.isArray(older)?older:[]),...(Array.isArray(newer)?newer:[])]){
      if(!item?.date||!Array.isArray(item.tasks))continue;
      const prev=map.get(item.date);
      const currentStamp=Math.max(isoTime(item.archivedAt),isoTime(item.createdAt));
      const prevStamp=Math.max(isoTime(prev?.archivedAt),isoTime(prev?.createdAt));
      if(!prev||currentStamp>=prevStamp)map.set(item.date,item);
    }
    return [...map.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-14);
  }
  function mergeLearningState(localState,cloudState,cloudUpdatedAt){
    if(!localState||typeof localState!=='object')return cloudState||null;
    if(!cloudState||typeof cloudState!=='object')return localState||null;
    const lt=isoTime(localState.clientUpdatedAt),ct=Math.max(isoTime(cloudState.clientUpdatedAt),isoTime(cloudUpdatedAt)),localNewer=lt>ct,newer=localNewer?localState:cloudState,older=localNewer?cloudState:localState;
    return {...older,...newer,schemaVersion:Math.max(Number(localState.schemaVersion)||0,Number(cloudState.schemaVersion)||0,6),xp:Math.max(Number(localState.xp)||0,Number(cloudState.xp)||0),skills:{...(older.skills||{}),...(newer.skills||{})},qstats:mergeStatMap(localState.qstats,cloudState.qstats),chunkKnown:mergeBoolMap(localState.chunkKnown,cloudState.chunkKnown),vocabKnown:mergeBoolMap(localState.vocabKnown,cloudState.vocabKnown),vocabStats:mergeStatMap(localState.vocabStats,cloudState.vocabStats),weaknessCounts:mergeCountMap(localState.weaknessCounts,cloudState.weaknessCounts),errorMemory:mergeErrorMemory(localState.errorMemory,cloudState.errorMemory),littleEHistory:mergeMemory(localState.littleEHistory,cloudState.littleEHistory,'id',40),littleEMemory:mergeMemory(localState.littleEMemory,cloudState.littleEMemory,'key',60),sessions:mergeSessions(localState.sessions,cloudState.sessions),retryHistory:mergeMemory(older.retryHistory,newer.retryHistory,'completedAt',80),quoteHistory:mergeQuoteHistory(older.quoteHistory,newer.quoteHistory),quoteFavorites:Array.isArray(newer.quoteFavorites)?[...new Set(newer.quoteFavorites)].slice(-100):(Array.isArray(older.quoteFavorites)?older.quoteFavorites:[]),quoteWordBank:mergeQuoteWordBank(older.quoteWordBank,newer.quoteWordBank),skillHistory:mergeSkillHistory(older.skillHistory,newer.skillHistory),dailyMissionHistory:mergeDailyMissionHistory(older.dailyMissionHistory,newer.dailyMissionHistory),completedDates:uniqueStrings(localState.completedDates,cloudState.completedDates).sort(),streakRepairs:mergeRepairs(localState.streakRepairs,cloudState.streakRepairs),settings:{...(older.settings||{}),...(newer.settings||{})},clientUpdatedAt:new Date(Math.max(lt,ct,Date.now())).toISOString()};
  }
  function browserDateKey(value){const d=value instanceof Date?value:new Date(value);if(Number.isNaN(d.getTime()))return null;return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  async function fetchRecentCompletedSessionDates(){
    if(!currentUser)return [];
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-2);cutoff.setHours(0,0,0,0);
    const {data,error}=await client.from('learning_events').select('occurred_at,payload').eq('user_id',currentUser.id).eq('event_type','session_completed').gte('occurred_at',cutoff.toISOString()).order('occurred_at',{ascending:true});
    if(error){console.warn('Recent session recovery lookup failed',error);return [];}
    return [...new Set((data||[]).filter(r=>r?.payload?.completedUnit!==false).map(r=>browserDateKey(r.occurred_at)).filter(Boolean))];
  }
  async function repairRecentDatesFromEvents(state){
    if(!state||typeof state!=='object')return state;
    const evidence=await fetchRecentCompletedSessionDates(); if(!evidence.length)return state;
    const before=new Set(Array.isArray(state.completedDates)?state.completedDates:[]),recovered=evidence.filter(d=>!before.has(d));
    state.completedDates=uniqueStrings([...before],evidence).sort();
    if(recovered.length){state.clientUpdatedAt=new Date().toISOString();await logEvent('learning_state_recovered',{dates:recovered,source:'session_completed',maxAgeDays:2},'state-recovery-'+recovered.join('-'));}
    return state;
  }

  async function loadOrMigrateState() {
    const cloud=await fetchCloudState(),localRaw=localStorage.getItem(STORE_KEY);
    let localState=null;if(localRaw){try{localState=JSON.parse(localRaw)}catch(e){console.warn('Local state parse failed',e)}}
    let resolved=null;
    if(cloud?.state&&Object.keys(cloud.state).length)resolved=mergeLearningState(localState,cloud.state,cloud.updated_at);
    else if(localState){resolved=localState;await logEvent('local_state_migrated',{source:'localStorage'},'migration-v1');}
    if(resolved){
      resolved=await repairRecentDatesFromEvents(resolved);resolved.clientUpdatedAt=new Date().toISOString();
      localStorage.setItem(STORE_KEY,JSON.stringify(resolved));await upsertCloudState(resolved);
      window.dispatchEvent(new CustomEvent('edan:cloud-state',{detail:{state:resolved}}));return;
    }
    window.dispatchEvent(new CustomEvent('edan:cloud-state',{detail:{state:null}}));
  }

  async function logEvent(eventType, payload={}, eventKey=null) {
    if (!currentUser) return;
    const { error } = await client.from('learning_events').insert({
      user_id: currentUser.id,
      event_type: eventType,
      event_key: eventKey,
      payload,
      client_id: navigator.userAgent.slice(0,180)
    });
    if (error) console.warn('Event log failed', error);
  }

  async function finishAuthenticatedBoot() {
    cloudReady = false;
    await loadOrMigrateState();
    cloudReady = true;
    unlockApp();
    updateAccountUI();
    window.dispatchEvent(new CustomEvent('edan:auth-ready',{detail:{
      id:currentUser?.id||null,
      email:currentUser?.email||'',
      isAdmin:isAdminUser()
    }}));
    await logEvent('login_ready', { path: location.pathname }, 'login-' + new Date().toISOString().slice(0,10));
  }

  async function handleSession(session) {
    currentUser = session?.user || null;

    if (!currentUser) {
      cloudReady = false;
      lockApp();
      showAuthView('login');
      updateAccountUI();
      return;
    }

    if (!currentUser.email_confirmed_at) {
      lockApp();
      showAuthView('verify-email');
      $('verifyEmailText').textContent = '驗證信已寄到 ' + (currentUser.email || '你的信箱') + '。完成驗證後再回到這一頁。';
      updateAccountUI();
      return;
    }

    try {
      const mfaOk = await ensureMFA();
      if (!mfaOk) {
        updateAccountUI();
        return;
      }
      await finishAuthenticatedBoot();
    } catch (e) {
      lockApp();
      showAuthView('login');
      setAuthMessage('登入驗證失敗：' + (e.message || e), 'bad');
    }
  }

  function updateAccountUI() {
    const btn = $('accountBtn');
    if (btn) btn.textContent = currentUser ? '帳號' : '登入';
    const email = $('accountEmail');
    if (email) email.textContent = currentUser?.email || '尚未登入';
  }

  async function signIn(email,password) {
    setAuthMessage('登入中…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await handleSession(data.session);
  }

  async function signUp(displayName,email,password) {
    setAuthMessage('建立帳號中…');
    const redirect = location.origin + location.pathname;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
        emailRedirectTo: redirect
      }
    });
    if (error) throw error;
    if (!data.session) {
      showAuthView('verify-email');
      $('verifyEmailText').textContent = '驗證信已寄到 ' + email + '。請先完成信箱驗證，再回到此頁登入。';
      return;
    }
    await handleSession(data.session);
  }

  async function resetPassword(email) {
    const redirect = location.origin + location.pathname + '?reset=1';
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
    if (error) throw error;
    setAuthMessage('密碼重設信已寄出，請查看信箱。', 'good');
  }

  async function updatePassword(password) {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    history.replaceState({}, '', location.pathname);
    setAuthMessage('密碼已更新。', 'good');
    setTimeout(() => showAuthView('login'), 900);
  }

  async function beginMFAEnrollment() {
    setAuthMessage('建立 2FA 設定中…');
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Edan English Coach'
    });
    if (error) throw error;
    enrollingFactorId = data.id;
    $('mfaQr').src = data.totp.qr_code;
    $('mfaSecret').textContent = data.totp.secret;
    $('mfaEnrollIntro')?.classList.add('hidden');
    $('mfaEnrollSetup')?.classList.remove('hidden');
    clearAuthMessage();
  }

  async function verifyMFAEnrollment(code) {
    if (!enrollingFactorId) throw new Error('尚未建立驗證器設定');
    const challenge = await client.auth.mfa.challenge({ factorId: enrollingFactorId });
    if (challenge.error) throw challenge.error;
    const verify = await client.auth.mfa.verify({
      factorId: enrollingFactorId,
      challengeId: challenge.data.id,
      code
    });
    if (verify.error) throw verify.error;
    setAuthMessage('雙重驗證已啟用。', 'good');
    const { data } = await client.auth.getSession();
    await handleSession(data.session);
  }

  async function verifyMFAChallenge(code) {
    if (!currentFactorId) {
      const factors = await listVerifiedTotp();
      currentFactorId = factors[0]?.id || null;
    }
    if (!currentFactorId) throw new Error('找不到已啟用的驗證器');
    const challenge = await client.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error) throw challenge.error;
    currentChallengeId = challenge.data.id;
    const verify = await client.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: currentChallengeId,
      code
    });
    if (verify.error) throw verify.error;
    const { data } = await client.auth.getSession();
    await handleSession(data.session);
  }

  async function openAccountPanel() {
    if (!currentUser) {
      lockApp();
      showAuthView('login');
      return;
    }
    $('accountPanel')?.classList.remove('hidden');
    const factors = await listVerifiedTotp().catch(()=>[]);
    const aal = await getAAL().catch(()=>null);
    $('accountMfaStatus').textContent = factors.length
      ? '已啟用 · ' + (aal?.currentLevel === 'aal2' ? '本次登入已驗證' : '需要再次驗證')
      : '尚未啟用';
  }

  function closeAccountPanel() {
    $('accountPanel')?.classList.add('hidden');
  }

  function isAdminUser(){
    return String(currentUser?.app_metadata?.role||'').toLowerCase()==='admin';
  }

  async function getLearnerProfile(){
    if(!currentUser)return null;
    const {data,error}=await client.from('learner_profiles')
      .select('goal,role_type,self_level,daily_minutes,accents,target_company,onboarding_completed,diagnostic_completed,diagnostic,created_at,updated_at')
      .eq('user_id',currentUser.id)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function saveLearnerProfile(patch={}){
    if(!currentUser)throw new Error('尚未登入');
    const allowedGoal=new Set(['daily','work','interview']);
    const allowedRole=new Set(['engineer','pm','consultant','other']);
    const allowedLevel=new Set(['beginner','intermediate','advanced']);
    const row={user_id:currentUser.id,updated_at:new Date().toISOString()};
    if(allowedGoal.has(patch.goal))row.goal=patch.goal;
    if(allowedRole.has(patch.role_type))row.role_type=patch.role_type;
    if(allowedLevel.has(patch.self_level))row.self_level=patch.self_level;
    if([15,30,60].includes(Number(patch.daily_minutes)))row.daily_minutes=Number(patch.daily_minutes);
    if(Array.isArray(patch.accents)){
      const accents=patch.accents.filter(x=>x==='northAmerica'||x==='india');
      if(accents.length)row.accents=[...new Set(accents)];
    }
    if('target_company' in patch)row.target_company=String(patch.target_company||'').trim().slice(0,120)||null;
    if(typeof patch.onboarding_completed==='boolean')row.onboarding_completed=patch.onboarding_completed;
    if(typeof patch.diagnostic_completed==='boolean')row.diagnostic_completed=patch.diagnostic_completed;
    if(patch.diagnostic&&typeof patch.diagnostic==='object')row.diagnostic=patch.diagnostic;
    const {data,error}=await client.from('learner_profiles')
      .upsert(row,{onConflict:'user_id'})
      .select('goal,role_type,self_level,daily_minutes,accents,target_company,onboarding_completed,diagnostic_completed,diagnostic,created_at,updated_at')
      .single();
    if(error)throw error;
    return data;
  }

  async function getPrivateQuestionPacks(){
    if(!currentUser)return [];
    const {data,error}=await client.from('private_question_packs')
      .select('pack_key,label,questions,answer_translations,question_translations,updated_at')
      .eq('user_id',currentUser.id)
      .eq('enabled',true)
      .order('updated_at',{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function submitLittleEFeedback(payload={}){
    if(!currentUser)throw new Error('尚未登入');
    const row={
      user_id:currentUser.id,
      user_email:currentUser.email||null,
      rating:payload.rating||'suggestion',
      category:payload.category||null,
      comment:payload.comment||null,
      user_message:payload.userMessage||null,
      assistant_response:payload.assistantResponse||null,
      context:payload.context||{},
      improvement_hint:payload.improvementHint||null
    };
    const {data,error}=await client.from('little_e_feedback').insert(row).select('id,created_at,status').single();
    if(error)throw error;
    return data;
  }

  async function listLittleEFeedback(limit=100){
    if(!isAdminUser())throw new Error('需要 Admin 權限');
    const {data,error}=await client.from('little_e_feedback')
      .select('id,user_email,rating,category,comment,user_message,assistant_response,context,improvement_hint,status,created_at,reviewed_at')
      .order('created_at',{ascending:false})
      .limit(Math.max(1,Math.min(200,Number(limit)||100)));
    if(error)throw error;
    return data||[];
  }

  async function updateLittleEFeedbackStatus(id,status){
    if(!isAdminUser())throw new Error('需要 Admin 權限');
    const allowed=new Set(['new','reviewed','planned','done']);
    if(!allowed.has(status))throw new Error('狀態不正確');
    const {data,error}=await client.from('little_e_feedback')
      .update({status,reviewed_at:status==='new'?null:new Date().toISOString()})
      .eq('id',id)
      .select('id,status,reviewed_at')
      .single();
    if(error)throw error;
    return data;
  }

  window.EDAN_CLOUD = {
    get client(){ return client; },
    get user(){ return currentUser; },
    get ready(){ return cloudReady; },
    get isAdmin(){ return isAdminUser(); },
    submitLittleEFeedback,
    listLittleEFeedback,
    updateLittleEFeedbackStatus,
    getLearnerProfile,
    saveLearnerProfile,
    getPrivateQuestionPacks,
    saveState(state) {
      pendingState = state;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        if (!cloudReady || !currentUser || !pendingState) return;
        const copy = pendingState;
        pendingState = null;
        try { await upsertCloudState(copy); }
        catch (e) {
          console.warn('Cloud state sync failed', e);
          const sync = $('cloudSyncStatus');
          if (sync) sync.textContent = '同步失敗，資料仍保留在本機';
        }
      }, 650);
    },
    logEvent
  };

  function bindUI() {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.addEventListener('click',()=>showAuthView(btn.dataset.authTab)));

    $('loginForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await signIn($('loginEmail').value.trim(), $('loginPassword').value); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('registerForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const password = $('registerPassword').value;
      if (password.length < 8) return setAuthMessage('密碼至少需要 8 個字元。','bad');
      try { await signUp($('registerName').value.trim(), $('registerEmail').value.trim(), password); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('forgotForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await resetPassword($('forgotEmail').value.trim()); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('resetPasswordForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await updatePassword($('newPassword').value); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('startMfaEnrollBtn')?.addEventListener('click', async()=>{
      try { await beginMFAEnrollment(); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('mfaEnrollForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      try { await verifyMFAEnrollment($('mfaEnrollCode').value.trim()); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('mfaChallengeForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      try { await verifyMFAChallenge($('mfaChallengeCode').value.trim()); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('accountBtn')?.addEventListener('click', openAccountPanel);
    $('closeAccountPanelBtn')?.addEventListener('click', closeAccountPanel);
    $('accountPanelBackdrop')?.addEventListener('click', closeAccountPanel);
    $('signOutBtn')?.addEventListener('click', async()=>{
      window.dispatchEvent(new CustomEvent('edan:auth-signed-out'));
      await client.auth.signOut();
      closeAccountPanel();
      currentUser = null;
      cloudReady = false;
      lockApp();
      showAuthView('login');
      updateAccountUI();
    });

    $('resendVerificationBtn')?.addEventListener('click', async()=>{
      const email = $('registerEmail')?.value.trim() || $('loginEmail')?.value.trim() || currentUser?.email;
      if (!email) return setAuthMessage('請先輸入 Email。','bad');
      const { error } = await client.auth.resend({ type:'signup', email, options:{ emailRedirectTo:location.origin+location.pathname } });
      if (error) setAuthMessage(error.message,'bad');
      else setAuthMessage('驗證信已重新寄出。','good');
    });
  }

  async function boot() {
    bindUI();
    lockApp();

    if (new URLSearchParams(location.search).get('reset') === '1') {
      showAuthView('reset-password');
    }

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        lockApp();
        showAuthView('reset-password');
        return;
      }
      if (event === 'SIGNED_OUT') {
        window.dispatchEvent(new CustomEvent('edan:auth-signed-out'));
        currentUser = null;
        cloudReady = false;
        lockApp();
        showAuthView('login');
        updateAccountUI();
      }
    });

    const { data } = await client.auth.getSession();
    if (new URLSearchParams(location.search).get('reset') === '1' && data.session) {
      currentUser = data.session.user;
      showAuthView('reset-password');
      return;
    }
    await handleSession(data.session);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
