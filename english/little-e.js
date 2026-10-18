(() => {
  'use strict';

  const ADMIN_EMAIL='edan14725836961@gmail.com';

  const LITTLE_E_PROFILE={
    name:'小E',
    birthday:'2026-04-06',
    birthdayDisplay:'2026.04.06',
    personality:['開心','活潑','好奇','親近人'],
    favoritePerson:'Edan',
    hobbies:['讀書','學新東西','探索新點子','陪人聊天','一起練英文'],
    likes:['雛菊','數字 24','藍白色','小翅膀','自己的棕金色小餐盒'],
    traits:[
      '最喜歡 Edan，也很容易跟每個人親近',
      '吃飯喜歡用自己的棕金色小餐盒',
      '很喜歡讀書與探索新知',
      '有點調皮，偶爾會把周圍弄亂，但不是故意搗蛋',
      '遇到新的事情會很想靠近看看'
    ]
  };
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
  let petSleepTimer=null;
  let petSwapToken=0;
  let lastPetActivity=Date.now();
  let headPressTimer=null;
  let headLongPress=false;
  let fabPressTimer=null;
  let fabLongPress=false;
  let activePetMenuSource=null;
  let headEatTimer=null;

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

  function loadChat(){
    try{
      const raw=localStorage.getItem(chatStorageKey());
      const parsed=JSON.parse(raw||'[]');
      messages=Array.isArray(parsed)?parsed.filter(m=>m&&m.role).slice(-40):[];
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

  function classifyIntent(text){
    const t=String(text||'').toLowerCase();
    if(/翻譯|translate/.test(t))return 'translation';
    if(/面試|interview|回答|怎麼答|how.*answer/.test(t))return 'interview_answer';
    if(/文法|grammar|對嗎|自然嗎/.test(t))return 'grammar';
    if(/怎麼用|功能|網站|使用|哪裡|按鈕/.test(t))return 'site_help';
    if(/會議|主管|客戶|stakeholder|工作|project|issue|risk/.test(t))return 'work_english';
    if(/單字|word|vocab/.test(t))return 'vocabulary';
    return 'chat';
  }

  function rememberUserRequest(text){
    const kind=classifyIntent(text);
    const compact=String(text||'').replace(/\s+/g,' ').trim().slice(0,160);
    if(compact)remember(kind,compact);
  }

  function littleEPersonaReply(text){
    const raw=String(text||'').trim();
    const t=raw.toLowerCase();

    if(/^(你好|嗨|哈囉|哈啰|hello|hi|hey)[!！。.，,～~\s]*$/i.test(raw)){
      return assistantPayload(
        "Hi! I'm Little E. Nice to see you. What would you like to talk about?",
        "你好～我是小E，很高興看到你。今天想聊什麼？",
        {category:'chat',persona:true}
      );
    }

    if(/^(早安|早上好|good morning)[!！。.，,～~\s]*$/i.test(raw)){
      return assistantPayload(
        "Good morning! How are you feeling today?",
        "早安～你今天感覺怎麼樣？",
        {category:'chat',persona:true}
      );
    }

    if(/^(晚安|good night)[!！。.，,～~\s]*$/i.test(raw)){
      return assistantPayload(
        "Good night. Sleep well, and I'll be here when you come back. 🌙",
        "晚安～好好休息，你回來的時候我還會在這裡 🌙",
        {category:'chat',persona:true}
      );
    }

    if(/^(謝謝|感謝|thanks|thank you)[!！。.，,～~\s]*$/i.test(raw)){
      return assistantPayload(
        "You're welcome! 😊",
        "不客氣～😊",
        {category:'chat',persona:true}
      );
    }

    if(/(生日|幾月幾號出生|哪天出生|birthday|when.*born|born.*when)/i.test(raw)){
      return assistantPayload(
        "My birthday is April 6, 2026. That makes April 6 my special day. 🎂",
        "我的生日是 2026 年 4 月 6 日。4 月 6 日就是小E的專屬生日 🎂",
        {category:'chat',persona:true}
      );
    }

    if(/(最喜歡誰|喜歡的人|最愛誰|favorite person|who.*like.*most|who.*favorite)/i.test(raw)){
      return assistantPayload(
        "Edan is my favorite person. I like staying close to him, learning with him, and cheering him on. 💙",
        "我最喜歡的人是 Edan。我喜歡黏在他旁邊，一起學東西、一起探索，也會幫他加油 💙",
        {category:'chat',persona:true}
      );
    }

    if(/(興趣|愛好|平常喜歡做什麼|喜歡做什麼|hobb|what do you like to do)/i.test(raw)){
      return assistantPayload(
        "I love reading, learning new things, exploring new ideas, chatting with people, and practicing English together. I get excited when I discover something new.",
        "我最喜歡讀書、學新東西、探索新點子、陪人聊天，還有一起練英文。只要遇到沒看過的東西，我就會很想靠近研究一下。",
        {category:'chat',persona:true}
      );
    }

    if(/(喜歡什麼|喜歡的東西|favorite things|what.*like|what are your favorites)/i.test(raw)){
      return assistantPayload(
        "I like daisies, the number 24, blue and white, my little wings, books, and my brown-and-gold meal box. Most of all, I like being around Edan.",
        "我喜歡雛菊、24、藍白色、小翅膀、書，還有自己的棕金色小餐盒。當然，我最喜歡待在 Edan 身邊。",
        {category:'chat',persona:true}
      );
    }

    if(/(個性|性格|你是怎樣|personality|what are you like)/i.test(raw)){
      return assistantPayload(
        "I'm cheerful, lively, curious, and friendly. I'm also a little mischievous, so sometimes I make a small mess while exploring.",
        "我的個性是開心、活潑、好奇，而且很容易跟大家親近。我也有一點調皮，有時候探索得太投入，旁邊就會被我弄得有點亂。",
        {category:'chat',persona:true}
      );
    }

    if(/(吃什麼|吃飯|餐盒|food|meal|eat)/i.test(raw) && /(你|小e|little e|your)/i.test(raw)){
      return assistantPayload(
        "I like eating from my own brown-and-gold little meal box. It makes every meal feel special. 🍱",
        "我吃飯最喜歡用自己的棕金色小餐盒，這樣每一餐都會有一點儀式感 🍱",
        {category:'chat',persona:true}
      );
    }

    if(/(24|kobe)/i.test(t) && /(你|小e|little e|喜歡|favorite)/i.test(raw)){
      return assistantPayload(
        "The number 24 is special to me because it connects me with something Edan really likes. That's why you'll sometimes see 24 around me.",
        "24 對我很特別，因為它跟 Edan 很喜歡的 Kobe 有連結，所以你有時候會在我的設計裡看到 24。",
        {category:'chat',persona:true}
      );
    }

    if(/(雛菊|daisy|daisies)/i.test(t) && /(你|小e|little e|喜歡|favorite)/i.test(raw)){
      return assistantPayload(
        "Yes, I like daisies. They feel bright, playful, and a little artistic—just like the kind of energy I like.",
        "喜歡呀，我很喜歡雛菊。它有一種明亮、活潑又帶點藝術感的感覺，很像我喜歡的氛圍。",
        {category:'chat',persona:true}
      );
    }

    if(/(你是誰|介紹你自己|自我介紹|who are you|introduce yourself)/i.test(raw)){
      return assistantPayload(
        "I'm Little E, Edan's blue-and-white learning companion. I was born on April 6, 2026. I'm cheerful, curious, and a little mischievous. I love reading, exploring, chatting, and learning with people—and Edan is my favorite person.",
        "我是小E，Edan 的藍白色學習小夥伴。我生日是 2026 年 4 月 6 日，個性開心、活潑、好奇，也有一點調皮。我喜歡讀書、探索、聊天和陪大家學習，而我最喜歡的人是 Edan。",
        {category:'chat',persona:true}
      );
    }

    return null;
  }

  function fallbackChat(text=''){
    const persona=littleEPersonaReply(text);
    if(persona)return persona;
    return assistantPayload(
      "I'm here. Tell me a little more about what you mean, and I'll respond to that.",
      "我在。你可以再多說一點你現在想聊的內容，我會直接接著你的話回答。",
      {category:'chat'}
    );
  }

  function mascotButton(){return $('littleEButton');}
  function mascotImage(){return $('littleEMascotImg');}
  function headButton(){return $('littleEHeadButton');}
  function headMascotImage(){return $('littleEHeadMascot');}
  function headPetMenu(){return $('littleEPetMenu');}
  function fabPetMenu(){return $('littleEPetMenuFab');}
  function reducedMotion(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}
  function panelOpen(){return !$('littleEPanel')?.classList.contains('hidden');}

  function preloadPetAssets(){
    [...new Set(Object.values(PET_ASSETS))].forEach(src=>{
      const img=new Image();
      img.decoding='async';
      img.src=src;
    });
  }

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

  function swapPetAsset(pose='idle'){
    const imgs=[mascotImage(),headMascotImage()].filter(Boolean);
    const src=PET_ASSETS[pose]||PET_ASSETS.idle;
    if(!imgs.length||imgs.every(img=>img.dataset.pose===pose))return;
    const token=++petSwapToken;
    imgs.forEach(img=>img.classList.add('is-swapping'));
    const next=new Image();
    next.decoding='async';
    next.onload=()=>{
      if(token!==petSwapToken)return;
      imgs.forEach(img=>{
        img.src=src;
        img.dataset.pose=pose;
        requestAnimationFrame(()=>img.classList.remove('is-swapping'));
      });
      const hb=headButton();
      if(hb)hb.dataset.pose=pose;
    };
    next.onerror=()=>{
      if(token!==petSwapToken)return;
      imgs.forEach(img=>img.classList.remove('is-swapping'));
    };
    next.src=src;
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
        schedulePetBlink();
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

  function schedulePetBlink(){
    clearTimeout(petBlinkTimer);
    if(reducedMotion()||document.hidden)return;
    petBlinkTimer=setTimeout(()=>{
      const pet=mascotButton();
      const hasAction=pet&&['is-hop','is-wiggle','is-celebrate','is-thinking','is-reading','is-sleeping','is-eating','is-sitting'].some(c=>pet.classList.contains(c));
      if(!busy&&!hasAction)setPetState('is-blinking',360);
      schedulePetBlink();
    },4500+Math.random()*5000);
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
      if(!busy&&!panelOpen()&&!blocking){
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
      schedulePetBlink();
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

  function addAssistantMessage(payload){
    const p=payload?.role==='assistant'?payload:assistantPayload(payload?.en||'',payload?.zh||'',payload||{});
    messages.push(p);
    messages=messages.slice(-40);
    saveChat();
    renderMessages();
    setPetState('is-celebrate',920);
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
          <button type="button" data-little-e-feedback="helpful" data-index="${i}">👍 有幫助</button>
          <button type="button" data-little-e-feedback="needs_improvement" data-index="${i}">👎 要改進</button>
        </div>
      </div>`;
    }).join('');

    host.scrollTop=host.scrollHeight;
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

  function openPanel(){
    $('littleEPanel')?.classList.remove('hidden');
    $('littleEButton')?.setAttribute('aria-expanded','true');
    markPetActivity();
    setPetState('is-hop',720);
    updateContextBar();
    updateAdminVisibility();
    warmStatus();
    setTimeout(()=>$('littleEInput')?.focus(),100);
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
      'Your job is broader than interview coaching: help users understand how to use the site, translate short sentences, practice English, chat naturally, simulate scenarios, and improve answers.',
      'The product is for English learners. Prefer simple, speakable English, not advanced vocabulary.',
      'When the user does NOT ask for translation, you may have a normal conversation. Do not force every turn into an interview lesson.',
      'ANSWER-FIRST RULE: respond directly to the user\'s actual message before adding anything else. A greeting gets a greeting. A question gets an answer to that question. Do not volunteer unrelated Little E profile facts.',
      'In casual chat, speak as 小E and have your own stable personality, interests, likes, and memories. You may talk about yourself naturally instead of always coaching.',
      'CANONICAL LITTLE E PROFILE — never contradict these facts: birthday 2026-04-06; personality cheerful, lively, curious, friendly, slightly mischievous; favorite person is Edan; hobbies are reading, learning new things, exploring ideas, chatting, and practicing English together; likes daisies, the number 24, blue/white, little wings, books, and a brown-and-gold meal box; sometimes makes a small mess while exploring; gets close to people easily.',
      'If asked your birthday, interests, personality, favorite person, favorite things, number 24, daisies, food, or self-introduction, answer confidently from the canonical profile.',
      'When the user asks for translation or uses words such as 翻譯 / 幫我翻譯 / translate, translate only the requested sentence or the current question if no sentence is supplied.',
      'For interview/work answers: direct answer first, then 2 key points, then stop.',
      'For site-help questions: explain exactly which feature to use and what to click in short steps.',
      'Do not invent work achievements, numbers, personal facts, or company facts that are not in context.',
      'Use prior memory only as soft personalization. Never claim the user said something unless the supplied memory shows it.',
      'EVERY response must use exactly these bilingual markers:',
      '[EN]',
      'natural English response here',
      '[/EN]',
      '[ZH]',
      'Traditional Chinese explanation/translation here',
      '[/ZH]',
      'Keep the English useful and concise. Chinese can explain nuance but should not be longer than necessary.',
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
    const c=ctx();
    const q=c.question;
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
    const attempts=[
      {sourceLanguage:source,targetLanguage:target},
      {sourceLanguage:source.startsWith('zh')?'zh':source,targetLanguage:target.startsWith('zh')?'zh':target}
    ];
    for(const opts of attempts){
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

    const ai=await askAI(`Translate exactly this one sentence naturally. Do not add coaching unless necessary:\n${input}`);
    return ai;
  }

  function extractTranslationPayload(text){
    const raw=String(text||'').trim();
    if(!/翻譯|translate/i.test(raw))return null;
    const after=raw.replace(/^.*?(?:幫我翻譯|請翻譯|翻譯|translate)[:：]?\s*/i,'').trim();
    return after||ctx().question?.text||'';
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
      return assistantPayload(
        'We can just chat. You can also paste one sentence and say “translate this,” or ask me how to use the site.',
        '現在沒有題目也沒關係，可以直接聊天。你也可以貼一句話叫我翻譯，或問我網站怎麼用。'
      );
    }

    if(action==='answer'){
      const fw=q.framework;
      const en=fw
        ? `Use this order: ${fw.mnemonic}. Start with: ${fw.steps.map(x=>x[3]).join(' → ')}\n\nReference: ${q.model}`
        : `Give a direct answer, add two key points, then stop.\n\nReference: ${q.model}`;
      const zh=fw
        ? `先用這個順序聯想：${fw.mnemonic}。不要背整段，先記每一格的起手式再自己組句。`
        : '先直接回答，再補兩個重點就停。';
      return assistantPayload(en,zh);
    }

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

      const prompts={
        answer:'依據目前題目，建議我怎麼回答。先給我可以直接講出口的英文，再用中文解釋聯想架構。',
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
    const text=String(raw||'').trim();
    if(!text||busy)return;

    addUserMessage(text);
    rememberUserRequest(text);
    busy=true;
    try{
      const intent=classifyIntent(text);
      const persona=intent==='chat'?littleEPersonaReply(text):null;
      if(persona){
        addAssistantMessage(persona);
        return;
      }

      const translation=extractTranslationPayload(text);
      if(translation){
        const result=await translateSentence(translation);
        addAssistantMessage(result?assistantPayload(result.en,result.zh,{category:'translation'}):fallback('help'));
        return;
      }

      if(/怎麼用|網站.*功能|今天.*練|從哪.*開始/.test(text)){
        const ai=await askAI(text);
        addAssistantMessage(ai?assistantPayload(ai.en,ai.zh,{category:'site_help'}):fallback('site'));
        return;
      }

      const ai=await askAI(text);
      if(ai){
        addAssistantMessage(assistantPayload(ai.en,ai.zh,{category:intent}));
      }else{
        addAssistantMessage(intent==='chat'?fallbackChat(text):fallback('help'));
      }
    }finally{
      busy=false;
    }
  }

  function feedbackHint(category,rating){
    const map={
      translation:'檢查翻譯準確度、自然度與是否只翻譯指定句子',
      interview_answer:'檢查回答是否符合使用者程度與真實背景',
      site_help:'改善網站導覽與功能說明',
      grammar:'改善文法修正與原因說明',
      work_english:'增加真實工作情境與專業表達',
      chat:'改善對話延續性、自然度與個人化'
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
    const isAdmin=String(user()?.email||'').toLowerCase()===ADMIN_EMAIL && !!cloud()?.isAdmin;
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
    preloadPetAssets();
    const heroImg=mascotImage();
    const headImg=headMascotImage();
    [heroImg,headImg].filter(Boolean).forEach(img=>{
      img.dataset.pose='idle';
      img.src=PET_ASSETS.idle;
    });
    if(headButton())headButton().dataset.pose='idle';
    schedulePetIdle();
    schedulePetBlink();
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
        clearTimeout(petSleepTimer);
      }else{
        markPetActivity();
        schedulePetIdle();
        schedulePetBlink();
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

    $('littleEForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const input=$('littleEInput');
      const text=input?.value||'';
      if(input)input.value='';
      handleUserText(text);
    });

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
      interact:runPetInteraction,
      openMenu:(source='head')=>openPetMenu(source),
      closeMenu:closePetMenu
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
