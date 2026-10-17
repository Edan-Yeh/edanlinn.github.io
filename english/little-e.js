(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const bridge = () => window.EDAN_APP_BRIDGE;
  let aiSession = null;
  let aiInitPromise = null;
  let busy = false;
  let messages = [];

  function escapeText(s=''){
    return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  }

  function context(){
    return bridge()?.context?.() || {};
  }

  function currentQuestionLabel(){
    const q=context().question;
    return q ? `目前題目：${q.text}` : '目前沒有進行中的題目';
  }

  function setStatus(text,tone='neutral'){
    const el=$('littleEStatus');
    if(!el)return;
    el.textContent=text;
    el.dataset.tone=tone;
  }

  function saveHistory(){
    bridge()?.saveHistory?.(messages.slice(-30));
  }

  function addMessage(role,text,meta={}){
    messages.push({
      role,
      text:String(text||'').trim(),
      ts:new Date().toISOString(),
      ...meta
    });
    messages=messages.slice(-30);
    saveHistory();
    renderMessages();
  }

  function renderMessages(){
    const host=$('littleEMessages');
    if(!host)return;
    if(!messages.length){
      host.innerHTML='<div class="little-e-empty"><b>嗨，我是小E 👋</b><span>我會看你目前正在練的題目，幫你翻譯、拆回答架構、把英文改成你現在講得出來的版本。</span></div>';
      return;
    }
    host.innerHTML=messages.map((m,i)=>{
      const who=m.role==='user'?'你':'小E';
      const cls=m.role==='user'?'user':'assistant';
      const speak=m.role==='assistant' && /[A-Za-z]{3}/.test(m.text)
        ? `<button class="little-e-msg-action" data-little-e-speak="${i}" type="button">🔊 朗讀英文</button>`
        : '';
      return `<div class="little-e-msg ${cls}"><div class="little-e-msg-who">${who}</div><div class="little-e-msg-text">${escapeText(m.text)}</div>${speak}</div>`;
    }).join('');
    host.scrollTop=host.scrollHeight;
  }

  function updateContextBar(){
    const el=$('littleEContext');
    if(el)el.textContent=currentQuestionLabel();
  }

  function openPanel(){
    $('littleEPanel')?.classList.remove('hidden');
    $('littleEButton')?.setAttribute('aria-expanded','true');
    updateContextBar();
    setTimeout(()=>$('littleEInput')?.focus(),120);
    warmStatus();
  }

  function closePanel(){
    $('littleEPanel')?.classList.add('hidden');
    $('littleEButton')?.setAttribute('aria-expanded','false');
  }

  function warmStatus(){
    if('LanguageModel' in window){
      setStatus('本機 AI 可用 · 0 API 費用','good');
    }else if('Translator' in window){
      setStatus('本機翻譯可用 · 回答建議使用輔助模式','mid');
    }else{
      setStatus('基本輔助模式','mid');
    }
  }

  function littleESystemPrompt(){
    return [
      'You are 小E, Edan\'s personal Career English coach.',
      'Edan is an IBM Taiwan IT consultant working on a large core banking transformation project.',
      'His background includes software development, system analysis, consulting, banking and insurance IT, cross-team coordination, batch operations, testing and delivery.',
      'His goal is to speak natural, clear English for international tech interviews and work, especially PM, Professional Services, Solutions Architect and consulting roles.',
      'Always prioritize simple, speakable English over advanced vocabulary.',
      'For explanations, reply in Traditional Chinese. Put useful English examples on separate lines.',
      'For interview answers, use: direct answer first, then 2 key points, then stop. Avoid long memorized essays.',
      'When the user asks for a simpler version, use short sentences and common words.',
      'When translating, preserve meaning and give natural spoken English, not literal textbook English.',
      'Use only the supplied current-question context for question-specific facts. Do not invent job achievements or numbers.'
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
        const session=await LanguageModel.create({
          initialPrompts:[{role:'system',content:littleESystemPrompt()}],
          monitor(m){
            m.addEventListener('downloadprogress',e=>{
              const pct=Math.round((Number(e.loaded)||0)*100);
              setStatus(`本機 AI 模型下載中 ${pct}%`,'loading');
            });
          }
        });
        aiSession=session;
        setStatus('本機 AI · 資料留在裝置','good');
        return session;
      }catch(err){
        console.warn('Little E local AI unavailable',err);
        setStatus('本機 AI 暫不可用 · 已切換輔助模式','mid');
        return null;
      }finally{
        aiInitPromise=null;
      }
    })();

    return aiInitPromise;
  }

  function buildPrompt(userText){
    const ctx=context();
    const q=ctx.question;
    const fw=q?.framework;
    const parts=[
      'CURRENT USER REQUEST:',
      userText,
      '',
      'CURRENT LEARNING CONTEXT:'
    ];
    if(q){
      parts.push(
        `Question: ${q.text}`,
        `Type: ${q.type}; Skill: ${q.skill}; Level: L${q.level}`,
        q.intent?`Intent: ${q.intent}`:'',
        q.keywords?.length?`Keywords: ${q.keywords.join(', ')}`:'',
        q.model?`Reference answer: ${q.model}`:'',
        q.modelZh?`Reference answer zh-TW: ${q.modelZh}`:''
      );
      if(fw){
        parts.push(
          `Answer map: ${fw.title}`,
          `Memory rule: ${fw.mnemonic}`,
          ...fw.steps.map(x=>`${x[1]}: ${x[2]} | starter: ${x[3]}`)
        );
      }
    }else{
      parts.push('No active question.');
    }
    if(ctx.transcript)parts.push(`Edan's latest transcript: ${ctx.transcript}`);
    if(Number.isFinite(ctx.lastSystemScore))parts.push(`Latest score for this question: ${ctx.lastSystemScore}/100`);
    if(ctx.topWeakness)parts.push(`Current weak area: ${ctx.topWeakness}`);
    parts.push('', 'Keep the response concise and practical for speaking practice.');
    return parts.filter(Boolean).join('\n');
  }

  async function askLocalAI(text){
    const session=await ensureAI();
    if(!session)return null;
    try{
      setStatus('小E 思考中…','loading');
      const result=await session.prompt(buildPrompt(text));
      setStatus('本機 AI · 資料留在裝置','good');
      return String(result||'').trim();
    }catch(err){
      console.warn('Little E prompt failed',err);
      setStatus('本機 AI 回覆失敗 · 使用輔助模式','mid');
      return null;
    }
  }

  async function createTranslator(sourceLanguage,targetLanguage){
    if(!('Translator' in window))return null;
    const attempts=[
      {sourceLanguage,targetLanguage},
      {sourceLanguage:sourceLanguage.startsWith('zh')?'zh':sourceLanguage,targetLanguage:targetLanguage.startsWith('zh')?'zh':targetLanguage}
    ];
    for(const options of attempts){
      try{
        return await Translator.create({
          ...options,
          monitor(m){
            m.addEventListener('downloadprogress',e=>{
              const pct=Math.round((Number(e.loaded)||0)*100);
              setStatus(`本機翻譯模型下載中 ${pct}%`,'loading');
            });
          }
        });
      }catch(e){}
    }
    return null;
  }

  async function translateText(text){
    const hasHan=/[\u3400-\u9fff]/.test(text);
    const source=hasHan?'zh':'en';
    const target=hasHan?'en':'zh-Hant';
    const translator=await createTranslator(source,target);
    if(translator){
      try{
        setStatus('本機翻譯中…','loading');
        const out=await translator.translate(text);
        if(typeof translator.destroy==='function')translator.destroy();
        warmStatus();
        return String(out||'').trim();
      }catch(e){}
    }

    const ai=await askLocalAI(hasHan
      ? `請把以下中文翻成自然、簡單、適合口說的英文，只給英文與一個更自然版本：\n${text}`
      : `請把以下英文翻成繁體中文，並補一句這句英文在口語中的意思：\n${text}`);
    return ai;
  }

  function fallbackAnswer(action){
    const ctx=context();
    const q=ctx.question;
    if(!q)return '目前沒有進行中的題目。你可以直接貼一段英文或中文，我可以先幫你處理翻譯；進入題目後，我也會自動帶入題目內容。';

    if(action==='answer'){
      const fw=q.framework;
      if(fw){
        const steps=fw.steps.map(x=>`${x[0]}. ${x[1]}：${x[2]}\n   起手式：${x[3]}`).join('\n');
        return `這題先不要背完整答案。照這個順序聯想：\n\n${fw.mnemonic}\n\n${steps}\n\n參考答案：\n${q.model}`;
      }
      return `先直接回答，再補 2 個重點。\n\n參考答案：\n${q.model}`;
    }

    if(action==='simple'){
      const sentences=String(q.model||'').split(/(?<=[.!?])\s+/).filter(Boolean);
      const simple=sentences.slice(0,Math.min(2,sentences.length)).join(' ');
      return `先用短版練：\n\n${simple||q.model}\n\n先求順，再慢慢補完整。`;
    }

    if(action==='keywords'){
      const keys=(q.keywords||[]).slice(0,5);
      return keys.length
        ? `這題先記這幾個 cue words：\n\n${keys.map((k,i)=>`${i+1}. ${k}`).join('\n')}\n\n只看這些字，試著自己重組答案。`
        : '這題目前沒有設定 Keywords。可以先用 Answer Map 的四格順序聯想。';
    }

    if(action==='model-zh'){
      return q.modelZh
        ? `Model answer 的意思：\n\n${q.modelZh}`
        : '這題目前沒有預先整理好的繁體中文翻譯。';
    }

    return `目前題目是：\n${q.text}\n\n你可以問我：「這題怎麼回答？」、「幫我簡化」、「這句什麼意思？」或直接貼一段文字要我翻譯。`;
  }

  async function runAction(action){
    if(busy)return;
    busy=true;
    try{
      updateContextBar();
      if(action==='translate-question'){
        const q=context().question;
        if(!q){addMessage('assistant','目前沒有進行中的題目。');return;}
        addMessage('user','翻譯目前題目');
        const translated=await translateText(q.text);
        addMessage('assistant',translated || (q.intent?`這題的意思／意圖是：${q.intent}`:'目前無法自動翻譯這題。'));
        return;
      }
      if(action==='model-zh'){
        addMessage('user','翻譯 Model answer');
        addMessage('assistant',fallbackAnswer('model-zh'));
        return;
      }
      if(action==='keywords'){
        addMessage('user','這題要記哪些關鍵字？');
        addMessage('assistant',fallbackAnswer('keywords'));
        return;
      }

      const prompts={
        answer:'依據我目前這題，建議我怎麼回答？請用我講得出來的簡單英文，先給聯想架構，再給 20–40 秒版本。',
        simple:'把目前這題的建議回答改成更簡單、更好說、更容易記的版本。不要用難字。',
        explain:'解釋目前這題在問什麼，以及面試官真正想聽什麼。用繁體中文說明，再給英文起手式。'
      };
      const user=prompts[action]||'請幫我處理目前這題。';
      addMessage('user',user);
      const ai=await askLocalAI(user);
      addMessage('assistant',ai || fallbackAnswer(action==='explain'?'answer':action));
    }finally{
      busy=false;
    }
  }

  async function handleUserText(raw){
    const text=String(raw||'').trim();
    if(!text||busy)return;
    addMessage('user',text);
    busy=true;
    try{
      const lower=text.toLowerCase();
      const translateIntent=/^(翻譯|translate|這句什麼意思|這句英文)/i.test(text);
      if(translateIntent){
        const stripped=text.replace(/^(翻譯|translate|這句什麼意思|這句英文)[:：]?\s*/i,'').trim();
        const target=stripped || context().question?.text || '';
        if(target){
          const result=await translateText(target);
          addMessage('assistant',result || '目前無法啟用本機翻譯。你可以改用上方「翻譯目前題目」，或稍後再試。');
          return;
        }
      }

      const ai=await askLocalAI(text);
      if(ai){
        addMessage('assistant',ai);
      }else{
        addMessage('assistant',fallbackAnswer('help'));
      }
    }finally{
      busy=false;
    }
  }

  function bind(){
    messages=(bridge()?.getHistory?.()||[]).filter(m=>m&&m.role&&m.text).slice(-30);
    renderMessages();
    updateContextBar();
    warmStatus();

    $('littleEButton')?.addEventListener('click',()=>{
      const panel=$('littleEPanel');
      if(panel?.classList.contains('hidden'))openPanel(); else closePanel();
    });
    $('littleEClose')?.addEventListener('click',closePanel);
    $('littleEClear')?.addEventListener('click',()=>{
      messages=[];
      bridge()?.clearHistory?.();
      renderMessages();
    });
    document.querySelectorAll('[data-little-e-action]').forEach(btn=>btn.addEventListener('click',()=>runAction(btn.dataset.littleEAction)));
    $('littleEForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const input=$('littleEInput');
      const text=input?.value||'';
      if(input)input.value='';
      handleUserText(text);
    });
    $('littleEMessages')?.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-little-e-speak]');
      if(!btn)return;
      const msg=messages[Number(btn.dataset.littleESpeak)];
      if(!msg)return;
      const englishLines=String(msg.text).split('\n').filter(line=>/[A-Za-z]{3}/.test(line) && !/[\u3400-\u9fff]/.test(line));
      const spoken=englishLines.join(' ').trim();
      if(spoken)bridge()?.speakEnglish?.(spoken,.92);
    });

    window.addEventListener('edan:cloud-state',()=>{
      const cloudHistory=bridge()?.getHistory?.()||[];
      if(cloudHistory.length>=messages.length){
        messages=cloudHistory.slice(-30);
        renderMessages();
      }
      updateContextBar();
    });

    const challenge=$('challengeSection');
    if(challenge && 'MutationObserver' in window){
      new MutationObserver(()=>updateContextBar()).observe(challenge,{subtree:true,childList:true,attributes:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
