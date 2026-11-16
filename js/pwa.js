/* PDD Test — қосымша ретінде орнату (PWA) және офлайн жұмыс */
(function(){
  window.__standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});
  window.addEventListener('appinstalled',function(){window.__bip=null;window.__standalone=true;});
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#inst');if(!b)return;
    if(window.__bip){window.__bip.prompt();window.__bip.userChoice.finally(function(){window.__bip=null});return;}
    var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    alert(ios?'iPhone / iPad: Safari-де «Поделиться» (□↑) → «На экран Домой» басыңыз.':'Android: Chrome мәзірі ⋮ → «Установить приложение» немесе «Добавить на главный экран».\nКомпьютер: мекенжай жолындағы ⊕ белгісі.');
  });
  // claude.ai ішінде файлды жүктеу тек downloads мүмкіндігі арқылы жұмыс істейді
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('.dlgif');if(!a||!(window.claude&&window.claude.use))return;e.preventDefault();
    window.claude.use('downloads').then(function(d){if(!d){location.href=a.href;return}
      return fetch(a.getAttribute('href')).then(function(r){return r.blob()}).then(function(b){return d.save({filename:a.getAttribute('download'),data:b})});
    }).catch(function(err){if(err&&err.code&&err.code!=='declined')alert('Жүктеу мүмкін болмады: '+err.code)});
  });
  if('serviceWorker' in navigator && location.protocol==='https:'){
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  }
})();
