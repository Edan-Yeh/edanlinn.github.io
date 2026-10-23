#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=__dirname;
const version=require(path.join(root,'english/version.js'));
const core=require(path.join(root,'english/little-e-core.js'));

assert.equal(version.release,'2026.10.24-v50');
assert.equal(version.cache,'edan-english-coach-20261024-v50');

const hello=core.directReply('你好',[]);
assert.ok(hello);assert.match(hello.zh,/你好/);assert.doesNotMatch(hello.en,/24|book|Edan|dais/i);
assert.equal(core.classifyIntent('幫我翻譯：我晚點回覆你'),'translation');
assert.equal(core.classifyIntent('這個網站怎麼用？'),'site_help');
assert.equal(core.classifyIntent('你生日幾號？'),'persona');
assert.match(core.directReply('你生日幾號？',[]).en,/April 6, 2026/);
assert.match(core.directReply('你最喜歡誰？',[]).en,/Edan/);
assert.match(core.directReply('你平常喜歡做什麼？',[]).en,/reading/i);

const daisy=core.directReply('你喜歡雛菊嗎？',[]);
const why=core.directReply('為什麼？',[{role:'assistant',en:daisy.en,zh:daisy.zh,...daisy.meta}]);
assert.equal(daisy.meta.personaTopic,'daisies');assert.ok(why);assert.equal(why.meta.personaTopic,'daisies');assert.match(why.zh,/雛菊/);
assert.match(core.fallbackReply('我今天很累',[]).zh,/累|疲/);
assert.equal(core.emotionKind('我今天真的很累'),'tired');
assert.equal(core.emotionKind('這件事超煩'),'frustrated');
assert.equal(core.emotionKind('明天面試我有點緊張'),'nervous');
assert.equal(core.reactionFor('我今天真的很累','chat'),'sit');
assert.equal(core.reactionFor('這句文法對嗎','grammar'),'reading');

const hiA=core.directReply('你好',[]);
const hiB=core.directReply('你好',[{role:'assistant',variantKey:'social:hello'}]);
assert.notEqual(hiA.en,hiB.en);

const soReply=core.directReply('所以呢？',[{role:'assistant',en:'ok',zh:'好'}]);
assert.ok(soReply);assert.match(soReply.zh,/繼續|跟上/);

const youReply=core.directReply('那你呢？',[{role:'user',text:'我今天很累'}]);
assert.ok(youReply);assert.match(youReply.zh,/我還好|睡/);

const frustrated=core.fallbackReply('這件事真的很煩',[]);
assert.equal(frustrated.meta.emotion,'frustrated');
assert.match(frustrated.zh,/煩|不爽|發生/);

const happy=core.fallbackReply('我今天超開心',[]);
assert.equal(happy.meta.petReaction,'happy');

assert.equal(core.isCurrentQuestionAnswerRequest('這題怎麼回答'),true);
assert.equal(core.isCurrentQuestionAnswerRequest('這個問題要怎麼答？'),true);
assert.equal(core.isCurrentQuestionAnswerRequest('how should I answer this?'),true);
const chooseTemplate=core.reusableAnswerTemplate({text:'Why should we choose you over a candidate with more traditional project management experience?'});
assert.match(chooseTemplate.en,/My advantage is/);
assert.match(chooseTemplate.zh,/我的優勢是/);
assert.match(chooseTemplate.zh,/較傳統的候選人/);

