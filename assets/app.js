/* Dom – wybór stylu wnętrz. Statyczna strona, bez build stepu. */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zl=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(Math.round(n))+' zł';
const rng=(a,b)=>{const f=new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0});return f.format(Math.round(a))+'–'+f.format(Math.round(b))+' zł';};
const pl=(n,a,b,c)=>n===1?a:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?b:c;
const zl2=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' zł';
const CAT_COL={'podłogi':'#C9A77C','płytki':'#D8C7AE','farby':'#E6DCCD','drzwi':'#8C6A43','łazienki':'#7D7A5B','oświetlenie':'#E3B65A','kuchnia':'#B9805E','meble':'#4E4A43','drzwi zewnętrzne / EI30':'#6B5137','tekstylia':'#D9B8A0','kominek':'#9B5F45','schody i balustrady':'#A8865F','wykończenie ścian':'#BFB5A3','Dodatki i dekoracje':'#8FA37E','materiały pomocnicze':'#A39E93','robocizna':'#5F7F8C'};
const isLab=i=>i.cat.startsWith('robocizna');
/* rozbicie sumy: produkty + materiały + robocizna (+ kuchnia) vs budżet */
const brk=d=>{const b=d.breakdown||{},m=b.materials||d.by_cat?.['materiały pomocnicze']||0,l=b.labour||d.by_cat?.['robocizna']||0;
  return {p:b.products??(d.total-m-l),m,l,lmin:b.labour_min,lmax:b.labour_max,t:d.total};};
const left=(B,t,kMin,kMax)=>{const a=B-t-kMax,b=B-t-kMin;
  if(a>=0)return `<b style="color:var(--ok)">zostaje ${rng(a,b)}</b>`;
  if(b<0)return `<b style="color:var(--bad)">brakuje ${rng(-b,-a)}</b>`;
  return `<b style="color:var(--warn)">od −${zl(-a)} do +${zl(b)}</b>`;};
const sumCard=(d,kMin,kMax,B)=>{const x=brk(d);
  return `<div class="sumcard" aria-label="Podsumowanie kosztów">
   <div class="sr"><span><i style="background:#4E4A43"></i>Produkty <small>wykończenie, wyposażenie, meble</small></span><b>${zl(x.p)}</b></div>
   <div class="sr"><span>+ <i style="background:${CAT_COL['materiały pomocnicze']}"></i>Materiały pomocnicze</span><b>${zl(x.m)}</b></div>
   <div class="sr"><span>+ <i style="background:${CAT_COL['robocizna']}"></i>Robocizna <small>średnie stawki rynkowe${x.lmin!=null?' · widełki '+rng(x.lmin,x.lmax):''}</small></span><b>${zl(x.l)}</b></div>
   <div class="sr"><span>+ <i style="background:#B9805E"></i>Kuchnia na wymiar <small>szacunek</small></span><b>${rng(kMin,kMax)}</b></div>
   <div class="sr tot"><span>= Razem</span><b>${rng(x.t+kMin,x.t+kMax)}</b></div>
   <div class="sr"><span>Budżet ${zl(B)} (z meblami)</span>${left(B,x.t,kMin,kMax)}</div>
  </div>`;};
const cache={};
const getJSON=(u,opt)=>(cache[u]??=fetch(u,opt).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}));
const S={styles:[],rooms:[],gaps:[],cmp:[]};

