/* Sky Surveyor offline support: keeps the game page, map library, fonts and the saved satellite tiles on the device */
const V="v1",SHELL="ss-shell-"+V,TILES="ss-tiles-"+V;
self.addEventListener("install",e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(["./"]).catch(()=>{})).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim());});
function putIn(name,key,res){if(res&&(res.ok||res.type==="opaque")){const cl=res.clone();caches.open(name).then(c=>c.put(key,cl)).catch(()=>{});}return res;}
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;let u;try{u=new URL(r.url);}catch(_){return;}
  // satellite tiles: saved copy first (instant on bad network), otherwise download and keep
  if(u.hostname==="server.arcgisonline.com"&&u.pathname.includes("/tile/")){
    e.respondWith(caches.match(r.url,{ignoreVary:true}).then(hit=>hit||fetch(r).then(res=>putIn(TILES,r.url,res))));return;}
  // the game page: newest version when online, saved copy when the network is slow or down
  if(r.mode==="navigate"||u.origin===self.location.origin){
    e.respondWith(new Promise(done=>{let sent=false;const key=u.origin+u.pathname;
      const fromCache=()=>caches.match(key,{ignoreSearch:true,ignoreVary:true});
      const timer=setTimeout(()=>fromCache().then(h=>{if(h&&!sent){sent=true;done(h);}}),3500);
      fetch(r).then(res=>{putIn(SHELL,key,res);if(!sent){sent=true;clearTimeout(timer);done(res);}})
        .catch(()=>fromCache().then(h=>{if(!sent){sent=true;clearTimeout(timer);done(h||new Response("Offline",{status:503,headers:{"Content-Type":"text/plain"}}));}}));}));return;}
  // map library and fonts
  if(/(^|\.)cdnjs\.cloudflare\.com$|(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(r.url,{ignoreVary:true}).then(hit=>hit||fetch(r).then(res=>putIn(SHELL,r.url,res))));}
});