const html=fs.readFileSync(path.join(root,'english/challenge.html'),'utf8');
const qb=fs.readFileSync(path.join(root,'english/question-bank.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'english/sw.js'),'utf8');
const le=fs.readFileSync(path.join(root,'english/little-e.js'),'utf8');
const app=fs.readFileSync(path.join(root,'english/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'english/styles.css'),'utf8');
const north=fs.readFileSync(path.join(root,'english/north-american-tts.js'),'utf8');
const northWorker=fs.readFileSync(path.join(root,'english/north-american-tts-worker.js'),'utf8');
const indian=fs.readFileSync(path.join(root,'english/indian-tts.js'),'utf8');
const indianWorker=fs.readFileSync(path.join(root,'english/indian-tts-worker.js'),'utf8');
const phonemizer=fs.readFileSync(path.join(root,'english/piper-phonemize.js'),'utf8');
const auth=fs.readFileSync(path.join(root,'english/auth.js'),'utf8');

assert.ok(html.includes('<script src="version.js"></script>'));
assert.ok(html.includes('<script src="little-e-core.js"></script>'));
assert.ok(html.includes('<script src="north-american-tts.js"></script>'));
assert.ok(html.includes('<script src="indian-tts.js"></script>'));
assert.ok(html.indexOf('version.js')<html.indexOf('question-bank.js'));
assert.ok(html.indexOf('north-american-tts.js')<html.indexOf('app.js'));
assert.ok(html.indexOf('indian-tts.js')<html.indexOf('app.js'));
assert.doesNotMatch(html,/20261018v\d+/);
assert.doesNotMatch(html,/Azure Indian English|Prabhat/);
assert.match(html,/Local AI[^<]*Piper Lessac US English[^<]*Piper SPICOR Indian English/);
assert.match(qb,/contentVersion:\s*window\.EDAN_APP_VERSION\.release/);
assert.match(sw,/importScripts\('\.\/version\.js'\)/);
assert.match(sw,/EDAN_APP_VERSION\.cache/);
assert.match(sw,/\.\/indian-tts\.js/);
assert.match(sw,/url\.origin!==self\.location\.origin/);
assert.match(le,/normalizePetAsset/);
assert.match(le,/CORE\.directReply/);
assert.match(le,/function currentQuestionAnswerPayload\(/);
assert.match(le,/const readyZh=String\(q\.modelZh\|\|''\)/);
assert.match(le,/可套用模板：/);
assert.match(le,/function repairLegacyBilingualMessages\(/);
assert.match(le,/repairedInV47=true/);
assert.match(le,/targetLanguage:'zh-Hant'/);
assert.match(le,/targetLanguage:'zh-TW'/);
assert.doesNotMatch(le,/targetIsTraditional[\s\S]{0,500}targetLanguage:'zh'/);
assert.match(le,/CORE\.isCurrentQuestionAnswerRequest\(text\)/);
assert.match(le,/LATEST USER ANSWER \/ RESULT:/);
assert.match(le,/Corrected version:/);
assert.match(le,/NEVER reply with only an answer framework or mnemonic/);
assert.match(le,/Common example:/);
assert.match(le,/Reusable template:/);
assert.match(le,/const IDLE_EXPRESSIONS=/);
assert.match(le,/function schedulePetExpression\(/);
assert.match(le,/pose:'blink'/);
assert.match(le,/pose:'happy'/);
assert.match(le,/pose:'thinking'/);
assert.doesNotMatch(le,/IDLE_EXPRESSIONS=[\s\S]{0,600}pose:'(?:eat|sit|sleep)'/);
assert.match(le,/panelOpen\(\)/);
assert.match(le,/petExpressionActive/);
assert.doesNotMatch(css,/transform:scale\([23]\./);
assert.ok(html.includes('appUpdateBanner'));
assert.ok(html.includes('class="web-jump-nav"'));
assert.ok(html.includes('href="#vocabularySection"'));
assert.ok(html.includes('href="#chunksSection"'));
assert.ok(html.includes('id="chunksSection"'));
assert.ok(html.includes('data-little-e-action="example"'));
assert.ok(html.includes('id="streakSub"'));
assert.ok(html.includes('id="voiceModelStatus"'));
assert.match(app,/function repairRecentStreakGap\(/);
assert.match(app,/reason:'two_day_grace'/);
assert.match(app,/function questionSemanticFamily\(/);
assert.match(app,/function semanticExposurePenalty\(/);
assert.match(app,/latestAnswer:session\?\.currentMeta\?\.latestAnswer/);
assert.match(app,/function recentExposurePenalty\(/);
assert.match(app,/function diversifyCandidatePool\(/);
assert.match(app,/function withinSessionVarietyPenalty\(/);
assert.match(app,/const normal=\[\.08,\.18,\.38,\.62,\.82,\.94\]/);
assert.match(app,/let w=\{wrong:8,guessed:5\.5,new:6,correct:1\.05\}/);
assert.match(app,/const anchorCount=Math\.min\(2/);
assert.match(app,/sort\(\(a,b\)=>questionSessionDistance\(b\.id\)-questionSessionDistance\(a\.id\)\)/);
assert.match(app,/下一輪會優先換新題/);
assert.match(app,/const MODEL_CUE_ZH=Object\.freeze/);
assert.match(app,/"English at work": "工作中使用英文"/);
assert.match(app,/"technical documents": "技術文件"/);
assert.match(app,/"international vendors": "國際供應商"/);
assert.match(app,/data-cue-zh=/);
assert.match(app,/class="model-cue-zh"/);
assert.match(css,/\.model-cue-zh/);
assert.match(app,/function indianVoiceIdentity\(/);
assert.match(app,/async function speakNorthAmerican\(/);
assert.match(app,/async function speakIndian\(/);
assert.match(app,/window\.EDAN_NORTH_AMERICA_TTS/);
assert.match(app,/northAmericanPlaybackStatus/);
assert.match(app,/window\.EDAN_INDIAN_TTS/);
assert.match(app,/function indianProgressText\(/);
assert.match(app,/Local AI/);
assert.match(app,/speakNorthAmerican\(c\.example/);
assert.match(app,/speakNorthAmerican\(`\$\{v\.word\}\. \$\{v\.example\}`/);
assert.match(app,/speakNorthAmerican\(q\.text/);
assert.match(app,/speakNorthAmerican\(q\.model/);
assert.doesNotMatch(app,/functions\/v1\/indian-tts|INDIAN_CLOUD_VOICE|Azure · Prabhat|edan-indian-tts-v1/);
assert.match(app,/requested==='en-in'/);
assert.match(app,/indianCandidates=voices\.filter\(indianVoiceIdentity\)/);
assert.match(app,/原生 en-IN voice 未安裝/);
assert.match(app,/strictIndian:true/);
assert.match(app,/resolved\.unavailable/);
assert.match(auth,/function mergeLearningState\(/);
assert.match(auth,/function fetchRecentCompletedSessionDates\(/);
assert.match(auth,/maxAgeDays:2/);
assert.match(auth,/mergeSessions\(/);
assert.match(north,/function warmup\(/);
assert.match(north,/getStatus/);
assert.match(northWorker,/data\.type==='warmup'/);
assert.match(indian,/function warmup\(/);
assert.match(indian,/getStatus/);
assert.match(indianWorker,/data\.type==='warmup'/);
assert.match(north,/en_US-lessac-medium/);
assert.match(north,/north-american-tts-worker\.js/);
assert.match(northWorker,/env\.wasm\.numThreads=1/);
assert.match(northWorker,/en_US-lessac-medium\.onnx/);
assert.match(northWorker,/MODEL_CACHE='edan-north-american-piper-model-v1'/);
assert.match(indian,/en_IN-spicor-medium/);
assert.match(indian,/indian-tts-worker\.js/);
assert.match(indian,/new Worker\(/);
assert.match(indian,/cachedModel/);
assert.doesNotMatch(indian,/@the-vedantic-coder\/piper-tts-web|\+esm|AZURE|apiKey|credit card/i);
assert.match(indianWorker,/env\.wasm\.numThreads=1/);
assert.match(indianWorker,/en_IN-dataset=spicor-english-base=ljspeech-epochs=1089\.onnx/);
assert.match(indianWorker,/InferenceSession\.create/);
assert.match(indianWorker,/MODEL_CACHE='edan-indian-piper-model-v2'/);
assert.match(indianWorker,/piper-phonemize\.js/);
assert.match(phonemizer,/self\.createPiperPhonemize=createPiperPhonemize/);

const qbSandbox={window:{EDAN_APP_VERSION:{release:version.release}}};
vm.runInNewContext(qb,qbSandbox,{filename:'question-bank.js'});
const content=qbSandbox.window.EDAN_ENGLISH_CONTENT;
assert.ok(content&&Array.isArray(content.questions)&&content.questions.length>0);
for(const q of content.questions){
  if(q.model){
    const zh=String(q.modelZh||content.answerTranslations?.[q.id]||'').trim();
    assert.ok(zh,'Missing Traditional Chinese model answer for '+q.id);
    assert.match(zh,/[\u3400-\u9fff]/,'Model answer is not Chinese for '+q.id);
  }
}
const cueMatch=app.match(/const MODEL_CUE_ZH=Object\.freeze\((\{[\s\S]*?\})\);/);
assert.ok(cueMatch,'MODEL_CUE_ZH map missing');
const cueMap=JSON.parse(cueMatch[1]);
for(const q of content.questions){
  for(const kw of (q.keywords||[]))assert.ok(String(cueMap[kw]||'').trim(),'Missing cue zh-TW for '+q.id+' / '+kw);
}

console.log('PASS: v50 two-day streak rescue, safe cloud merge/recovery, semantic anti-repeat, cached TTS warmup, Little E answer context, bilingual QA and prior regressions.');