/* ---------- manifesty wizualizacji (tolerancyjny parser) ---------- */
const roomKey=v=>{const m=String(v??'').match(/(\d)\s*[\/\-_ .]?\s*(\d{2})/);return m?`${m[1]}-${m[2]}`:null;};
const FILE_KEYS=['file','src','path','img','image','url','plik','name','filename'];
const ROOM_KEYS=['room','room_id','roomId','pomieszczenie','id','pokoj','slug'];
const pick=(o,ks)=>{for(const k of ks)if(o&&o[k]!=null&&o[k]!=='')return o[k];return null;};
function imgPath(slug,f){f=String(f).trim();if(/^(https?:)?\/\//.test(f)||f.startsWith('img/'))return f;return `img/${slug}/${f.replace(/^\.?\//,'')}`;}
const rejected=o=>o&&typeof o==='object'&&(o.rejected||o.ok===false||o.hidden||/odrzu|reject/i.test(o.status||''));
function normManifest(m,slug){
  const rooms={};let cover=null;
  const add=(rk,e)=>{
    if(e==null||rejected(e))return;
    if(Array.isArray(e)){e.forEach(x=>add(rk,x));return;}
    if(typeof e==='object'&&!pick(e,FILE_KEYS)){const inner=e.files||e.images||e.imgs||e.warianty;if(inner){add(rk,inner);}return;}
    const f=typeof e==='string'?e:pick(e,FILE_KEYS);if(!f||!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(f))return;
    if(/_rej\b|_rej\./i.test(f))return;
    const k=rk||roomKey(typeof e==='object'&&pick(e,ROOM_KEYS))||roomKey(String(f).split('/').pop());
    if(!k)return;
    let cap=null;
    if(typeof e==='object'){const t=pick(e,['title_pl','title','tytul']),o=pick(e,['opis_pl','caption','opis','desc','description','alt','label','podpis','view','widok']),x=pick(e,['odstepstwa_pl','odstepstwa','deviations']);
      cap=[t,o].filter(Boolean).join(' – ')+(x?` (odstępstwa od rzutu: ${x})`:'')||null;}
    const note=typeof e==='object'?pick(e,['uwaga_pl','uwaga','note']):null;
    if(note)cap=`⚠ ${note}`+(cap?` · ${cap}`:'');
    (rooms[k]??=[]).push({src:imgPath(slug,f),cap,note,title:typeof e==='object'?pick(e,['title_pl','title']):null});
  };
  if(!m)return null;
  if(Array.isArray(m))add(null,m);
  else if(typeof m==='object'){
    cover=m.cover||m.okladka||null;
    const list=m.images||m.files||m.items||m.wizualizacje||m.renders;
    if(list)add(null,list);
    const rm=m.rooms||m.pomieszczenia;
    if(rm&&typeof rm==='object'&&!Array.isArray(rm))for(const[k,v]of Object.entries(rm))add(roomKey(k),v);
    else if(Array.isArray(rm))rm.forEach(r=>add(roomKey(pick(r,ROOM_KEYS)),r.files||r.images||r));
    if(!list&&!rm)for(const[k,v]of Object.entries(m)){const rk=roomKey(k);if(rk&&/^\s*\d\s*[\/\-_ .]?\s*\d{2}\s*$/.test(k))add(rk,v);}
  }
  for(const k in rooms){const seen=new Set();rooms[k]=rooms[k].filter(x=>!seen.has(x.src)&&seen.add(x.src));}
  if(cover)cover=typeof cover==='string'?imgPath(slug,cover):imgPath(slug,pick(cover,FILE_KEYS));
  return {rooms,cover};
}
const imgOk=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i.naturalWidth>0);i.onerror=()=>res(false);i.src=src;});
const manifests={};
function loadManifest(slug){
  return manifests[slug]??=fetch(`img/${slug}/manifest.json`,{cache:'no-cache'})
    .then(r=>r.ok?r.json():null).then(m=>normManifest(m,slug)).catch(()=>null);
}
/* bez manifestu: sprawdzamy konwencję nazw img/<styl>/<pokój>.jpg, _b, _c… */
const probes={};
function probeRoom(slug,rk){
  return probes[slug+rk]??=(async()=>{
    const out=[];
    for(const suf of ['','_b','_c','_d','_e']){
      const src=`img/${slug}/${rk}${suf}.jpg`;
      if(await imgOk(src))out.push({src,cap:null});else if(suf)break;else break;
    }
    return out;
  })();
}
async function styleCover(st){
  const m=await loadManifest(st.slug);
  if(m){if(m.cover)return m.cover;const f=(m.rooms['1-02']||Object.values(m.rooms)[0]||[])[0];if(f)return f.src;}
  for(const rk of ['1-02','2-02','1-03']){const src=`img/${st.slug}/${rk}.jpg`;if(await imgOk(src))return src;}
  return null;
}

/* ---------- lightbox ---------- */
const lb={list:[],i:0};
function openLB(list,i){lb.list=list;lb.i=i;showLB();$('#lb').hidden=false;document.body.style.overflow='hidden';}
function showLB(){const x=lb.list[lb.i];if(!x)return;$('#lb-img').src=x.src;$('#lb-img').alt=x.cap||'';$('#lb-cap').textContent=(x.cap||'')+(lb.list.length>1?`  (${lb.i+1}/${lb.list.length})`:'');}
function closeLB(){$('#lb').hidden=true;document.body.style.overflow='';$('#lb-img').removeAttribute('src');}
const step=d=>{if(lb.list.length<2)return;lb.i=(lb.i+d+lb.list.length)%lb.list.length;showLB();};
$('#lb').addEventListener('click',e=>{const a=e.target.dataset.lb;if(a==='close'||e.target.id==='lb'||e.target.tagName==='FIGURE')closeLB();else if(a==='prev')step(-1);else if(a==='next')step(1);});
document.addEventListener('keydown',e=>{if($('#lb').hidden)return;if(e.key==='Escape')closeLB();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);});
let tx=null;$('#lb').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
$('#lb').addEventListener('touchend',e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)step(dx<0?1:-1);tx=null;});

/* ---------- routing ---------- */
const cur=()=>localStorage.getItem('styl')||S.styles[0]?.slug;
function route(){
  const [,tab='',slug]=location.hash.split('/');
  if(slug&&S.styles.some(s=>s.slug===slug))localStorage.setItem('styl',slug);
  const t=tab||'style';
  document.querySelectorAll('#tabs a').forEach(a=>{a.classList.toggle('on',a.dataset.tab===t);
    if(['pokoje','zakupy'].includes(a.dataset.tab))a.href=`#/${a.dataset.tab}/${cur()}`;});
  const sb=$('#stylebar');sb.hidden=!['pokoje','zakupy'].includes(t);
  if(!sb.hidden)renderStylebar(t);
  document.documentElement.style.setProperty('--stick',($('.top').offsetHeight+(sb.hidden?0:sb.offsetHeight))+'px');
  window.scrollTo(0,0);
  ({style:viewStyles,pokoje:viewRooms,zakupy:viewShop,porownanie:viewCompare}[t]||viewStyles)();
}
function renderStylebar(t){
  const c=cur();
  $('#stylebar').innerHTML=S.styles.map(s=>`<a class="chip${s.slug===c?' on':''}" href="#/${t}/${s.slug}"><i style="background:${esc(Object.values(s.palette)[2]||'#ccc')}"></i>${esc(s.name)}</a>`).join('');
  const on=$('#stylebar .on');if(on)on.scrollIntoView({inline:'center',block:'nearest'});
}
const styleBy=slug=>S.styles.find(s=>s.slug===slug)||S.styles[0];
const cmpBy=slug=>S.cmp.find(c=>c.slug===slug);

