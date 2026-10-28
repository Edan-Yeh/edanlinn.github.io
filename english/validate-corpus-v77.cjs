/* v77 corpus quality gate. Run: node english/validate-corpus-v77.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname, sandbox={window:{EDAN_APP_VERSION:{release:'test',date:'test'}}};
for(const filename of ['question-bank.js','corpus-v71.js','corpus-v72.js','corpus-v73.js','corpus-v74.js','corpus-v75.js','corpus-v76.js','corpus-v77-vocabulary.js','corpus-v77-dialogues.js']){
  vm.runInNewContext(fs.readFileSync(path.join(root,filename),'utf8'),sandbox,{filename});
}
const c=sandbox.window.EDAN_ENGLISH_CONTENT;
assert.equal(c.vocabulary.length,873);assert.equal(c.questions.filter(q=>q.type==='listening_intent').length,345);
const words=new Set(),ids=new Set(),normalizedExamples=new Set();
for(const v of c.vocabulary){
  const key=String(v.word).trim().toLowerCase();
  assert.ok(key&&v.zh,'Incomplete vocabulary '+v.id);
  if(Number(String(v.id).slice(1))>=724)assert.ok(v.example&&v.exampleZh,'Incomplete v77 vocabulary '+v.id);
  assert.ok(!words.has(key),'Duplicate word '+key);words.add(key);
  assert.ok(!ids.has(v.id),'Duplicate ID '+v.id);ids.add(v.id);
}
const newDialogs=c.questions.filter(q=>q.source==='v77 Curated Dialogues');
assert.equal(newDialogs.length,19);
for(const q of c.questions){
  assert.ok(!ids.has(q.id),'Duplicate ID '+q.id);ids.add(q.id);
  if(q.source==='v77 Curated Dialogues'){
    assert.ok(q.format==='conversation'&&q.turns.length===4&&q.turns.every(t=>t.speaker&&t.en&&t.zh));
    assert.ok(q.comprehensionQuestion&&q.comprehensionQuestionZh&&q.textZh&&q.modelZh);
    assert.ok(q.answer>=0&&q.answer<q.options.length);
    assert.equal(new Set(q.options.map(x=>x.toLowerCase())).size,q.options.length,'Duplicate answer options '+q.id);
    assert.ok(q.options.every(x=>String(x).length>8));
    assert.ok(!normalizedExamples.has(q.text),'Duplicated dialogue '+q.id);
    normalizedExamples.add(q.text);
  }
}
console.log('PASS v77 corpus: 873 distinct words, 345 listening intents, 19 bilingual dialogues, stable unique IDs');
