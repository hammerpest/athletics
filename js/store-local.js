/* ===== Storage layer (swappable). Local test store now; Supabase at Aths Opt 1.1 with the same calls. =====
   Store API: mode, onDoc(path,cb), onCol(col,cb), get(path), set(path,data), update(path,data), del(path),
   nextRace(dev) -> number, presence(obj), onPeers(cb), pending() */
const DEV=(()=>{let d=null;try{d=sessionStorage.getItem("aths_dev")}catch(e){}if(!d){const a=new Uint32Array(2);try{crypto.getRandomValues(a)}catch(e){a[0]=Date.now();a[1]=performance.now()*1000}d="d"+a[0].toString(36)+a[1].toString(36);try{sessionStorage.setItem("aths_dev",d)}catch(e){}}return d})();
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))])}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* photos waiting to send are kept in IndexedDB, not in the queue: a slip photo is about 180 KB, and
   localStorage fills after 15 to 25 of them */
const IDB=(()=>{let dbp=null;
  const open=()=>dbp||(dbp=new Promise((ok,no)=>{try{const r=indexedDB.open("aths_queue",1);r.onupgradeneeded=()=>r.result.createObjectStore("photos");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}));
  const tx=(mode,fn)=>open().then(db=>new Promise((ok,no)=>{const t=db.transaction("photos",mode);const r=fn(t.objectStore("photos"));t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>no(t.error)}));
  return {put:(k,v)=>tx("readwrite",st=>st.put(v,k)),get:k=>tx("readonly",st=>st.get(k)),del:k=>tx("readwrite",st=>st.delete(k))};
})();

/* --- offline queue shared by both stores ---
   canFlush: the queue waits until this device has a job again (after a flat phone or a closed tab the
   page signs in as a new device, and the server would refuse the writes), so a queued slip is never
   dropped for that */
function makeQueue(write,onChange,canFlush){
  let q=lsGet("aths_queue",[]);let busy=false;
  const save=()=>{lsSet("aths_queue",q);onChange&&onChange(q.length)};
  async function load(w){
    if(!(w.data&&w.data.idb))return w;
    let img=null;try{img=await IDB.get(w.data.idb)}catch(e){}
    return img?Object.assign({},w,{data:{img,at:w.data.at}}):null;
  }
  async function hold(w){
    if(!(w.op==="set"&&w.data&&typeof w.data.img==="string"&&w.data.img.length>2000))return w;
    const k=w.path+"@"+Date.now();
    try{await IDB.put(k,w.data.img);return Object.assign({},w,{data:{idb:k,at:w.data.at}})}catch(e){return w}
  }
  async function flush(){
    if(busy||!q.length||(canFlush&&!canFlush()))return;busy=true;
    while(q.length){
      const w=q[0];const full=await load(w);
      try{if(full)await withTimeout(write(full),8000);q.shift();save();if(w.data&&w.data.idb)IDB.del(w.data.idb).catch(()=>{})}
      catch(e){if(e&&e.code==="invalid_argument"){q.shift();save();continue}break}
    }
    busy=false;
  }
  setInterval(flush,8000);
  if(typeof window!=="undefined")window.addEventListener("online",flush);
  return {
    async run(w){
      if(q.length){q.push(await hold(w));save();flush();return {queued:true}}
      try{await withTimeout(write(w),8000);return {ok:true}}
      catch(e){if(e&&e.code==="invalid_argument")throw e;q.push(await hold(w));save();return {queued:true}}
    },
    size:()=>q.length,count:pre=>q.filter(w=>String(w.path).startsWith(pre)).length,flush
  };
}

/* --- Local store: this device only (tabs on one device stay in step). Used for preview and testing. --- */
function localStore(onQueue){
  const PFX="aths_db:";
  const ch=("BroadcastChannel" in window)?new BroadcastChannel("aths_db"):null;
  const docSubs=new Map(),colSubs=new Map();
  const readAll=()=>{const out={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX))out[k.slice(PFX.length)]=JSON.parse(localStorage.getItem(k))}}catch(e){}return out};
  const mem=readAll();
  const fire=(path)=>{
    (docSubs.get(path)||[]).forEach(cb=>cb(mem[path]||null));
    const col=path.split("/").slice(0,-1).join("/");
    (colSubs.get(col)||[]).forEach(cb=>cb(colDocs(col)));
  };
  const colDocs=col=>Object.keys(mem).filter(p=>p.startsWith(col+"/")&&p.split("/").length===col.split("/").length+1).sort().map(p=>Object.assign({_id:p.split("/").pop()},mem[p]));
  const put=(path,data)=>{if(data==null)delete mem[path];else mem[path]=data;try{if(data==null)localStorage.removeItem(PFX+path);else localStorage.setItem(PFX+path,JSON.stringify(data))}catch(e){}fire(path);if(ch)ch.postMessage({path,data})};
  if(ch)ch.onmessage=e=>{const {path,data,pres,hello,bye}=e.data||{};
    if(hello){const me=peers.get(DEV);if(me)ch.postMessage({pres:me});return}
    if(bye){peers.delete(bye);emitPeers();return}
    if(pres){peers.set(pres.dev,pres);emitPeers();return}if(data==null)delete mem[path];else mem[path]=data;fire(path)};
  const merge=(a,b)=>{const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=merge(o[k],b[k]);else o[k]=b[k]}return o};
  const peers=new Map();let peersCb=[];
  const emitPeers=()=>{const list=[...peers.values()];peersCb.forEach(cb=>cb(list))};
  let counterLock=Promise.resolve();
  let offline=false;
  const write=async w=>{
    if(offline)throw {code:"offline"};
    if(w.op==="set")put(w.path,w.data);else if(w.op==="update")put(w.path,merge(mem[w.path],w.data));else put(w.path,null);
  };
  const queue=makeQueue(write,onQueue,()=>!offline);
  /* test mode: ask other tabs who is here, and say goodbye on close */
  if(ch){setTimeout(()=>ch.postMessage({hello:true}),50);window.addEventListener("pagehide",()=>{try{ch.postMessage({bye:DEV})}catch(e){}})}
  return {
    mode:"local",
    onDoc(path,cb){(docSubs.get(path)||docSubs.set(path,[]).get(path)).push(cb);setTimeout(()=>cb(mem[path]||null));return()=>{}},
    onCol(col,cb){(colSubs.get(col)||colSubs.set(col,[]).get(col)).push(cb);setTimeout(()=>cb(colDocs(col)));return()=>{}},
    async get(path){return mem[path]||null},
    set(path,data){return queue.run({op:"set",path,data:JSON.parse(JSON.stringify(data))})},
    update(path,data){return queue.run({op:"update",path,data:JSON.parse(JSON.stringify(data))})},
    del(path){return queue.run({op:"del",path})},
    async nextRace(){
      if(offline)throw {code:"offline"};
      const run=async()=>{const d=mem["counter/race"]||{};const n=Number(d.next)||1;put("counter/race",{next:n+1,by:DEV,at:Date.now()});return n};
      const p=counterLock.then(run);counterLock=p.catch(()=>{});return p;
    },
    presence(obj){const pres=Object.assign({dev:DEV},peers.get(DEV)||{},obj);peers.set(DEV,pres);emitPeers();if(ch)ch.postMessage({pres})},
    onPeers(cb){peersCb.push(cb)},
    hasRoom:!!ch,
    pending:()=>queue.size(),flush:()=>queue.flush(),
    /* tests only: act as if the signal has gone, so the queue and "waiting to send" can be tried */
    setOffline(v){offline=!!v;if(onQueue)onQueue();if(!v)queue.flush()}
  };
}