/* ---------- widok: style ---------- */
function viewStyles(){
  app.innerHTML=`<h1>Wybierz styl wnętrz</h1>
  <p class="lead">6 kierunków dla tego samego domu (rzut parteru i poddasza bez zmian). Po wyborze zobaczysz każde pomieszczenie w danym stylu i listę zakupów z cenami.</p>
  <div class="grid s3">${S.styles.map(s=>{const c=cmpBy(s.slug);const pal=Object.entries(s.palette);
    return `<a class="card style-card" href="#/pokoje/${s.slug}">
    <div class="cover" data-cover="${s.slug}" style="background-image:linear-gradient(135deg,${pal.slice(0,4).map(p=>esc(p[1])).join(',')})"><span class="tag" data-cnt="${s.slug}">wizualizacje: …</span></div>
    <div class="b"><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
    <div class="sw" title="Paleta">${pal.map(([n,h])=>`<span style="background:${esc(h)}" title="${esc(n)} ${esc(h)}"></span>`).join('')}</div>
    <div class="meta"><span>Zakupy: <b>${zl(c?.total)}</b> + kuchnia</span><span class="btn">Zobacz</span></div></div></a>`;}).join('')}</div>
  <p class="capt" style="padding:12px 0">Wizualizacje nastrojowe (AI), proporcje wg rzutów, nie 1:1.</p>`;
  S.styles.forEach(async s=>{
    const [cv,m]=await Promise.all([styleCover(s),loadManifest(s.slug)]);
    const el=app.querySelector(`[data-cover="${s.slug}"]`);if(!el)return;
    if(cv)el.style.backgroundImage=`url("${cv}")`;
    const n=m?Object.values(m.rooms).reduce((a,b)=>a+b.length,0):null;
    const tag=app.querySelector(`[data-cnt="${s.slug}"]`);
    tag.textContent=n?`${n} ${pl(n,'wizualizacja','wizualizacje','wizualizacji')} · ${Object.keys(m.rooms).length} pom.`:cv?'wizualizacje: częściowo':'wizualizacje w przygotowaniu';
  });
}

