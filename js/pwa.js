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
  if('serviceWorker' in navigator && location.protocol==='https:'){
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  }
})();
