(() => {
  'use strict';

  const CORE=window.LITTLE_E_CORE;
  if(!CORE)throw new Error('little-e-core.js must load before little-e.js');
  const LITTLE_E_PROFILE=CORE.PROFILE;
  const CHAT_KEY_PREFIX='edanLittleEChatV26:';
  const PREF_KEY='edanLittleEPrefsV26';

  const $=id=>document.getElementById(id);
  const bridge=()=>window.EDAN_APP_BRIDGE;
  const cloud=()=>window.EDAN_CLOUD;

  let aiSession=null;
  let aiInitPromise=null;
  let busy=false;
  let messages=[];
  let currentFeedbackMessageId=null;
  let langPrefs={en:true,zh:false};
  let scenario='coach';
  let petIdleTimer=null;
  let petActionTimer=null;
  let petBlinkTimer=null;
  let petExpressionTimer=null;
  let petExpressionResetTimer=null;
  let petExpressionActive=false;
  let lastIdleExpression='';
  let petSleepTimer=null;
  let petSwapToken=0;
  let lastPetActivity=Date.now();
  let headPressTimer=null;
  let headLongPress=false;
  let fabPressTimer=null;
  let fabLongPress=false;
  let activePetMenuSource=null;
  let headEatTimer=null;
  let currentPetPose='idle';
  let petAssetsReadyPromise=null;
  const normalizedPetAssets={};

  const PET_ASSETS={
    idle:'assets/little-e-mascot-v30.webp',
    blink:'assets/little-e-blink-v31.webp',
    wave:'assets/little-e-mascot-v30.webp',
    happy:'assets/little-e-happy-v31.webp',
    thinking:'assets/little-e-thinking-v31.webp',
    reading:'assets/little-e-reading-v31.webp',
    eat:'assets/little-e-eat-v34.webp',
    sit:'assets/little-e-sit-v34.webp',
    sleep:'assets/little-e-sleep-v34.webp'
  };

  // v40: subtle random facial expressions while Little E is collapsed and idle.
  // Only facial poses live here; full interactions such as eat / sit / sleep stay manual/contextual.
  const IDLE_EXPRESSIONS=[
    {pose:'blink',weight:46,minMs:320,maxMs:500},
    {pose:'happy',weight:34,minMs:780,maxMs:1250},
    {pose:'thinking',weight:20,minMs:820,maxMs:1350}
  ];

  const SCENARIOS={
    coach:{
      label:'學習教練',
      prompt:'Help the user understand how to learn, remember, and answer. Use short, practical English.'
    },
    chat:{
      label:'英文陪聊',
      prompt:'Have a natural friendly conversation as Little E. Answer what the user actually said or asked first. Never jump to an unrelated hobby, favorite thing, personal fact, or coaching topic. Only mention your stable interests, likes, personality, birthday, or favorite person when the user asks about you or when it is clearly relevant to the current conversation. Keep English simple enough for an English learner. Ask at most one useful follow-up question.'
    },
    interview:{
      label:'面試陪練',
      prompt:'Act as an international tech interviewer and career English coach. Ask realistic follow-up questions and improve the user\'s answer without making it sound memorized.'
    },
    work:{
      label:'工作情境',
      prompt:'Simulate professional workplace English for meetings, stakeholder updates, project delivery, risks, incidents, requirements, and cross-team coordination.'
    },
    site:{
      label:'網站導覽',
      prompt:'Explain how to use Edan\'s English Coach clearly. Recommend the next feature or practice mode based on the user\'s request.'
    },
    style:{
      label:'我的回答風格',
      prompt:'Rewrite or answer in the user\'s emerging speaking style: direct, structured, concise, practical, and easy to say. Do not invent personal facts.'
    },
    mock:{
      label:'情境模擬',
      prompt:'Create a short role-play. Give one line at a time, wait for the user, then continue naturally. Adapt difficulty to the user.'
    }
  };

  function esc(s=''){
    return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  }

  function user(){
    return cloud()?.user||null;
  }

  function chatStorageKey(){
    return CHAT_KEY_PREFIX+(user()?.id||'anonymous');
  }

  function loadPrefs(){
    try{
      const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
      if(typeof p.en==='boolean')langPrefs.en=p.en;
      if(typeof p.zh==='boolean')langPrefs.zh=p.zh;
      if(p.scenario&&SCENARIOS[p.scenario])scenario=p.scenario;
    }catch(e){}
    if(!langPrefs.en&&!langPrefs.zh)langPrefs.en=true;
  }

  function savePrefs(){
    localStorage.setItem(PREF_KEY,JSON.stringify({...langPrefs,scenario}));
  }

  function repairLegacyBilingualMessages(list=[]){
    let changed=false;
    for(const m of list){
      if(m?.role!=='assistant')continue;
      const en=String(m.en||'');
      const zh=String(m.zh||'');
      if(!/Use this order:|Reference:/i.test(en))continue;
      if(!/聯想|起手式|回答架構|兩個重點/.test(zh))continue;
      const reference=en.match(/Reference:\s*([\s\S]+)$/i)?.[1]?.trim();
      if(!reference)continue;
      const q=(window.EDAN_ENGLISH_CONTENT?.questions||[]).find(x=>String(x.model||'').trim()===reference);
      if(!q)continue;
      const template=CORE.reusableAnswerTemplate(q);
      const modelZh=String(q.modelZh||window.EDAN_ENGLISH_CONTENT?.answerTranslations?.[q.id]||'').trim();
      m.en=['You can answer this question like this:','',q.model,'','Reusable template:',template.en].join('\n');
      m.zh=['你可以這樣回答：','',modelZh||template.zh,'','可套用模板：',template.zh].join('\n');
      m.category='interview_answer';
      m.bilingualAligned=true;
      m.repairedInV47=true;
      changed=true;
    }
    return changed;
  }

  function loadChat(){
    try{
      const raw=localStorage.getItem(chatStorageKey());
      const parsed=JSON.parse(raw||'[]');
      messages=Array.isArray(parsed)?parsed.filter(m=>m&&m.role).slice(-40):[];
      if(repairLegacyBilingualMessages(messages))saveChat();
    }catch(e){messages=[];}
    renderMessages();
  }

  function saveChat(){
    try{localStorage.setItem(chatStorageKey(),JSON.stringify(messages.slice(-40)));}catch(e){}
  }

  function clearVisibleChat(){
    try{localStorage.removeItem(chatStorageKey());}catch(e){}
    messages=[];
    renderMessages();
  }

  function ctx(){
    return bridge()?.context?.()||{};
  }

  function memory(){
    return bridge()?.getMemory?.()||[];
  }

  function remember(kind,text){
    bridge()?.remember?.({kind,text});
  }

  function classifyIntent(text){return CORE.classifyIntent(text);}

  function rememberUserRequest(text){
    const kind=classifyIntent(text);
    const compact=String(text||'').replace(/\s+/g,' ').trim().slice(0,160);
    if(kind==='social')return;
    if(compact)remember(kind,compact);
  }

  function littleEPersonaReply(text){
    const r=CORE.directReply(text,messages);
    return r?assistantPayload(r.en,r.zh,{category:classifyIntent(text),...(r.meta||{})}):null;
  }
  function fallbackChat(text=''){
    const r=CORE.fallbackReply(text,messages);
    return assistantPayload(r.en,r.zh,{category:'chat',...(r.meta||{})});
  }

  function mascotButton(){return $('littleEButton');}
  function mascotImage(){return $('littleEMascotImg');}
  function headButton(){return $('littleEHeadButton');}
  function headMascotImage(){return $('littleEHeadMascot');}
  function headPetMenu(){return $('littleEPetMenu');}
  function fabPetMenu(){return $('littleEPetMenuFab');}
  function reducedMotion(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}
  function panelOpen(){return !$('littleEPanel')?.classList.contains('hidden');}

  function normalizePetAsset(pose,src){
    return new Promise(resolve=>{
      const img=new Image();img.decoding='async';
      img.onload=()=>{
        try{
          const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
          const scan=document.createElement('canvas');scan.width=w;scan.height=h;
          const sctx=scan.getContext('2d',{willReadFrequently:true});if(!sctx)return resolve(src);
          sctx.drawImage(img,0,0,w,h);const px=sctx.getImageData(0,0,w,h).data;
          let minX=w,minY=h,maxX=-1,maxY=-1;
          for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>10){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
          if(maxX<minX||maxY<minY)return resolve(src);
          const bw=maxX-minX+1,bh=maxY-minY+1,pad=Math.ceil(Math.max(bw,bh)*.08);
          const sx=Math.max(0,minX-pad),sy=Math.max(0,minY-pad),ex=Math.min(w,maxX+pad+1),ey=Math.min(h,maxY+pad+1),cw=ex-sx,ch=ey-sy;
          const out=document.createElement('canvas');out.width=256;out.height=256;const octx=out.getContext('2d');if(!octx)return resolve(src);
          const scale=Math.min(226/cw,226/ch),dw=cw*scale,dh=ch*scale;
          octx.drawImage(img,sx,sy,cw,ch,(256-dw)/2,(256-dh)/2,dw,dh);
          resolve(out.toDataURL('image/webp',.94)||src);
        }catch(err){console.warn('Little E pose normalization fallback',pose,err);resolve(src)}
      };
      img.onerror=()=>resolve(src);img.src=src;
    });
  }
  function preloadPetAssets(){
    if(petAssetsReadyPromise)return petAssetsReadyPromise;
    petAssetsReadyPromise=Promise.all(Object.entries(PET_ASSETS).map(async([pose,src])=>{normalizedPetAssets[pose]=await normalizePetAsset(pose,src)})).then(()=>{swapPetAsset(currentPetPose,true);return normalizedPetAssets});
    return petAssetsReadyPromise;
  }
  function petAssetForPose(pose='idle'){return normalizedPetAssets[pose]||PET_ASSETS[pose]||PET_ASSETS.idle;}

  function petPoseForState(state=''){
    if(state==='is-eating')return 'eat';
    if(state==='is-sitting')return 'sit';
    if(state==='is-thinking')return 'thinking';
    if(state==='is-reading')return 'reading';
    if(state==='is-sleeping')return 'sleep';
    if(state==='is-blinking')return 'blink';
    if(state==='is-celebrate'||state==='is-hop')return 'happy';
    if(state==='is-wiggle')return 'wave';
    return 'idle';
  }

  function petBubbleForPose(pose){
    return {
      idle:'找我嗎？',
      blink:'嘿嘿',
      wave:'嗨 👋',
      happy:'做得好！',
      eating:'好吃！',
      eat:'好吃！',
      sit:'坐好囉',
      thinking:'讓我想想…',
      reading:'一起看一下',
      sleep:'晚安 Zzz'
    }[pose]||'找我嗎？';
  }

  function swapPetAsset(pose='idle',force=false){
    const imgs=[mascotImage(),headMascotImage()].filter(Boolean),src=petAssetForPose(pose);
    currentPetPose=pose;if(!imgs.length)return;
    const resolved=src.startsWith('data:')?src:new URL(src,document.baseURI).href;
    if(!force&&imgs.every(img=>img.dataset.pose===pose&&img.src===resolved))return;
    const token=++petSwapToken;imgs.forEach(img=>img.classList.add('is-swapping'));
    const next=new Image();next.decoding='async';
    next.onload=()=>{if(token!==petSwapToken)return;imgs.forEach(img=>{img.src=src;img.dataset.pose=pose;requestAnimationFrame(()=>img.classList.remove('is-swapping'))});const hb=headButton();if(hb)hb.dataset.pose=pose};
    next.onerror=()=>{if(token!==petSwapToken)return;imgs.forEach(img=>img.classList.remove('is-swapping'))};next.src=src;
  }

  function openPetMenu(source='head'){
    closePetMenu();
    const isFab=source==='fab';
    const menu=isFab?fabPetMenu():headPetMenu();
    const btn=isFab?mascotButton():headButton();
    if(!menu||!btn)return;
    activePetMenuSource=source;
    menu.classList.remove('hidden');
    menu.dataset.source=source;
    btn.setAttribute('aria-expanded','true');
    btn.classList.add('menu-open');
    setPetState('is-wiggle',700);
  }

  function closePetMenu(){
    [headPetMenu(),fabPetMenu()].forEach(menu=>{
      menu?.classList.add('hidden');
      if(menu)delete menu.dataset.source;
    });
    [headButton(),mascotButton()].forEach(btn=>{
      btn?.setAttribute('aria-expanded','false');
      btn?.classList.remove('menu-open','is-pressing');
    });
    activePetMenuSource=null;
  }

  function feedLittleE(){
    clearTimeout(headEatTimer);
    setPetState('is-eating',3200);
  }

  function runPetInteraction(action){
    closePetMenu();
    markPetActivity();
    switch(action){
      case 'feed': feedLittleE(); break;
      case 'sit': setPetState('is-sitting',4400); break;
      case 'sleep': setPetState('is-sleeping'); break;
      case 'wave': setPetState('is-wiggle',900); break;
      case 'read': setPetState('is-reading',2600); break;
      case 'think': setPetState('is-thinking',2100); break;
      case 'happy': setPetState('is-celebrate',1100); break;
      case 'random':{
        const actions=['feed','sit','sleep','wave','read','think','happy'];
        runPetInteraction(actions[Math.floor(Math.random()*actions.length)]);
        break;
      }
      default: setPetState('is-wiggle',850);
    }
  }

  function startHeadLongPress(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    clearTimeout(headPressTimer);
    headLongPress=false;
    headButton()?.classList.add('is-pressing');
    headPressTimer=setTimeout(()=>{
      headLongPress=true;
      headButton()?.classList.remove('is-pressing');
      openPetMenu('head');
      try{navigator.vibrate?.(20);}catch(_){}
    },560);
  }

  function startFabLongPress(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    clearTimeout(fabPressTimer);
    fabLongPress=false;
    mascotButton()?.classList.add('is-pressing');
    fabPressTimer=setTimeout(()=>{
      fabLongPress=true;
      mascotButton()?.classList.remove('is-pressing');
      openPetMenu('fab');
      try{navigator.vibrate?.(20);}catch(_){}
    },560);
  }

  function cancelFabLongPress(){
    clearTimeout(fabPressTimer);
    mascotButton()?.classList.remove('is-pressing');
  }

  function finishFabPress(){
    clearTimeout(fabPressTimer);
    mascotButton()?.classList.remove('is-pressing');
  }

  function cancelHeadLongPress(){
    clearTimeout(headPressTimer);
    headButton()?.classList.remove('is-pressing');
  }

  function finishHeadPress(){
    clearTimeout(headPressTimer);
    headButton()?.classList.remove('is-pressing');
  }

  function updatePetBubble(pose){
    const el=mascotButton()?.querySelector('.little-e-pet-bubble small');
    if(el)el.textContent=petBubbleForPose(pose);
  }

  function setPetState(state='',duration=0){
    const pet=mascotButton();
    if(!pet)return;
    const head=headButton();
    clearTimeout(petActionTimer);
    clearTimeout(petExpressionTimer);
    clearTimeout(petExpressionResetTimer);
    petExpressionActive=false;
    const classes=['is-hop','is-wiggle','is-celebrate','is-thinking','is-reading','is-sleeping','is-blinking','is-eating','is-sitting'];
    [pet,head].filter(Boolean).forEach(el=>classes.forEach(c=>el.classList.remove(c)));
    if(state)[pet,head].filter(Boolean).forEach(el=>el.classList.add(state));
    const pose=petPoseForState(state);
    swapPetAsset(pose);
    updatePetBubble(pose);
    if(duration>0){
      petActionTimer=setTimeout(()=>{
        [pet,head].filter(Boolean).forEach(el=>el.classList.remove(state));
        swapPetAsset('idle');
        updatePetBubble('idle');
        schedulePetIdle();
        schedulePetExpression();
      },duration);
    }
  }

  function markPetActivity(){
    lastPetActivity=Date.now();
    const pet=mascotButton();
    if(pet?.classList.contains('is-sleeping')&&!busy){
      setPetState('is-wiggle',850);
    }
    schedulePetSleep();
  }

  function petHasBlockingAction(){
    const pet=mascotButton();
    return !!pet&&['is-hop','is-wiggle','is-celebrate','is-thinking','is-reading','is-sleeping','is-eating','is-sitting'].some(c=>pet.classList.contains(c));
  }

  function chooseIdleExpression(){
    const choices=IDLE_EXPRESSIONS.filter(x=>x.pose!==lastIdleExpression);
    const pool=choices.length?choices:IDLE_EXPRESSIONS;
    const total=pool.reduce((sum,x)=>sum+x.weight,0);
    let roll=Math.random()*total;
    for(const item of pool){
      roll-=item.weight;
      if(roll<=0)return item;
    }
    return pool[pool.length-1];
  }

  function schedulePetExpression(){
    clearTimeout(petBlinkTimer);
    clearTimeout(petExpressionTimer);
    if(reducedMotion()||document.hidden||panelOpen())return;

    const delay=6200+Math.random()*9200;
    petExpressionTimer=setTimeout(()=>{
      if(busy||panelOpen()||petHasBlockingAction()||petExpressionActive){
        schedulePetExpression();
        return;
      }

      const expression=chooseIdleExpression();
      lastIdleExpression=expression.pose;
      petExpressionActive=true;
      swapPetAsset(expression.pose);

      const duration=expression.minMs+Math.random()*(expression.maxMs-expression.minMs);
      clearTimeout(petExpressionResetTimer);
      petExpressionResetTimer=setTimeout(()=>{
        petExpressionActive=false;
        if(!busy&&!panelOpen()&&!petHasBlockingAction()){
          swapPetAsset('idle');
        }
        schedulePetExpression();
      },duration);
    },delay);
  }

  // Compatibility alias for older call sites; blinking is now part of the random expression scheduler.
  function schedulePetBlink(){
    schedulePetExpression();
  }

  function schedulePetSleep(){
    clearTimeout(petSleepTimer);
    if(reducedMotion()||document.hidden)return;
    petSleepTimer=setTimeout(()=>{
      if(!busy&&!panelOpen()&&Date.now()-lastPetActivity>=90000){
        setPetState('is-sleeping');
      }else{
        schedulePetSleep();
      }
    },90050);
  }

  function schedulePetIdle(){
    clearTimeout(petIdleTimer);
    if(reducedMotion()||document.hidden)return;
    petIdleTimer=setTimeout(()=>{
      const pet=mascotButton();
      const blocking=pet&&['is-sleeping','is-eating','is-sitting','is-thinking','is-reading','is-celebrate','is-hop','is-wiggle'].some(c=>pet.classList.contains(c));
      if(!busy&&!panelOpen()&&!blocking&&!petExpressionActive){
        setPetState(Math.random()<.55?'is-wiggle':'is-hop',Math.random()<.5?850:720);
      }else if(!pet?.classList.contains('is-sleeping')){
        schedulePetIdle();
      }
    },6500+Math.random()*7500);
  }

  function setStatus(text,tone='neutral'){
    const el=$('littleEStatus');
    if(el){
      el.textContent=text;
      el.dataset.tone=tone;
    }
    if(tone==='loading')setPetState('is-thinking');
    else if(mascotButton()?.classList.contains('is-thinking')){
      setPetState('',0);
      schedulePetIdle();
      schedulePetExpression();
    }
  }

  function currentQuestionLabel(){
    const q=ctx().question;
    if(!q)return '目前沒有題目。可以直接聊天、貼一句話翻譯，或問我網站怎麼用。';
    return `${q.active?'目前題目':'最近題目'}：${q.text}`;
  }

  function updateContextBar(){
    const el=$('littleEContext');
    if(el)el.textContent=currentQuestionLabel();
  }

  function assistantPayload(en='',zh='',meta={}){
    return {
      role:'assistant',
      id:'le-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
      en:String(en||'').trim(),
      zh:String(zh||'').trim(),
      ts:new Date().toISOString(),
      ...meta
    };
  }

  function addUserMessage(text){
    messages.push({role:'user',id:'le-u-'+Date.now(),text:String(text||'').trim(),ts:new Date().toISOString()});
    messages=messages.slice(-40);
    saveChat();
    renderMessages();
  }

  function playPetReaction(reaction='happy'){
    const map={
      happy:['is-celebrate',920],
      wave:['is-wiggle',900],
      thinking:['is-thinking',1500],
      reading:['is-reading',1800],
      sit:['is-sitting',2200],
      sleep:['is-sleeping',2200]
    };
    const [state,duration]=map[reaction]||map.happy;
    setPetState(state,duration);
  }

  function addAssistantMessage(payload){
    const p=payload?.role==='assistant'?payload:assistantPayload(payload?.en||'',payload?.zh||'',payload||{});
    messages.push(p);
    messages=messages.slice(-40);
    saveChat();
    renderMessages();
    playPetReaction(p.petReaction||CORE.reactionFor?.('',p.category||'chat')||'happy');
  }

  function renderMessages(){
    const host=$('littleEMessages');
    if(!host)return;

    if(!messages.length){
      host.innerHTML=`<div class="little-e-empty"><b>嗨，我是小E 👋</b><span>我可以陪你聊天、翻譯一句話、解釋題目、練面試、模擬工作情境，也可以教你怎麼使用這個網站。</span><div class="little-e-empty-examples">例如：<button type="button" data-little-e-sample="幫我翻譯：我晚一點回覆你">幫我翻譯一句話</button><button type="button" data-little-e-sample="這個網站我今天應該先練什麼？">今天先練什麼？</button><button type="button" data-little-e-sample="陪我用英文聊工作">陪我聊工作</button><button type="button" data-little-e-sample="小E，你喜歡什麼？">問小E喜歡什麼</button></div></div>`;
      return;
    }

    host.innerHTML=messages.map((m,i)=>{
      if(m.role==='user'){
        return `<div class="little-e-msg user"><div class="little-e-msg-who">你</div><div class="little-e-msg-text">${esc(m.text||'')}</div></div>`;
      }

      const en=m.en||'';
      const zh=m.zh||'';
      const showEn=typeof m.showEn==='boolean'?m.showEn:langPrefs.en;
      const showZh=typeof m.showZh==='boolean'?m.showZh:langPrefs.zh;
      return `<div class="little-e-msg assistant" data-msg-id="${esc(m.id||String(i))}">
        <div class="little-e-msg-who">小E</div>
        <div class="little-e-response">
          <div class="little-e-lang little-e-lang-en ${showEn?'':'hidden'}"><span class="little-e-lang-label">EN</span><div>${esc(en||'—')}</div></div>
          <div class="little-e-lang little-e-lang-zh ${showZh?'':'hidden'}"><span class="little-e-lang-label">中文</span><div>${esc(zh||'—')}</div></div>
        </div>
        <div class="little-e-msg-actions little-e-lang-actions">
          <button type="button" class="${showEn?'active':''}" data-little-e-msg-lang="en" data-index="${i}">${showEn?'🙈 隱藏英文':'👁 顯示英文'}</button>
          <button type="button" class="${showZh?'active':''}" data-little-e-msg-lang="zh" data-index="${i}">${showZh?'🙈 隱藏中文':'🇹🇼 顯示中文'}</button>
          ${en&&/[A-Za-z]{2}/.test(en)?`<button type="button" data-little-e-speak="${i}">🔊 英文</button>`:''}
          ${m.latestAnswerCoach?`<button type="button" class="little-e-retry-cta" data-little-e-retry="${i}">🎙 套用修正再答一次</button>`:''}
          <button type="button" data-little-e-feedback="helpful" data-index="${i}">👍 有幫助</button>
          <button type="button" data-little-e-feedback="needs_improvement" data-index="${i}">👎 要改進</button>
        </div>
      </div>`;
    }).join('');

    scrollChatToEnd();
  }

  function applyLanguageVisibility(){
    const en=$('littleELangEn');
    const zh=$('littleELangZh');
    if(en){
      en.classList.toggle('active',langPrefs.en);
      en.textContent=langPrefs.en?'EN 顯示':'EN 隱藏';
    }
    if(zh){
      zh.classList.toggle('active',langPrefs.zh);
      zh.textContent=langPrefs.zh?'中文 顯示':'中文 隱藏';
    }
    renderMessages();
  }

  function setLanguage(which){
    if(which==='en')langPrefs.en=!langPrefs.en;
    if(which==='zh')langPrefs.zh=!langPrefs.zh;
    if(!langPrefs.en&&!langPrefs.zh){
      if(which==='en')langPrefs.zh=true;
      else langPrefs.en=true;
    }
    messages.forEach(m=>{
      if(m.role!=='assistant')return;
      m.showEn=langPrefs.en;
      m.showZh=langPrefs.zh;
    });
    savePrefs();
    saveChat();
    applyLanguageVisibility();
  }

  function toggleMessageLanguage(index,which){
    const msg=messages[Number(index)];
    if(!msg||msg.role!=='assistant')return;
    const currentEn=typeof msg.showEn==='boolean'?msg.showEn:langPrefs.en;
    const currentZh=typeof msg.showZh==='boolean'?msg.showZh:langPrefs.zh;
    if(which==='en'){
      msg.showEn=!currentEn;
      if(!msg.showEn && !currentZh)msg.showZh=true;
      else if(typeof msg.showZh!=='boolean')msg.showZh=currentZh;
    }else if(which==='zh'){
      msg.showZh=!currentZh;
      if(!msg.showZh && !currentEn)msg.showEn=true;
      else if(typeof msg.showEn!=='boolean')msg.showEn=currentEn;
    }
    saveChat();
    renderMessages();
  }

  function scrollChatToEnd(){const h=$('littleEMessages');if(!h)return;requestAnimationFrame(()=>{h.scrollTop=h.scrollHeight});setTimeout(()=>{h.scrollTop=h.scrollHeight},80)}
  function resizeLittleEInput(){const i=$('littleEInput');if(!i)return;i.style.height='auto';i.style.height=Math.min(Math.max(i.scrollHeight,44),112)+'px'}
  function syncLittleEViewport(){const v=window.visualViewport,p=$('littleEPanel'),i=$('littleEInput');if(!p)return;if(v)document.documentElement.style.setProperty('--little-e-vvh',v.height+'px');const k=!!(v&&i&&document.activeElement===i&&v.height<window.innerHeight*.86);p.classList.toggle('keyboard-open',k);if(k)scrollChatToEnd()}

  function openPanel(){
    clearTimeout(petExpressionTimer);
    clearTimeout(petExpressionResetTimer);
    petExpressionActive=false;
    $('littleEPanel')?.classList.remove('hidden');
    $('littleEButton')?.setAttribute('aria-expanded','true');
    markPetActivity();
    setPetState('is-hop',720);
    updateContextBar();
    updateAdminVisibility();
    warmStatus();
    if(window.matchMedia?.('(min-width:701px)')?.matches)setTimeout(()=>$('littleEInput')?.focus(),100);
    setTimeout(scrollChatToEnd,120);
  }

  function closePanel(){
    closePetMenu();
    $('littleEPanel')?.classList.add('hidden');
    $('littleEButton')?.setAttribute('aria-expanded','false');
    markPetActivity();
    setPetState('is-wiggle',850);
  }

  function warmStatus(){
    if('LanguageModel' in window)setStatus('本機 AI 可用 · 0 API 費用','good');
    else if('Translator' in window)setStatus('本機翻譯可用 · 對話使用輔助模式','mid');
    else setStatus('基本輔助模式','mid');
  }

  function scenarioPrompt(){
    return SCENARIOS[scenario]?.prompt||SCENARIOS.coach.prompt;
  }

  function systemPrompt(){
    return [
      'You are 小E, the built-in AI helper inside Edan English Coach.',
      'Your job is broader than interview coaching: help users use the site, translate short sentences, practice English, chat naturally, simulate scenarios, and improve answers.',
      'Prefer simple, speakable English.',
      ...CORE.systemRules(),
      'Translation requests: translate only the requested sentence or current question when no sentence is supplied.',
      'Interview/work answers: direct answer first, then 2 key points, then stop.',
      'If the user asks “這題怎麼回答 / how should I answer this?”, use the CURRENT LEARNING CONTEXT question and write an actual ready-to-say answer first. NEVER reply with only an answer framework or mnemonic.',
      'If the user asks about the latest answer (what to improve / make it natural / make it simpler), use LATEST USER ANSWER / RESULT as the primary source. Do not replace it with the Model Answer unless you are comparing them explicitly.',
      'Prefer the current question Reference answer when it exists. You may simplify or naturalize it, but do not ignore it.',
      'If there is not enough personal evidence, give a common realistic sample answer and label it as a sample. Never invent the user\'s achievements or numbers.',
      'Site help: explain what to click in short steps.',
      'Do not invent work achievements, numbers, personal facts, or company facts not in context.',
      'EVERY response must use exactly: [EN]...[/EN] then [ZH]...[/ZH].',
      'The [ZH] block must be a faithful natural Traditional Chinese (Taiwan) translation of the [EN] block, preserving the same sections, examples, and meaning. Never use [ZH] for separate coaching notes that are absent from [EN].',
      'CURRENT SCENARIO: '+scenarioPrompt()
    ].join('\n');
  }

  async function ensureAI(){
    if(aiSession)return aiSession;
    if(aiInitPromise)return aiInitPromise;
    if(!('LanguageModel' in window))return null;

    aiInitPromise=(async()=>{
      try{
        const availability=await LanguageModel.availability();
        if(availability==='unavailable')return null;
        setStatus(availability==='available'?'正在啟動本機 AI…':'準備下載本機 AI 模型…','loading');
        aiSession=await LanguageModel.create({
          initialPrompts:[{role:'system',content:systemPrompt()}],
          monitor(m){
            m.addEventListener('downloadprogress',e=>{
              setStatus(`本機 AI 模型下載中 ${Math.round((Number(e.loaded)||0)*100)}%`,'loading');
            });
          }
        });
        setStatus('本機 AI · 資料留在裝置','good');
        return aiSession;
      }catch(err){
        console.warn('Little E AI unavailable',err);
        setStatus('本機 AI 暫不可用 · 輔助模式','mid');
        return null;
      }finally{
        aiInitPromise=null;
      }
    })();
    return aiInitPromise;
  }

  function recentConversationText(){
    return messages.slice(-8).map(m=>{
      if(m.role==='user')return 'USER: '+(m.text||'');
      return 'ASSISTANT EN: '+(m.en||'')+'\nASSISTANT ZH: '+(m.zh||'');
    }).join('\n');
  }

  function memoryText(){
    return memory().slice(-12).map(m=>`- [${m.kind}] ${m.text} (asked ${m.count||1}x)`).join('\n');
  }

  function buildPrompt(userText){
    const c=ctx(),q=c.question,resolved=CORE.resolveConversationContext(userText,messages);
    const parts=[
      'USER REQUEST:',
      userText,
      '',
      'SCENARIO:',
      SCENARIOS[scenario]?.label||scenario,
      '',
      'RECENT CHAT:',
      recentConversationText()||'(none)',
      '',
      'RESOLVED CONVERSATION CONTEXT:',
      resolved.summary||'(none)',
      '',
      'LONG-TERM TOPIC MEMORY:',
      memoryText()||'(none)',
      '',
      'LITTLE E CANONICAL PROFILE:',
      'Birthday: '+LITTLE_E_PROFILE.birthdayDisplay,
      'Personality: '+LITTLE_E_PROFILE.personality.join(', '),
      'Favorite person: '+LITTLE_E_PROFILE.favoritePerson,
      'Hobbies: '+LITTLE_E_PROFILE.hobbies.join(', '),
      'Likes: '+LITTLE_E_PROFILE.likes.join(', '),
      'Traits: '+LITTLE_E_PROFILE.traits.join(' | '),
      '',
      'CURRENT LEARNING CONTEXT:'
    ];

    if(q){
      parts.push(
        `Question (${q.active?'active':'most recent'}): ${q.text}`,
        `Type: ${q.type}; Skill: ${q.skill}; Level: L${q.level}`,
        q.intent?`Intent: ${q.intent}`:'',
        q.keywords?.length?`Keywords: ${q.keywords.join(', ')}`:'',
        q.model?`Reference answer: ${q.model}`:'',
        q.modelZh?`Reference answer zh-TW: ${q.modelZh}`:''
      );
      if(q.framework){
        parts.push(`Answer map: ${q.framework.title}`,`Memory rule: ${q.framework.mnemonic}`);
      }
    }else{
      parts.push('No current/recent practice question.');
    }

    if(c.transcript)parts.push(`Latest transcript: ${c.transcript}`);
    if(c.latestAnswer){
      const a=c.latestAnswer;parts.push('LATEST USER ANSWER / RESULT:');
      if(a.kind)parts.push(`Answer type: ${a.kind}`);
      if(a.transcript)parts.push(`User said: ${a.transcript}`);
      if(Number.isFinite(a.score))parts.push(`Current score: ${a.score}/100`);
      if(a.corrected)parts.push(`Corrected version: ${a.corrected}`);
      if(a.natural)parts.push(`Natural version: ${a.natural}`);
      if(a.notes?.length)parts.push(`Correction notes: ${a.notes.join(' | ')}`);
      if(a.missing?.length)parts.push(`Missing content: ${a.missing.join(' | ')}`);
      if(a.suggestions?.length)parts.push(`Suggestions: ${a.suggestions.join(' | ')}`);
      if(a.selectedText)parts.push(`Selected answer: ${a.selectedText}`);
      if(a.correctText)parts.push(`Correct answer: ${a.correctText}`);
      if(typeof a.correct==='boolean')parts.push(`Was correct: ${a.correct?'yes':'no'}`);
    }
    if(c.learnerProfile){
      parts.push(`Learner goal: ${c.learnerProfile.goal||'unknown'}`);
      parts.push(`Learner role type: ${c.learnerProfile.role_type||'other'}`);
      parts.push(`Learner self level: ${c.learnerProfile.self_level||'unknown'}`);
      if(c.learnerProfile.target_company)parts.push(`Target company or role: ${c.learnerProfile.target_company}`);
    }
    if(c.retryComparison){
      const sign=Number(c.retryComparison.delta)>0?'+':'';
      parts.push(`Retry comparison: ${c.retryComparison.beforeScore} -> ${c.retryComparison.afterScore} (${sign}${c.retryComparison.delta})`);
      parts.push(`Next review: ${c.retryComparison.reviewLabel||c.retryComparison.reviewDue||'scheduled'}`);
    }
    if(Number.isFinite(c.lastSystemScore))parts.push(`Latest speaking score: ${c.lastSystemScore}/100`);
    if(c.topWeakness)parts.push(`Current weak area: ${c.topWeakness}`);

    return parts.filter(Boolean).join('\n');
  }

  function parseBilingual(raw){
    const text=String(raw||'').trim();
    const en=text.match(/\[EN\]([\s\S]*?)\[\/EN\]/i)?.[1]?.trim()||'';
    const zh=text.match(/\[ZH\]([\s\S]*?)\[\/ZH\]/i)?.[1]?.trim()||'';
    if(en||zh)return {en,zh};

    const hasZh=/[\u3400-\u9fff]/.test(text);
    return hasZh?{en:'',zh:text}:{en:text,zh:''};
  }

  async function askAI(text){
    const session=await ensureAI();
    if(!session)return null;
    try{
      setStatus('小E 思考中…','loading');
      const result=await session.prompt(buildPrompt(text));
      setStatus('本機 AI · 資料留在裝置','good');
      return parseBilingual(result);
    }catch(err){
      console.warn('Little E prompt failed',err);
      setStatus('本機 AI 回覆失敗 · 輔助模式','mid');
      return null;
    }
  }

  async function makeTranslator(source,target){
    if(!('Translator' in window))return null;
    const targetIsTraditional=/^zh-(?:Hant|TW)$/i.test(target);
    const sourceIsChinese=/^zh/i.test(source);
    const attempts=targetIsTraditional
      ? [
          {sourceLanguage:source,targetLanguage:'zh-Hant'},
          {sourceLanguage:source,targetLanguage:'zh-TW'}
        ]
      : sourceIsChinese
        ? [
            {sourceLanguage:source,targetLanguage:target},
            {sourceLanguage:'zh-Hant',targetLanguage:target},
            {sourceLanguage:'zh-TW',targetLanguage:target},
            {sourceLanguage:'zh',targetLanguage:target}
          ]
        : [{sourceLanguage:source,targetLanguage:target}];

    const seen=new Set();
    for(const opts of attempts){
      const key=opts.sourceLanguage+'>'+opts.targetLanguage;
      if(seen.has(key))continue;
      seen.add(key);
      try{
        return await Translator.create({
          ...opts,
          monitor(m){m.addEventListener('downloadprogress',e=>setStatus(`翻譯模型下載中 ${Math.round((Number(e.loaded)||0)*100)}%`,'loading'));}
        });
      }catch(e){}
    }
    return null;
  }

  async function translateSentence(text){
    const input=String(text||'').trim();
    if(!input)return null;
    const sourceIsZh=/[\u3400-\u9fff]/.test(input);
    const source=sourceIsZh?'zh':'en';
    const target=sourceIsZh?'en':'zh-Hant';
    const translator=await makeTranslator(source,target);

    if(translator){
      try{
        setStatus('本機翻譯中…','loading');
        const translated=String(await translator.translate(input)||'').trim();
        translator.destroy?.();
        warmStatus();
        return sourceIsZh
          ? {en:translated,zh:input}
          : {en:input,zh:translated};
      }catch(e){}
    }

    const ai=await askAI(`Translate exactly this one sentence naturally. If translating English to Chinese, use natural Traditional Chinese as used in Taiwan (zh-TW), never Simplified Chinese. The Chinese must have the same meaning as the English and must not add coaching or extra information:\n${input}`);
    return ai;
  }

  function extractTranslationPayload(text){
    const raw=String(text||'').trim();
    if(!/翻譯|translate/i.test(raw))return null;
    const after=raw.replace(/^.*?(?:幫我翻譯|請翻譯|翻譯|translate)[:：]?\s*/i,'').trim();
    return after||ctx().question?.text||'';
  }

  function currentQuestionAnswerPayload(q,{exampleOnly=false}={}){
    if(!q)return null;
    const template=CORE.reusableAnswerTemplate(q);
    const ready=String(q.model||'').trim();
    const readyZh=String(q.modelZh||'').trim();
    const en=exampleOnly
      ? [
          'Common example:',
          ready||template.en,
          '',
          'Reusable template:',
          template.en
        ].join('\n')
      : [
          'You can answer this question like this:',
          '',
          ready||template.en,
          '',
          'Reusable template:',
          template.en
        ].join('\n');
    const zh=exampleOnly
      ? [
          '常用範例：',
          readyZh||template.zh,
          '',
          '可套用模板：',
          template.zh
        ].join('\n')
      : [
          '你可以這樣回答：',
          '',
          readyZh||template.zh,
          '',
          '可套用模板：',
          template.zh
        ].join('\n');
    return assistantPayload(en,zh,{category:'interview_answer',petReaction:'thinking',answerFirst:true,bilingualAligned:true});
  }

  function fallback(action='help'){
    const c=ctx();
    const q=c.question;

    if(action==='site'){
      return assistantPayload(
        'Start with Today\'s 15-minute plan. Use Listening for question intent, Vocabulary for frequent words, Chunks for usable phrases, and Speaking for recorded answers. Use 小E anytime you get stuck.',
        '建議先從「今日 15 分鐘」開始：聽力練意圖、單字練高頻字、Chunks 練可直接說的句型、口說做錄音回答。卡住時隨時叫小E。'
      );
    }

    if(!q){
      if(action==='answer'||action==='example'){
        return assistantPayload(
          'Paste the interview question and I will give you a ready-to-say answer. If your personal details are not available, I will give you a common sample instead of making facts up.',
          '把面試題目貼給我，我會直接給你可以講出口的回答；如果沒有你的個人細節，我就給常用範例，不會亂編你的經歷。'
        );
      }
      return assistantPayload(
        'We can just chat. You can also paste one sentence and say “translate this,” or ask me how to use the site.',
        '現在沒有題目也沒關係，可以直接聊天。你也可以貼一句話叫我翻譯，或問我網站怎麼用。'
      );
    }

    if(action==='answer')return currentQuestionAnswerPayload(q);
    if(action==='example')return currentQuestionAnswerPayload(q,{exampleOnly:true});

    if(action==='simple'){
      const sentences=String(q.model||'').split(/(?<=[.!?])\s+/).filter(Boolean);
      return assistantPayload(sentences.slice(0,2).join(' ')||q.model,'這是短版，先練到能順順說完，再補完整內容。');
    }

    if(action==='keywords'){
      const keys=(q.keywords||[]).slice(0,5);
      return assistantPayload(keys.join(' → ')||'Use the Answer Map.','先看這些 cue words，不看完整答案，試著自己把句子組回來。');
    }

    if(action==='explain'){
      return assistantPayload(
        'The interviewer wants a clear answer with ownership, priorities, and a practical example.',
        q.intent?`這題的核心意圖：${q.intent}`:'面試官主要想聽你能不能清楚回答、說明自己負責什麼，以及你的實際做法。'
      );
    }

    if(action==='model-zh'){
      return assistantPayload(q.model||'',q.modelZh||'這題目前沒有預先整理的繁體中文翻譯。');
    }

    return fallback('answer');
  }

  function latestAnswerFallback(action,c){
    const a=c?.latestAnswer;
    if(!a){
      return assistantPayload(
        'Finish one question first, then I can coach your latest answer directly.',
        '先完成一題，我就能直接針對你剛才的回答幫你修改。'
      );
    }

    if(a.kind==='speaking'){
      if(action==='natural-last'&&a.natural){
        return assistantPayload(
          a.natural,
          '這是系統目前整理出的較自然版本。你可以先跟讀一次，再用自己的方式重說。'
        );
      }
      if(action==='simplify-last'){
        const source=String(a.corrected||a.natural||a.transcript||'').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,2).join(' ');
        return assistantPayload(
          source||'Keep the answer short: one direct point, one reason, and one result.',
          '先縮成「直接回答 → 一個理由 → 一個結果」，講順之後再補細節。'
        );
      }
      const focus=[...(a.notes||[]),...(a.missing||[]),...(a.suggestions||[])].filter(Boolean).slice(0,3);
      return assistantPayload(
        [
          'Your latest answer:',
          a.transcript||'(no transcript)',
          '',
          'A better version:',
          a.corrected||a.natural||'Keep the answer direct and complete.',
          '',
          'Focus:',
          focus.length?focus.join(' | '):'Make the main point earlier and keep the structure clear.'
        ].join('\n'),
        focus.length
          ? '這次先改這幾點：'+focus.join('；')
          : '這次先把主要答案提早講，再讓結構更清楚。'
      );
    }

    if(typeof a.correct==='boolean'){
      return assistantPayload(
        a.correct
          ? 'Your last choice was correct. The next step is to explain why it is correct in one short sentence.'
          : 'Your last choice was not correct. Compare your choice with the correct answer and focus on the question intent.',
        a.correct
          ? '你剛才答對了。下一步練習用一句話說出「為什麼這個答案對」。'
          : `你剛才選的是「${a.selectedText||''}」，正確答案是「${a.correctText||''}」。先重新抓題目真正的意圖。`
      );
    }

    return assistantPayload('Let me review your latest answer again.','我會重新檢查你剛才的回答。');
  }

  function latestAnswerPrompt(action,c){
    const a=c?.latestAnswer||null;
    const labels={
      'review-last':'針對我剛才的回答，直接指出最值得改的 2–3 個地方。先說問題，再給修正版。不要重新回答整個題目，也不要講空泛原則。',
      'natural-last':'把我剛才的回答改得更自然、更像實際面試口說，但保留我的原意與程度。先給可以直接說的英文，再給自然繁中翻譯。',
      'simplify-last':'把我剛才的回答縮短成更容易說、容易記、但仍完整的版本。優先保留核心答案、理由與結果。'
    };
    return [
      labels[action]||'幫我檢查剛才的回答。',
      a?.transcript?`我的原回答：${a.transcript}`:'',
      a?.corrected?`目前修正版：${a.corrected}`:'',
      a?.natural?`目前自然版：${a.natural}`:'',
      Number.isFinite(a?.score)?`目前分數：${a.score}/100`:'',
      a?.notes?.length?`系統註記：${a.notes.join('；')}`:'',
      a?.missing?.length?`可能漏掉：${a.missing.join('；')}`:'',
      a?.selectedText?`我剛選：${a.selectedText}`:'',
      a?.correctText?`正確答案：${a.correctText}`:''
    ].filter(Boolean).join('\n');
  }

  async function runQuickAction(action){
    if(busy)return;
    busy=true;
    try{
      updateContextBar();
      const q=ctx().question;

      if(action==='translate-question'){
        if(!q){addAssistantMessage(fallback('site'));return;}
        addUserMessage('翻譯目前題目');
        const result=await translateSentence(q.text);
        addAssistantMessage(result?assistantPayload(result.en,result.zh,{category:'translation'}):fallback('explain'));
        remember('translation',q.text.slice(0,140));
        return;
      }

      if((action==='answer'||action==='example')&&q){
        const text=action==='answer'?'這題怎麼回答':'給我這題的常用範例';
        addUserMessage(text);
        rememberUserRequest(text);
        addAssistantMessage(currentQuestionAnswerPayload(q,{exampleOnly:action==='example'}));
        return;
      }

      if(action==='retry-last'){
        const text='套用剛才的修正，再回答一次';
        addUserMessage(text);rememberUserRequest(text);
        const result=bridge()?.retryLatestSpeaking?.('little_e_quick');
        if(result?.ok){
          addAssistantMessage(assistantPayload(
            `Great. Your previous score was ${result.beforeScore}/100. Answer the same question again in your own words.`,
            `好，剛才是 ${result.beforeScore}/100。現在用你自己的話重新回答同一題；完成後我會幫你比較前後分數。`,
            {category:'interview_answer',petReaction:'happy'}
          ));
          setTimeout(closePanel,420);
        }else{
          addAssistantMessage(assistantPayload('Finish one scored speaking answer first.',result?.reason||'請先完成一題有分數的口說回答。',{category:'interview_answer'}));
        }
        return;
      }

      if(['review-last','natural-last','simplify-last'].includes(action)){
        const c=ctx();
        const labels={
          'review-last':'幫我看剛才哪裡要改',
          'natural-last':'把我剛才回答改自然一點',
          'simplify-last':'把我剛才回答變簡單'
        };
        const text=labels[action];
        addUserMessage(text);
        rememberUserRequest(text);
        if(!c.latestAnswer){
          addAssistantMessage(latestAnswerFallback(action,c));
          return;
        }
        const ai=await askAI(latestAnswerPrompt(action,c));
        addAssistantMessage(ai
          ? assistantPayload(ai.en,ai.zh,{category:'interview_answer',petReaction:'thinking',latestAnswerCoach:true})
          : latestAnswerFallback(action,c));
        return;
      }

      const prompts={
        answer:'依據目前題目，直接給我一個可以講出口的完整英文回答；如果沒有我的個人資料，就給常用範例，不要只給架構。',
        example:'給我目前題目一個常見、自然、可以直接講出口的英文範例，再補一個可重複使用的模板。',
        simple:'把目前題目的回答改成更簡單、更好說、更好記的版本。',
        keywords:'只整理目前題目的 cue words，並告訴我怎麼用它們聯想回答。',
        explain:'解釋目前題目真正想問什麼，以及面試官想聽什麼。',
        'model-zh':'翻譯目前 Model answer，英文保留原句，中文做自然翻譯。',
        site:'告訴我現在這個網站怎麼用，以及我下一步適合做什麼。'
      };
      const text=prompts[action]||'幫我處理目前這題。';
      addUserMessage(text);
      rememberUserRequest(text);
      const ai=await askAI(text);
      addAssistantMessage(ai?assistantPayload(ai.en,ai.zh,{category:action}):fallback(action));
    }finally{
      busy=false;
    }
  }

  async function handleUserText(raw){
    const text=String(raw||'').trim();if(!text||busy)return;
    addUserMessage(text);rememberUserRequest(text);busy=true;
    try{
      const intent=classifyIntent(text),direct=CORE.directReply(text,messages.slice(0,-1));
      if(direct){addAssistantMessage(assistantPayload(direct.en,direct.zh,{category:intent,...(direct.meta||{})}));return}
      const currentQuestion=ctx().question;
      if(currentQuestion&&CORE.isCurrentQuestionAnswerRequest(text)){
        addAssistantMessage(currentQuestionAnswerPayload(currentQuestion));
        return;
      }
      const translation=extractTranslationPayload(text);
      if(intent==='translation'&&translation){const r=await translateSentence(translation);addAssistantMessage(r?assistantPayload(r.en,r.zh,{category:'translation',petReaction:'thinking'}):fallback('help'));return}
      if(intent==='site_help'){const r=await askAI(text);addAssistantMessage(r?assistantPayload(r.en,r.zh,{category:'site_help',petReaction:'reading'}):fallback('site'));return}
      const r=await askAI(text);
      if(r)addAssistantMessage(assistantPayload(r.en,r.zh,{category:intent,petReaction:CORE.reactionFor(text,intent)}));
      else addAssistantMessage(['chat','persona','social'].includes(intent)?fallbackChat(text):fallback('help'));
    }finally{busy=false;resizeLittleEInput();scrollChatToEnd()}
  }

  function feedbackHint(category,rating){
    const map={
      translation:'檢查翻譯準確度、自然度與是否只翻譯指定句子',
      interview_answer:'檢查回答是否符合使用者程度與真實背景',
      site_help:'改善網站導覽與功能說明',
      grammar:'改善文法修正與原因說明',
      work_english:'增加真實工作情境與專業表達',
      chat:'改善對話延續性、自然度與個人化',
      persona:'改善小E人格一致性與問答相關性',
      social:'改善招呼與簡短社交回覆'
    };
    return `${map[category]||'檢查回覆是否真正解決使用者需求'}；回饋類型：${rating}`;
  }

  async function submitFeedback({rating,message,comment=''}) {
    const c=cloud();
    if(!c?.submitLittleEFeedback){
      setStatus('回饋功能尚未連線','mid');
      return false;
    }
    const category=message?.category||classifyIntent(messages.slice().reverse().find(x=>x.role==='user')?.text||'');
    try{
      await c.submitLittleEFeedback({
        rating,
        category,
        comment,
        userMessage:messages.slice(0,messages.indexOf(message)).reverse().find(x=>x.role==='user')?.text||null,
        assistantResponse:[message?.en,message?.zh].filter(Boolean).join('\n---\n'),
        context:{question:ctx().question?.text||null,scenario,version:ctx().contentVersion||null},
        improvementHint:feedbackHint(category,rating)
      });
      setStatus('✓ 已收到你的回饋','good');
      return true;
    }catch(err){
      console.warn(err);
      setStatus('回饋送出失敗，請稍後再試','mid');
      return false;
    }
  }

  function openFeedbackForm(index=null,rating='suggestion'){
    currentFeedbackMessageId=index===null?null:Number(index);
    const modal=$('littleEFeedbackBox');
    if(!modal)return;
    modal.classList.remove('hidden');
    $('littleEFeedbackTitle').textContent=rating==='needs_improvement'?'這則回覆哪裡需要改進？':'給小E一個使用建議';
    modal.dataset.rating=rating;
    const input=$('littleEFeedbackText');
    if(input){input.value='';setTimeout(()=>input.focus(),80);}
  }

  function closeFeedbackForm(){
    $('littleEFeedbackBox')?.classList.add('hidden');
    currentFeedbackMessageId=null;
  }

  async function sendFeedbackForm(){
    const box=$('littleEFeedbackBox');
    const rating=box?.dataset.rating||'suggestion';
    const comment=$('littleEFeedbackText')?.value.trim()||'';
    if(!comment){
      $('littleEFeedbackHint').textContent='請寫一點你希望怎麼改。';
      return;
    }
    const message=currentFeedbackMessageId===null?null:messages[currentFeedbackMessageId];
    const ok=await submitFeedback({rating,message,comment});
    if(ok)closeFeedbackForm();
  }

  function updateAdminVisibility(){
    const isAdmin=!!cloud()?.isAdmin;
    $('littleEAdminBtn')?.classList.toggle('hidden',!isAdmin);
  }

  function feedbackStatusLabel(status){
    return {new:'新回饋',reviewed:'已查看',planned:'預計改善',done:'已完成'}[status]||status;
  }

  async function loadAdminFeedback(){
    const host=$('littleEAdminList');
    if(!host)return;
    host.innerHTML='<div class="support">讀取回饋中…</div>';
    try{
      const rows=await cloud().listLittleEFeedback(100);
      if(!rows.length){
        host.innerHTML='<div class="support">目前沒有使用者回饋。</div>';
        return;
      }
      host.innerHTML=rows.map(r=>`<article class="little-e-admin-item">
        <div class="little-e-admin-meta"><b>#${r.id} · ${esc(r.rating)}</b><span>${esc(r.user_email||'')} · ${esc(new Date(r.created_at).toLocaleString('zh-TW',{hour12:false}))}</span></div>
        <div class="little-e-admin-category">${esc(r.category||'general')} · ${esc(r.improvement_hint||'')}</div>
        ${r.comment?`<div class="little-e-admin-comment">使用者：${esc(r.comment)}</div>`:''}
        ${r.user_message?`<details><summary>使用者訊息</summary><div>${esc(r.user_message)}</div></details>`:''}
        ${r.assistant_response?`<details><summary>小E 回覆</summary><div class="little-e-admin-response">${esc(r.assistant_response)}</div></details>`:''}
        <label class="little-e-admin-status">處理狀態
          <select data-feedback-status data-id="${r.id}">
            ${['new','reviewed','planned','done'].map(x=>`<option value="${x}" ${x===r.status?'selected':''}>${feedbackStatusLabel(x)}</option>`).join('')}
          </select>
        </label>
      </article>`).join('');
    }catch(err){
      console.warn(err);
      host.innerHTML='<div class="support">無法讀取 Admin 回饋。</div>';
    }
  }

  function openAdmin(){
    $('littleEAdminPanel')?.classList.remove('hidden');
    loadAdminFeedback();
  }

  function closeAdmin(){
    $('littleEAdminPanel')?.classList.add('hidden');
  }

  function bind(){
    loadPrefs();
    scenario=$('littleEScenario')?.value||scenario;
    if($('littleEScenario'))$('littleEScenario').value=scenario;
    loadChat();
    applyLanguageVisibility();
    updateContextBar();
    updateAdminVisibility();
    warmStatus();
    preloadPetAssets().catch(()=>{});
    const heroImg=mascotImage();
    const headImg=headMascotImage();
    [heroImg,headImg].filter(Boolean).forEach(img=>{
      img.dataset.pose='idle';
      img.src=PET_ASSETS.idle;
    });
    if(headButton())headButton().dataset.pose='idle';
    schedulePetIdle();
    schedulePetExpression();
    schedulePetSleep();

    const pet=mascotButton();
    pet?.addEventListener('pointerdown',startFabLongPress);
    pet?.addEventListener('pointerup',finishFabPress);
    pet?.addEventListener('pointercancel',cancelFabLongPress);
    pet?.addEventListener('pointerleave',cancelFabLongPress);
    pet?.addEventListener('click',e=>{
      markPetActivity();
      if(fabLongPress){
        fabLongPress=false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      setPetState('is-hop',720);
      $('littleEPanel')?.classList.contains('hidden')?openPanel():closePanel();
    });
    pet?.addEventListener('mouseenter',()=>{
      markPetActivity();
      if(!busy&&!pet.classList.contains('menu-open'))setPetState('is-wiggle',850);
    });
    pet?.addEventListener('dragstart',e=>e.preventDefault());
    pet?.addEventListener('contextmenu',e=>{
      e.preventDefault();
      e.stopPropagation();
      openPetMenu('fab');
    });
    document.querySelectorAll('.little-e-protected-art,.little-e-mascot-img,.little-e-head-mascot').forEach(img=>{
      img.addEventListener('dragstart',e=>e.preventDefault());
      img.addEventListener('contextmenu',e=>e.preventDefault());
    });

    const head=headButton();
    head?.addEventListener('pointerdown',startHeadLongPress);
    head?.addEventListener('pointerup',finishHeadPress);
    head?.addEventListener('pointercancel',cancelHeadLongPress);
    head?.addEventListener('pointerleave',cancelHeadLongPress);
    head?.addEventListener('click',e=>{
      e.stopPropagation();
      markPetActivity();
      if(headLongPress){
        headLongPress=false;
        e.preventDefault();
        return;
      }
      setPetState('is-wiggle',850);
    });
    head?.addEventListener('contextmenu',e=>{
      e.preventDefault();
      e.stopPropagation();
      openPetMenu('head');
    });

    [headPetMenu(),fabPetMenu()].filter(Boolean).forEach(menu=>{
      menu.addEventListener('click',e=>{
        const btn=e.target.closest?.('[data-pet-action]');
        if(!btn)return;
        e.stopPropagation();
        runPetInteraction(btn.dataset.petAction);
      });
    });

    document.addEventListener('pointerdown',e=>{
      const headWrap=$('littleEHeadInteraction');
      const insideHead=headWrap?.contains(e.target);
      const insideFab=mascotButton()?.contains(e.target)||fabPetMenu()?.contains(e.target);
      if(activePetMenuSource&&!insideHead&&!insideFab)closePetMenu();
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape')closePetMenu();
    });
    ['keydown','pointerdown','touchstart','scroll'].forEach(evt=>{
      window.addEventListener(evt,markPetActivity,{passive:true});
    });
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){
        clearTimeout(petIdleTimer);
        clearTimeout(petBlinkTimer);
        clearTimeout(petExpressionTimer);
        clearTimeout(petExpressionResetTimer);
        petExpressionActive=false;
        clearTimeout(petSleepTimer);
      }else{
        markPetActivity();
        schedulePetIdle();
        schedulePetExpression();
      }
    });
    $('littleEClose')?.addEventListener('click',closePanel);
    $('littleEClear')?.addEventListener('click',clearVisibleChat);
    $('littleELangEn')?.addEventListener('click',()=>setLanguage('en'));
    $('littleELangZh')?.addEventListener('click',()=>setLanguage('zh'));
    $('littleEScenario')?.addEventListener('change',e=>{
      scenario=SCENARIOS[e.target.value]?e.target.value:'coach';
      savePrefs();
      aiSession?.destroy?.();
      aiSession=null;
      setStatus(`已切換：${SCENARIOS[scenario].label}`,'good');
      remember('scenario',SCENARIOS[scenario].label);
    });

    document.querySelectorAll('[data-little-e-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.littleEAction;
      markPetActivity();
      if(action==='site'||action==='keywords')setPetState('is-reading',1800);
      runQuickAction(action);
    }));

    const littleEInput=$('littleEInput');
    littleEInput?.addEventListener('input',()=>{resizeLittleEInput();scrollChatToEnd()});
    littleEInput?.addEventListener('focus',()=>{setTimeout(syncLittleEViewport,80);setTimeout(scrollChatToEnd,120)});
    littleEInput?.addEventListener('blur',()=>setTimeout(syncLittleEViewport,80));
    window.visualViewport?.addEventListener('resize',syncLittleEViewport);
    window.visualViewport?.addEventListener('scroll',syncLittleEViewport);
    resizeLittleEInput();syncLittleEViewport();
    $('littleEForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('littleEInput'),text=input?.value||'';if(input){input.value='';input.style.height='44px'}handleUserText(text)});

    $('littleEMessages')?.addEventListener('click',async e=>{
      const sample=e.target.closest?.('[data-little-e-sample]');
      if(sample){handleUserText(sample.dataset.littleESample);return;}

      const langBtn=e.target.closest?.('[data-little-e-msg-lang]');
      if(langBtn){
        toggleMessageLanguage(Number(langBtn.dataset.index),langBtn.dataset.littleEMsgLang);
        return;
      }

      const speakBtn=e.target.closest?.('[data-little-e-speak]');
      if(speakBtn){
        const msg=messages[Number(speakBtn.dataset.littleESpeak)];
        if(msg?.en)bridge()?.speakEnglish?.(msg.en,.92);
        return;
      }

      const retryBtn=e.target.closest?.('[data-little-e-retry]');
      if(retryBtn){
        const result=bridge()?.retryLatestSpeaking?.('little_e_coach');
        if(result?.ok){
          setStatus(`開始重答 · Before ${result.beforeScore}/100`,'good');
          setPetState('is-celebrate',720);
          setTimeout(closePanel,260);
        }else{
          setStatus(result?.reason||'目前沒有可重答的口說題','mid');
        }
        return;
      }

      const feedback=e.target.closest?.('[data-little-e-feedback]');
      if(feedback){
        const index=Number(feedback.dataset.index);
        const rating=feedback.dataset.littleEFeedback;
        const msg=messages[index];
        if(rating==='helpful'){
          const ok=await submitFeedback({rating,message:msg,comment:'有幫助'});
          if(ok){feedback.disabled=true;feedback.textContent='✓ 已回饋';}
        }else{
          openFeedbackForm(index,rating);
        }
      }
    });

    $('littleEGeneralFeedbackBtn')?.addEventListener('click',()=>openFeedbackForm(null,'suggestion'));
    $('littleEFeedbackCancel')?.addEventListener('click',closeFeedbackForm);
    $('littleEFeedbackSend')?.addEventListener('click',sendFeedbackForm);

    $('littleEAdminBtn')?.addEventListener('click',openAdmin);
    $('littleEAdminClose')?.addEventListener('click',closeAdmin);
    $('littleEAdminRefresh')?.addEventListener('click',loadAdminFeedback);
    $('littleEAdminList')?.addEventListener('change',async e=>{
      const select=e.target.closest?.('[data-feedback-status]');
      if(!select)return;
      try{
        await cloud().updateLittleEFeedbackStatus(Number(select.dataset.id),select.value);
        setStatus('✓ Admin 狀態已更新','good');
      }catch(err){
        console.warn(err);
        setStatus('Admin 狀態更新失敗','mid');
      }
    });

    window.addEventListener('edan:auth-ready',()=>{
      loadChat();
      updateAdminVisibility();
      updateContextBar();
    });

    window.addEventListener('edan:auth-signed-out',()=>{
      clearVisibleChat();
      closeAdmin();
      closePanel();
    });

    window.addEventListener('edan:cloud-state',()=>{
      updateContextBar();
    });

    const challenge=$('challengeSection');
    if(challenge&&'MutationObserver'in window){
      new MutationObserver(()=>updateContextBar()).observe(challenge,{subtree:true,childList:true,attributes:true});
    }

    window.LITTLE_E_PET={
      setState:setPetState,
      idle:()=>setPetState('',0),
      wave:()=>setPetState('is-wiggle',850),
      happy:()=>setPetState('is-celebrate',920),
      thinking:()=>setPetState('is-thinking'),
      reading:()=>setPetState('is-reading',1800),
      sit:()=>setPetState('is-sitting',4400),
      sleep:()=>setPetState('is-sleeping'),
      expression:()=>{clearTimeout(petExpressionTimer);petExpressionTimer=setTimeout(()=>{if(!panelOpen()&&!busy&&!petHasBlockingAction()){const x=chooseIdleExpression();lastIdleExpression=x.pose;swapPetAsset(x.pose);petExpressionActive=true;petExpressionResetTimer=setTimeout(()=>{petExpressionActive=false;swapPetAsset('idle');schedulePetExpression()},x.minMs)}},0)},
      interact:runPetInteraction,
      openMenu:(source='head')=>openPetMenu(source),
      closeMenu:closePetMenu
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