/* ---------- widok: pokoje ---------- */
function roomCard(r){
  const rows=[['Wymiary',r.dims],['Wysokość',r.h],['Kształt',r.shape],r.slopes&&r.slopes!=='brak'&&r.slopes!=='brak (parter)'?['Skosy',r.slopes]:null].filter(x=>x&&x[1]);
  return `<article class="card room" id="r-${r.slug}">
   <div class="imgwrap" data-room="${r.slug}"><div class="ph"><b>W przygotowaniu</b><span>wizualizacja tego pomieszczenia jest jeszcze generowana</span></div></div>
   <div class="b"><div class="hd"><h3>${esc(r.name)}</h3><span class="area">${r.area!=null?esc(String(r.area).replace('.',','))+' m²':''}</span></div>
   <div class="id">${esc(r.id)} · ${esc(r.floor)}</div>
   <dl>${rows.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
   <div class="wal" data-wal="${r.slug}"></div>
   <details><summary>Rzut z góry, okna i drzwi</summary>
    ${r.plan?`<img class="plan" loading="lazy" src="${esc(r.plan)}" alt="Rzut pomieszczenia ${esc(r.id)}" data-plan="${esc(r.plan)}" data-cap="${esc(r.id+' '+r.name+' – rzut')}">`:''}
    ${r.windows.length?`<p><b>Okna:</b> ${r.windows.map(esc).join('; ')}</p>`:''}
    ${r.doors.length?`<p><b>Drzwi:</b> ${r.doors.map(esc).join('; ')}</p>`:''}
   </details></div></article>`;
}
/* ---------- autowalidacja: plakietka + „Materiały w tym widoku” (dane: data/walidacja-<styl>.json) ---------- */
const fname=src=>String(src).split('/').pop().split('?')[0];
const OC={ok:'zgodny',partial:'częściowo',generic:'ogólnikowy',mismatch:'niezgodny',luka_csv:'brak w CSV',nieczytelne:'nieczytelny'};
const wTag=b=>{const m=String(b).match(/^\[([^\]]+)\]\s*(.*)$/);if(!m)return ['',b];let t=m[1],x=m[2];if(t==='auto'){t='kontrola';x=x.replace(/^znak_wodny:.*/,'brak znaku wodnego „wizualizacja nastrojowa (AI)”').replace(/^[a-z_]+:\s*/,'');}return [t,x];};
function wBadge(v){if(!v)return '';const st=String(v.status||'');if(st==='zgodne')return '<span class="wbadge ok">✓ zgodne</span>';if(st.startsWith('niezweryfikowane'))return '<span class="wbadge neu" title="obraz nie był jeszcze sprawdzony przez testera">do weryfikacji</span>';return '<span class="wbadge bad">✕ do poprawy</span>';}
function wPrice(p){const c=p.cena!=null?zl2(p.cena):(p.cena_txt||'cena niezweryfikowana');const q=p.ilosc!=null?` × ${String(p.ilosc).replace('.',',')} ${esc(p.jednostka||'')}`:'';const su=p.suma!=null?` = <b>${zl2(p.suma)}</b>`:(p.suma_txt?` = <b>${esc(p.suma_txt)} zł</b>`:'');return `${esc(c)}${q}${su}`;}
function wBlock(v,i,n){
  if(!v)return '';
  const ok=v.status==='zgodne';
  const fails=v.bledy.map(b=>{const [t,x]=wTag(b);return `<li>${t?`<span class="wk">${esc(t)}</span> `:''}${esc(x)}</li>`;}).join('');
  const mats=v.materialy.map(m=>`<li class="o-${esc(m.ocena)}"><div class="wn"><span>${esc(m.nazwa)}</span><i>${esc(OC[m.ocena]||m.ocena)}</i></div>
    ${m.produkty.map(p=>`<div class="wp">${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.produkt)}</a>`:esc(p.produkt)}<small>${esc(p.sklep)} · ${wPrice(p)}</small></div>`).join('')}
    ${m.uwagi&&m.ocena!=='ok'?`<div class="wu">Na wizualizacji: ${esc(m.uwagi)}</div>`:''}</li>`).join('');
  return `<details class="walv ${ok?'ok':'bad'}"><summary>${wBadge(v)} ${n>1?`Ujęcie ${i+1}: `:''}Materiały w tym widoku <small>(${v.materialy.length})</small></summary>
   ${fails?`<div class="wfail"><b>Do poprawy:</b><ul>${fails}</ul></div>`:''}
   <ul class="wmat">${mats}</ul>
   ${v.luki.length?`<p class="wluki"><b>Widoczne, ale brak w liście zakupów:</b> ${v.luki.map(esc).join(', ')}</p>`:''}
   ${v.liczba_uwag?`<p class="wluki">${v.liczba_uwag} ${pl(v.liczba_uwag,'drobna uwaga','drobne uwagi','drobnych uwag')} – szczegóły w walidacja/raport.md</p>`:''}</details>`;
}
function fillImgs(wrap,list,r,W){
  if(!list.length)return;
  const L=list.map((x,i)=>({src:x.src,note:x.note,cap:x.cap&&x.title?x.cap:`${r.id} ${r.name}`+(x.cap?` – ${x.cap}`:'')}));
  const wv=L.map(x=>W?.widoki?.[fname(x.src)]);
  const n=L.length;
  wrap.innerHTML=`<div class="imgs">${L.map((x,i)=>`<button data-i="${i}" aria-label="Powiększ ujęcie ${i+1}"><img loading="${i?'lazy':'eager'}" decoding="async" src="${esc(x.src)}" alt="${esc(x.cap)}">${wBadge(wv[i])}${n>1?`<span class="vcnt">${i+1}/${n}</span>`:''}</button>`).join('')}</div>${n>1?`<div class="thumbs" role="tablist">${L.map((x,i)=>`<button type="button" role="tab" data-t="${i}" class="${i?'':'on'}" aria-label="Ujęcie ${i+1}"><img loading="lazy" decoding="async" src="${esc(x.src)}" alt=""></button>`).join('')}</div><div class="capt vcap">${n} ${pl(n,'ujęcie','ujęcia','ujęć')} z różnych stron – przesuń palcem lub dotknij miniatury</div>`:''}`;
  const sc=wrap.querySelector('.imgs');
  wrap.querySelectorAll('.imgs button').forEach(b=>b.onclick=()=>{const ok=L.filter(x=>!x.bad);openLB(ok,Math.max(0,ok.indexOf(L[+b.dataset.i])));});
  if(n>1){
    const th=[...wrap.querySelectorAll('.thumbs button')];
    const mark=i=>th.forEach((t,j)=>t.classList.toggle('on',j===i));
    th.forEach(t=>t.onclick=()=>{const i=+t.dataset.t;sc.scrollTo({left:i*sc.clientWidth,behavior:'smooth'});mark(i);});
    let raf=0;sc.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mark(Math.round(sc.scrollLeft/Math.max(1,sc.clientWidth))));},{passive:true});
  }
  wrap.querySelectorAll('img').forEach((im,i)=>im.onerror=()=>{L[i].bad=true;im.parentElement.remove();wrap.querySelector(`.thumbs [data-t="${i}"]`)?.remove();
    if(!wrap.querySelector('img'))wrap.innerHTML='<div class="ph"><b>W przygotowaniu</b><span>plik wizualizacji jeszcze niedostępny</span></div>';});
  const box=wrap.closest('.room')?.querySelector('.wal');
  const notes=[...new Set(L.map(x=>x.note).filter(Boolean))].map(n=>`<p class="note vnote">⚠ ${esc(n)}</p>`).join('');
  if(box)box.innerHTML=notes+(W?wv.map((v,i)=>wBlock(v,i,L.length)).join(''):'');
}
async function viewRooms(){
  const st=styleBy(cur());
  const floors=[['parter','Parter'],['poddasze','Poddasze']];
  app.innerHTML=`<h1>${esc(st.name)}</h1><p class="lead">${esc(st.desc)}</p>
   <p class="note" style="border-left-color:var(--acc2)">Wizualizacje nastrojowe (AI), proporcje wg rzutów, nie 1:1. Wymiary i rzut każdego pomieszczenia – pod zdjęciem. Dotknij zdjęcia, aby powiększyć.</p>
   ${floors.map(([f,l])=>{const rs=S.rooms.filter(r=>r.floor===f);return `<h2 class="floorh">${l} <small>${rs.length} pomieszczeń · ${rs.reduce((a,r)=>a+(+r.area||0),0).toFixed(1).replace('.',',')} m²</small></h2><div class="grid s3">${rs.map(roomCard).join('')}</div>`;}).join('')}
   <p style="margin-top:24px"><a class="btn" href="#/zakupy/${st.slug}">Lista zakupów – ${esc(st.name)} →</a></p>`;
  app.querySelectorAll('img.plan').forEach(im=>im.onclick=()=>openLB([{src:im.dataset.plan,cap:im.dataset.cap}],0));
  spacerLinks(st.slug);
  const [m,W]=await Promise.all([loadManifest(st.slug),getJSON(`data/walidacja-${st.slug}.json`).catch(()=>null)]);
  if(cur()!==st.slug)return;
  for(const r of S.rooms){
    const wrap=app.querySelector(`[data-room="${r.slug}"]`);if(!wrap)continue;
    if(m&&m.rooms[r.slug]?.length)fillImgs(wrap,m.rooms[r.slug],r,W);
    else if(m)fillImgs(wrap,[],r,W); /* manifest jest, pokój bez wizualizacji – nie sondujemy plików (404) */
    else probeRoom(st.slug,r.slug).then(l=>{if(cur()===st.slug)fillImgs(wrap,l,r,W);});
  }
}
/* spacer 3D/360° – link na karcie pokoju tylko gdy dla stylu i pokoju są gotowe pliki (data/spacer.json) */
async function spacerLinks(slug){
  let M;try{M=await getJSON('data/spacer.json');}catch(e){return;}
  const k=Object.keys(M.style||{}).find(k=>M.style[k].slug===slug);if(!k||cur()!==slug)return;
  for(const r of S.rooms){if(!(M.pokoje||[]).includes(r.id))continue;
    const b=app.querySelector(`#r-${r.slug} .b`);if(!b||b.querySelector('.sp3d'))continue;
    b.insertAdjacentHTML('beforeend',`<p class="sp3d" style="margin:10px 0 0"><a class="btn" href="spacer.html?styl=${encodeURIComponent(slug)}&pokoj=${encodeURIComponent(r.id.replace('/','-'))}">Spacer 3D / 360° →</a></p>`);}
}

