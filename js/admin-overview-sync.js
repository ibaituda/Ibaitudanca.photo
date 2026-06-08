(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=(v)=>String(v ?? '').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));

  function client(){
    try{
      if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
      if(!window.IBAI_OVERVIEW_CLIENT){
        window.IBAI_OVERVIEW_CLIENT=window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
      }
      return window.IBAI_OVERVIEW_CLIENT;
    }catch(e){ console.warn('[overview] client init failed', e); return null; }
  }

  function setText(selector,value){ const el=$(selector); if(el) el.textContent=value; }
  function fmtDate(value){
    if(!value) return '—';
    try{ return new Date(value).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
    catch(e){ return String(value); }
  }
  function statusLabel(status){
    const map={ready:'Lista',in_progress:'En proceso',created:'Creada',published:'Publicado',draft:'Borrador',pending:'Pendiente',done:'Finalizado',completed:'Finalizado',confirmed:'Confirmado',covering:'En cobertura',cancelled:'Cancelado'};
    return map[status] || status || '—';
  }
  async function selectSafe(table,query='*',opts={}){
    const sb=client();
    if(!sb) return {data:[],error:new Error('Supabase no configurado')};
    try{
      let q=sb.from(table).select(query);
      if(opts.eq) opts.eq.forEach(([k,v])=>{ q=q.eq(k,v); });
      if(opts.gte) opts.gte.forEach(([k,v])=>{ q=q.gte(k,v); });
      if(opts.order) q=q.order(opts.order,{ascending:!!opts.ascending});
      if(opts.limit) q=q.limit(opts.limit);
      return await q;
    }catch(e){ console.warn('[overview] select failed', table, e); return {data:[],error:e}; }
  }

  function injectStyles(){
    if($('#overview-rebuild-styles')) return;
    const st=document.createElement('style'); st.id='overview-rebuild-styles';
    st.textContent=`
      #overview #overview-publication-checklist-v2 ul,#overview #overview-publication-checklist-v2 li,#overview #overview-publication-checklist-v2 .check-dot{display:none!important;visibility:hidden!important}
      .overview-mini-list{display:grid;gap:9px}.overview-mini-row{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:start;border:1px solid var(--line);background:rgba(255,255,255,.025);padding:9px;cursor:pointer}.overview-mini-row strong{display:block;font-size:12px;font-weight:500;color:var(--text)}.overview-mini-row span{display:block;font-size:10.5px;color:var(--muted);margin-top:2px;line-height:1.35}.overview-mini-row b{color:var(--soft);font-weight:500}.task-summary{display:flex;gap:8px;margin:0 0 10px 0}.task-summary span{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);background:rgba(255,255,255,.035);padding:6px 8px;font-size:11px;color:var(--soft)}.task-summary i{width:8px;height:8px;border-radius:50%;display:inline-block}.task-summary .red{background:var(--red)}.task-summary .yellow{background:var(--yellow)}.task-summary .green{background:var(--green)}.publication-check-card{display:grid;gap:8px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.015));padding:12px;cursor:pointer}.publication-check-card .check-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.publication-check-card strong{font-size:12px;font-weight:600;color:var(--text);line-height:1.25}.publication-check-card .check-badge{font-size:9px;letter-spacing:.14em;text-transform:uppercase;border:1px solid var(--line);padding:5px 7px;color:var(--soft);white-space:nowrap}.publication-check-card.is-red .check-badge{border-color:rgba(255,92,92,.45);color:#ffb3b3}.publication-check-card.is-yellow .check-badge{border-color:rgba(245,197,66,.45);color:#ffe38d}.publication-check-card.is-green .check-badge{border-color:rgba(90,220,130,.45);color:#abffc4}.publication-check-card p{margin:0;font-size:11px;color:var(--muted);line-height:1.45}.publication-check-card .check-source{font-size:10px;color:var(--soft);letter-spacing:.08em;text-transform:uppercase}.publication-check-empty{border:1px solid var(--line);padding:12px;background:rgba(255,255,255,.025)}.publication-check-empty strong{display:block;color:var(--text);font-size:12px}.publication-check-empty span{display:block;color:var(--muted);font-size:11px;margin-top:4px;line-height:1.4}
    `;
    document.head.appendChild(st);
  }

  async function updateStats(){
    setText('#overview-clients-count','…'); setText('#overview-galleries-count','…'); setText('#overview-uploads-count','…'); setText('#overview-retouch-count','…');
    const [clients,galleries,requests,photos]=await Promise.all([
      selectSafe('clients','id,active,publish_status'),
      selectSafe('galleries','id,status,publish_status'),
      selectSafe('retouch_requests','id,status'),
      selectSafe('photos','id,gallery_id')
    ]);
    const clientRows=clients.data||[], galleryRows=galleries.data||[], requestRows=requests.data||[], photoRows=photos.data||[];
    const activeClients=clientRows.filter(c=>c.active!==false).length;
    const activeGalleries=galleryRows.filter(g=>g.status!=='archived').length;
    const galleriesWithPhotos=new Set(photoRows.map(p=>p.gallery_id).filter(Boolean));
    const pendingUploads=galleryRows.filter(g=>g.status==='created'||g.status==='in_progress'||!galleriesWithPhotos.has(g.id)).length;
    const openRequests=requestRows.filter(r=>!['done','completed'].includes(r.status)).length;
    setText('#overview-clients-count',activeClients); setText('#overview-galleries-count',activeGalleries); setText('#overview-uploads-count',pendingUploads); setText('#overview-retouch-count',openRequests);
  }

  let __checklistRendering=false;
  let __lastChecklistHtml='';

  function ensureChecklistBox(){
    let box=$('#overview-checklist-real-content');
    let panel=$('#overview-publication-checklist-v2');
    if(!panel){
      const overview=$('#overview .overview-grid') || $('#overview');
      if(!overview) return null;
      panel=document.createElement('div');
      panel.className='compact-panel';
      panel.id='overview-publication-checklist-v2';
      panel.innerHTML='<h4><span data-en="">Publication checklist</span><span data-es="">Checklist de publicación</span></h4><div id="overview-checklist-real-content" class="overview-mini-list"></div>';
      overview.prepend(panel);
    }
    if(!box){
      panel.querySelector('ul')?.remove();
      box=document.createElement('div');
      box.id='overview-checklist-real-content';
      box.className='overview-mini-list';
      panel.appendChild(box);
    }
    // Remove/hide any old decorative checklist inside this panel.
    panel.querySelectorAll('ul, li, .check-dot').forEach(el=>el.remove());
    return box;
  }

  function renderChecklistHtml(items){
    const priority={red:0,yellow:1,green:2};
    const visible=items.sort((a,b)=>priority[a.severity]-priority[b.severity]).slice(0,6);
    if(!visible.length){
      return '<div class="publication-check-empty"><strong>Todo al día</strong><span>No hay pendientes automáticos en clientes, galerías, tareas, retoques o calendario.</span></div>';
    }
    return visible.map(item=>`<div class="publication-check-card is-${esc(item.severity)}" data-section-link="${esc(item.target)}"><div class="check-head"><strong>${esc(item.title)}</strong><span class="check-badge">${esc(item.badge)}</span></div><div class="check-source">${esc(item.source)}</div><p>${esc(item.detail)}</p></div>`).join('');
  }

  async function updateChecklist(){
    const box=ensureChecklistBox(); if(!box) return;
    if(!__lastChecklistHtml){
      box.innerHTML='<div class="row-meta">Cargando checklist real...</div>';
    }
    const today=new Date().toISOString().slice(0,10);
    const [galleries,links,photos,requests,tasks,events,clients]=await Promise.all([
      selectSafe('galleries','id,title_es,title_en,cover_image_url,status,publish_status,personal_note_es,created_at,updated_at',{order:'updated_at',ascending:false,limit:100}),
      selectSafe('gallery_clients','id,gallery_id,client_id'),
      selectSafe('photos','id,gallery_id,hidden'),
      selectSafe('retouch_requests','id,gallery_id,status,message,created_at',{order:'created_at',ascending:false,limit:50}),
      selectSafe('app_tasks','id,title,status,due_date,created_at',{order:'created_at',ascending:false,limit:50}),
      selectSafe('calendar_events','id,title,event_date,status,location',{gte:[['event_date',today]],order:'event_date',ascending:true,limit:30}),
      selectSafe('clients','id,name,username,active,publish_status,password_hash,profile_image_url,hero_image_url',{order:'created_at',ascending:false,limit:100})
    ]);

    const linked=new Set((links.data||[]).map(x=>x.gallery_id).filter(Boolean));
    const photoCount={}; const visibleCount={};
    (photos.data||[]).forEach(p=>{
      if(!p.gallery_id) return;
      photoCount[p.gallery_id]=(photoCount[p.gallery_id]||0)+1;
      if(p.hidden!==true) visibleCount[p.gallery_id]=(visibleCount[p.gallery_id]||0)+1;
    });

    const items=[];
    (galleries.data||[]).forEach(g=>{
      const missing=[];
      if(!linked.has(g.id)) missing.push('cliente asignado');
      if(!g.cover_image_url) missing.push('portada');
      if(!photoCount[g.id]) missing.push('fotos subidas');
      if(photoCount[g.id] && !visibleCount[g.id]) missing.push('fotos visibles');
      if(!g.personal_note_es) missing.push('nota personalizada');
      if(g.publish_status!=='published') missing.push('publicación');
      const title=g.title_es||g.title_en||'Galería sin título';
      if(missing.length){
        const severe=!linked.has(g.id)||!photoCount[g.id];
        items.push({severity:severe?'red':'yellow',badge:severe?'Revisar':'Pendiente',title,source:'Galerías · Editar galería',detail:`Falta ${missing.join(', ')}.`,target:'galleries'});
      }else{
        items.push({severity:'green',badge:'Lista',title,source:'Galerías',detail:'Tiene cliente asignado, portada, fotos visibles y publicación activa.',target:'galleries'});
      }
    });

    (clients.data||[]).filter(c=>c.active!==false).forEach(c=>{
      const missing=[];
      if(!c.password_hash) missing.push('contraseña');
      if(!c.profile_image_url) missing.push('foto de perfil');
      if(!c.hero_image_url) missing.push('hero');
      if(c.publish_status!=='published') missing.push('publicación');
      if(missing.length) items.push({severity:'yellow',badge:'Cliente',title:c.name||c.username||'Cliente sin nombre',source:'Clientes · Editar cliente',detail:`Falta ${missing.join(', ')}.`,target:'clients'});
    });

    (requests.data||[]).filter(r=>!['done','completed'].includes(r.status)).slice(0,3).forEach(r=>items.push({severity:'yellow',badge:'Retoque',title:'Solicitud de retoque pendiente',source:'Retoques',detail:r.message?`Mensaje: ${r.message}`:'Hay una solicitud sin completar.',target:'requests'}));
    (tasks.data||[]).filter(t=>['pending','in_progress'].includes(t.status)).slice(0,3).forEach(t=>items.push({severity:t.status==='pending'?'red':'yellow',badge:t.status==='pending'?'Tarea':'En curso',title:t.title||'Tarea sin título',source:'Tareas',detail:t.due_date?`Fecha límite: ${t.due_date}`:(t.status==='pending'?'Pendiente de empezar.':'En progreso.'),target:'tasks'}));
    (events.data||[]).filter(e=>['pending','confirmed','covering'].includes(e.status)).slice(0,2).forEach(e=>items.push({severity:e.status==='pending'?'red':'yellow',badge:'Evento',title:e.title||'Evento programado',source:'Calendario',detail:`${e.event_date||'Sin fecha'}${e.location?' · '+e.location:''} · ${statusLabel(e.status)}`,target:'calendar'}));

    const html=renderChecklistHtml(items);
    __lastChecklistHtml=html;
    __checklistRendering=true;
    box.innerHTML=html;
    ensureChecklistBox();
    __checklistRendering=false;
  }

  function guardChecklistAgainstLegacyScripts(){
    const panel=$('#overview-publication-checklist-v2'); if(!panel || window.__ibaiChecklistGuard) return;
    window.__ibaiChecklistGuard=true;
    const observer=new MutationObserver(()=>{
      if(__checklistRendering) return;
      const hasLegacy=!!panel.querySelector('ul, li, .check-dot');
      const box=ensureChecklistBox();
      if(hasLegacy && box){
        box.innerHTML=__lastChecklistHtml || '<div class="row-meta">Cargando checklist real...</div>';
      }
    });
    observer.observe(panel,{childList:true,subtree:true});
  }

  async function updateTasks(){
    const box=$('#overview-tasks-content'); if(!box) return;
    const res=await selectSafe('app_tasks','id,title,status,due_date,created_at',{order:'created_at',ascending:false,limit:100});
    if(res.error){ box.innerHTML='<div class="row-meta">No se pudieron cargar tareas.</div>'; return; }
    const rows=res.data||[];
    const pending=rows.filter(t=>t.status==='pending'), progress=rows.filter(t=>t.status==='in_progress'), done=rows.filter(t=>t.status==='done'||t.status==='completed');
    const visible=[...pending,...progress].slice(0,4);
    const counters=`<div class="task-summary"><span><i class="red"></i>${pending.length}</span><span><i class="yellow"></i>${progress.length}</span><span><i class="green"></i>${done.length}</span></div>`;
    if(!rows.length){ box.innerHTML=counters+'<div class="row-meta">No hay tareas creadas.</div>'; return; }
    box.innerHTML=counters+(visible.length?visible.map(t=>`<div class="overview-mini-row"><span class="task-dot ${esc(t.status)}"></span><div><strong>${esc(t.title)}</strong><span>${t.due_date?esc(t.due_date):'Sin fecha límite'}</span></div></div>`).join(''):'<div class="row-meta">No hay tareas pendientes.</div>');
  }

  async function updateActivity(){
    const box=$('#overview-activity-content'); if(!box) return;
    const chunks=[];
    const [activity,downloads,requests,galleries,clients]=await Promise.all([
      selectSafe('activity_log','type,title,details,created_at',{order:'created_at',ascending:false,limit:5}),
      selectSafe('download_logs','download_type,size_label,photos_count,created_at',{order:'created_at',ascending:false,limit:5}),
      selectSafe('retouch_requests','message,status,created_at',{order:'created_at',ascending:false,limit:5}),
      selectSafe('galleries','title_es,title_en,created_at',{order:'created_at',ascending:false,limit:2}),
      selectSafe('clients','name,username,created_at',{order:'created_at',ascending:false,limit:2})
    ]);
    (activity.data||[]).forEach(x=>chunks.push({t:x.created_at,title:x.title||x.type,meta:x.details||'Actividad'}));
    (downloads.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Descarga registrada',meta:`${x.photos_count||1} foto(s) · ${x.size_label||x.download_type||''}`}));
    (requests.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Retoque solicitado',meta:x.message||x.status||'new'}));
    (galleries.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Galería creada',meta:x.title_es||x.title_en||'Sin título'}));
    (clients.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Cliente creado',meta:x.name||x.username||'Sin nombre'}));
    chunks.sort((a,b)=>new Date(b.t)-new Date(a.t));
    const items=chunks.slice(0,4);
    box.innerHTML=items.length?items.map(x=>`<div class="overview-mini-row"><span class="side-dot"></span><div><strong>${esc(x.title)}</strong><span>${esc(x.meta)} · ${fmtDate(x.t)}</span></div></div>`).join(''):'<div class="row-meta">Aún no hay actividad real.</div>';
  }

  function bindOverviewLinks(){
    if(window.__ibaiOverviewLinksBound) return; window.__ibaiOverviewLinksBound=true;
    document.addEventListener('click',(e)=>{
      const btn=e.target.closest('[data-section-link]'); if(!btn) return;
      const section=btn.dataset.sectionLink; if(!section) return;
      document.querySelector(`.side-btn[data-section="${section}"]`)?.click();
      setTimeout(()=>{ if(section==='tasks') $('#task-title')?.focus(); if(section==='galleries') document.querySelector('.tab[data-tab="galleries-list"]')?.click(); },150);
    },true);
  }

  async function refresh(){
    await Promise.allSettled([updateStats(),updateChecklist(),updateTasks(),updateActivity()]);
  }
  function init(){
    injectStyles(); ensureChecklistBox(); guardChecklistAgainstLegacyScripts(); bindOverviewLinks(); refresh();
    if(!window.IBAI_OVERVIEW_INTERVAL) window.IBAI_OVERVIEW_INTERVAL=setInterval(refresh,60000);
    window.IBAI_REFRESH_OVERVIEW=refresh;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
