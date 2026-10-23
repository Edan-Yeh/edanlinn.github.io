(() => {
  'use strict';

  const quotes=[
    {
      en:"Your time is limited, so don't waste it living someone else's life.",
      zh:"你的時間有限，不要浪費在活成別人的人生。",
      author:"Steve Jobs",
      source:"Stanford Commencement, 2005",
      sourceUrl:"https://news.stanford.edu/stories/2005/06/steve-jobs-2005-graduates-stay-hungry-stay-foolish",
      kind:"FAMOUS QUOTE"
    },
    {
      en:"By leaving the phone market, we opened our minds to invent a new one.",
      zh:"離開手機市場之後，我們反而打開思路，去創造一個全新的市場。",
      author:"Jensen Huang",
      source:"NVIDIA · NTU Commencement",
      sourceUrl:"https://blogs.nvidia.com/blog/huang-ntu-commencement/",
      kind:"FAMOUS QUOTE"
    },
    {
      en:"There are times when something is important enough that you do it in spite of fear.",
      zh:"有些事情重要到，即使你害怕，你還是會去做。",
      author:"Elon Musk",
      source:"Y Combinator interview",
      sourceUrl:"https://www.ycombinator.com/blog/elon-musk-on-how-to-build-the-future/",
      kind:"FAMOUS QUOTE"
    },
    {
      en:"The important thing is not to stop questioning. Curiosity has its own reason for existing.",
      zh:"重要的是不要停止提問。好奇心本身就有存在的理由。",
      author:"Albert Einstein",
      source:"American Institute of Physics",
      sourceUrl:"https://history.aip.org/exhibits/einstein/ae77.htm",
      kind:"FAMOUS QUOTE"
    },
    {
      en:"Now I am become Death, the destroyer of worlds.",
      zh:"如今我成了死神，世界的毀滅者。",
      author:"J. Robert Oppenheimer · quoting the Bhagavad Gita",
      source:"Oppenheimer recalling the Trinity test",
      sourceUrl:"https://www.atomicarchive.com/media/videos/oppenheimer.html",
      kind:"HISTORY"
    },
    {
      en:"Build what the future needs before the present fully understands it.",
      zh:"在現在還沒完全理解之前，先打造未來真正需要的東西。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"Progress begins where certainty ends.",
      zh:"真正的進步，往往從確定性結束的地方開始。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"When the path is unclear, improve the quality of the question.",
      zh:"當方向不清楚時，先提高你提出問題的品質。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"A difficult problem is often evidence that the next level is close.",
      zh:"一個很難的問題，往往代表下一個層級已經不遠了。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"The goal is not to avoid uncertainty, but to learn faster inside it.",
      zh:"目標不是避開不確定，而是在不確定之中學得更快。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"Make the difficult thing understandable. Then make it usable.",
      zh:"先把困難的事說懂，再把它做成真正能用的東西。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"Your advantage is how quickly you can learn when the rules change.",
      zh:"真正的優勢，是規則改變時你仍能多快學會。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"Do not chase complexity. Chase the truth that survives simplification.",
      zh:"不要追逐複雜；去找那個經得起簡化之後仍然成立的真相。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"A breakthrough can look like a mistake before it looks obvious.",
      zh:"一個突破在變得理所當然之前，可能先看起來像個錯誤。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    },
    {
      en:"Pressure reveals whether your system is strong enough to carry your ambition.",
      zh:"壓力會揭露：你的系統，是否真的足以承載你的野心。",
      author:"Daily Reflection",
      source:"Edan's English Coach",
      sourceUrl:"",
      kind:"DAILY THOUGHT"
    }
  ];

  function dateKey(d=new Date()){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function indexForDate(d=new Date()){
    const key=dateKey(d);
    let hash=2166136261;
    for(const ch of key){
      hash^=ch.charCodeAt(0);
      hash=Math.imul(hash,16777619);
    }
    return (hash>>>0)%quotes.length;
  }

  window.EDAN_DAILY_QUOTES=Object.freeze({
    quotes:Object.freeze(quotes.map(q=>Object.freeze({...q}))),
    dateKey,
    indexForDate,
    today(d=new Date()){return quotes[indexForDate(d)];}
  });
})();