/* robocizna: opis ilości + widełki + linki do źródeł stawek */
const labInfo=i=>{const f=String(i.formula||''),[a,src='']=f.split('; źródła: ');
  const links=[...src.matchAll(/([^;(]+?)\s*\((https?:\/\/[^)\s]+)\)/g)].map(m=>`<a href="${esc(m[2])}" target="_blank" rel="noopener nofollow">${esc(m[1].trim())}</a>`);
  const rest=src.replace(/\s*\(https?:\/\/[^)\s]+\)/g,'').split(';').map(x=>x.trim()).filter(Boolean);
  return `<small>${esc(a)}</small><small class="src">Źródła stawek: ${links.length?links.join(' · '):esc(rest.join('; '))}</small>${/SZACUNEK/.test(i.status)?`<small class="est">${esc(i.status)}</small>`:''}`;};

/* ---------- widok: zakupy ---------- */
/* oceny i opinie (audyt jakości, zakupy/opinie.py) */
function opInfo(i){const o=i.op;if(!o)return'';
  const cls=o.v==='wymień'?'bad':o.v==='uwaga'?'mid':'ok';
  const st=o.r!=null?`★ ${String(o.r).replace('.',',')} <i>(${o.c} op.)</i>`:'brak opinii';
  const xs=(o.x||[]).map((u,k)=>`<a href="${esc(u)}" target="_blank" rel="noopener nofollow">źródło${o.x.length>1?' '+(k+1):''}</a>`).join(' ');
  return `<div class="op"><span class="opb ${cls}">${st} · ${esc(o.v)}</span>${o.dec?'<span class="opb dec">do decyzji – wymaga zmiany wizualizacji</span>':''}<small>${esc(o.n)}${o.alt?' Propozycja: '+esc(o.alt)+'.':''} ${xs} <span class="opd">(${esc(o.d)})</span></small></div>`;}
