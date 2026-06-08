(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function sb(){ if(!window.supabase||!window.IBAI_SUPABASE_URL||!window.IBAI_SUPABASE_ANON_KEY) return null; if(!window.IBAI_BETA_CLIENT) window.IBAI_BETA_CLIENT=window.supabase.createClient(window.IBAI_SUPABASE_URL,window.IBAI_SUPABASE_ANON_KEY); return window.IBAI_BETA_CLIENT; }
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));

  function injectSearch(){
    if($('.ibai-global-search')) return;
    const nav=$('.nav-right'); if(!nav) return;
    const wrap=document.createElement('div'); wrap.className='ibai-global-search';
    wrap.innerHTML='<input id="ibai-global-search-input" placeholder="Buscar"><div class="ibai-search-results" id="ibai-search-results"></div>';
    nav.insertBefore(wrap, nav.firstChild);
    $('#ibai-global-search-input')?.addEventListener('input', debounce(runSearch, 250));
    document.addEventListener('click',(e)=>{ if(!e.target.closest('.ibai-global-search')) $('#ibai-search-results')?.classList.remove('active'); });
  }
  function debounce(fn,ms){let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),ms);};}
  async function runSearch(e){
    const q=e.target.value.trim(); const results=$('#ibai-search-results'); if(!results) return;
    if(q.length<2){results.classList.remove('active'); results.innerHTML=''; return;}
    const client=sb(); if(!client) return;
    const like=`%${q}%`;
    const [clients,galleries,tasks]=await Promise.all([
      client.from('clients').select('id,name,username').or(`name.ilike.${like},username.ilike.${like}`).limit(5),
      client.from('galleries').select('id,title_es,title_en').or(`title_es.ilike.${like},title_en.ilike.${like}`).limit(5),
      client.from('app_tasks').select('id,title,status').ilike('title',like).limit(5)
    ]);
    const items=[];
    if(!clients.error) clients.data.forEach(x=>items.push({type:'Cliente',title:x.name||x.username,meta:x.username,section:'clients'}));
    if(!galleries.error) galleries.data.forEach(x=>items.push({type:'Galería',title:x.title_es||x.title_en,meta:'Galería',section:'galleries'}));
    if(!tasks.error) tasks.data.forEach(x=>items.push({type:'Tarea',title:x.title,meta:x.status,section:'tasks'}));
    results.innerHTML=items.length?items.map(x=>`<div class="ibai-search-result" data-section-jump="${x.section}"><div class="row-title">${esc(x.title)}</div><div class="row-meta">${esc(x.type)} · ${esc(x.meta||'')}</div></div>`).join(''):'<div class="ibai-search-result"><div class="row-meta">Sin resultados</div></div>';
    results.classList.add('active');
    results.querySelectorAll('[data-section-jump]').forEach(el=>el.addEventListener('click',()=>{document.querySelector(`.side-btn[data-section="${el.dataset.sectionJump}"]`)?.click();results.classList.remove('active');}));
  }

  async function renderRealActivity(){
    const client=sb(); if(!client) return;
    const overview=$('#overview'); if(!overview || $('#real-activity-card')) return;
    const card=document.createElement('div'); card.className='card pad'; card.id='real-activity-card'; card.style.marginTop='18px';
    card.innerHTML='<div class="section-title"><div><h2>Actividad real</h2><p>Últimos movimientos del sistema.</p></div></div><div class="timeline" id="real-activity-list"><div class="empty-state">Cargando actividad...</div></div>';
    overview.appendChild(card);
    const list=$('#real-activity-list');
    const chunks=[];
    try{
      const [activity,downloads,requests,galleries,clients,tasks]=await Promise.all([
        client.from('activity_log').select('*').order('created_at',{ascending:false}).limit(8),
        client.from('download_logs').select('*').order('created_at',{ascending:false}).limit(4),
        client.from('retouch_requests').select('*').order('created_at',{ascending:false}).limit(4),
        client.from('galleries').select('title_es,title_en,created_at').order('created_at',{ascending:false}).limit(4),
        client.from('clients').select('name,username,created_at').order('created_at',{ascending:false}).limit(4),
        client.from('app_tasks').select('title,status,created_at').order('created_at',{ascending:false}).limit(4)
      ]);
      if(!activity.error) activity.data.forEach(x=>chunks.push({t:x.created_at,title:x.title||x.type,meta:x.details||'Actividad'}));
      if(!downloads.error) downloads.data.forEach(x=>chunks.push({t:x.created_at,title:'Descarga registrada',meta:`${x.download_type||'download'} · ${x.size_label||''}`}));
      if(!requests.error) requests.data.forEach(x=>chunks.push({t:x.created_at,title:'Retoque solicitado',meta:x.status||'new'}));
      if(!galleries.error) galleries.data.forEach(x=>chunks.push({t:x.created_at,title:'Galería creada',meta:x.title_es||x.title_en||''}));
      if(!clients.error) clients.data.forEach(x=>chunks.push({t:x.created_at,title:'Cliente creado',meta:x.name||x.username||''}));
      if(!tasks.error) tasks.data.forEach(x=>chunks.push({t:x.created_at,title:'Tarea creada',meta:`${x.status} · ${x.title}`}));
    }catch(e){ list.innerHTML=`<div class="empty-state">No se pudo cargar actividad: ${esc(e.message)}</div>`; return; }
    chunks.sort((a,b)=>new Date(b.t)-new Date(a.t));
    const items=chunks.slice(0,10);
    list.innerHTML=items.length?items.map(x=>`<div class="timeline-item"><div class="pill">${esc(formatTime(x.t))}</div><div><div class="row-title">${esc(x.title)}</div><div class="row-meta">${esc(x.meta||'')}</div></div><span class="side-dot"></span></div>`).join(''):'<div class="empty-state">Aún no hay actividad real.</div>';
  }
  function formatTime(iso){try{return new Date(iso).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return ''}}

  function improveEmptyStates(){
    const observer=new MutationObserver(()=>{
      document.querySelectorAll('.list,.timeline').forEach(list=>{
        if(!list.textContent.trim()) list.innerHTML='<div class="empty-state">Sin datos todavía.</div>';
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  function init(){ injectSearch(); setTimeout(renderRealActivity,1000); improveEmptyStates(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
