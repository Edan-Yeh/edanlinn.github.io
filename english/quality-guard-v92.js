/* English Coach v92 QA guard: preserve original IDs and learning history. */
(function(){
'use strict';
const C=window.EDAN_ENGLISH_CONTENT;
if(!C||!Array.isArray(C.vocabulary)||!Array.isArray(C.questions))return;
const norm=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const seenWords=new Set(),seenVIds=new Set(),seenQIds=new Set(),seenQText=new Set();
const issues={duplicateWords:0,duplicateVocabularyIds:0,duplicateQuestionIds:0,exactDuplicateListening:0,malformedQuestions:0};
C.vocabulary=C.vocabulary.filter(v=>{
 if(!v||!v.id||!v.word||!String(v.zh||'').trim())return true; // avoid altering legacy formats
 const id=String(v.id),word=norm(v.word);
 if(seenVIds.has(id)){issues.duplicateVocabularyIds++;return false;}
 seenVIds.add(id);
 if(seenWords.has(word)){issues.duplicateWords++;return false;}
 seenWords.add(word);return true;
});
C.questions=C.questions.filter(q=>{
 if(!q||!q.id)return true;
 const id=String(q.id);
 if(seenQIds.has(id)){issues.duplicateQuestionIds++;return false;}
 seenQIds.add(id);
 if(q.skill!=='listening')return true;
 // Do not remove legacy questions simply because they use different schemas.
 if(!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3){issues.malformedQuestions++;return false;}
 const spoken=norm(q.text||q.turns?.map(t=>t.en).join(' '));
 const asked=norm(q.comprehensionQuestion||q.intent);
 if(spoken&&asked){
   const key=spoken+'|'+asked;
   if(seenQText.has(key)){issues.exactDuplicateListening++;return false;}
   seenQText.add(key);
 }
 return true;
});
const listening=C.questions.filter(q=>q.skill==='listening');
const stemCounts=new Map();
for(const q of listening){const stem=norm(q.comprehensionQuestion||q.intent);if(stem)stemCounts.set(stem,(stemCounts.get(stem)||0)+1);}
const repeated=[...stemCounts].sort((a,b)=>b[1]-a[1]).slice(0,10);
window.EDAN_QUALITY_AUDIT=Object.freeze({release:'v92-qa1',vocabulary:C.vocabulary.length,listening:listening.length,questionTotal:C.questions.length,issues,repeatedQuestionStems:repeated});
if(Object.values(issues).some(Boolean))console.warn('English Coach question-bank QA:',window.EDAN_QUALITY_AUDIT);
})();
