(function(){
  'use strict';
  const SESSION_KEY='ibaiClientSession';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const qs=new URLSearchParams(location.search);
  const isGallery=/gallery-view\.html/i.test(location.pathname)||document.body?.classList?.contains('gallery-page')||!!$('#gallery');
  const isDashboard=/client-dashboard\.html/i.test(location.pathname)||!!$('.gallery-grid');
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clean=(v)=>{const s=String(v??'').trim(); if(!s) return ''; if(/Antonio Blanco|duels, celebrations|Personal note from Ibai|Alavés vs Rayo|Season Archive|Branding selection|Welcome back/i.test(s)) return ''; return s;};
  const lang=()=>((document.documentElement.lang||localStorage.getItem('ibaiLanguage')||'es').toLowerCase().startsWith('en')?'en':'es');
  function sb(){return window.supabase&&window.IBAI_SUPABASE_URL&&window.IBAI_SUPABASE_ANON_KEY?window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY):null;}
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function setText(el,txt){if(el) el.textContent=txt;}
  function ensureStyle(){
    if($('#v119-polish-style')) return;
    const st=document.createElement('style'); st.id='v119-polish-style';
    st.textContent=`
      .v119-requests{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.032);padding:20px 24px;margin:0 auto 18px;max-width:1480px}
      .v119-requests h3{font-size:20px;font-weight:500;letter-spacing:-.035em;margin:0 0 12px}
      .v119-request-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
      .v119-request{border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.18);padding:14px}
      .v119-request strong{display:block;font-size:12px;font-weight:500;margin-bottom:6px;color:#fff}.v119-request p{font-size:12px;line-height:1.55;color:rgba(255,255,255,.62);margin:0}.v119-request small{display:block;margin-top:10px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.42)}
      .v119-back-dashboard{display:inline-flex!important;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:10px 14px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;background:rgba(255,255,255,.04);color:#fff;text-decoration:none;white-space:nowrap}
      .v119-empty{font-size:13px;line-height:1.65;color:rgba(255,255,255,.52)}
      .v119-hidden-demo{display:none!important}
    `; document.head.appendChild(st);
  }
  async function getClientBySession(){
    const clientId=qs.get('client')||qs.get('client_id')||qs.get('id')||session()?.id; if(!clientId) return null;
    const api=sb(); if(!api) return null;
    const {data}=await api.from('clients').select('*').eq('id',clientId).maybeSingle(); return data||null;
  }
  async function getGalleryAndClient(){
    const api=sb(); if(!api) return {api:null,gallery:null,client:null};
    const gid=qs.get('gallery')||qs.get('gallery_id')||qs.get('id'); if(!gid) return {api,gallery:null,client:await getClientBySession()};
    const {data:g}=await api.from('galleries').select('*').eq('id',gid).maybeSingle();
    let client=await getClientBySession();
    if(!client){
      const {data:links}=await api.from('gallery_clients').select('client_id').eq('gallery_id',gid).limit(1);
      const cid=links?.[0]?.client_id;
      if(cid){const {data:c}=await api.from('clients').select('*').eq('id',cid).maybeSingle(); client=c||null;}
    }
    return {api,gallery:g||null,client};
  }
  function updateDashboardCustomTexts(client){
    if(!client) return;
    const l=lang();
    const title=clean(l==='es' ? client.welcome_title_es : client.welcome_title_en);
    const msg=clean(l==='es' ? client.welcome_message_es : client.welcome_message_en);
    const license=clean(l==='es' ? client.license_es : client.license_en);
    const h1=$('.hero h1'); if(h1 && title) h1.textContent=title;
    const heroP=$('.hero p'); if(heroP){ if(msg){heroP.textContent=msg; heroP.style.display='';} else {heroP.textContent=''; heroP.style.display='none';} }
    const note=$('.personal-note'); const noteP=$('.personal-note p'); const noteSpan=$('.personal-note span');
    if(note && noteP){ if(msg){note.style.display='grid'; noteP.textContent=msg; if(noteSpan) noteSpan.textContent=l==='es'?'Nota personal de Ibai':'Personal note from Ibai';} else {note.style.display='none';} }
    const licenseP=$('.license-box p'); if(licenseP){ if(license){licenseP.textContent=license;} else {licenseP.textContent='';} }
  }
  function dashboardLanguageHook(client){
    $$('.lang-btn,[data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>updateDashboardCustomTexts(client),80)));
  }
  async function polishDashboard(){
    ensureStyle();
    const client=await getClientBySession();
    updateDashboardCustomTexts(client); dashboardLanguageHook(client);
  }
  function addBackButton(client){
    const nav=$('.nav-right')||$('.dashboard-nav .nav-right')||$('.top-actions')||$('.nav'); if(!nav || $('.v119-back-dashboard')) return;
    const a=document.createElement('a'); a.className='v119-back-dashboard';
    const slug=(client?.username||client?.name||client?.id||'client').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    const href=client?.id?`/client-dashboard/${encodeURIComponent(slug)}`:'/client-dashboard';
    a.href=href; a.textContent=lang()==='es'?'Volver al dashboard':'Back to dashboard';
    const first=nav.querySelector('.nav-link,.language-switch,.logout');
    if(first) nav.insertBefore(a,first); else nav.appendChild(a);
  }
  async function fetchRequests(api,gallery,client){
    if(!api) return [];
    const attempts=[];
    if(gallery?.id) attempts.push(()=>api.from('retouch_requests').select('*').eq('gallery_id',gallery.id).order('created_at',{ascending:false}).limit(8));
    if(client?.id) attempts.push(()=>api.from('retouch_requests').select('*').eq('client_id',client.id).order('created_at',{ascending:false}).limit(8));
    for(const fn of attempts){try{const {data,error}=await fn(); if(!error && data) return data;}catch(e){}}
    return [];
  }
  function requestStatus(row){const s=String(row.status||'').toLowerCase(); if(/complete|done|final|complet|finished/.test(s)) return lang()==='es'?'Completado':'Completed'; if(/progress|process|curso/.test(s)) return lang()==='es'?'En proceso':'In progress'; return lang()==='es'?'Pendiente':'Pending';}
  function renderRequestsBox(rows){
    if($('#v119-request-box')) $('#v119-request-box').remove();
    const box=document.createElement('section'); box.className='v119-requests'; box.id='v119-request-box';
    const l=lang();
    const html=rows.length?`<div class="v119-request-grid">${rows.map((r,i)=>`<article class="v119-request"><strong>${esc(r.title||r.filename||r.photo_filename||r.photo_id||`${l==='es'?'Solicitud':'Request'} ${i+1}`)}</strong><p>${esc(r.message||r.notes||r.request||r.description||'')}</p><small>${requestStatus(r)}</small></article>`).join('')}</div>`:`<p class="v119-empty">${l==='es'?'Todavía no hay retoques solicitados en esta galería. Cuando el cliente pida una revisión aparecerá aquí con su estado.':'There are no edit requests for this gallery yet. When the client asks for a revision, it will appear here with its status.'}</p>`;
    box.innerHTML=`<h3>${l==='es'?'Retoques y solicitudes':'Edits and requests'}</h3>${html}`;
    const anchor=$('.toolbar')||$('#gallery')||$('.note')||$('.hero');
    if(anchor) anchor.insertAdjacentElement(anchor.classList.contains('hero')?'afterend':'beforebegin',box);
  }
  function updateGalleryLanguageStrings(gallery,client){
    if(!gallery) return;
    const l=lang();
    addBackButton(client);
    const noteText=clean(l==='es' ? gallery.personal_note_es : gallery.personal_note_en);
    const note=$('.note'); const noteP=$('.note p'); const noteSpan=$('.note span');
    if(note && noteP){ if(noteText){note.style.display='grid'; note.classList.remove('is-empty'); noteP.textContent=noteText; if(noteSpan) noteSpan.textContent=l==='es'?'Nota personal de Ibai':'Personal note from Ibai';} else {note.style.display='none';}}
    const desc=clean(l==='es'?gallery.description_es:gallery.description_en); const heroP=$('.hero p'); if(heroP){ if(desc){heroP.textContent=desc; heroP.style.display='';} else {heroP.textContent=''; heroP.style.display='none';} }
    const back=$('.v119-back-dashboard'); if(back) back.textContent=l==='es'?'Volver al dashboard':'Back to dashboard';
  }
  async function polishGallery(){
    ensureStyle();
    const {api,gallery,client}=await getGalleryAndClient();
    addBackButton(client);
    updateGalleryLanguageStrings(gallery,client);
    const rows=await fetchRequests(api,gallery,client);
    renderRequestsBox(rows);
    $$('.lang-btn,[data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(async()=>{
      updateGalleryLanguageStrings(gallery,client);
      renderRequestsBox(rows);
    },100)));
  }
  function boot(){ setTimeout(()=>{ if(isGallery) polishGallery(); if(isDashboard) polishDashboard(); },600); setTimeout(()=>{ if(isGallery) polishGallery(); if(isDashboard) polishDashboard(); },1600); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
