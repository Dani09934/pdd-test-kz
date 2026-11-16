/* PDD Test — негізгі логика.
 * Экрандар: #home, #topics, #topic-N, #exam, #marathon, #mistakes, #bank, #saved, #stats, #settings
 * Прогресс браузердің localStorage-ында сақталады (кілт: pddtest.v1).
 */
(function(){
var D=window.PDD, Q=D.questions, T=D.topics, L='ABCDEFGH';
var byId={}; Q.forEach(function(q){byId[q.id]=q});
// ---- storage (per browser, safe) ----
var KEY='pddtest.v1', st={};
try{st=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){st={}}
st.ans=st.ans||{}; st.mis=st.mis||{}; st.exams=st.exams||[]; st.fav=st.fav||{};
st.set=Object.assign({delay:1300,vibrate:true,shuffleOpts:false,examN:D.exam.n,sound:false,font:1,goal:20},st.set||{});
st.days=st.days||{};
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function streak(){var n=0,d=new Date();for(;;){var k=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);if(st.days[k]){n++;d.setDate(d.getDate()-1)}else{if(n===0&&k===today()){d.setDate(d.getDate()-1);continue}break}}return n}
function applyFont(){document.documentElement.style.fontSize=(st.set.font*100)+'%'}applyFont();
var AC=null;function beep(ok){if(!st.set.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.frequency.value=ok?880:220;o.type=ok?'sine':'square';g.gain.setValueAtTime(.12,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+(ok?.18:.35));o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+(ok?.2:.4))}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function buzz(ok){beep(ok);try{if(st.set.vibrate&&navigator.vibrate)navigator.vibrate(ok?25:[60,40,60])}catch(e){}}
function isFav(id){return !!st.fav[id]}
function toggleFav(id){if(st.fav[id])delete st.fav[id];else st.fav[id]=Date.now();save()}
function record(id,ok){var t=today();st.days[t]=(st.days[t]||0)+1;var a=st.ans[id]||{c:0,w:0,last:null};if(ok)a.c++;else a.w++;a.last=ok;st.ans[id]=a;
  if(!ok)st.mis[id]=2;else if(st.mis[id]){st.mis[id]--;if(st.mis[id]<=0)delete st.mis[id]}save()}
try{var th=localStorage.getItem('pddtest.theme');if(th===null&&window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light';if(th==='light')document.documentElement.dataset.theme='light'}catch(e){}
document.getElementById('theme').onclick=document.getElementById('theme2').onclick=function(){var d=document.documentElement;d.dataset.theme=d.dataset.theme==='light'?'':'light';try{localStorage.setItem('pddtest.theme',d.dataset.theme)}catch(e){}};
var V=document.getElementById('view');
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function topicStats(ti){var qs=Q.filter(function(q){return q.topic===ti}),done=0,ok=0;qs.forEach(function(q){var a=st.ans[q.id];if(a){done++;if(a.last)ok++}});return{n:qs.length,done:done,ok:ok}}
function nav(r){document.querySelectorAll('[data-r]').forEach(function(a){if(a.dataset.r===r)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}

// ---- quiz engine ----
var timerId=null;
function runQuiz(title,ids,mode,back){ // mode: 'train' instant feedback | 'exam'
  clearInterval(timerId);
  if(!ids.length){V.innerHTML='<div class="card">Сұрақ жоқ.</div>';return}
  var cur=0,res={},sel={},start=Date.now(),limit=mode==='exam'?Math.round(D.exam.minutes*60*ids.length/D.exam.n):0,ord={};
  function order(q){if(!ord[q.id]){var o=q.opts.map(function(_,i){return i});ord[q.id]=st.set.shuffleOpts?shuffle(o):o}return ord[q.id]}
  function draw(){
    var q=byId[ids[cur]],done=res[q.id]!==undefined;
    var h='<div class="top"><a class="backbtn" href="'+back+'" aria-label="Шығу"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></a><h2 style="margin:0;flex:1">'+esc(title)+'</h2>'+'<button class="star'+(isFav(q.id)?' on':'')+'" id="fav" aria-label="Таңдаулыға қосу" title="Таңдаулыға қосу">'+(isFav(q.id)?'★':'☆')+'</button>'+(mode==='exam'?'<span class="cnt">'+(cur+1)+' / '+ids.length+'</span>':'<span class="cnt">'+(cur+1)+' / '+ids.length+'</span>')+'</div>';
    h+='<div class="qnav">'+ids.map(function(id,i){var c=i===cur?'cur ':'';if(res[id]!==undefined)c+=mode==='exam'?'ans':(res[id]?'ok':'no');return'<button class="'+c+'" data-i="'+i+'">'+(i+1)+'</button>'}).join('')+'</div>';
    var isrc=q.img&&((window.PDDIMG&&window.PDDIMG[q.img.split('/').pop()])||q.img);if(q.vid){var vs=(window.PDDVID&&window.PDDVID[q.img.split('/').pop()])||q.img;h+='<video class="scene" src="'+vs+'" autoplay loop muted playsinline preload="auto" title="Басып, қайта ойнату"></video><div class="mediabar"><button class="mb" id="replay">↺ Қайта ойнату</button><button class="mb" id="slow">0.5× баяу</button><a class="mb dlgif" href="'+vs+'" download="pdd-'+q.id+'.mp4">⬇ GIF жүктеу</a></div>';}else if(isrc)h+='<img class="scene" src="'+isrc+'" alt="Сұрақтың суреті" loading="lazy">';
    h+='<div class="qtext">'+(q.q?esc(q.q):'<span style="color:var(--soft)">(Сұрақ мәтіні скриншотта көрінбеген — суретке қараңыз)</span>')+'</div>';
    var correct=q.opts.findIndex(function(o){return o.ok});
    order(q).forEach(function(i,pos){var o=q.opts[i],c='';
      if(done&&mode==='train'){if(i===correct)c='ok';else if(i===sel[q.id])c='no'}
      else if(done&&mode==='exam'&&i===sel[q.id])c='sel';
      h+='<button class="opt '+c+'" data-o="'+i+'"'+(done&&mode==='train'?' disabled':'')+'><b>'+L[pos]+'.</b>'+esc(o.t)+'</button>'});
    if(q.hidden)h+='<div class="note">Бастапқы скриншотта кейбір жауап нұсқалары толық көрінбеген, сондықтан мұнда нұсқа аз болуы мүмкін.</div>';
    h+='<div class="swipehint">← келесі сұрақ: солға сырғытыңыз</div>';
    V.innerHTML='<div class="qwrap '+(anim||'')+'">'+h+'</div>';anim='';
    V.querySelectorAll('.qnav button').forEach(function(b){b.onclick=function(){cur=+b.dataset.i;draw()}});
    V.querySelectorAll('.opt').forEach(function(b){b.onclick=function(){var i=+b.dataset.o;
      if(mode==='train'){if(done)return;sel[q.id]=i;res[q.id]=q.opts[i].ok;record(q.id,res[q.id]);buzz(res[q.id]);draw();afterAnswer()}
      else{var first=res[q.id]===undefined;sel[q.id]=i;res[q.id]=q.opts[i].ok;if(first&&st.set.vibrate)try{navigator.vibrate&&navigator.vibrate(15)}catch(e){}draw();if(first)afterAnswer()}}});
    var fb=document.getElementById('fav');if(fb)fb.onclick=function(){toggleFav(q.id);draw()};
    var vd=V.querySelector('video.scene');if(vd){vd.onclick=function(){vd.currentTime=0;vd.play()};
      document.getElementById('replay').onclick=function(){vd.playbackRate=1;vd.currentTime=0;vd.play()};
      document.getElementById('slow').onclick=function(){vd.playbackRate=vd.playbackRate===1?0.5:1;this.textContent=vd.playbackRate===1?'0.5× баяу':'1× қалыпты';vd.play()}}
    var cq=V.querySelector('.qnav .cur');if(cq)cq.scrollIntoView({block:'nearest',inline:'center'});
    tick();
  }
  var anim='',autoT=null,finished=false;
  function go(d){var n=cur+d;if(n<0||n>=ids.length)return;anim=d>0?'in-r':'in-l';cur=n;draw()}
  function allDone(){return ids.every(function(id){return res[id]!==undefined})}
  function afterAnswer(){clearTimeout(autoT);if(allDone())autoT=setTimeout(function(){if(!finished)finish()},700)}
  var sx=null,sy=null;
  V.ontouchstart=function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY};
  V.ontouchend=function(e){if(sx===null)return;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){clearTimeout(autoT);go(dx<0?1:-1)}};
  document.onkeydown=function(e){if(!V.querySelector('.qwrap'))return;if(/^[1-8]$/.test(e.key)){var ob=V.querySelectorAll('.opt')[+e.key-1];if(ob&&!ob.disabled)ob.click();return}if(e.key==='ArrowRight'){clearTimeout(autoT);go(1)}else if(e.key==='ArrowLeft'){clearTimeout(autoT);go(-1)}};
  function tick(){}
  
  function finish(){if(finished)return;finished=true;clearInterval(timerId);clearTimeout(autoT);V.ontouchstart=V.ontouchend=null;
    if(mode==='exam')ids.forEach(function(id){record(id,!!res[id])});
    var ok=ids.filter(function(id){return res[id]}).length;
    if(mode==='exam'){st.exams.push({d:Date.now(),ok:ok,n:ids.length,pass:pass,t:Math.round((Date.now()-start)/1000)});save()}
    var need=Math.ceil(ids.length*D.exam.pass/D.exam.n),pass=mode==='exam'?ok>=need:null;
    var wrong=ids.filter(function(id){return!res[id]});
    V.innerHTML='<div class="card result"><b>'+ok+' / '+ids.length+'</b>'+(pass===null?'':'<p style="font-weight:600;color:'+(pass?'var(--ok)':'var(--no)')+'">'+(pass?'Өтті':'Өтпеді')+' (шек: '+need+')</p>')+
      '<div class="row" style="justify-content:center;margin-top:14px">'+(wrong.length?'<button class="btn gold" id="rw">Қателерді қайта шешу ('+wrong.length+')</button>':'')+'<button class="btn ghost" id="shr">↗ Бөлісу</button><a class="btn ghost" href="'+back+'">Артқа</a></div></div>'+
      '<h2>Жауаптарды талдау</h2>'+ids.map(function(id,k){var q=byId[id],c=q.opts.findIndex(function(o){return o.ok}),s=sel[id];
        return'<div class="card review '+(res[id]?'r-ok':'r-no')+'"><div class="row" style="justify-content:space-between"><b>'+(k+1)+'. '+(res[id]?'✓':'✗')+'</b><button class="star'+(isFav(id)?' on':'')+'" data-fv="'+id+'">'+(isFav(id)?'★':'☆')+'</button></div><div>'+esc(q.q)+'</div>'+
        (s!==undefined&&s!==c?'<div class="ans no">Сіздің жауабыңыз: '+esc(q.opts[s].t)+'</div>':s===undefined?'<div class="ans no">Жауап берілмеді</div>':'')+
        '<div class="ans ok">Дұрыс жауап: '+esc(q.opts[c].t)+'</div></div>'}).join('');
    V.querySelectorAll('[data-fv]').forEach(function(b){b.onclick=function(){var id=+b.dataset.fv;toggleFav(id);b.classList.toggle('on');b.textContent=isFav(id)?'★':'☆'}});
    document.getElementById('shr').onclick=function(){var t='PDD Test: '+title+' — '+ok+'/'+ids.length+(pass===null?'':(pass?' ✅ өтті':' ❌ өтпеді'));
      if(navigator.share)navigator.share({title:'PDD Test',text:t,url:location.href.split('#')[0]}).catch(function(){});
      else{try{navigator.clipboard.writeText(t+' '+location.href.split('#')[0]);alert('Нәтиже көшірілді')}catch(e){alert(t)}}};
    var rw=document.getElementById('rw');if(rw)rw.onclick=function(){runQuiz('Қателермен жұмыс',wrong,'train',back)};
  }
  draw();
}
// ---- pages ----
var R={};
R.home=function(){
  var done=Object.keys(st.ans).length,okc=Object.keys(st.ans).filter(function(k){return st.ans[k].last}).length;
  var pct=Math.round(okc*100/Q.length), ex=st.exams, nEx=ex.length;
  var avg=nEx?Math.round(ex.reduce(function(a,e){return a+e.ok},0)/nEx):0;
  var avgT=nEx?Math.round(ex.reduce(function(a,e){return a+(e.t||0)},0)/nEx/60):0;
  var mis=Object.keys(st.mis).length, exMode=home.exMode;
  var ready=nEx?Math.round(ex.slice(-5).filter(function(e){return (e.pass!==undefined?e.pass:e.ok>=Math.ceil(e.n*D.exam.pass/D.exam.n))}).length*100/Math.min(5,nEx)):null;
  var h='<section class="tl"><span class="pct">'+pct+'<small>%</small></span><h1>ПДД тесттері</h1><p class="sub">Теория емтиханына дайындалыңыз: жаттығу, емтихан, қателермен жұмыс</p>'+
   '<div class="modes"><span class="pill">'+(exMode?st.set.examN+' сұрақ':'Жаттығу')+'</span><button class="tog" id="tog" aria-pressed="'+(exMode?'true':'false')+'"><i></i>Емтихан</button></div>'+
   '<div class="cards"><div class="dc"><h3>Тапсырылған емтихан</h3><div class="big">'+nEx+'</div></div>'+
   '<div class="dc"><h3>Орташа балл</h3><div class="ring"><b>'+avg+'</b>/ '+D.exam.n+'</div></div>';
  if(exMode) h+='<div class="dc wide"><h3>Емтиханға орташа уақыт</h3><div class="big or">'+avgT+'<sup>мин</sup></div></div>'+
   '<div class="dc wide"><h3>Емтиханға дайындығыңыз</h3><div class="big or">'+(ready===null?'?':ready)+'%</div><div class="hint">'+(ready===null?'Дайындықты көру үшін кемінде бір емтихан тапсырыңыз':'Соңғы '+Math.min(5,nEx)+' емтиханның ішінде өткені (шегі '+D.exam.pass+' / '+D.exam.n+')')+'</div></div>';
  h+='<div class="dc wide"><h3>Қате жауаптар</h3><div class="big or">'+mis+'<sup>қате</sup></div><div class="hint">'+(mis?'Қателерді қайталаңыз — сұрақ қатарынан 2 дұрыс жауаптан кейін тізімнен шығады':'Тест шешіп, емтиханды тапсыру мүмкіндігіңізді арттырыңыз')+'</div>'+(mis?'<a class="cta" style="background:var(--surface-2)" href="#mistakes">Работа над ошибками</a>':'')+'</div></div>';
  var td=st.days[today()]||0,gp=Math.min(100,Math.round(td*100/st.set.goal)),sk=streak();
  h+='<div class="dc wide goal"><h3>Бүгінгі мақсат</h3><div class="row" style="justify-content:space-between;align-items:baseline"><div class="big">'+td+'<sup>/ '+st.set.goal+' сұрақ</sup></div><div class="fire" title="Қатарынан күн">🔥 '+sk+' күн</div></div><span class="bar"><i style="width:'+gp+'%"></i></span>'+(gp>=100?'<div class="hint">Бүгінгі мақсат орындалды! 🎉</div>':'')+'</div>';
  h+=exMode?'<button class="cta" id="goex">Емтиханды бастау</button>':'<button class="cta" id="gotr">Тестті бастау · 20 сұрақ</button><button class="cta alt" id="quick">⚡ Жылдам 10 сұрақ</button>';
  if(!window.__standalone)h+='<button class="inst" id="inst"><img src="img/icon-180.png" alt=""><span>Телефонға қосымша етіп орнату<small>'+(window.__bip?'Бір басу арқылы орнатылады':'Браузер мәзірі → «Басты экранға қосу» / «Установить приложение»')+'</small></span></button>';
  h+='</section>';
  var ts=T.map(function(t,i){var s2=topicStats(i);return{i:i,t:t,s:s2}});
  var tp=Math.round(ts.reduce(function(a,x){return a+x.s.done},0)*100/Q.length);
  h+='<section class="tl"><span class="pct">'+tp+'<small>%</small></span><h1>Тақырыптар</h1><p class="sub">'+T.length+' тақырып, '+Q.length+' сұрақ</p><div class="lst">'+
   ts.slice(0,5).map(function(x){return'<a href="#topic-'+x.i+'"><span class="dot'+(x.s.done===x.s.n?' on':'')+'"></span><span>'+esc(x.t)+'<small>'+x.s.done+' / '+x.s.n+' шешілді</small></span></a>'}).join('')+
   '<a href="#topics"><span class="dot"></span><span>Барлық тақырыптар →</span></a></div></section>';
  h+='<section class="tl"><span class="pct">'+done+'</span><h1>Сұрақтар қоры</h1><p class="sub">Барлық сұрақ пен жауап бойынша іздеу</p><a class="cta" style="background:var(--surface)" href="#bank">Қорды ашу</a></section>';
  V.innerHTML=h;
  document.getElementById('tog').onclick=function(){home.exMode=!home.exMode;R.home()};
  var a=document.getElementById('gotr');if(a)a.onclick=function(){runQuiz('Тест · 20 сұрақ',shuffle(Q.map(function(q){return q.id})).slice(0,20),'train','#home')};
  var qk=document.getElementById('quick');if(qk)qk.onclick=function(){runQuiz('Жылдам 10',shuffle(Q.map(function(q){return q.id})).slice(0,10),'train','#home')};
  var b=document.getElementById('goex');if(b)b.onclick=function(){runQuiz('Емтихан',shuffle(Q.map(function(q){return q.id})).slice(0,st.set.examN),'exam','#home')};
};
var home={exMode:false};
R.topics=function(){
  V.innerHTML='<h1>Тақырыптар</h1><p class="lead">Тақырыпты таңдаңыз — жауап бергеннен кейін бірден дұрысы көрсетіледі.</p>'+
   '<div class="row" style="gap:10px;margin-bottom:16px"><a class="btn" href="#marathon">🏁 Марафон — барлық '+Q.length+' сұрақ</a><a class="btn ghost" href="#saved">★ Таңдаулылар ('+Object.keys(st.fav).length+')</a></div><div class="grid">'+T.map(function(t,i){var s=topicStats(i);return'<a class="topic" href="#topic-'+i+'"><span class="n">'+s.n+' сұрақ · '+s.done+' шешілді</span><b>'+esc(t)+'</b><span class="bar"><i style="width:'+(s.n?s.ok*100/s.n:0)+'%"></i></span></a>'}).join('')+'</div>';
};
R.marathon=function(){runQuiz('Марафон',shuffle(Q.map(function(q){return q.id})),'train','#topics')};
R.saved=function(){
  var ids=Object.keys(st.fav).map(Number).filter(function(id){return byId[id]}).sort(function(x,y){return st.fav[y]-st.fav[x]});
  V.innerHTML='<h1>Таңдаулылар</h1><p class="lead">Сұрақтың жоғарғы жағындағы ☆ белгісін басып, қиын сұрақтарды осында сақтаңыз.</p>'+
   (ids.length?'<button class="btn" id="go">Таңдаулыларды шешу ('+ids.length+')</button><div style="margin-top:16px">'+ids.map(function(id){var q=byId[id],c=q.opts.find(function(o){return o.ok});return'<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between"><span style="font-size:.75rem;color:var(--soft)">№'+id+'</span><button class="star on" data-un="'+id+'">★</button></div><div>'+esc(q.q)+'</div><div style="margin-top:6px;color:var(--ok)">✓ '+esc(c.t)+'</div></div>'}).join('')+'</div>':'<div class="card">Әзірге бос.</div>');
  var g=document.getElementById('go');if(g)g.onclick=function(){runQuiz('Таңдаулылар',ids,'train','#saved')};
  V.querySelectorAll('[data-un]').forEach(function(b){b.onclick=function(){toggleFav(+b.dataset.un);R.saved()}});
};
R.topic=function(i){i=+i;if(!T[i]){location.replace('#topics');return}var ids=Q.filter(function(q){return q.topic===i}).map(function(q){return q.id});runQuiz(T[i],ids,'train','#topics')};
R.exam=function(){
  V.innerHTML='<h1>Емтихан</h1><p class="lead">Барлық тақырыптардан '+st.set.examN+' кездейсоқ сұрақ, уақыт шектеусіз. Жауаптар соңында көрсетіледі. Өту шегі: '+D.exam.pass+' дұрыс жауап.</p><button class="btn gold" id="go">Бастау</button>'+
  (st.exams.length?'<h2 style="margin-top:26px">Соңғы нәтижелер</h2><div class="card">'+st.exams.slice(-10).reverse().map(function(e){return'<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0"><span>'+new Date(e.d).toLocaleString()+'</span><b style="color:'+((e.pass!==undefined?e.pass:e.ok>=Math.ceil(e.n*D.exam.pass/D.exam.n))?'var(--ok)':'var(--no)')+'">'+e.ok+'/'+e.n+'</b></div>'}).join('')+'</div>':'');
  document.getElementById('go').onclick=function(){runQuiz('Емтихан',shuffle(Q.map(function(q){return q.id})).slice(0,st.set.examN),'exam','#exam')};
};
R.mistakes=function(){
  var ids=Object.keys(st.mis).map(Number).filter(function(id){return byId[id]});
  V.innerHTML='<h1>Қателер</h1><p class="lead">Қате жауап берген сұрақтар осында жиналады. Сұрақ қатарынан 2 рет дұрыс шешілгенде тізімнен шығады.</p>'+(ids.length?'<button class="btn gold" id="go">Қателерді шешу ('+ids.length+')</button>':'<div class="card">Әзірге қате жоқ.</div>');
  var g=document.getElementById('go');if(g)g.onclick=function(){runQuiz('Қателермен жұмыс',shuffle(ids),'train','#mistakes')};
};
R.bank=function(){
  V.innerHTML='<h1>Сұрақтар қоры</h1><input type="search" id="s" placeholder="Сұрақ немесе жауап бойынша іздеу…"><div id="list"></div>';
  var s=document.getElementById('s'),list=document.getElementById('list');
  function draw(){var t=s.value.trim().toLowerCase();var r=Q.filter(function(q){return!t||(q.q+' '+q.opts.map(function(o){return o.t}).join(' ')).toLowerCase().indexOf(t)>=0}).slice(0,60);
    list.innerHTML=r.map(function(q){var c=q.opts.find(function(o){return o.ok});return'<div class="card" style="margin-bottom:10px"><div class="n" style="font-size:.75rem;color:var(--soft)">№'+q.id+' · '+esc(T[q.topic])+'</div><b>'+esc(q.q||'(сурет бойынша)')+'</b><div style="color:var(--ok);margin-top:4px">✓ '+esc(c?c.t:'')+'</div></div>'}).join('')+(r.length===60?'<p class="lead">Алғашқы 60 нәтиже көрсетілді.</p>':'')}
  s.oninput=draw;draw();
};
R.stats=function(){
  var tot=Object.keys(st.ans).length,okc=Object.keys(st.ans).filter(function(k){return st.ans[k].last}).length,ex=st.exams;
  var best=ex.length?Math.max.apply(null,ex.map(function(e){return e.ok})):0,passed=ex.filter(function(e){return (e.pass!==undefined?e.pass:e.ok>=Math.ceil(e.n*D.exam.pass/D.exam.n))}).length;
  var last=ex.slice(-12);
  V.innerHTML='<h1>Статистика</h1><div class="cards" style="margin-bottom:16px">'+
   '<div class="dc"><h3>Шешілген сұрақ</h3><div class="big">'+tot+'<sup>/ '+Q.length+'</sup></div></div>'+
   '<div class="dc"><h3>Дұрыс жауап</h3><div class="big">'+(tot?Math.round(okc*100/tot):0)+'<sup>%</sup></div></div>'+
   '<div class="dc"><h3>Емтихан</h3><div class="big">'+passed+'<sup>/ '+ex.length+' өтті</sup></div></div>'+
   '<div class="dc"><h3>Ең жақсы нәтиже</h3><div class="big">'+best+'<sup>/ '+D.exam.n+'</sup></div></div></div>'+
   (last.length?'<h2>Соңғы емтихандар</h2><div class="card chart">'+last.map(function(e){var p=Math.round(e.ok*100/e.n);return'<div class="col" title="'+new Date(e.d).toLocaleDateString()+': '+e.ok+'/'+e.n+'"><i style="height:'+p+'%;background:'+((e.pass!==undefined?e.pass:e.ok>=Math.ceil(e.n*D.exam.pass/D.exam.n))?'var(--ok)':'var(--no)')+'"></i><small>'+e.ok+'</small></div>'}).join('')+'</div>':'')+
   '<h2>Тақырыптар бойынша</h2><div class="card">'+T.map(function(t,i){var s=topicStats(i);return'<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="srow"><span>'+esc(t)+'</span><b>'+s.ok+'/'+s.n+'</b></div><span class="bar"><i style="width:'+(s.n?s.ok*100/s.n:0)+'%"></i></span></div>'}).join('')+'</div>'+
   '<a class="btn ghost" href="#settings" style="margin-top:16px">⚙ Баптаулар</a>';
};
R.settings=function(){
  var S=st.set;
  function sw(id,on,label,sub){return'<label class="setrow"><span>'+label+'<small>'+sub+'</small></span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'></label>'}
  V.innerHTML='<h1>Баптаулар</h1><div class="card">'+
   sw('s_vib',S.vibrate,'Діріл','Жауап бергенде телефон дірілдейді')+
   sw('s_shuf',S.shuffleOpts,'Жауаптарды араластыру','Нұсқалардың реті әр жолы өзгереді')+
   '<label class="setrow"><span>Емтихандағы сұрақ саны<small>Ресми емтиханда — '+D.exam.n+'</small></span><select id="s_n"><option>10</option><option>20</option><option>40</option></select></label>'+
   sw('s_snd',S.sound,'Дыбыс','Дұрыс/қате жауапқа қысқа дыбыс')+
   '<label class="setrow"><span>Мәтін өлшемі<small>Сұрақ пен жауап әрпінің көлемі</small></span><select id="s_font"><option value="0.9">Кіші</option><option value="1">Қалыпты</option><option value="1.12">Үлкен</option><option value="1.25">Өте үлкен</option></select></label>'+
   '<label class="setrow"><span>Күнделікті мақсат<small>Күніне шешілетін сұрақ саны</small></span><select id="s_goal"><option>10</option><option>20</option><option>40</option><option>80</option></select></label>'+
   '<label class="setrow"><span>Тақырып<small>Жарық немесе қараңғы</small></span><button class="btn ghost" id="s_theme">Ауыстыру</button></label></div>'+
   '<h2>Прогресс</h2><div class="card"><p style="margin-top:0">Прогресс осы браузерде сақталады. Басқа телефонға көшіру үшін файлға сақтап, сол жерде жүктеңіз.</p><div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn" id="s_exp">⬇ Прогресті сақтау</button><label class="btn ghost" style="cursor:pointer">⬆ Прогресті жүктеу<input type="file" id="s_imp" accept=".json,application/json" hidden></label><button class="btn ghost" id="rst">Прогресті тазалау</button></div></div>'+
   '<h2>Қосымша</h2><div class="card"><button class="inst" id="inst" style="margin:0"><img src="img/icon-180.png" alt=""><span>Телефонға қосымша етіп орнату<small>Интернетсіз де ашылады</small></span></button><p style="color:var(--soft);font-size:.85rem;margin-bottom:0">PDD Test · '+Q.length+' сұрақ · нұсқа 2.2</p></div>';
  document.getElementById('s_n').value=String(S.examN);document.getElementById('s_font').value=String(S.font);document.getElementById('s_goal').value=String(S.goal);
  document.getElementById('s_snd').onchange=function(){S.sound=this.checked;save();beep(true)};
  document.getElementById('s_font').onchange=function(){S.font=+this.value;save();applyFont()};
  document.getElementById('s_goal').onchange=function(){S.goal=+this.value;save()};
  document.getElementById('s_vib').onchange=function(){S.vibrate=this.checked;save();buzz(true)};
  document.getElementById('s_shuf').onchange=function(){S.shuffleOpts=this.checked;save()};
  document.getElementById('s_n').onchange=function(){S.examN=+this.value;save()};
  document.getElementById('s_theme').onclick=function(){document.getElementById('theme').click()};
  document.getElementById('s_exp').onclick=function(){var b=new Blob([JSON.stringify(st,null,1)],{type:'application/json'}),u=URL.createObjectURL(b),x=document.createElement('a');x.href=u;x.download='pdd-test-progress-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(x);x.click();setTimeout(function(){URL.revokeObjectURL(u);x.remove()},500)};
  document.getElementById('s_imp').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!d||typeof d!=='object'||!d.ans)throw 0;st=d;st.days=st.days||{};st.fav=st.fav||{};st.mis=st.mis||{};st.exams=st.exams||[];st.set=Object.assign({delay:1300,vibrate:true,shuffleOpts:false,examN:D.exam.n,sound:false,font:1,goal:20},st.set||{});applyFont();save();alert('Прогресс жүктелді');R.settings()}catch(e){alert('Файл дұрыс емес')}};r.readAsText(f)};
  document.getElementById('rst').onclick=function(){if(confirm('Барлық прогресс өшіріледі. Жалғастырасыз ба?')){st={ans:{},mis:{},exams:[],fav:{},days:{},set:S};save();R.settings()}};
};
function route(){clearInterval(timerId);var h=location.hash.replace(/^#\/?/,'').split(/[-\/]/);var r=h[0]||'home';nav(r==='topic'||r==='marathon'?'topics':r);(R[r]||R.home)(h[1]);window.scrollTo(0,0)}
window.addEventListener('hashchange',route);
// a link to the current hash does not fire hashchange (e.g. "Шығу"/"Артқа" inside a quiz started from #mistakes, #exam, #home) — re-render explicitly
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(a&&a.getAttribute('href')===location.hash){e.preventDefault();route()}});
route();
})();