/* ---------- warianty wykończenia (Podstawowy / Wyższy / Premium) ---------- */
async function wariantyCard(slug){
  const box=$('#warianty');if(!box)return;
  let W;try{W=await getJSON('data/warianty.json');}catch(e){box.remove();return;}
  const S0=W.style?.[slug];if(!S0){box.remove();return;}
  let sel=localStorage.getItem('wariant')||'podstawowy';if(!S0.warianty[sel])sel='podstawowy';
  const sgn=n=>(n>0?'+':n<0?'−':'')+zl(Math.abs(n));
  const draw=()=>{
    const w=S0.warianty[sel],b=S0.warianty.podstawowy;
    const seg=W.kolejnosc.map(k=>{const x=S0.warianty[k];return `<button type="button" role="tab" aria-selected="${k===sel}" data-w="${k}" class="${k===sel?'on':''}"><b>${esc(W.nazwy[k])}</b><small>${zl(x.razem_avg)}</small></button>`;}).join('');
    const lim=w.razem_avg>W.limit?`<b style="color:var(--bad)">ponad limit ${zl(W.limit)}</b>`:`<b style="color:var(--ok)">w limicie ${zl(W.limit)} (zostaje ${zl(W.limit-w.razem_avg)})</b>`;
    const mx=w.ponad_limit_max?` · <span style="color:var(--warn)">scenariusz max ${zl(w.razem_max)} &gt; limit</span>`:'';
    const R=(w.roznice||[]).filter(r=>Math.abs(r.delta)>=1);
    const rows=R.map(r=>`<tr><td>${esc(r.kat)}${r.pom?` <small>${esc(r.pom)}</small>`:''}</td><td><small>${esc(r.z||'—')}</small></td><td>${r.url&&r.typ!=='kuchnia'?`<a href="${esc(r.url)}" target="_blank" rel="noopener nofollow">${esc(r.na||'—')} ↗</a>`:esc(r.na||'—')}${r.dlaczego?`<small>${esc(r.dlaczego)}</small>`:''}</td><td class="n"><b>${sgn(r.delta)}</b></td></tr>`).join('');
    box.innerHTML=`<div class="wcard"><h2>Wariant wykończenia</h2>
     <div class="wseg" role="tablist" aria-label="Wariant wykończenia">${seg}</div>
     <div class="sumcard">
      <div class="sr"><span>Produkty</span><b>${zl(w.prod)}</b></div>
      <div class="sr"><span>+ Materiały pomocnicze</span><b>${zl(w.aux)}</b></div>
      <div class="sr"><span>+ Robocizna <small>min–max ${rng(w.lab_min,w.lab_max)}</small></span><b>${zl(w.lab_avg)}</b></div>
      <div class="sr"><span>+ Kuchnia na wymiar <small>${esc(w.kuchnia)}</small></span><b>${zl(w.k_avg)}</b></div>
      <div class="sr tot"><span>= Razem (scenariusz średni)</span><b>${zl(w.razem_avg)}</b></div>
      <div class="sr"><span>Zakres min–max ${rng(w.razem_min,w.razem_max)}${mx}</span>${lim}</div>
     </div>
     ${sel==='podstawowy'?'<p class="capt">Wariant podstawowy = lista poniżej. Wybierz „Wyższy” lub „Premium”, aby zobaczyć różnice pozycja po pozycji.</p>':
      `<p class="capt">Różnica względem podstawowego: <b>${sgn(w.razem_avg-b.razem_avg)}</b> · ${R.length} zmian · pełna lista: <code>${esc(w.plik)}</code></p>
      <div class="wkey">${(w.kluczowe||[]).map(k=>`<span><b>${sgn(k.delta)}</b> ${esc(k.na)}</span>`).join('')}</div>
      <details class="note"><summary><b>Różnice pozycja po pozycji (${R.length})</b></summary><table class="shop wdiff"><thead><tr><th>Kategoria</th><th>Było</th><th>Jest</th><th class="n">Δ</th></tr></thead><tbody>${rows}</tbody></table></details>`}
    </div>`;
    box.querySelectorAll('[data-w]').forEach(btn=>btn.addEventListener('click',()=>{sel=btn.dataset.w;localStorage.setItem('wariant',sel);draw();}));
  };
  draw();
}
async function viewShop(){
  const st=styleBy(cur());
  app.innerHTML='<p class="loading">Ładowanie listy…</p>';
  let d;try{d=await getJSON(`data/zakupy-${st.slug}.json`);}catch(e){app.innerHTML=`<div class="empty">Brak listy zakupów dla stylu ${esc(st.name)}.</div>`;return;}
  if(cur()!==st.slug)return;
  const [kMin,kMax]=d.kitchen_est,B=d.budget;
  const roomName=id=>S.rooms.find(r=>r.id===id)?.name||'';
  const ids=[...new Set(d.items.flatMap(i=>i.room.match(/\d\/\d{2}/g)||[]))].sort();
  const gen=d.items.some(i=>!/\d\/\d{2}/.test(i.room));
  const cats=Object.entries(d.by_cat);
  app.innerHTML=`<h1>Lista zakupów – ${esc(st.name)}</h1>
  <div class="kpis">
   <div class="kpi"><small>Produkty + materiały + robocizna (${d.verified} poz.)</small><b>${zl(d.total)}</b></div>
   <div class="kpi"><small>+ kuchnia na wymiar (szacunek)</small><b>${rng(kMin,kMax)}</b></div>
   <div class="kpi"><small>Razem z kuchnią</small><b>${rng(d.total+kMin,d.total+kMax)}</b></div>
   <div class="kpi"><small>Budżet 400 tys.</small>${left(B,d.total,kMin,kMax)}</div>
  </div>
  ${sumCard(d,kMin,kMax,B)}
  <div id="warianty"></div>
  <div class="bar" title="Udział w budżecie 400 000 zł">${cats.map(([c,v])=>`<span style="width:${v/B*100}%;background:${CAT_COL[c]||'#999'}" title="${esc(c)} ${zl(v)}"></span>`).join('')}<span style="width:${kMin/B*100}%;background:repeating-linear-gradient(45deg,#B9805E 0 4px,#d9b49b 4px 8px)" title="kuchnia na wymiar (min.)"></span></div>
  <div class="legend">${cats.map(([c,v])=>`<span><i style="background:${CAT_COL[c]||'#999'}"></i>${esc(c)} ${zl(v)}</span>`).join('')}<span><i style="background:#B9805E"></i>kuchnia na wymiar (szac.)</span><span>tło = budżet 400 000 zł</span></div>
  <details class="note"><summary><b>Czego nie ma w sumie (${S.gaps.length} uwag)</b> – kuchnia na wymiar, zakres GW, szacunki…</summary><ul>${S.gaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></details>
  <div class="filters">
   <select id="f-room" aria-label="Pomieszczenie"><option value="">Wszystkie pomieszczenia</option>${ids.map(id=>`<option value="${id}">${id} ${esc(roomName(id))}</option>`).join('')}${gen?'<option value="_og">Ogólne / cały dom</option>':''}</select>
   <select id="f-grp" aria-label="Grupowanie"><option value="cat">wg kategorii</option><option value="room">wg pomieszczenia</option></select>
   <input type="search" id="f-q" placeholder="Szukaj produktu / sklepu" aria-label="Szukaj">
  </div>
  <div id="list"></div>`;
  const draw=()=>{
    const fr=$('#f-room').value,g=$('#f-grp').value,q=$('#f-q').value.trim().toLowerCase();
    let it=d.items.filter(i=>!fr||(fr==='_og'?!/\d\/\d{2}/.test(i.room):i.room.includes(fr)));
    if(q)it=it.filter(i=>(i.product+' '+i.shop+' '+i.cat+' '+i.room).toLowerCase().includes(q));
    const key=i=>g==='cat'?i.cat.split(' –')[0]:i.room;
    const groups={};it.forEach(i=>(groups[key(i)]??=[]).push(i));
    const order=Object.keys(groups).sort((a,b)=>g==='cat'?Object.keys(CAT_COL).indexOf(a)-Object.keys(CAT_COL).indexOf(b):a.localeCompare(b,'pl',{numeric:true}));
    const tot=it.reduce((a,i)=>a+(i.sum||0),0);
    $('#list').innerHTML=(it.length?`<p class="capt" style="padding:0">${it.length} pozycji · suma widocznych: <b>${zl2(tot)}</b>${fr?' (pozycje „cały dom” liczone w filtrze „Ogólne”)':''}</p>`:'<div class="empty">Brak pozycji dla tego filtra.</div>')+
     order.map(k=>{const L=groups[k];const s=L.reduce((a,i)=>a+(i.sum||0),0);
      return `<div class="cat"><h3>${esc(g==='room'&&/^\d\/\d{2}$/.test(k)?k+' '+roomName(k):k)}</h3><span>${zl2(s)}</span></div>
      <table class="shop"><thead><tr><th>Produkt</th><th>Sklep</th><th class="n">Cena</th><th class="n">Ilość</th><th class="n">Suma</th><th>Sprawdzono</th></tr></thead><tbody>
      ${L.map(i=>`<tr><td class="pn"><div class="pname"><a href="${esc(i.url)}" target="_blank" rel="noopener nofollow">${esc(i.product)} ↗</a>${isLab(i)?labInfo(i):`<small>${esc(g==='cat'?i.room:i.cat)}${i.formula?' · '+esc(i.formula):''}</small>`}${opInfo(i)}</div></td>
       <td data-l="${isLab(i)?'Źródło stawki':'Sklep'}">${isLab(i)?`<a href="${esc(i.url)}" target="_blank" rel="noopener nofollow">${esc(i.shop)} ↗</a>`:esc(i.shop)}</td>
       <td class="n" data-l="${isLab(i)?'Stawka (średnia)':'Cena'}">${i.price!=null?zl2(i.price)+' / '+esc(i.unit):'<span class="unv">niezweryfikowana</span>'}</td>
       <td class="n" data-l="Ilość">${esc(String(i.qty).replace('.',','))} ${esc(i.unit)}</td>
       <td class="n" data-l="Suma">${i.sum!=null?'<b>'+zl2(i.sum)+'</b>':'<span class="unv">poza sumą</span>'}</td>
       <td data-l="Sprawdzono">${esc(i.date)}</td></tr>`).join('')}</tbody></table>`;}).join('');
  };
  ['f-room','f-grp','f-q'].forEach(id=>$('#'+id).addEventListener('input',draw));
  draw();
  wariantyCard(st.slug);
}

