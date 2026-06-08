(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=(v)=>String(v ?? '').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const imgFallback='img/IMG_IBAI.jpg';
  function supa(){
    if(!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    if(!window.IBAI_OVERVIEW_CLIENT) window.IBAI_OVERVIEW_CLIENT=window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
    return window.IBAI_OVERVIEW_CLIENT;
  }
  function setText(id,value){ const el=$(id); if(el) el.textContent = value; }
  function fmtDate(value){
    if(!value) return '—';
    try{ return new Date(value).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return String(value); }
  }
  function dateOnly(value){
    if(!value) return '—';
    try{ return new Date(value).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return String(value); }
  }
  function statusPill(status){
    const map={ready:['green','Lista','Ready'],in_progress:['yellow','En proceso','In progress'],created:['red','Creada','Created'],published:['green','Publicado','Published'],draft:['yellow','Borrador','Draft'],pending:['red','Pendiente','Pending'],done:['green','Finalizado','Done'],completed:['green','Finalizado','Completed'],confirmed:['yellow','Confirmado','Confirmed'],cancelled:['red','Cancelado','Cancelled']};
    const [color,es,en]=map[status]||['yellow',status||'—',status||'—'];
    return `<span class="pill"><span class="dot ${color}"></span><span data-es>${esc(es)}</span><span data-en>${esc(en)}</span></span>`;
  }
  async function selectSafe(table,query='*',opts={}){
    const sb=supa(); if(!sb) return {data:[],error:new Error('Supabase no configurado')};
    try{
      let q=sb.from(table).select(query, opts.count?{count:'exact',head:!!opts.head}:undefined);
      if(opts.order) q=q.order(opts.order,{ascending:!!opts.ascending});
      if(opts.limit) q=q.limit(opts.limit);
      if(opts.eq) opts.eq.forEach(([k,v])=>{q=q.eq(k,v);});
      if(opts.gte) opts.gte.forEach(([k,v])=>{q=q.gte(k,v);});
      const res=await q;
      return res;
    }catch(e){return {data:[],error:e};}
  }
  async function countTable(table){
    const res=await selectSafe(table,'id',{count:true,head:true});
    return typeof res.count==='number' ? res.count : (res.data||[]).length;
  }
  async function updateStats(){
    const sb=supa(); if(!sb) return;
    setText('#overview-clients-count','…'); setText('#overview-galleries-count','…'); setText('#overview-uploads-count','…'); setText('#overview-retouch-count','…');
    const [clients,galleries,requests,photos]=await Promise.all([
      selectSafe('clients','id,active,publish_status'),
      selectSafe('galleries','id,status,publish_status'),
      selectSafe('retouch_requests','id,status'),
      selectSafe('photos','id,gallery_id')
    ]);
    const clientRows=clients.data||[];
    const galleryRows=galleries.data||[];
    const requestRows=requests.data||[];
    const photoRows=photos.data||[];
    const activeClients=clientRows.filter(c=>c.active!==false).length;
    const activeGalleries=galleryRows.filter(g=>g.status!=='archived').length;
    const galleriesWithPhotos=new Set(photoRows.map(p=>p.gallery_id).filter(Boolean));
    const pendingUploads=galleryRows.filter(g=>g.status==='created' || g.status==='in_progress' || !galleriesWithPhotos.has(g.id)).length;
    const openRequests=requestRows.filter(r=>!['done','completed'].includes(r.status)).length;
    setText('#overview-clients-count', activeClients);
    setText('#overview-galleries-count', activeGalleries);
    setText('#overview-uploads-count', pendingUploads);
    setText('#overview-retouch-count', openRequests);
  }
  function replaceTopPanels(){
    const panels=$$('#overview .grid.three .compact-panel');
    if(panels[0]){
      panels[0].id='overview-publication-checklist';
      panels[0].innerHTML='<h4><span data-es>Checklist de publicación</span><span data-en>Publication checklist</span></h4><div id="overview-checklist-content" class="overview-mini-list"><div class="row-meta"><span data-es>Cargando datos reales...</span><span data-en>Loading real data...</span></div></div>';
    }
    if(panels[1]){
      panels[1].id='overview-tasks-panel';
      panels[1].innerHTML='<h4><span data-es>Tareas pendientes</span><span data-en>Pending tasks</span></h4><div id="overview-tasks-content" class="overview-mini-list"><div class="row-meta"><span data-es>Cargando datos reales...</span><span data-en>Loading real data...</span></div></div><button class="btn" data-section-link="tasks" style="margin-top:10px"><span data-es>Abrir tareas</span><span data-en>Open tasks</span></button>';
    }
    if(panels[2]){
      panels[2].id='overview-activity-panel';
      panels[2].innerHTML='<h4><span data-es>Actividad útil</span><span data-en>Useful activity</span></h4><div id="overview-activity-content" class="overview-mini-list"><div class="row-meta"><span data-es>Cargando datos reales...</span><span data-en>Loading real data...</span></div></div>';
    }
  }
  async function updateChecklist(){
    const [galleries,links,photos,requests,tasks,events]=await Promise.all([
      selectSafe('galleries','id,title_es,title_en,cover_image_url,status,publish_status,created_at,updated_at',{order:'updated_at',ascending:false,limit:80}),
      selectSafe('gallery_clients','id,gallery_id,client_id'),
      selectSafe('photos','id,gallery_id,hidden'),
      selectSafe('retouch_requests','id,gallery_id,status,message,created_at',{order:'created_at',ascending:false,limit:50}),
      selectSafe('app_tasks','id,title,status,due_date,created_at',{order:'created_at',ascending:false,limit:50}),
      selectSafe('calendar_events','id,title,event_date,status,location',{gte:[['event_date',new Date().toISOString().slice(0,10)]],order:'event_date',ascending:true,limit:30})
    ]);
    const box=$('#overview-checklist-content'); if(!box) return;

    const linked=new Set((links.data||[]).map(x=>x.gallery_id).filter(Boolean));
    const photoRows=photos.data||[];
    const photoCountByGallery=photoRows.reduce((acc,p)=>{ if(p.gallery_id) acc[p.gallery_id]=(acc[p.gallery_id]||0)+1; return acc; },{});
    const visibleCountByGallery=photoRows.reduce((acc,p)=>{ if(p.gallery_id && p.hidden!==true) acc[p.gallery_id]=(acc[p.gallery_id]||0)+1; return acc; },{});
    const items=[];

    (galleries.data||[]).forEach(g=>{
      const missing=[];
      if(!linked.has(g.id)) missing.push('cliente asignado');
      if(!g.cover_image_url) missing.push('portada');
      if(!photoCountByGallery[g.id]) missing.push('fotos subidas');
      if(photoCountByGallery[g.id] && !visibleCountByGallery[g.id]) missing.push('fotos visibles');
      if(g.publish_status!=='published') missing.push('publicación');
      if(missing.length){
        const title=g.title_es||g.title_en||'Galería sin título';
        const severity=(!linked.has(g.id) || !photoCountByGallery[g.id]) ? 'red' : 'yellow';
        items.push({
          severity,
          title:`Galería · ${title}`,
          place:'Galerías > Editar galería',
          detail:`Falta: ${missing.join(', ')}`,
          target:'galleries'
        });
      }
    });

    (requests.data||[]).filter(r=>!['done','completed'].includes(r.status)).slice(0,3).forEach(r=>{
      items.push({
        severity:'yellow',
        title:'Retoque pendiente',
        place:'Retoques',
        detail:r.message ? `Solicitud: ${r.message}` : 'Hay una solicitud de retoque sin completar.',
        target:'requests'
      });
    });

    (tasks.data||[]).filter(t=>['pending','in_progress'].includes(t.status)).slice(0,3).forEach(t=>{
      items.push({
        severity:t.status==='pending'?'red':'yellow',
        title:`Tarea · ${t.title||'Sin título'}`,
        place:'Tareas',
        detail:t.due_date ? `Fecha límite: ${t.due_date}` : (t.status==='pending'?'Pendiente de empezar.':'En progreso.'),
        target:'tasks'
      });
    });

    const upcoming=(events.data||[]).filter(e=>['pending','confirmed','covering'].includes(e.status)).slice(0,2);
    upcoming.forEach(e=>{
      items.push({
        severity:e.status==='pending'?'red':'yellow',
        title:`Calendario · ${e.title||'Evento'}`,
        place:'Calendario',
        detail:`${e.event_date||'Sin fecha'}${e.location?' · '+e.location:''} · ${e.status||'pending'}`,
        target:'calendar'
      });
    });

    if(!items.length){
      box.innerHTML='<div class="overview-mini-row"><span class="check-dot"></span><div><strong>Todo al día</strong><span>No hay pendientes automáticos en galerías, tareas, retoques o calendario.</span></div></div>';
      return;
    }

    box.innerHTML=items.slice(0,8).map(item=>{
      const cls=item.severity==='red'?'danger':(item.severity==='yellow'?'warn':'');
      const dot=item.severity==='red'?'red-dot':(item.severity==='yellow'?'warn':'');
      return `<div class="overview-mini-row checklist-source-row" data-section-link="${esc(item.target||'overview')}"><span class="check-dot ${dot}"></span><div><strong>${esc(item.title)}</strong><span><b>${esc(item.place)}</b> · ${esc(item.detail)}</span></div></div>`;
    }).join('');
  }
  async function updateTasks(){
    const res=await selectSafe('app_tasks','id,title,status,due_date,created_at',{order:'created_at',ascending:false,limit:100});
    const box=$('#overview-tasks-content'); if(!box) return;
    if(res.error){ box.innerHTML='<div class="row-meta">No se pudieron cargar tareas.</div>'; return; }
    const rows=res.data||[];
    const pending=rows.filter(t=>t.status==='pending');
    const progress=rows.filter(t=>t.status==='in_progress');
    const done=rows.filter(t=>t.status==='done');
    const visible=[...pending,...progress].slice(0,4);
    const counters=`<div class="task-summary"><span><i class="dot red"></i>${pending.length}</span><span><i class="dot yellow"></i>${progress.length}</span><span><i class="dot green"></i>${done.length}</span></div>`;
    if(!rows.length){ box.innerHTML=counters+'<div class="row-meta">No hay tareas creadas.</div>'; return; }
    box.innerHTML=counters+(visible.length?visible.map(t=>`<div class="overview-mini-row"><span class="task-dot ${esc(t.status)}"></span><div><strong>${esc(t.title)}</strong><span>${t.due_date?esc(t.due_date):'Sin fecha límite'}</span></div></div>`).join(''):'<div class="row-meta">No hay tareas pendientes.</div>');
  }
  async function updateActivity(){
    const box=$('#overview-activity-content'); if(!box) return;
    const chunks=[];
    const [activity,downloads,requests]=await Promise.all([
      selectSafe('activity_log','type,title,details,created_at',{order:'created_at',ascending:false,limit:5}),
      selectSafe('download_logs','download_type,size_label,photos_count,created_at',{order:'created_at',ascending:false,limit:5}),
      selectSafe('retouch_requests','message,status,created_at',{order:'created_at',ascending:false,limit:5})
    ]);
    (activity.data||[]).forEach(x=>chunks.push({t:x.created_at,title:x.title||x.type,meta:x.details||'Actividad'}));
    (downloads.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Descarga registrada',meta:`${x.photos_count||1} foto(s) · ${x.size_label||x.download_type||''}`}));
    (requests.data||[]).forEach(x=>chunks.push({t:x.created_at,title:'Retoque solicitado',meta:x.message||x.status||'new'}));
    chunks.sort((a,b)=>new Date(b.t)-new Date(a.t));
    const items=chunks.slice(0,4);
    box.innerHTML=items.length?items.map(x=>`<div class="overview-mini-row"><span class="side-dot"></span><div><strong>${esc(x.title)}</strong><span>${esc(x.meta)} · ${fmtDate(x.t)}</span></div></div>`).join(''):'<div class="row-meta">Aún no hay actividad real.</div>';
  }
  async function updateLatestCards(){
    const [lastGallery,lastClient,nextEvent]=await Promise.all([
      selectSafe('galleries','id,title_es,title_en,status,cover_image_url,created_at',{order:'created_at',ascending:false,limit:1}),
      selectSafe('clients','id,name,username,client_type,club,profile_image_url,created_at',{order:'created_at',ascending:false,limit:1}),
      selectSafe('calendar_events','id,title,event_date,event_time,location,status,assigned_photographer',{gte:[['event_date',new Date().toISOString().slice(0,10)]],order:'event_date',ascending:true,limit:1})
    ]);
    const cards=$$('#overview .overview-grid .photo-card');
    const lastG=(lastGallery.data||[])[0];
    if(cards[0]){
      if(lastG){
        cards[0].style.setProperty('--img',`url('${esc(lastG.cover_image_url||'img/work_A.jpg')}')`);
        const h=cards[0].querySelector('h3'); if(h) h.textContent=lastG.title_es||lastG.title_en||'Última galería';
        const p=cards[0].querySelector('p'); if(p) p.innerHTML=statusPill(lastG.status);
      }else{
        const h=cards[0].querySelector('h3'); if(h) h.textContent='Sin galerías';
        const p=cards[0].querySelector('p'); if(p) p.innerHTML='<span class="row-meta">Crea tu primera galería.</span>';
      }
    }
    const lastC=(lastClient.data||[])[0];
    if(cards[1]){
      if(lastC){
        cards[1].style.setProperty('--img',`url('${esc(lastC.profile_image_url||imgFallback)}')`);
        const h=cards[1].querySelector('h3'); if(h) h.textContent=lastC.name||lastC.username||'Último cliente';
        const p=cards[1].querySelector('p'); if(p) p.textContent=`${lastC.client_type||'client'}${lastC.club?' · '+lastC.club:''}`;
      }else{
        const h=cards[1].querySelector('h3'); if(h) h.textContent='Sin clientes';
      }
    }
    const ev=(nextEvent.data||[])[0];
    const eventCard=$$('#overview .overview-grid .card.pad').find(c=>/Next event|Próximo evento|Próximo/i.test(c.textContent));
    if(eventCard){
      const p=eventCard.querySelector('p');
      if(ev && p){ p.innerHTML=`<strong>${esc(ev.title||'Evento')} · ${esc(ev.event_time||'')}</strong><br>${esc(ev.location||'Sin ubicación')} · ${statusPill(ev.status)}<br><span class="row-meta">${dateOnly(ev.event_date)} · ${esc(ev.assigned_photographer||'Ibai Tudanca')}</span>`; }
      else if(p){ p.innerHTML='<strong>Sin próximos eventos</strong><br><span class="row-meta">Añade un evento en Calendario.</span>'; }
    }
  }
  function bindOverviewLinks(){
    document.addEventListener('click',(e)=>{
      const btn=e.target.closest('[data-section-link]'); if(!btn) return;
      const section=btn.dataset.sectionLink;
      if(section){
        document.querySelector(`.side-btn[data-section="${section}"]`)?.click();
        setTimeout(()=>{
          if(section==='tasks') $('#task-title')?.focus();
          if(section==='galleries') document.querySelector('.tab[data-tab="galleries-create"]')?.click();
          if(section==='clients') document.querySelector('.tab[data-tab="clients-create"]')?.click();
        },150);
      }
    },true);
  }
  function injectStyles(){
    if($('#overview-sync-styles')) return;
    const st=document.createElement('style'); st.id='overview-sync-styles';
    st.textContent=`
      .overview-mini-list{display:grid;gap:9px}.overview-mini-row{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:start;border:1px solid var(--line);background:rgba(255,255,255,.025);padding:9px}.overview-mini-row strong{display:block;font-size:12px;font-weight:500}.overview-mini-row span{display:block;font-size:10.5px;color:var(--muted);margin-top:2px;line-height:1.35}.task-summary{display:flex;gap:8px;margin:0 0 10px 0}.task-summary span{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);background:rgba(255,255,255,.035);padding:6px 8px;font-size:11px;color:var(--soft)}.task-summary i{width:8px;height:8px;border-radius:50%;display:inline-block}.task-summary .red{background:var(--red)}.task-summary .yellow{background:var(--yellow)}.task-summary .green{background:var(--green)}
    `;
    document.head.appendChild(st);
  }
  async function refresh(){
    replaceTopPanels();
    await Promise.allSettled([updateStats(),updateChecklist(),updateTasks(),updateActivity(),updateLatestCards()]);
  }
  function init(){
    injectStyles();
    bindOverviewLinks();
    // Replace any static placeholders immediately, before Supabase data arrives.
    replaceTopPanels();
    refresh();
    setInterval(refresh,30000);
    window.IBAI_REFRESH_OVERVIEW=refresh;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
