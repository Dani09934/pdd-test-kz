/* PDD Test — офлайн кэш. Файлдар өзгерсе, VERSION-ды көтеріңіз. */
var VERSION='pddtest-v2.1';
var FILES=[
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./css/style.css",
 "./js/app.js",
 "./js/pwa.js",
 "./data/questions.js",
 "./img/icon-180.png",
 "./img/icon-192.png",
 "./img/icon-512.png",
 "./media/gif/bq01.mp4",
 "./media/gif/bq02.mp4",
 "./media/gif/bq03.mp4",
 "./media/gif/bq04.mp4",
 "./media/gif/bq05.mp4",
 "./media/gif/bq06.mp4",
 "./media/gif/bq07.mp4",
 "./media/gif/bq08.mp4",
 "./media/gif/bq09.mp4",
 "./media/gif/bq10.mp4",
 "./media/gif/bq11.mp4",
 "./media/gif/bq12.mp4",
 "./media/gif/bq13.mp4",
 "./media/gif/bq14.mp4",
 "./media/gif/bq15.mp4",
 "./media/gif/bq16.mp4",
 "./media/gif/bq17.mp4",
 "./media/gif/bq18.mp4",
 "./media/gif/bq19.mp4",
 "./media/gif/bq20.mp4",
 "./media/gif/bq21.mp4",
 "./media/gif/bq22.mp4",
 "./media/gif/bq23.mp4",
 "./media/gif/bq24.mp4",
 "./media/gif/bq25.mp4",
 "./media/gif/bq26.mp4",
 "./media/gif/bq27.mp4",
 "./media/gif/bq28.mp4",
 "./media/gif/bq29.mp4",
 "./media/gif/bq30.mp4",
 "./media/gif/bq31.mp4",
 "./media/gif/bq32.mp4",
 "./media/gif/bq33.mp4",
 "./media/gif/bq34.mp4",
 "./media/gif/bq35.mp4",
 "./media/gif/bq36.mp4",
 "./media/gif/bq37.mp4",
 "./media/gif/bq38.mp4",
 "./media/gif/bq39.mp4",
 "./media/gif/bq40.mp4"
];
self.addEventListener('install',function(e){e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==VERSION}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);if(url.origin!==location.origin)return;
  // Видео Range сұрауларын кэштен толық жауаппен береміз
  e.respondWith(caches.match(e.request,{ignoreSearch:true,ignoreVary:true}).then(function(r){
    return r||fetch(e.request).then(function(resp){if(resp.ok&&resp.status===200){var cp=resp.clone();caches.open(VERSION).then(function(c){c.put(e.request,cp)})}return resp}).catch(function(){return caches.match('./index.html')});
  }));
});