/* ---------- widok: porównanie ---------- */
function viewCompare(){
  const C=S.styles.map(s=>({s,c:cmpBy(s.slug)})).filter(x=>x.c);
  const cats=Object.keys(CAT_COL).filter(k=>C.some(x=>x.c.by_cat[k]!=null));
  const min=k=>Math.min(...C.map(x=>k?x.c.by_cat[k]??Infinity:x.c.total));
  const B=C[0]?.c.budget||400000,[kMin,kMax]=C[0]?.c.kitchen_est||[0,0];
  const maxT=Math.max(...C.map(x=>x.c.total+kMax));
  app.innerHTML=`<h1>Porównanie stylów</h1>
  <p class="lead">Produkty (ceny zweryfikowane) + materiały pomocnicze + robocizna (szacunek wg średnich stawek rynkowych). Do każdej sumy doliczyć kuchnię na wymiar: ${rng(kMin,kMax)}. Budżet: ${zl(B)} (z meblami).</p>
  <div class="grid s3" style="margin-bottom:18px">${C.sort((a,b)=>a.c.total-b.c.total).map(({s,c})=>`<a class="card" href="#/zakupy/${s.slug}" style="padding:12px 14px;text-decoration:none;color:inherit">
    <div class="hd" style="display:flex;justify-content:space-between"><b>${esc(s.name)}</b><b>${zl(c.total)}</b></div>
    <div class="bar" style="height:12px">${cats.map(k=>`<span style="width:${(c.by_cat[k]||0)/maxT*100}%;background:${CAT_COL[k]}"></span>`).join('')}<span style="width:${kMin/maxT*100}%;background:repeating-linear-gradient(45deg,#B9805E 0 4px,#d9b49b 4px 8px)"></span></div>
    <small style="color:var(--mut);display:block">produkty ${zl(brk(c).p)} + materiały ${zl(brk(c).m)} + robocizna ${zl(brk(c).l)} + kuchnia ${rng(kMin,kMax)}</small>
    <small style="color:var(--mut)">= ${rng(c.total+kMin,c.total+kMax)} · ${Math.round((c.total+kMax)/B*100)}% budżetu (max) · ${left(B,c.total,kMin,kMax)}</small></a>`).join('')}</div>
  <div class="legend" style="margin-bottom:10px">${cats.map(k=>`<span><i style="background:${CAT_COL[k]}"></i>${esc(k)}</span>`).join('')}<span><i style="background:#B9805E"></i>kuchnia na wymiar (min.)</span></div>
  <div class="scroll"><table class="cmp"><thead><tr><th>Kategoria</th>${S.styles.map(s=>`<th><a href="#/zakupy/${s.slug}">${esc(s.name)}</a></th>`).join('')}</tr></thead><tbody>
  ${cats.map(k=>`<tr><td>${esc(k)}</td>${S.styles.map(s=>{const v=cmpBy(s.slug)?.by_cat[k];return `<td class="${v===min(k)?'best':''}">${zl(v)}</td>`;}).join('')}</tr>`).join('')}
  <tr><td>w tym produkty</td>${S.styles.map(s=>`<td>${zl(brk(cmpBy(s.slug)).p)}</td>`).join('')}</tr>
  <tr><td>Robocizna – widełki min–max</td>${S.styles.map(s=>{const x=brk(cmpBy(s.slug));return `<td>${x.lmin!=null?rng(x.lmin,x.lmax):'—'}</td>`;}).join('')}</tr>
  <tr class="tot"><td>Razem produkty + materiały + robocizna</td>${S.styles.map(s=>{const v=cmpBy(s.slug)?.total;return `<td class="${v===min()?'best':''}">${zl(v)}</td>`;}).join('')}</tr>
  <tr><td>+ kuchnia (zakres)</td>${S.styles.map(s=>{const v=cmpBy(s.slug)?.total;return `<td>${rng(v+kMin,v+kMax)}</td>`;}).join('')}</tr>
  <tr><td>Zostaje z 400 tys. (min.; minus = przekroczenie)</td>${S.styles.map(s=>{const v=B-cmpBy(s.slug).total-kMax;return `<td style="color:var(${v<0?'--bad':'--ok'})">${zl(v)}</td>`;}).join('')}</tr>
  <tr><td>Pozycje zweryf. / niezweryf.</td>${S.styles.map(s=>{const c=cmpBy(s.slug);return `<td>${c.verified} / ${c.unverified}</td>`;}).join('')}</tr>
  </tbody></table></div>
  <p class="capt" style="padding:8px 0">Najtańsza wartość w wierszu – na zielono. Robocizna to szacunek (średnia z cenników firm, Warszawa 2026) – źródła stawek przy każdej pozycji w zakładce „Zakupy”.</p>`;
}

/* ---------- start ---------- */
Promise.all([getJSON('data/styles.json'),getJSON('data/rooms.json'),getJSON('data/porownanie.json'),getJSON('data/luki.json').catch(()=>[])])
 .then(([st,rm,cmp,gaps])=>{Object.assign(S,{styles:st,rooms:rm,cmp,gaps});addEventListener('hashchange',route);route();})
 .catch(e=>{app.innerHTML=`<div class="empty">Nie udało się wczytać danych (${esc(e.message)}). Otwórz stronę przez serwer HTTP (np. GitHub Pages), nie jako plik.</div>`;});
})();
